import { createServerFn } from "@tanstack/react-start";
import { getDb } from "./db.server";

export type PublicAddon = { name: string; price: number };
export type PublicCategory = { id: string; label: string; emoji: string };
export type PublicGlobalAddon = { id: string; name: string; price: number };
export type PublicPaymentMethods = { pix: boolean; dinheiro: boolean; cartao: boolean };

export type PublicMenuRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  badge: string | null;
  addons: PublicAddon[];
  available: boolean;
  sort_order: number;
};

export type PublicSettingsRow = {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsapp_display: string;
  delivery_fee: number;
  min_order: number;
  open_hour: number;
  close_hour: number;
  accepting_orders: boolean;
  timezone: string;
  currency: string;
  payment_methods: PublicPaymentMethods;
  categories: PublicCategory[];
  global_addons: PublicGlobalAddon[];
};

function parseAddons(value: unknown): PublicAddon[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PublicAddon =>
      typeof item === "object" &&
      item !== null &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price),
  );
}

function parseCategories(value: unknown): PublicCategory[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PublicCategory =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.emoji === "string",
  );
}

function parseGlobalAddons(value: unknown): PublicGlobalAddon[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PublicGlobalAddon =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price),
  );
}

function parsePaymentMethods(value: unknown): PublicPaymentMethods {
  const record = typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  return {
    pix: (record as Record<string, unknown>)["pix"] !== false,
    dinheiro: (record as Record<string, unknown>)["dinheiro"] !== false,
    cartao: (record as Record<string, unknown>)["cartao"] !== false,
  };
}

export const getPublicMenu = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = getDb();
    const rows = await sql<
      Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        category: string;
        image_url: string;
        badge: string | null;
        addons: unknown;
        available: boolean;
        sort_order: number;
      }>
    >`
      select id, name, description, price, category, image_url, badge, addons, available, sort_order
      from menu_items
      where available = true
      order by sort_order asc, name asc
    `;
    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      addons: parseAddons(row.addons),
    }));
  } catch (error) {
    console.warn(
      "[Vercel DB] Public menu unavailable:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
});

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = getDb();
    const rows = await sql<
      Array<{
        name: string;
        tagline: string;
        whatsapp: string;
        whatsapp_display: string;
        delivery_fee: number;
        min_order: number;
        open_hour: number;
        close_hour: number;
        accepting_orders: boolean;
        timezone: string;
        currency: string;
        payment_methods: unknown;
        categories: unknown;
        global_addons: unknown;
      }>
    >`
      select name, tagline, whatsapp, whatsapp_display, delivery_fee, min_order,
             open_hour, close_hour, accepting_orders, timezone, currency,
             payment_methods, categories, global_addons
      from store_settings
      where id = 1
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      name: row.name,
      tagline: row.tagline,
      whatsapp: row.whatsapp,
      whatsapp_display: row.whatsapp_display,
      delivery_fee: Number(row.delivery_fee),
      min_order: Number(row.min_order),
      open_hour: row.open_hour,
      close_hour: row.close_hour,
      accepting_orders: row.accepting_orders,
      timezone: row.timezone,
      currency: row.currency,
      payment_methods: parsePaymentMethods(row.payment_methods),
      categories: parseCategories(row.categories),
      global_addons: parseGlobalAddons(row.global_addons),
    } satisfies PublicSettingsRow;
  } catch (error) {
    console.warn(
      "[Vercel DB] Public settings unavailable:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
});
