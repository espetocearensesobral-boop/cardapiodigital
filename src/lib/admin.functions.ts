import { createServerFn } from "@tanstack/react-start";
import { getDb } from "@/lib/db.server";
import { requireAdminSession } from "@/lib/admin-auth.server";
import { z } from "zod";

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

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  requireAdminSession();
  const sql = getDb();
  return sql`
    select * from orders
    order by created_at desc
    limit 200
  `;
});

export const adminSaveMenuItem = createServerFn({ method: "POST" })
  .validator((data: unknown) => menuItemSchema.parse(data))
  .handler(async ({ data }) => {
    requireAdminSession();
    const sql = getDb();

    if (isUuid(data.id)) {
      const itemId = data.id;
      const rows = await sql`
        update menu_items
        set name = ${data.name}, description = ${data.description}, price = ${data.price},
            category = ${data.category}, image_url = ${data.image_url}, badge = ${data.badge},
            addons = ${JSON.stringify(data.addons)}, available = ${data.available}, sort_order = ${data.sort_order}
        where id = ${itemId}::uuid
        returning *
      `;
      if (!rows[0]) throw new Error("Produto não encontrado.");
      return rows[0];
    }

    const rows = await sql`
      insert into menu_items (name, description, price, category, image_url, badge, addons, available, sort_order)
      values (${data.name}, ${data.description}, ${data.price}, ${data.category}, ${data.image_url},
              ${data.badge}, ${JSON.stringify(data.addons)}, ${data.available}, ${data.sort_order})
      returning *
    `;
    return rows[0];
  });

export const adminDeleteMenuItem = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    requireAdminSession();
    const sql = getDb();
    await sql`delete from menu_items where id = ${data.id}::uuid`;
    return { success: true as const };
  });

export const adminSaveStoreSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data }) => {
    requireAdminSession();
    const sql = getDb();

    await sql.begin(async (transaction) => {
      await transaction`update categories set active = false`;
      for (const [sortOrder, category] of data.categories.entries()) {
        await transaction`
          insert into categories (id, label, emoji, sort_order, active)
          values (${category.id}, ${category.label}, ${category.emoji}, ${sortOrder}, true)
          on conflict (id) do update set label = excluded.label, emoji = excluded.emoji,
            sort_order = excluded.sort_order, active = true
        `;
      }

      await transaction`update global_addons set active = false`;
      for (const [sortOrder, addon] of data.globalAddons.entries()) {
        await transaction`
          insert into global_addons (id, name, price, sort_order, active)
          values (${addon.id}, ${addon.name}, ${addon.price}, ${sortOrder}, true)
          on conflict (id) do update set name = excluded.name, price = excluded.price,
            sort_order = excluded.sort_order, active = true
        `;
      }

      await transaction`
        update store_settings
        set name = ${data.name}, tagline = ${data.tagline}, whatsapp = ${data.whatsapp},
            whatsapp_display = ${data.whatsappDisplay}, delivery_fee = ${data.deliveryFee},
            min_order = ${data.minOrder}, open_hour = ${data.openHour}, close_hour = ${data.closeHour},
            accepting_orders = ${data.acceptingOrders}, timezone = ${data.timezone}, currency = ${data.currency},
            payment_methods = ${JSON.stringify(data.paymentMethods)}, updated_at = now()
        where id = 1
      `;
    });

    const rows = await sql`select * from store_settings where id = 1 limit 1`;
    return rows[0];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: statusSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    requireAdminSession();
    const sql = getDb();
    const rows = await sql`
      update orders set status = ${data.status}, updated_at = now()
      where id = ${data.id}::uuid
      returning id, status
    `;
    if (!rows[0]) throw new Error("Pedido não encontrado.");
    return rows[0];
  });
