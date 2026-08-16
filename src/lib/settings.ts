import { queryOptions, useQuery } from "@tanstack/react-query";
export interface SystemSettings {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsappDisplay: string;
  deliveryFee: number;
  minOrder: number;
  openHour: number;
  closeHour: number;
  acceptingOrders: boolean;
  timezone: string;
  currency: string;
  paymentMethods: {
    pix: boolean;
    dinheiro: boolean;
    cartao: boolean;
  };
}

export interface CategoryItem {
  id: string;
  label: string;
  emoji: string;
}

export interface GlobalAddon {
  id: string;
  name: string;
  price: number;
}

export type StoreSettings = {
  system: SystemSettings;
  categories: CategoryItem[];
  globalAddons: GlobalAddon[];
};

export const DEFAULT_SETTINGS: SystemSettings = {
  name: "La Bella Pizza",
  tagline: "A melhor pizza da região • Delivery e local",
  whatsapp: "5588998340085",
  whatsappDisplay: "(88) 99834-0085",
  deliveryFee: 5,
  minOrder: 30,
  openHour: 18,
  closeHour: 23,
  acceptingOrders: true,
  timezone: "America/Fortaleza",
  currency: "BRL",
  paymentMethods: {
    pix: true,
    dinheiro: true,
    cartao: true,
  },
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "tradicional", label: "Tradicional", emoji: "🍕" },
  { id: "especial", label: "Especial", emoji: "🌟" },
  { id: "doce", label: "Doce", emoji: "🍫" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "acompanhamentos", label: "Acompanhamentos", emoji: "🍟" },
  { id: "sobremesas", label: "Sobremesas", emoji: "🍮" },
];

export const DEFAULT_GLOBAL_ADDONS: GlobalAddon[] = [
  { id: "1", name: "Requeijão Cremoso", price: 6 },
  { id: "2", name: "Catupiry", price: 8 },
  { id: "3", name: "Cheddar", price: 6 },
  { id: "4", name: "Chocolate Harold", price: 6 },
  { id: "5", name: "Bacon Extra", price: 5 },
  { id: "6", name: "Extra Queijo", price: 7 },
];

const SETTINGS_QUERY_KEY = ["store-settings"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCategories(value: unknown): CategoryItem[] {
  if (!Array.isArray(value)) return DEFAULT_CATEGORIES;
  const parsed = value.filter(
    (item): item is CategoryItem =>
      isRecord(item) &&
      typeof item["id"] === "string" &&
      typeof item["label"] === "string" &&
      typeof item["emoji"] === "string",
  );
  return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
}

function parseAddons(value: unknown): GlobalAddon[] {
  if (!Array.isArray(value)) return DEFAULT_GLOBAL_ADDONS;
  const parsed = value.filter(
    (item): item is GlobalAddon =>
      isRecord(item) &&
      typeof item["id"] === "string" &&
      typeof item["name"] === "string" &&
      typeof item["price"] === "number" &&
      Number.isFinite(item["price"]) &&
      item["price"] >= 0,
  );
  return parsed;
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  // Mock temporário: mantém o catálogo navegável enquanto o Supabase é configurado.
  return {
    system: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    globalAddons: DEFAULT_GLOBAL_ADDONS,
  };
}

export const storeSettingsQueryOptions = queryOptions({
  queryKey: SETTINGS_QUERY_KEY,
  queryFn: fetchStoreSettings,
  staleTime: 60_000,
});

export function useStoreSettings() {
  return useQuery(storeSettingsQueryOptions);
}

export function useSystemSettings() {
  return useStoreSettings().data?.system ?? DEFAULT_SETTINGS;
}

export function useCategories() {
  return useStoreSettings().data?.categories ?? DEFAULT_CATEGORIES;
}

export function useGlobalAddons() {
  return useStoreSettings().data?.globalAddons ?? DEFAULT_GLOBAL_ADDONS;
}
