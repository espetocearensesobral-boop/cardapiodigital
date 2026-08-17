import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Calculator,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Minus,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  DEFAULT_MENU_ITEMS,
  isQuentinha,
  proteinLimitForSize,
  type Addon,
  type MenuItem,
} from "@/lib/menu";
import { brl } from "@/lib/format";
import {
  MOCK_PDV_SALES,
  PDV_PAYMENT_LABELS,
  pdvItemCount,
  pdvLineTotal,
  pdvSubtotal,
  pdvTime,
  type PdvCartLine,
  type PdvPaymentMethod,
  type PdvSale,
} from "@/lib/pdv.mock";

export const Route = createFileRoute("/pdv")({
  component: PdvPage,
});

type CategoryFilter = "todos" | string;

const CATEGORY_LABELS: Record<string, string> = {
  quentinhas: "Quentinhas",
  saladas: "Saladas",
  adicionais: "Adicionais",
};

function PdvPage() {
  const access = useAdminAccess();

  if (access.status === "loading") {
    return <PdvAccessState title="Verificando acesso..." />;
  }

  if (access.status === "unauthenticated") {
    return (
      <PdvAccessState
        title="Entre para abrir o PDV"
        description="O ponto de venda fica disponível apenas para a equipe autorizada."
        action={
          <Button asChild>
            <Link to="/admin">Ir para o login administrativo</Link>
          </Button>
        }
      />
    );
  }

  if (access.status === "unauthorized") {
    return (
      <PdvAccessState
        title="Acesso não autorizado"
        description={access.error ?? "Sua conta não possui permissão para operar o caixa."}
        action={
          <Button type="button" onClick={() => void access.signOut()}>
            Sair
          </Button>
        }
      />
    );
  }

  return <PdvWorkspace onSignOut={access.signOut} />;
}

