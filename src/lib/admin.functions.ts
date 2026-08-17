import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const addonSchema = z.object({
  name: z.string().trim().min(1).max(80),
  price: z.number().finite().min(0).max(10000),
});

const categorySchema = z.object({
  id: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(80),
  emoji: z.string().trim().min(1).max(8),
});

const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500),
  size: z.string().trim().max(40).default(""),
  price: z.number().finite().min(0).max(100000),
  category: z.string().trim().min(1).max(60),
  image_url: z.string().trim().url().or(z.literal("")),
  badge: z.string().trim().max(40).nullable(),
  addons: z.array(addonSchema).max(30),
  available: z.boolean(),
  sort_order: z.number().int().min(0).max(100000),
});

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  tagline: z.string().trim().max(180),
  whatsapp: z.string().regex(/^\d{10,15}$/, "WhatsApp inválido"),
  whatsappDisplay: z.string().trim().max(40),
  deliveryFee: z.number().finite().min(0).max(100000),
  minOrder: z.number().finite().min(0).max(100000),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(0).max(23),
  acceptingOrders: z.boolean().optional().default(true),
  timezone: z.string().trim().min(1).max(80).optional().default("America/Fortaleza"),
  currency: z.string().trim().length(3).optional().default("BRL"),
  paymentMethods: z.object({
    pix: z.boolean(),
    dinheiro: z.boolean(),
    cartao: z.boolean(),
  }),
  categories: z.array(categorySchema).min(1).max(50),
  globalAddons: z.array(addonSchema.extend({ id: z.string().min(1).max(80) })).max(50),
});

const statusSchema = z.enum([
  "recebido",
  "confirmado",
  "em_preparo",
  "saiu_entrega",
  "concluido",
  "cancelado",
]);

async function assertStaff(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["staff", "admin"])
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden: acesso administrativo não autorizado.");
  }

  return data.role;
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(`Não foi possível carregar os pedidos: ${error.message}`);
    return data ?? [];
  });

export const adminSaveMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => menuItemSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context.userId);
    const { id, ...item } = data;

    const isUuid =
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      const { data: updated, error } = await supabaseAdmin
        .from("menu_items")
        .update(item)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(`Não foi possível atualizar o produto: ${error.message}`);
      return updated;
    }

    const { data: created, error } = await supabaseAdmin
      .from("menu_items")
      .insert(item)
      .select()
      .single();
    if (error) throw new Error(`Não foi possível criar o produto: ${error.message}`);
    return created;
  });

export const adminDeleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context.userId);
    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(`Não foi possível remover o produto: ${error.message}`);
    return { success: true as const };
  });

async function syncNormalizedCatalog(data: {
  categories: Array<{ id: string; label: string; emoji: string }>;
  globalAddons: Array<{ id: string; name: string; price: number }>;
}) {
  const deactivateCategories = await supabaseAdmin
    .from("categories")
    .update({ active: false })
    .neq("id", "__never_match__");
  if (deactivateCategories.error) {
    throw new Error(
      `Não foi possível preparar as categorias: ${deactivateCategories.error.message}`,
    );
  }

  const categoryRows = data.categories.map((category, index) => ({
    ...category,
    sort_order: index,
    active: true,
  }));
  const categories = await supabaseAdmin
    .from("categories")
    .upsert(categoryRows, { onConflict: "id" });
  if (categories.error) {
    throw new Error(`Não foi possível salvar as categorias: ${categories.error.message}`);
  }

  const deactivateAddons = await supabaseAdmin
    .from("global_addons")
    .update({ active: false })
    .neq("id", "__never_match__");
  if (deactivateAddons.error) {
    throw new Error(`Não foi possível preparar os adicionais: ${deactivateAddons.error.message}`);
  }

  const addonRows = data.globalAddons.map((addon, index) => ({
    ...addon,
    sort_order: index,
    active: true,
  }));
  const addons = await supabaseAdmin.from("global_addons").upsert(addonRows, { onConflict: "id" });
  if (addons.error) {
    throw new Error(`Não foi possível salvar os adicionais: ${addons.error.message}`);
  }
}

export const adminSaveStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context.userId);
    await syncNormalizedCatalog(data);

    const { data: updated, error } = await supabaseAdmin
      .from("store_settings")
      .update({
        name: data.name,
        tagline: data.tagline,
        whatsapp: data.whatsapp,
        whatsapp_display: data.whatsappDisplay,
        delivery_fee: data.deliveryFee,
        min_order: data.minOrder,
        open_hour: data.openHour,
        close_hour: data.closeHour,
        accepting_orders: data.acceptingOrders,
        timezone: data.timezone,
        currency: data.currency,
        payment_methods: data.paymentMethods,
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw new Error(`Não foi possível salvar as configurações: ${error.message}`);
    return updated;
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: statusSchema }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context.userId);
    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id, status")
      .single();

    if (error) throw new Error(`Não foi possível atualizar o pedido: ${error.message}`);
    return updated;
  });
