import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Filter,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { brl } from "@/lib/format";
import {
  MOCK_ORDERS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  PAYMENT_LABELS,
  formatOrderAddress,
  getOrderItemCount,
  type AdminOrder,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/orders.mock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/pedidos")({
  component: OrdersPage,
});

const statusToneClasses: Record<OrderStatus, string> = {
  recebido: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  confirmado: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  em_preparo: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  saiu_entrega: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  concluido: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelado: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

const statusDotClasses: Record<OrderStatus, string> = {
  recebido: "bg-blue-500",
  confirmado: "bg-violet-500",
  em_preparo: "bg-amber-500",
  saiu_entrega: "bg-emerald-500",
  concluido: "bg-emerald-500",
  cancelado: "bg-red-500",
};

function OrdersPage() {
  const access = useAdminAccess();

  if (access.status === "loading") {
    return <AccessState title="Verificando acesso..." />;
  }

  if (access.status === "unauthenticated") {
    return (
      <AccessState
        title="Entre para acompanhar os pedidos"
        description="A central de pedidos está disponível apenas para a equipe autorizada."
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
      <AccessState
        title="Acesso não autorizado"
        description={access.error ?? "Sua conta não possui permissão para visualizar os pedidos."}
        action={
          <Button type="button" onClick={() => void access.signOut()}>
            Sair
          </Button>
        }
      />
    );
  }

  return <OrdersWorkspace onSignOut={access.signOut} />;
}

function AccessState({
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
          <ShoppingBag className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

function OrdersWorkspace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [orders, setOrders] = useState<AdminOrder[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "delivery" | "local">("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const metrics = useMemo(() => {
    const active = orders.filter((order) => !["concluido", "cancelado"].includes(order.status));
    const completed = orders.filter((order) => order.status === "concluido");
    const revenue = completed.reduce((total, order) => total + order.total, 0);
    const averageTicket = completed.length > 0 ? revenue / completed.length : 0;
    return {
      total: orders.length,
      active: active.length,
      pending: orders.filter((order) => order.status === "recebido").length,
      revenue,
      averageTicket,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return [...orders]
      .filter((order) => {
        const matchesSearch = normalizedSearch
          ? [order.code, order.customerName, order.phone]
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(normalizedSearch)
          : true;
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesType = typeFilter === "all" || order.orderType === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter, typeFilter]);

  function advanceOrder(order: AdminOrder) {
    if (order.status === "cancelado" || order.status === "concluido") return;
    const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
    const nextStatus = ORDER_STATUS_FLOW[currentIndex + 1];
    if (!nextStatus) return;
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)),
    );
    setSelectedOrder((current) =>
      current?.id === order.id ? { ...current, status: nextStatus } : current,
    );
    toast.success(`${order.code} atualizado para ${ORDER_STATUS_META[nextStatus].label}.`);
  }

  function cancelOrder(order: AdminOrder) {
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status: "cancelado" } : item)),
    );
    setSelectedOrder((current) =>
      current?.id === order.id ? { ...current, status: "cancelado" } : current,
    );
    toast.success(`${order.code} marcado como cancelado.`);
  }

  function restoreMocks() {
    setOrders(MOCK_ORDERS);
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    toast.success("Pedidos mockados restaurados.");
  }

  const nextStatus = selectedOrder ? getNextStatus(selectedOrder.status) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
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
                  Operação
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" /> Loja aberta
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Central de pedidos
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Acompanhe o fluxo da cozinha, organize entregas e mantenha cada pedido sob controle.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 pl-14 sm:w-auto lg:pl-0">
            <Button type="button" variant="outline" className="gap-2" onClick={restoreMocks}>
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void onSignOut()}
            >
              Sair
            </Button>
          </div>
        </header>

        <main className="space-y-6 py-6">
          <section aria-labelledby="dashboard-title">
            <div className="mb-3 flex items-center gap-2">
              <LayoutDashboard className="size-5 text-primary" />
              <h2 id="dashboard-title" className="font-display text-lg font-bold">
                Visão geral
              </h2>
              <span className="text-xs text-muted-foreground">Hoje</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Pedidos hoje"
                value={metrics.total}
                helper={`${metrics.active} em andamento`}
                icon={ShoppingBag}
                tone="primary"
              />
              <MetricCard
                label="Aguardando ação"
                value={metrics.pending}
                helper="novos pedidos"
                icon={Clock3}
                tone="amber"
              />
              <MetricCard
                label="Concluídos"
                value={orders.filter((order) => order.status === "concluido").length}
                helper={`${brl(metrics.revenue)} em vendas`}
                icon={PackageCheck}
                tone="emerald"
              />
              <MetricCard
                label="Ticket médio"
                value={metrics.averageTicket ? brl(metrics.averageTicket) : "R$ 0,00"}
                helper="pedidos concluídos"
                icon={WalletCards}
                tone="violet"
              />
            </div>
          </section>

          <section
            className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5"
            aria-labelledby="flow-title"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="flow-title" className="font-display text-lg font-bold">
                  Fluxo operacional
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Veja em qual etapa cada pedido está e avance a produção com um toque.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="size-3.5" /> {orders.length} pedidos mockados
              </span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {ORDER_STATUS_FLOW.map((status, index) => {
                const count = orders.filter((order) => order.status === status).length;
                const meta = ORDER_STATUS_META[status];
                return (
                  <div
                    key={status}
                    className="relative rounded-2xl border border-border bg-muted/45 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`size-2.5 rounded-full ${statusDotClasses[status]}`} />
                      <span className="font-display text-2xl font-bold">{count}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                    {index < ORDER_STATUS_FLOW.length - 1 ? (
                      <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-card p-0.5 text-muted-foreground lg:block" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="orders-list-title">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 id="orders-list-title" className="font-display text-lg font-bold">
                  Pedidos recentes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredOrders.length} resultado{filteredOrders.length === 1 ? "" : "s"}{" "}
                  encontrado{filteredOrders.length === 1 ? "" : "s"}.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block min-w-0 sm:min-w-64 sm:flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar código ou cliente..."
                    className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
                    aria-label="Buscar pedidos"
                  />
                </label>
                <div className="grid gap-2 sm:flex sm:flex-row">
                  <label className="sr-only" htmlFor="order-status-filter">
                    Filtrar por status
                  </label>
                  <select
                    id="order-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
                    className="h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary sm:w-auto sm:min-w-36"
                  >
                    <option value="all">Todos os status</option>
                    {Object.entries(ORDER_STATUS_META).map(([status, meta]) => (
                      <option key={status} value={status}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="order-type-filter">
                    Filtrar por tipo
                  </label>
                  <select
                    id="order-type-filter"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as "all" | "delivery" | "local")
                    }
                    className="h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary sm:w-auto sm:min-w-32"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="delivery">Entrega</option>
                    <option value="local">No local</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-14 text-center">
                <Filter className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-display font-bold">Nenhum pedido encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente limpar a busca ou alterar os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onOpen={() => setSelectedOrder(order)}
                    onAdvance={() => advanceOrder(order)}
                    onCancel={() => cancelOrder(order)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        {selectedOrder ? (
          <DialogContent className="max-h-[min(90dvh,780px)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <span className="font-mono text-sm font-bold text-primary">
                  {selectedOrder.code}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <DialogTitle className="text-xl">Detalhes do pedido</DialogTitle>
              <DialogDescription>
                Recebido em {formatDateTime(selectedOrder.createdAt)}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock icon={UserRound} label="Cliente">
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                </InfoBlock>
                <InfoBlock
                  icon={MapPin}
                  label={selectedOrder.orderType === "delivery" ? "Entrega" : "Consumo no local"}
                >
                  <p className="font-semibold">{formatOrderAddress(selectedOrder)}</p>
                  {selectedOrder.reference ? (
                    <p className="text-sm text-muted-foreground">Ref.: {selectedOrder.reference}</p>
                  ) : null}
                </InfoBlock>
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <h3 className="font-display font-bold">Itens do pedido</h3>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold">
                            {item.qty}x {item.name}
                          </p>
                          {item.size ? (
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                              Tamanho: {item.size}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-semibold">
                          {brl(item.unitPrice * item.qty)}
                        </span>
                      </div>
                      {item.addons.length > 0 ? (
                        <div className="mt-1 space-y-0.5 pl-4 text-xs text-muted-foreground">
                          {item.addons.map((addon) => (
                            <p key={addon.name}>
                              + {addon.name} ({brl(addon.price)})
                            </p>
                          ))}
                        </div>
                      ) : null}
                      {item.obs ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          Obs.: {item.obs}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock icon={WalletCards} label="Pagamento">
                  <p className="font-semibold">{PAYMENT_LABELS[selectedOrder.paymentMethod]}</p>
                  {selectedOrder.changeFor ? (
                    <p className="text-sm text-muted-foreground">
                      Troco para {brl(selectedOrder.changeFor)}
                    </p>
                  ) : null}
                </InfoBlock>
                <InfoBlock icon={PackageCheck} label="Resumo">
                  <p className="text-sm text-muted-foreground">
                    {getOrderItemCount(selectedOrder)} item(ns)
                  </p>
                  <p className="font-display text-lg font-bold text-primary">
                    {brl(selectedOrder.total)}
                  </p>
                </InfoBlock>
              </div>
              {selectedOrder.notes ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <strong>Observações:</strong> {selectedOrder.notes}
                </div>
              ) : null}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              {selectedOrder.status !== "concluido" && selectedOrder.status !== "cancelado" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => cancelOrder(selectedOrder)}
                >
                  <X className="size-4" /> Cancelar pedido
                </Button>
              ) : (
                <span />
              )}
              {nextStatus ? (
                <Button
                  type="button"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => advanceOrder(selectedOrder)}
                >
                  Avançar para {ORDER_STATUS_META[nextStatus].label}
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof ShoppingBag;
  tone: "primary" | "amber" | "emerald" | "violet";
}) {
  const iconClasses = {
    primary: "bg-accent text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-xl ${iconClasses[tone]}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onOpen,
  onAdvance,
  onCancel,
}: {
  order: AdminOrder;
  onOpen: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const nextStatus = getNextStatus(order.status);
  const isFinished = order.status === "concluido" || order.status === "cancelado";
  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary">{order.code}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Abrir detalhes de ${order.code}`}
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{order.customerName}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" /> {order.phone}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg font-bold text-primary">{brl(order.total)}</p>
      </div>

      <div className="mt-4 grid gap-2 border-y border-border py-3 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {order.orderType === "delivery" ? (
            <Truck className="size-4 text-primary" />
          ) : (
            <MapPin className="size-4 text-primary" />
          )}
          <span className="truncate">{formatOrderAddress(order)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
          <WalletCards className="size-4 text-primary" />
          <span>{PAYMENT_LABELS[order.paymentMethod]}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {!isFinished && nextStatus ? (
          <Button type="button" className="h-10 flex-1 gap-2" onClick={onAdvance}>
            {order.status === "recebido" ? (
              <Check className="size-4" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {ORDER_STATUS_META[nextStatus].shortLabel}
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="h-10 flex-1 gap-2" onClick={onOpen}>
          Ver pedido <ChevronDown className="size-4" />
        </Button>
        {!isFinished ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-3 text-muted-foreground hover:text-destructive"
            onClick={onCancel}
            aria-label={`Cancelar ${order.code}`}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusToneClasses[status]}`}
    >
      <span className={`size-1.5 rounded-full ${statusDotClasses[status]}`} />
      {meta.label}
    </span>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  return index >= 0 ? (ORDER_STATUS_FLOW[index + 1] ?? null) : null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
