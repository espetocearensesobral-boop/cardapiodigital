import { getDb } from "@/lib/db.server";

export type SelectedAddonInput = {
  name: string;
  price: number;
};

export type CheckoutItemInput = {
  id: string;
  qty: number;
  addons: SelectedAddonInput[];
  obs: string;
};

export type CheckoutInput = {
  clientOrderId: string;
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
  items: CheckoutItemInput[];
};

export type OrderItemInput = {
  name: string;
  qty: number;
  unitPrice: number;
  addons: SelectedAddonInput[];
  obs: string;
};

export type OrderInput = Omit<CheckoutInput, "items"> & {
  items: OrderItemInput[];
};

type StoreSettingsSnapshot = {
  name: string;
  whatsapp: string;
  deliveryFee: number;
  minOrder: number;
  acceptingOrders: boolean;
  paymentMethods: {
    pix: boolean;
    dinheiro: boolean;
    cartao: boolean;
  };
};

type MenuRow = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  addons: unknown;
};

type Addon = { name: string; price: number };

function money(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function makeCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `LBP-${n}`;
}

function parseAddons(value: unknown): Addon[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (addon): addon is Addon =>
      typeof addon === "object" &&
      addon !== null &&
      typeof addon.name === "string" &&
      typeof addon.price === "number" &&
      Number.isFinite(addon.price) &&
      addon.price >= 0,
  );
}

async function getStoreSettings(): Promise<StoreSettingsSnapshot> {
  const sql = getDb();
  const rows = await sql<
    Array<{
      name: string;
      whatsapp: string;
      delivery_fee: number;
      min_order: number;
      accepting_orders: boolean;
      payment_methods: unknown;
    }>
  >`
    select name, whatsapp, delivery_fee, min_order, accepting_orders, payment_methods
    from store_settings
    where id = 1
    limit 1
  `;
  const data = rows[0];

  if (!data) throw new Error("As configurações do restaurante não estão disponíveis.");

  const paymentMethods =
    typeof data.payment_methods === "object" &&
    data.payment_methods !== null &&
    !Array.isArray(data.payment_methods)
      ? (data.payment_methods as Record<string, unknown>)
      : {};

  return {
    name: data.name,
    whatsapp: data.whatsapp,
    deliveryFee: Number(data.delivery_fee),
    minOrder: Number(data.min_order),
    acceptingOrders: data.accepting_orders !== false,
    paymentMethods: {
      pix: paymentMethods["pix"] !== false,
      dinheiro: paymentMethods["dinheiro"] !== false,
      cartao: paymentMethods["cartao"] !== false,
    },
  };
}

