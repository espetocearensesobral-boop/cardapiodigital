import { useCallback, useEffect, useState } from "react";
import type { Addon, CartLine, MenuItem } from "@/lib/menu";

const STORAGE_KEY = "brasa-cart-v1";

export function useCart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignora carrinho corrompido */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem = useCallback((item: MenuItem, qty: number, addons: Addon[], obs: string) => {
    const unitPrice = item.price + addons.reduce((s, a) => s + a.price, 0);
    const signature = `${item.id}|${addons
      .map((a) => a.name)
      .sort()
      .join(",")}|${obs.trim()}`;
    setCart((prev) => {
      const existing = prev.find(
        (l) =>
          `${l.item.id}|${l.addons
            .map((a) => a.name)
            .sort()
            .join(",")}|${l.obs.trim()}` === signature,
      );
      if (existing) {
        return prev.map((l) => (l.lineId === existing.lineId ? { ...l, qty: l.qty + qty } : l));
      }
      return [
        ...prev,
        {
          lineId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          item,
          qty,
          addons,
          obs: obs.trim(),
          unitPrice,
        },
      ];
    });
  }, []);

  const changeQty = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  return { cart, hydrated, addItem, changeQty, removeLine, clear };
}
