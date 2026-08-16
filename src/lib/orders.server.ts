import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEFAULT_MENU_ITEMS } from "@/lib/menu";
import { DEFAULT_SETTINGS } from "@/lib/settings";

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

function isMockOrderMode() {
  return (
    process.env["MOCK_DATA_MODE"] === "true" ||
    !process.env["SUPABASE_URL"] ||
    !process.env["SUPABASE_SERVICE_ROLE_KEY"]
  );
}

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
  if (isMockOrderMode()) {
    return {
      name: DEFAULT_SETTINGS.name,
      whatsapp: DEFAULT_SETTINGS.whatsapp,
      deliveryFee: DEFAULT_SETTINGS.deliveryFee,
      minOrder: DEFAULT_SETTINGS.minOrder,
      acceptingOrders: DEFAULT_SETTINGS.acceptingOrders,
      paymentMethods: DEFAULT_SETTINGS.paymentMethods,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("name, whatsapp, delivery_fee, min_order, accepting_orders, payment_methods")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error("As configurações do restaurante não estão disponíveis.");
  }

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
  const ids = [...new Set(input.items.map((item) => item.id))];
  const result = isMockOrderMode()
    ? {
        data: DEFAULT_MENU_ITEMS.filter((item) => ids.includes(item.id)),
        error: null,
      }
    : await supabaseAdmin
        .from("menu_items")
        .select("id, name, price, available, addons")
        .in("id", ids);
  const { data: menu, error } = result;

  if (error) throw new Error("Não foi possível validar o cardápio. Tente novamente.");
  if (!menu || menu.length !== ids.length) {
    throw new Error("Um ou mais produtos não estão mais disponíveis. Atualize o carrinho.");
  }

  const menuById = new Map((menu as MenuRow[]).map((item) => [item.id, item]));
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
  const settings = await getStoreSettings();
  if (!settings.acceptingOrders) {
    throw new Error("No momento não estamos aceitando novos pedidos.");
  }
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

  if (isMockOrderMode()) {
    const savedCode = makeCode();
    const message = buildWhatsappMessage(
      order,
      { subtotal, deliveryFee, total },
      savedCode,
      settings.name,
    );
    const targetPhone = settings.whatsapp.replace(/\D/g, "");
    return {
      code: savedCode,
      total,
      whatsappUrl: `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`,
    };
  }

  let savedCode = "";
  let savedTotal = total;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = makeCode();
    const { error } = await supabaseAdmin.from("orders").insert({
      code,
      client_order_id: input.clientOrderId,
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
      items,
      notes: input.notes ?? null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    });

    if (!error) {
      savedCode = code;
      break;
    }

    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("code, total")
      .eq("client_order_id", input.clientOrderId)
      .maybeSingle();
    if (existing) {
      savedCode = existing.code;
      savedTotal = Number(existing.total);
      break;
    }

    lastError = error.message;
  }

  if (!savedCode) {
    console.error("[Orders] Could not record order:", lastError);
    throw new Error("Não foi possível registrar o pedido. Tente novamente.");
  }

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
