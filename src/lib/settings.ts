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
  group: "mistura" | "guarnicao" | "extra";
}

export type StoreSettings = {
  system: SystemSettings;
  categories: CategoryItem[];
  globalAddons: GlobalAddon[];
};

export const DEFAULT_SETTINGS: SystemSettings = {
  name: "La Bella Pizza",
  tagline: "Quentinhas fresquinhas • Delivery e local",
  whatsapp: "5588998340085",
  whatsappDisplay: "(88) 99834-0085",
  deliveryFee: 5,
  minOrder: 12,
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
  { id: "quentinhas", label: "Quentinhas", emoji: "🍱" },
  { id: "saladas", label: "Saladas", emoji: "🥗" },
  { id: "adicionais", label: "Adicionais", emoji: "🥤" },
];

export const DEFAULT_GLOBAL_ADDONS: GlobalAddon[] = [
  {
    id: "mistura-panqueca",
    name: "Panqueca de frango ao molho branco com queijo gratinado",
    price: 0,
    group: "mistura",
  },
  { id: "mistura-galinha", name: "Galinha caipira ao molho com pirão", price: 0, group: "mistura" },
  {
    id: "mistura-file",
    name: "Filé trinchado ao acréscimo de 2 reais",
    price: 2,
    group: "mistura",
  },
  { id: "mistura-strogonoff", name: "Strogonoff de carne", price: 0, group: "mistura" },
  {
    id: "mistura-carne",
    name: "Carne de panela ao purê de batata acréscimo de 2 reais",
    price: 2,
    group: "mistura",
  },
  { id: "mistura-linguica", name: "Linguiça Toscana frita", price: 0, group: "mistura" },
  { id: "mistura-ovos", name: "Ovos fritos ou cozidos — 2 unidades", price: 0, group: "mistura" },
  { id: "guarnicao-baiao", name: "Baião de dois", price: 0, group: "guarnicao" },
  { id: "guarnicao-arroz", name: "Arroz de cenoura refogado", price: 0, group: "guarnicao" },
  { id: "guarnicao-feijao", name: "Feijão carioca", price: 0, group: "guarnicao" },
  { id: "guarnicao-macarrao", name: "Macarrão espaguete", price: 0, group: "guarnicao" },
  { id: "guarnicao-farofa", name: "Farofa tradicional ou pirão", price: 0, group: "guarnicao" },
  { id: "extra-file", name: "Filé trinchado extra", price: 2, group: "extra" },
  { id: "extra-carne", name: "Carne de panela extra", price: 2, group: "extra" },
  { id: "extra-salada-legumes", name: "Salada de legumes na maionese", price: 7, group: "extra" },
  { id: "extra-salada-colorida", name: "Salada colorida na maionese", price: 7, group: "extra" },
  { id: "extra-refri-250", name: "Refrigerante 250 ml", price: 5, group: "extra" },
  { id: "extra-suco-goiaba", name: "Suco de goiaba", price: 7, group: "extra" },
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
  const parsed = value.flatMap((item): GlobalAddon[] => {
    if (
      !isRecord(item) ||
      typeof item["id"] !== "string" ||
      typeof item["name"] !== "string" ||
      typeof item["price"] !== "number" ||
      !Number.isFinite(item["price"]) ||
      item["price"] < 0
    ) {
      return [];
    }
    const group =
      item["group"] === "mistura" || item["group"] === "guarnicao" || item["group"] === "extra"
        ? item["group"]
        : "extra";
    return [{ id: item["id"], name: item["name"], price: item["price"], group }];
  });
  return parsed.length > 0 ? parsed : DEFAULT_GLOBAL_ADDONS;
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