function PdvAccessState({
  title,
  description = "Aguarde enquanto validamos sua sessão.",
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-card">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <Store className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

function PdvWorkspace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [cart, setCart] = useState<PdvCartLine[]>([]);
  const [sales, setSales] = useState<PdvSale[]>(MOCK_PDV_SALES);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [customerName, setCustomerName] = useState("Cliente balcão");
  const [tableNumber, setTableNumber] = useState("Balcão");
  const [paymentMethod, setPaymentMethod] = useState<PdvPaymentMethod>("pix");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [selectedQty, setSelectedQty] = useState("1");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<PdvSale | null>(null);
  const receivedAmountRef = useRef<HTMLInputElement>(null);

  const menu = useMemo(() => DEFAULT_MENU_ITEMS.filter((item) => item.available), []);
  const categories = useMemo(
    () => [
      { id: "todos", label: "Todos" },
      ...Array.from(new Set(menu.map((item) => item.category))).map((id) => ({
        id,
        label: CATEGORY_LABELS[id] ?? id,
      })),
    ],
    [menu],
  );
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return menu.filter((item) => {
      const matchesCategory = category === "todos" || item.category === category;
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, menu, search]);
  const subtotal = pdvSubtotal(cart);
  const itemCount = pdvItemCount(cart);
  const received = Number(receivedAmount.replace(",", ".")) || 0;
  const change = Math.max(0, received - subtotal);
  const canFinalize = cart.length > 0 && (paymentMethod !== "dinheiro" || received >= subtotal);
  const completedSales = sales.filter((sale) => sale.status === "concluida");
  const salesTotal = completedSales.reduce((sum, sale) => sum + sale.total, 0);
  const lastSaleNumber = Math.max(
    9021,
    ...sales.map((sale) => Number(sale.code.replace("PDV-", "")) || 0),
  );
  const selectedProteinLimit =
    selectedProduct && isQuentinha(selectedProduct) ? proteinLimitForSize(selectedProduct.size) : 0;
  const selectedProteinCount = selectedAddons.filter((addon) => addon.group === "mistura").length;
  const productSelectionReady =
    !selectedProduct ||
    !isQuentinha(selectedProduct) ||
    selectedProteinCount === selectedProteinLimit;

  useEffect(() => {
    if (isPaymentOpen && paymentMethod === "dinheiro") {
      window.requestAnimationFrame(() => receivedAmountRef.current?.focus());
    }
  }, [isPaymentOpen, paymentMethod]);

  function openProduct(item: MenuItem) {
    setSelectedProduct(item);
    setSelectedAddons([]);
    setSelectedQty("1");
    setIsProductDialogOpen(true);
  }

  function toggleAddon(addon: Addon) {
    setSelectedAddons((current) => {
      const checked = current.some((item) => item.name === addon.name);
      if (checked) return current.filter((item) => item.name !== addon.name);

      if (selectedProduct && isQuentinha(selectedProduct) && addon.group === "mistura") {
        const currentProteinCount = current.filter((item) => item.group === "mistura").length;
        if (currentProteinCount >= proteinLimitForSize(selectedProduct.size)) return current;
      }

      return [...current, addon];
    });
  }

  function confirmProduct() {
    if (!selectedProduct) return;
    if (!productSelectionReady) {
      toast.error(
        `Selecione ${selectedProteinLimit} ${selectedProteinLimit === 1 ? "proteína" : "proteínas"} para continuar.`,
      );
      return;
    }
    const quantity = Math.max(1, Number.parseInt(selectedQty, 10) || 1);
    const addonKey = selectedAddons
      .map((addon) => addon.name)
      .sort()
      .join("|");
    setCart((current) => {
      const existing = current.find(
        (line) =>
          line.itemId === selectedProduct.id &&
          line.addons
            .map((addon) => addon.name)
            .sort()
            .join("|") === addonKey,
      );
      if (existing) {
        return current.map((line) =>
          line.lineId === existing.lineId ? { ...line, qty: line.qty + quantity } : line,
        );
      }
      return [
        ...current,
        {
          lineId: `${selectedProduct.id}-${Date.now()}`,
          itemId: selectedProduct.id,
          name: selectedProduct.name,
          size: selectedProduct.size,
          qty: quantity,
          unitPrice: selectedProduct.price,
          addons: selectedAddons,
        },
      ];
    });
    setIsProductDialogOpen(false);
    toast.success(`${quantity} item(ns) adicionado(s) à venda.`);
  }

  function updateQuantity(lineId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.lineId === lineId ? { ...line, qty: Math.max(0, line.qty + delta) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  }

  function clearSale() {
    if (!cart.length || window.confirm("Limpar todos os itens da venda atual?")) {
      setCart([]);
      setCustomerName("Cliente balcão");
      setTableNumber("Balcão");
      setReceivedAmount("");
      toast.success("Venda atual limpa.");
    }
  }

  function openPayment() {
    if (!cart.length) {
      toast.error("Adicione pelo menos um produto antes de finalizar.");
      return;
    }
    setIsPaymentOpen(true);
  }

  function finalizeSale() {
    if (!canFinalize) {
      toast.error("Informe um valor recebido igual ou maior que o total.");
      return;
    }
    const now = new Date();
    const sale: PdvSale = {
      id: `pdv-sale-${now.getTime()}`,
      code: `PDV-${String(lastSaleNumber + 1).padStart(4, "0")}`,
      customerName: customerName.trim() || "Cliente balcão",
      tableNumber: tableNumber.trim() || "Balcão",
      items: cart,
      subtotal,
      total: subtotal,
      paymentMethod,
      receivedAmount: paymentMethod === "dinheiro" ? received : subtotal,
      changeAmount: paymentMethod === "dinheiro" ? change : 0,
      createdAt: now.toISOString(),
      status: "concluida",
    };
    setSales((current) => [sale, ...current]);
    setCart([]);
    setReceivedAmount("");
    setIsPaymentOpen(false);
    setCompletedSale(sale);
    toast.success(`${sale.code} finalizada com sucesso.`);
  }

  function resetMockSales() {
    setSales(MOCK_PDV_SALES);
    toast.success("Vendas mockadas restauradas.");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-12">
        <header className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/admin"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Voltar ao painel administrativo"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Frente de caixa
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" /> Caixa aberto
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                PDV
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Lance pedidos presenciais com agilidade e finalize no balcão ou em uma mesa.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 pl-14 sm:w-auto sm:pl-0">
            <Button
              asChild
              type="button"
              variant="outline"
              className="flex-1 justify-center gap-2 sm:flex-none"
            >
              <Link to="/salao">
                <Store className="size-4" /> Salão
              </Link>
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="flex-1 justify-center gap-2 sm:flex-none"
            >
              <Link to="/pedidos">
                <ShoppingBag className="size-4" /> Pedidos
              </Link>
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="flex-1 justify-center gap-2 sm:flex-none"
            >
              <Link to="/financeiro">
                <BarChart3 className="size-4" /> Financeiro
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-center gap-2 sm:flex-none"
              onClick={resetMockSales}
            >
              <RefreshCw className="size-4" /> Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={() => void onSignOut()}>
              Sair
            </Button>
          </div>
        </header>

        <main className="space-y-6 py-6">
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Resumo do caixa"
          >
            <PdvMetric
              icon={Calculator}
              label="Venda atual"
              value={brl(subtotal)}
              helper={`${itemCount} item(ns) no carrinho`}
              tone="primary"
            />
            <PdvMetric
              icon={ReceiptText}
              label="Vendas concluídas"
              value={String(completedSales.length)}
              helper="nesta sessão mockada"
              tone="violet"
            />
            <PdvMetric
              icon={CircleDollarSign}
              label="Faturamento do caixa"
              value={brl(salesTotal)}
              helper="vendas presenciais"
              tone="emerald"
            />
            <PdvMetric
              icon={Clock3}
              label="Último lançamento"
              value={sales[0] ? pdvTime(sales[0].createdAt) : "—"}
              helper={sales[0]?.code ?? "Nenhuma venda"}
              tone="amber"
            />
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
            <div className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">Catálogo rápido</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Toque em um produto para escolher adicionais e quantidade.
                  </p>
                </div>
                <div className="relative w-full md:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar produto..."
                    className="h-11 pl-9"
                    aria-label="Buscar produto no catálogo"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto border-b border-border pb-3">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={category === item.id}
                    className={`min-h-10 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                      category === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filteredProducts.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredProducts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openProduct(item)}
                      className="group overflow-hidden rounded-2xl border border-border bg-background text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative aspect-[1.45] overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt=""
                          className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                        <span className="absolute bottom-2 right-2 inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                          <Plus className="size-4" />
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-bold leading-snug">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              Tamanho: {item.size}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {brl(item.price)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                        {item.addons.length ? (
                          <p className="mt-2 text-[11px] font-semibold text-primary">
                            {item.addons.length} adicionais disponíveis
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
                  <Package className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">Nenhum produto encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tente outra busca ou selecione uma categoria diferente.
                  </p>
                </div>
              )}
            </div>

            <aside className="min-w-0 xl:sticky xl:top-4">
              <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-5 text-primary" />
                      <h2 className="font-display text-lg font-bold">Venda atual</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {itemCount
                        ? `${itemCount} item(ns) selecionado(s)`
                        : "Nenhum item selecionado"}
                    </p>
                  </div>
                  {cart.length ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={clearSale}
                      aria-label="Limpar venda atual"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  {cart.length ? (
                    cart.map((line) => (
                      <PdvCartItem
                        key={line.lineId}
                        line={line}
                        onQuantityChange={updateQuantity}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
                      <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-semibold">Seu carrinho está vazio</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Selecione um produto no catálogo para começar uma venda.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="pdv-customer">Cliente</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="pdv-customer"
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          className="pl-9"
                          placeholder="Nome do cliente"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pdv-destination">Destino</Label>
                      <Input
                        id="pdv-destination"
                        value={tableNumber}
                        onChange={(event) => setTableNumber(event.target.value)}
                        placeholder="Balcão ou Mesa 07"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <strong>{brl(subtotal)}</strong>
                  </div>
                  <div className="flex items-end justify-between gap-4 rounded-2xl bg-accent px-4 py-3">
                    <span className="text-sm font-semibold text-primary">Total da venda</span>
                    <strong className="font-display text-2xl text-primary">{brl(subtotal)}</strong>
                  </div>
                  <Button type="button" className="h-12 w-full gap-2" onClick={openPayment}>
                    <WalletCards className="size-4" />
                    Ir para pagamento
                    <ChevronRight className="ml-auto size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">Últimas vendas</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Movimentações deste caixa.</p>
                  </div>
                  <ReceiptText className="size-5 text-primary" />
                </div>
                <div className="mt-4 space-y-2">
                  {sales.slice(0, 4).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-muted/55 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{sale.code}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {sale.customerName} • {pdvTime(sale.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold">{brl(sale.total)}</p>
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          {PDV_PAYMENT_LABELS[sale.paymentMethod]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name ?? "Adicionar produto"}</DialogTitle>
            <DialogDescription>
              Monte a quentinha e informe a quantidade antes de lançar na venda.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-accent px-4 py-3 text-primary">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Preço base</span>
                  <strong>{brl(selectedProduct.price)}</strong>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide">
                  Tamanho: {selectedProduct.size}
                </p>
              </div>
              {selectedProduct.category === "quentinhas" ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">Obrigatório</p>
                      <p className="mt-1 text-sm font-semibold">
                        Escolha {selectedProteinLimit}{" "}
                        {selectedProteinLimit === 1 ? "proteína" : "proteínas"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold">
                      {selectedProteinCount}/{selectedProteinLimit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    P/M permitem 1 proteína, G permite 2 e GG permite 3.
                  </p>
                </div>
              ) : null}
              {selectedProduct.addons.length ? (
                <div className="space-y-4">
                  {(["mistura", "guarnicao", "extra"] as const).map((group) => {
                    const groupAddons = selectedProduct.addons.filter((addon) =>
                      group === "extra"
                        ? addon.group !== "mistura" && addon.group !== "guarnicao"
                        : addon.group === group,
                    );
                    if (groupAddons.length === 0) return null;
                    const title =
                      group === "mistura"
                        ? "Misturas"
                        : group === "guarnicao"
                          ? "Guarnições"
                          : "Adicionais";
                    const description =
                      group === "mistura"
                        ? `Selecione ${selectedProteinLimit} ${selectedProteinLimit === 1 ? "opção" : "opções"} de proteína.`
                        : group === "guarnicao"
                          ? "Escolha os acompanhamentos do prato."
                          : "Inclua opções extras na venda.";
                    return (
                      <section key={group} className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <Label>{title}</Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                          </div>
                          {group === "mistura" ? (
                            <span className="text-xs font-bold text-primary">
                              {selectedProteinCount}/{selectedProteinLimit}
                            </span>
                          ) : null}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {groupAddons.map((addon) => {
                            const selected = selectedAddons.some(
                              (item) => item.name === addon.name,
                            );
                            const reachedLimit =
                              group === "mistura" && selectedProteinCount >= selectedProteinLimit;
                            const addonLabel = selected
                              ? addon.price > 0
                                ? `+${brl(addon.price)} · Adicionado`
                                : "Adicionado"
                              : addon.price > 0
                                ? `+${brl(addon.price)}`
                                : "Incluso";
                            return (
                              <button
                                key={addon.name}
                                type="button"
                                aria-pressed={selected}
                                disabled={!selected && reachedLimit}
                                onClick={() => toggleAddon(addon)}
                                className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                                  selected
                                    ? "border-primary bg-accent text-primary"
                                    : "border-border bg-background hover:border-primary/40"
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2 font-medium">
                                  <span
                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                                  >
                                    {selected ? <Check className="size-3" /> : null}
                                  </span>
                                  <span className="leading-snug">{addon.name}</span>
                                </span>
                                <span className="ml-2 shrink-0 text-right text-xs font-semibold">
                                  {addonLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="pdv-product-qty">Quantidade</Label>
                <Input
                  id="pdv-product-qty"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={selectedQty}
                  onChange={(event) => setSelectedQty(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmProduct}
              disabled={!productSelectionReady}
              className="flex-1 justify-center gap-2 sm:flex-none"
            >
              <Plus className="size-4" />
              {productSelectionReady
                ? "Lançar na venda"
                : `Selecione ${selectedProteinLimit} ${selectedProteinLimit === 1 ? "proteína" : "proteínas"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pagamento da venda</DialogTitle>
            <DialogDescription>
              Confirme o meio de pagamento e finalize o lançamento presencial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-end justify-between rounded-2xl bg-accent px-4 py-4 text-primary">
              <span className="text-sm font-semibold">Total a receber</span>
              <strong className="font-display text-3xl">{brl(subtotal)}</strong>
            </div>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PdvPaymentMethod)}
              className="grid gap-2 sm:grid-cols-3"
            >
              {(
                [
                  ["pix", "Pix", WalletCards],
                  ["cartao", "Cartão", CreditCard],
                  ["dinheiro", "Dinheiro", CircleDollarSign],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 transition-colors ${
                    paymentMethod === value
                      ? "border-primary bg-accent text-primary"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem value={value} aria-label={label} />
                  <Icon className="size-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </label>
              ))}
            </RadioGroup>
            {paymentMethod === "dinheiro" ? (
              <div className="space-y-2">
                <Label htmlFor="pdv-received">Valor recebido</Label>
                <Input
                  ref={receivedAmountRef}
                  id="pdv-received"
                  type="text"
                  inputMode="decimal"
                  value={receivedAmount}
                  onChange={(event) =>
                    setReceivedAmount(event.target.value.replace(/[^0-9,.]/g, ""))
                  }
                  placeholder="Ex.: 100,00"
                  className="h-12 text-lg font-semibold"
                />
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Troco</span>
                  <strong
                    className={
                      received >= subtotal
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }
                  >
                    {brl(change)}
                  </strong>
                </div>
                {received > 0 && received < subtotal ? (
                  <p className="text-xs font-medium text-destructive">
                    Informe pelo menos {brl(subtotal)} para concluir.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                O pagamento será registrado como{" "}
                <strong className="text-foreground">{PDV_PAYMENT_LABELS[paymentMethod]}</strong>.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Voltar
            </Button>
            <Button
              type="button"
              className="flex-1 justify-center gap-2 sm:flex-none"
              disabled={!canFinalize}
              onClick={finalizeSale}
            >
              <Check className="size-4" /> Finalizar venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(completedSale)}
        onOpenChange={(open) => !open && setCompletedSale(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="size-6" />
            </div>
            <DialogTitle className="text-center">Venda concluída</DialogTitle>
            <DialogDescription className="text-center">
              {completedSale?.code} foi registrada no caixa mockado.
            </DialogDescription>
          </DialogHeader>
          {completedSale ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/60 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Cliente</span>
                  <strong>{completedSale.customerName}</strong>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-muted-foreground">Destino</span>
                  <strong>{completedSale.tableNumber}</strong>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-muted-foreground">Pagamento</span>
                  <strong>{PDV_PAYMENT_LABELS[completedSale.paymentMethod]}</strong>
                </div>
              </div>
              <div className="space-y-2">
                {completedSale.items.map((line) => (
                  <div key={line.lineId} className="flex justify-between gap-3 text-sm">
                    <div>
                      <span>
                        {line.qty}x {line.name}
                        <small className="ml-1 text-xs text-muted-foreground">({line.size})</small>
                      </span>
                      {line.addons.length ? (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {line.addons.map((addon) => (
                            <p key={addon.name}>
                              {addon.group === "guarnicao" ? "Guarnição" : "Mistura"}: {addon.name}
                              {addon.price > 0 ? ` (+${brl(addon.price)})` : " (Adicionado)"}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <strong>{brl(pdvLineTotal(line))}</strong>
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <strong className="font-display text-2xl text-primary">
                  {brl(completedSale.total)}
                </strong>
              </div>
              {completedSale.paymentMethod === "dinheiro" ? (
                <div className="flex justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <span>Troco entregue</span>
                  <strong>{brl(completedSale.changeAmount)}</strong>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" className="w-full" onClick={() => setCompletedSale(null)}>
              Nova venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PdvMetric({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof Calculator;
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "violet" | "emerald" | "amber";
}) {
  const toneClasses = {
    primary: "bg-accent text-primary",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={`flex size-10 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function PdvCartItem({
  line,
  onQuantityChange,
}: {
  line: PdvCartLine;
  onQuantityChange: (lineId: string, delta: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/45 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">{line.name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Tamanho: {line.size || "Não informado"}
          </p>
          {line.addons.length ? (
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {(["mistura", "guarnicao", "extra"] as const).map((group) => {
                const groupAddons = line.addons.filter((addon) =>
                  group === "extra"
                    ? addon.group !== "mistura" && addon.group !== "guarnicao"
                    : addon.group === group,
                );
                if (groupAddons.length === 0) return null;
                const label =
                  group === "mistura" ? "Mistura" : group === "guarnicao" ? "Guarnição" : "Extra";
                return (
                  <p key={group}>
                    <span className="font-semibold text-foreground">{label}:</span>{" "}
                    {groupAddons
                      .map((addon) =>
                        addon.price > 0
                          ? `${addon.name} (+${brl(addon.price)})`
                          : `${addon.name} (Adicionado)`,
                      )
                      .join(", ")}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>
        <strong className="shrink-0 text-sm">{brl(pdvLineTotal(line))}</strong>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{brl(line.unitPrice)} / un.</span>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onQuantityChange(line.lineId, -1)}
            aria-label={`Diminuir quantidade de ${line.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 text-center text-sm font-bold">{line.qty}</span>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onQuantityChange(line.lineId, 1)}
            aria-label={`Aumentar quantidade de ${line.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
