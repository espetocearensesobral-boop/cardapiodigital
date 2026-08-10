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
  return `BP-${n}`;
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão na entrega",
};

export function buildWhatsappMessage(
  input: OrderInput,
  totals: { subtotal: number; deliveryFee: number; total: number },
  code: string,
) {
  const lines: string[] = [];
  lines.push(`🍖 *NOVO PEDIDO ${code}*`);
  lines.push("━━━━━━━━━━━━━━");
  lines.push(`👤 *Cliente:* ${input.customerName}`);
  lines.push(`📞 *Contato:* ${input.phone}`);
  lines.push(`📍 *Tipo:* ${input.orderType === "delivery" ? "Entrega" : "Consumo no local"}`);

  if (input.orderType === "delivery") {
    lines.push("");
    lines.push("🏠 *Endereço*");
    lines.push(`${input.street}, ${input.number}`);
    if (input.complement) lines.push(input.complement);
    lines.push(`Bairro: ${input.neighborhood}`);
    if (input.reference) lines.push(`Ref: ${input.reference}`);
  } else if (input.tableNumber) {
    lines.push(`🍽 *Mesa:* ${input.tableNumber}`);
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━");
  lines.push("🛒 *ITENS*");
  for (const item of input.items) {
    lines.push(`• ${item.qty}x ${item.name} — R$ ${money(item.unitPrice * item.qty)}`);
    if (item.addons.length) {
      lines.push(`   ➕ ${item.addons.map((a) => a.name).join(", ")}`);
    }
    if (item.obs) lines.push(`   📝 ${item.obs}`);
  }

  if (input.notes) {
    lines.push("");
    lines.push(`💬 *Observações:* ${input.notes}`);
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━");
  lines.push(`Subtotal: R$ ${money(totals.subtotal)}`);
  if (totals.deliveryFee > 0) lines.push(`Entrega: R$ ${money(totals.deliveryFee)}`);
  lines.push(`💰 *TOTAL: R$ ${money(totals.total)}*`);

  if (input.paymentMethod) {
    lines.push("");
    lines.push(`💳 *Pagamento:* ${PAYMENT_LABEL[input.paymentMethod] ?? input.paymentMethod}`);
    if (input.changeFor) lines.push(`Troco para: R$ ${input.changeFor}`);
  }

  lines.push("");
  lines.push("Obrigado pela preferência ❤️");
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
    await supabaseAdmin.from("orders").insert({
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
  } catch (err) {
    console.warn("[Orders] Could not record order in Supabase:", err);
  }

  const message = buildWhatsappMessage(input, { subtotal, deliveryFee, total }, code);
  const whatsappUrl = `https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(message)}`;

  return { code, total, whatsappUrl };
}
