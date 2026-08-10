import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { RESTAURANT } from "@/lib/config";

export type OrderItemInput = {
  name: string;
  qty: number;
  unitPrice: number;
  addons: { name: string; price: number }[];
  obs: string;
};

export type OrderInput = {
  customerName: string;
  phone: string;
  orderType: "delivery" | "local";
  street?: string | undefined;
  number?: string | undefined;
  complement?: string | undefined;
  neighborhood?: string | undefined;
  reference?: string | undefined;
  tableNumber?: string | undefined;
  paymentMethod?: string | undefined;
  changeFor?: string | undefined;
  notes?: string | undefined;
  items: OrderItemInput[];
};

function money(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function makeCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `LBP-${n}`;
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro em Espécie",
  cartao: "Cartão na Entrega",
};

export function buildWhatsappMessage(
  input: OrderInput,
  totals: { subtotal: number; deliveryFee: number; total: number },
  code: string,
) {
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const lines: string[] = [];
  lines.push(`🍕 *LA BELLA PIZZA* 🧾`);
  lines.push(`📦 *Pedido:* ${code} | 🗓️ ${dateStr} - ${timeStr}`);
  lines.push("");
  lines.push(`👤 *CLIENTE:* ${input.customerName}`);
  lines.push(`📞 *Contato:* ${input.phone}`);

  if (input.orderType === "delivery") {
    const addressMain = `${input.street || "Endereço não informado"}, Nº ${input.number || "S/N"}${input.complement ? ` - ${input.complement}` : ""}`;
    lines.push(`🛵 *ENTREGA:* ${addressMain} (Bairro: ${input.neighborhood || "Não informado"})`);
    if (input.reference) {
      lines.push(`📍 *Ponto de Ref:* ${input.reference}`);
    }
  } else if (input.tableNumber) {
    lines.push(`🍽️ *MESA:* Nº ${input.tableNumber}`);
  }

  lines.push("");
  lines.push("➖➖➖➖➖➖➖➖➖➖");
  lines.push("🛒 *ITENS DO PEDIDO*");
  lines.push("");

  for (const item of input.items) {
    lines.push(`🍕 *${item.qty}x ${item.name}* — R$ ${money(item.unitPrice * item.qty)}`);
    if (item.addons && item.addons.length > 0) {
      lines.push(`   ➕ *Adicionais:*`);
      for (const addon of item.addons) {
        lines.push(`     • ${addon.name} (+R$ ${money(addon.price)})`);
      }
    }
    if (item.obs) {
      lines.push(`   📝 *Obs:* ${item.obs}`);
    }
  }

  if (input.notes) {
    lines.push("");
    lines.push(`🗒️ *Obs Gerais:* ${input.notes}`);
  }

  lines.push("");
  lines.push("➖➖➖➖➖➖➖➖➖➖");
  lines.push("💰 *RESUMO FINANCEIRO*");
  lines.push(`🔹 Subtotal: R$ ${money(totals.subtotal)}`);
  lines.push(
    `🔹 Entrega: ${totals.deliveryFee > 0 ? `R$ ${money(totals.deliveryFee)}` : "Grátis"}`,
  );
  lines.push(
    `💳 *Pagamento:* ${PAYMENT_LABEL[input.paymentMethod ?? "pix"] ?? input.paymentMethod}`,
  );
  if (input.changeFor) {
    lines.push(`💵 *Troco para:* R$ ${input.changeFor}`);
  }

  lines.push("");
  lines.push(`🟢 *TOTAL DO PEDIDO: R$ ${money(totals.total)}*`);
  lines.push("➖➖➖➖➖➖➖➖➖➖");
  lines.push("✅ _Obrigado pela preferência! Pedido registrado com sucesso._");

  return lines.join("\n");
}

export async function createOrder(input: OrderInput) {
  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const deliveryFee = input.orderType === "delivery" ? RESTAURANT.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  if (subtotal < RESTAURANT.minOrder) {
    throw new Error(`O pedido mínimo é de R$ ${money(RESTAURANT.minOrder)}. Adicione mais itens.`);
  }

  // Confere os preços contra o banco se disponível
  try {
    const { data: menu, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("name, price, available");
    if (!menuError && menu && menu.length > 0) {
      for (const item of input.items) {
        const match = menu.find((m) => m.name === item.name);
        if (match) {
          if (!match.available) throw new Error(`${item.name} está esgotado no momento.`);
          if (item.unitPrice + 0.001 < Number(match.price)) {
            throw new Error(`Preço inválido para ${item.name}. Atualize o carrinho.`);
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("esgotado")) throw err;
    console.warn("[Orders] Supabase validation skipped or offline:", err);
  }

  const code = makeCode();

  try {
    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      code,
      customer_name: input.customerName,
      phone: input.phone,
      order_type: input.orderType,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      reference: input.reference ?? null,
      table_number: input.tableNumber ?? null,
      payment_method: input.paymentMethod ?? null,
      change_for: input.changeFor ?? null,
      items: input.items as never,
      notes: input.notes ?? null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    });
    if (insertError) {
      console.warn("[Orders] Could not record order in Supabase:", insertError);
    } else {
      console.log(`[Orders] Order ${code} recorded successfully in cloud database.`);
    }
  } catch (err) {
    console.warn("[Orders] Could not record order in Supabase:", err);
  }

  const message = buildWhatsappMessage(input, { subtotal, deliveryFee, total }, code);
  // Requested number 88998340085 -> 5588998340085
  const targetPhone = "5588998340085";
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

  return { code, total, whatsappUrl };
}
