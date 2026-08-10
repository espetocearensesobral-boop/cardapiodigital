import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pizza, Search, ShoppingBag, Settings } from "lucide-react";
import { toast } from "sonner";
import { RESTAURANT } from "@/lib/config";
import { useSystemSettings, useCategories } from "@/lib/settings";
import { brl } from "@/lib/format";
import { cartSubtotal, menuQueryOptions, type MenuItem } from "@/lib/menu";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductSheet } from "@/components/menu/ProductSheet";
import { CartSheet } from "@/components/menu/CartSheet";
import { CheckoutSheet } from "@/components/menu/CheckoutSheet";
import { SuccessOverlay } from "@/components/menu/SuccessOverlay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "La Bella Pizza — Cardápio Digital e Delivery" },
      {
        name: "description",
        content:
          "Peça as melhores pizzas artesanais da La Bella Pizza. Cardápio digital com entrega ou consumo no local e pedido direto no WhatsApp.",
      },
      { property: "og:title", content: "La Bella Pizza — Cardápio Digital" },
      {
        property: "og:description",
        content:
          "Pizzas artesanais com entrega rápida. Monte seu pedido e envie direto pelo WhatsApp.",
      },
      { property: "og:type", content: "restaurant.menu" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQueryOptions),
  component: MenuPage,
});

type SuccessState = { code: string; total: number; whatsappUrl: string } | null;

function MenuPage() {
  const { data: menu } = useSuspenseQuery(menuQueryOptions);
  const { cart, addItem, changeQty, removeLine, clear } = useCart();
  const systemSettings = useSystemSettings();
  const catList = useCategories();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState<SuccessState>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { label: string; emoji: string }>();
    for (const c of catList) {
      map.set(c.id, { label: c.label, emoji: c.emoji });
    }
    return map;
  }, [catList]);

  const categoryKeys = useMemo(() => {
    const unique: string[] = [];
    for (const item of menu) if (!unique.includes(item.category)) unique.push(item.category);
    return ["all", ...unique];
  }, [menu]);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = menu.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });

    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [menu, category, search]);

  const subtotal = cartSubtotal(cart);
  const totalQty = cart.reduce((sum, line) => sum + line.qty, 0);

  function openProduct(item: MenuItem) {
    setSelected(item);
    setProductOpen(true);
  }

  function quickAdd(item: MenuItem) {
    addItem(item, 1, [], "");
    toast.success(`${item.name} adicionado ao carrinho`);
  }

  return (
    <div
      suppressHydrationWarning
      className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-28"
    >
      <header className="sticky top-0 z-30 bg-card px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-soft">
        <div className="flex items-center gap-3">
          <div className="bg-brasa flex size-11 items-center justify-center rounded-xl text-primary-foreground shadow-brand">
            <Pizza className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-base font-semibold">
                {systemSettings.name || RESTAURANT.name}
              </h1>
              <Link
                to="/admin"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Painel Administrativo"
                aria-label="Painel Administrativo"
              >
                <Settings className="size-3.5" />
              </Link>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-success" />
              Aberto • entrega das {systemSettings.openHour}h às {systemSettings.closeHour}h
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Abrir carrinho"
            className="relative flex size-10 items-center justify-center rounded-full bg-muted text-foreground"
          >
            <ShoppingBag className="size-5" />
            {totalQty > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-5 animate-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {totalQty}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <section className="bg-brasa relative mx-4 mt-4 flex h-36 items-center overflow-hidden rounded-2xl px-5 text-primary-foreground shadow-brand">
        <Pizza className="absolute -bottom-6 -right-6 size-40 opacity-15" />
        <div className="relative">
          <span className="rounded-full bg-primary-foreground/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
            Forno a lenha
          </span>
          <h2 className="mt-2 font-display text-xl font-bold leading-tight">
            Pizzas artesanais
            <br />
            entregues quentinhas
          </h2>
          <p className="mt-1 text-xs opacity-90">
            Pedido mínimo {brl(systemSettings.minOrder)} • entrega {brl(systemSettings.deliveryFee)}
          </p>
        </div>
      </section>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 transition-colors focus-within:border-primary">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no cardápio..."
            aria-label="Buscar no cardápio"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <nav className="sticky top-[76px] z-20 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {categoryKeys.map((key) => {
            const info = categoryMap.get(key);
            const label = key === "all" ? "Todos" : info?.label || key;
            const emoji = key === "all" ? "🍕" : info?.emoji || "🍕";

            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-[13px] font-medium transition-colors ${
                  category === key
                    ? "border-primary bg-primary text-primary-foreground shadow-brand"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="px-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="size-9 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">Nada encontrado</h3>
            <p className="text-sm text-muted-foreground">Tente buscar por outro nome.</p>
          </div>
        ) : (
          grouped.map(([key, items]) => (
            <section key={key} className="animate-slide-up">
              <h2 className="px-1 pb-2 pt-4 font-display text-lg font-semibold">
                {categoryMap.get(key)?.label || key}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onOpen={openProduct}
                    onQuickAdd={quickAdd}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {cart.length > 0 && !cartOpen && !checkoutOpen && !success ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="bg-brasa fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 animate-slide-up items-center justify-between rounded-2xl px-5 py-4 text-primary-foreground shadow-float"
        >
          <span className="flex items-center gap-2 font-display text-sm font-semibold">
            <ShoppingBag className="size-4" />
            {totalQty} {totalQty === 1 ? "item" : "itens"}
          </span>
          <span className="font-display text-sm font-bold">Ver carrinho • {brl(subtotal)}</span>
        </button>
      ) : null}

      <ProductSheet
        item={selected}
        open={productOpen}
        onClose={() => setProductOpen(false)}
        onAdd={(item, qty, addons, obs) => {
          addItem(item, qty, addons, obs);
          toast.success(`${item.name} adicionado ao carrinho`);
        }}
      />

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        notes={notes}
        onNotesChange={setNotes}
        onChangeQty={changeQty}
        onRemove={removeLine}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        notes={notes}
        onSuccess={(result) => {
          setCheckoutOpen(false);
          setSuccess(result);
          clear();
          setNotes("");
          if (typeof window !== "undefined") window.open(result.whatsappUrl, "_blank");
        }}
      />

      <SuccessOverlay
        open={!!success}
        code={success?.code ?? ""}
        total={success?.total ?? 0}
        whatsappUrl={success?.whatsappUrl ?? ""}
        onNewOrder={() => setSuccess(null)}
      />
    </div>
  );
}
