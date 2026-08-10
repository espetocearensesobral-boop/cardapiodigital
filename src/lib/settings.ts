import { useState, useEffect } from "react";

export interface SystemSettings {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsappDisplay: string;
  deliveryFee: number;
  minOrder: number;
  openHour: number;
  closeHour: number;
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

export const DEFAULT_SETTINGS: SystemSettings = {
  name: "La Bella Pizza",
  tagline: "A melhor pizza da região • Delivery e local",
  whatsapp: "5588981764990",
  whatsappDisplay: "(88) 98176-4990",
  deliveryFee: 5,
  minOrder: 30,
  openHour: 18,
  closeHour: 23,
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

const SETTINGS_KEY = "lbp_system_settings_v1";
const CATEGORIES_KEY = "lbp_categories_v1";
const ADDONS_KEY = "lbp_global_addons_v1";

export function getSystemSettings(): SystemSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSystemSettings(settings: SystemSettings) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("lbp_settings_updated"));
  }
}

export function getCategories(): CategoryItem[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event("lbp_settings_updated"));
  }
}

export function getGlobalAddons(): GlobalAddon[] {
  if (typeof window === "undefined") return DEFAULT_GLOBAL_ADDONS;
  try {
    const raw = localStorage.getItem(ADDONS_KEY);
    if (!raw) return DEFAULT_GLOBAL_ADDONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_GLOBAL_ADDONS;
  }
}

export function saveGlobalAddons(addons: GlobalAddon[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
    window.dispatchEvent(new Event("lbp_settings_updated"));
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getSystemSettings());
    const handleUpdate = () => setSettings(getSystemSettings());
    window.addEventListener("lbp_settings_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lbp_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return settings;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    setCategories(getCategories());
    const handleUpdate = () => setCategories(getCategories());
    window.addEventListener("lbp_settings_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lbp_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return categories;
}

export function useGlobalAddons() {
  const [addons, setAddons] = useState<GlobalAddon[]>(DEFAULT_GLOBAL_ADDONS);

  useEffect(() => {
    setAddons(getGlobalAddons());
    const handleUpdate = () => setAddons(getGlobalAddons());
    window.addEventListener("lbp_settings_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lbp_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return addons;
}