async function priceAndValidateItems(input: CheckoutInput) {
  const sql = getDb();
  const ids = [...new Set(input.items.map((item) => item.id))];
  const menu: MenuRow[] = [];

  for (const id of ids) {
    const rows = await sql<MenuRow[]>`
      select id, name, price, available, addons
      from menu_items
      where id = ${id}
      limit 1
    `;
    if (rows[0]) menu.push(rows[0]);
  }

  if (menu.length !== ids.length) {
    throw new Error("Um ou mais produtos não estão mais disponíveis. Atualize o carrinho.");
  }

  const menuById = new Map(menu.map((item) => [item.id, item]));
  const items: OrderItemInput[] = [];

  for (const selected of input.items) {
    const menuItem = menuById.get(selected.id);
    if (!menuItem || !menuItem.available) {
      throw new Error("Um dos produtos selecionados está esgotado.");
    }

    const allowedAddons = new Map(parseAddons(menuItem.addons).map((addon) => [addon.name, addon]));
    const addons = selected.addons.map((addon) => {
      const approved = allowedAddons.get(addon.name);
      if (!approved) throw new Error(`O adicional ${addon.name} não está disponível.`);
      return approved;
    });

    const unitPrice = Number(menuItem.price) + addons.reduce((sum, addon) => sum + addon.price, 0);
    items.push({
      name: menuItem.name,
      qty: selected.qty,
      unitPrice,
      addons,
      obs: selected.obs.trim(),
    });
  }

  return items;
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
  restaurantName: string,
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const lines: string[] = [];
  lines.push(`🍕 *${restaurantName.toUpperCase()}* 🧾`);
  lines.push(`📦 *Pedido:* ${code} | 🗓️ ${dateStr} - ${timeStr}`);
  lines.push("");
  lines.push(`👤 *CLIENTE:* ${input.customerName}`);
  lines.push(`📞 *Contato:* ${input.phone}`);

  if (input.orderType === "delivery") {
    const addressMain = `${input.street || "Endereço não informado"}, Nº ${input.number || "S/N"}${input.complement ? ` - ${input.complement}` : ""}`;
    lines.push(`🛵 *ENTREGA:* ${addressMain} (Bairro: ${input.neighborhood || "Não informado"})`);
    if (input.reference) lines.push(`📍 *Ponto de Ref:* ${input.reference}`);
  } else if (input.tableNumber) {
    lines.push(`🍽️ *MESA:* Nº ${input.tableNumber}`);
  }

  lines.push("");
  lines.push("➖➖➖➖➖➖➖➖➖➖");
  lines.push("🛒 *ITENS DO PEDIDO*");
  lines.push("");

  for (const item of input.items) {
    lines.push(`🍕 *${item.qty}x ${item.name}* — R$ ${money(item.unitPrice * item.qty)}`);
    if (item.addons.length > 0) {
      lines.push("   ➕ *Adicionais:*");
      for (const addon of item.addons)
        lines.push(`     • ${addon.name} (+R$ ${money(addon.price)})`);
    }
    if (item.obs) lines.push(`   📝 *Obs:* ${item.obs}`);
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
  lines.push(`💳 *Pagamento:* ${PAYMENT_LABEL[input.paymentMethod ?? ""] ?? "A combinar"}`);
  if (input.changeFor) lines.push(`💵 *Troco para:* R$ ${input.changeFor}`);
  lines.push("");
  lines.push(`🟢 *TOTAL DO PEDIDO: R$ ${money(totals.total)}*`);
  lines.push("➖➖➖➖➖➖➖➖➖➖");
  lines.push("✅ _Pedido registrado com sucesso._");

  return lines.join("\n");
}

export async function createOrder(input: CheckoutInput) {
  const sql = getDb();
  const settings = await getStoreSettings();
  if (!settings.acceptingOrders) throw new Error("No momento não estamos aceitando novos pedidos.");

  const items = await priceAndValidateItems(input);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const deliveryFee = input.orderType === "delivery" ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  if (subtotal < settings.minOrder) {
    throw new Error(`O pedido mínimo é de R$ ${money(settings.minOrder)}. Adicione mais itens.`);
  }

  if (
    input.paymentMethod &&
    !settings.paymentMethods[input.paymentMethod as keyof StoreSettingsSnapshot["paymentMethods"]]
  ) {
    throw new Error("A forma de pagamento selecionada não está disponível.");
  }

  const order: OrderInput = { ...input, items };
  const existing = await sql<Array<{ code: string; total: number }>>`
    select code, total from orders where client_order_id = ${input.clientOrderId} limit 1
  `;

  let savedCode = existing[0]?.code ?? "";
  let savedTotal = Number(existing[0]?.total ?? total);

  if (!savedCode) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = makeCode();
      try {
        await sql`
          insert into orders (
            code, client_order_id, customer_name, phone, order_type,
            street, number, complement, neighborhood, reference, table_number,
            payment_method, change_for, items, notes, subtotal, delivery_fee, total, source
          ) values (
            ${code}, ${input.clientOrderId}, ${input.customerName}, ${input.phone}, ${input.orderType},
            ${input.street ?? null}, ${input.number ?? null}, ${input.complement ?? null},
            ${input.neighborhood ?? null}, ${input.reference ?? null}, ${input.tableNumber ?? null},
            ${input.paymentMethod ?? null}, ${input.changeFor ?? null}, ${JSON.stringify(items)},
            ${input.notes ?? null}, ${subtotal}, ${deliveryFee}, ${total}, 'web'
          )
        `;
        savedCode = code;
        break;
      } catch (error) {
        const duplicate = await sql<Array<{ code: string; total: number }>>`
          select code, total from orders where client_order_id = ${input.clientOrderId} limit 1
        `;
        if (duplicate[0]) {
          savedCode = duplicate[0].code;
          savedTotal = Number(duplicate[0].total);
          break;
        }
        if (attempt === 2) throw error;
      }
    }
  }

  if (!savedCode) throw new Error("Não foi possível registrar o pedido. Tente novamente.");

  const message = buildWhatsappMessage(
    order,
    { subtotal, deliveryFee, total: savedTotal },
    savedCode,
    settings.name,
  );
  const targetPhone = settings.whatsapp.replace(/\D/g, "");
  return {
    code: savedCode,
    total: savedTotal,
    whatsappUrl: `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`,
  };
}
