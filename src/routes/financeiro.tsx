import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Info,
  LayoutDashboard,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Utensils,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { brl } from "@/lib/format";
import {
  FINANCE_PERIOD_LABELS,
  FINANCE_SNAPSHOTS,
  getPeakPoint,
  type FinancePeriod,
  type FinanceSnapshot,
} from "@/lib/finance.mock";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/financeiro")({
  component: FinancePage,
});

function FinancePage() {
  const access = useAdminAccess();

  if (access.status === "loading") {
    return <AccessState title="Verificando acesso..." />;
  }

  if (access.status === "unauthenticated") {
    return (
      <AccessState
        title="Entre para consultar o financeiro"
        description="Os indicadores financeiros estão disponíveis apenas para a equipe autorizada."
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
        description={access.error ?? "Sua conta não possui permissão para visualizar o financeiro."}
        action={
          <Button type="button" onClick={() => void access.signOut()}>
            Sair
          </Button>
        }
      />
    );
  }

  return <FinanceWorkspace onSignOut={access.signOut} />;
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
          <DollarSign className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

function FinanceWorkspace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [period, setPeriod] = useState<FinancePeriod>("today");
  const snapshot = FINANCE_SNAPSHOTS[period];
  const dayPeak = getPeakPoint(snapshot.days);
  const hourPeak = getPeakPoint(snapshot.hours);
  const maxDaySales = Math.max(...snapshot.days.map((point) => point.sales));
  const maxHourOrders = Math.max(...snapshot.hours.map((point) => point.orders));
  const maxDishSales = Math.max(...snapshot.popularDishes.map((dish) => dish.sales));

  const financialBreakdown = useMemo(() => {
    const { grossSales, completedSales, pendingAmount, cancelledAmount } = snapshot.summary;
    return [
      {
        label: "Saldo recebido",
        value: completedSales,
        percentage: grossSales > 0 ? (completedSales / grossSales) * 100 : 0,
        color: "bg-emerald-500",
      },
      {
        label: "Em aberto",
        value: pendingAmount,
        percentage: grossSales > 0 ? (pendingAmount / grossSales) * 100 : 0,
        color: "bg-amber-500",
      },
      {
        label: "Cancelamentos",
        value: cancelledAmount,
        percentage: grossSales > 0 ? (cancelledAmount / grossSales) * 100 : 0,
        color: "bg-red-500",
      },
    ];
  }, [snapshot]);

  function refresh() {
    toast.success("Indicadores mockados atualizados.");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-12">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between lg:mb-2">
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
                  Gestão
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="size-2 rounded-full bg-primary" /> Dados de demonstração
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Visão financeira
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Entenda o ritmo dos pedidos, os produtos que mais vendem e o saldo da operação.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
            <Button asChild type="button" variant="outline" className="gap-2">
              <Link to="/pedidos">
                <ShoppingBag className="size-4" /> Pedidos
              </Link>
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={refresh}>
              <RefreshCw className="size-4" /> Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={() => void onSignOut()}>
              Sair
            </Button>
          </div>
        </header>

        <main className="space-y-6 py-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Período analisado
              </p>
              <p className="mt-1 font-display text-lg font-bold">{snapshot.periodLabel}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{snapshot.updatedAt}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted p-1">
              {Object.entries(FINANCE_PERIOD_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value as FinancePeriod)}
                  aria-pressed={period === value}
                  className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors sm:px-4 ${
                    period === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="finance-summary-title">
            <div className="mb-3 flex items-center gap-2">
              <LayoutDashboard className="size-5 text-primary" />
              <h2 id="finance-summary-title" className="font-display text-lg font-bold">
                Resumo financeiro
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Faturamento bruto"
                value={brl(snapshot.summary.grossSales)}
                helper="todos os pedidos"
                icon={DollarSign}
                tone="primary"
              />
              <MetricCard
                label="Saldo recebido"
                value={brl(snapshot.summary.netBalance)}
                helper={`${snapshot.summary.completedOrders} pedidos concluídos`}
                icon={CheckCircle2}
                tone="emerald"
              />
              <MetricCard
                label="Ticket médio"
                value={brl(snapshot.summary.averageTicket)}
                helper="por pedido"
                icon={WalletCards}
                tone="violet"
              />
              <MetricCard
                label="Taxa de pedidos"
                value={`${snapshot.summary.totalOrders}`}
                helper={`${snapshot.summary.completedOrders} concluídos`}
                icon={ShoppingBag}
                tone="blue"
              />
              <MetricCard
                label="Cancelamentos"
                value={`${snapshot.summary.cancellationRate.toFixed(1).replace(".", ",")}%`}
                helper={`${snapshot.summary.cancelledOrders} pedidos • ${brl(snapshot.summary.cancelledAmount)}`}
                icon={Ban}
                tone="red"
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <ChartCard
              title="Pico de pedidos por dia"
              description="Volume e faturamento dos dias com maior movimento."
              icon={CalendarDays}
              action={
                dayPeak ? (
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                    Pico: {dayPeak.label}
                  </span>
                ) : null
              }
            >
              <div className="flex h-64 items-end gap-2 pt-6 sm:gap-4">
                {snapshot.days.map((point) => {
                  const height = Math.max(12, (point.sales / maxDaySales) * 100);
                  const isPeak = dayPeak?.label === point.label;
                  return (
                    <div
                      key={point.label}
                      className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div className="relative flex h-full w-full items-end justify-center">
                        <div
                          title={`${point.label}: ${point.orders} pedidos • ${brl(point.sales)}`}
                          className={`w-full max-w-10 rounded-t-lg transition-all group-hover:opacity-80 ${
                            isPeak ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/50"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                        {isPeak ? (
                          <span className="absolute -top-5 text-[10px] font-bold text-primary">
                            {point.orders}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`text-[10px] font-semibold sm:text-xs ${isPeak ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Menor dia: {Math.min(...snapshot.days.map((point) => point.orders))} pedidos
                </span>
                <span>Maior dia: {dayPeak?.orders ?? 0} pedidos</span>
              </div>
            </ChartCard>

            <ChartCard
              title="Pico por horário"
              description="Faixas que concentram os pedidos da operação."
              icon={Clock3}
              action={
                hourPeak ? (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Pico: {hourPeak.label}
                  </span>
                ) : null
              }
            >
              <div className="space-y-4 pt-3">
                {snapshot.hours.map((point) => {
                  const width = Math.max(8, (point.orders / maxHourOrders) * 100);
                  const isPeak = hourPeak?.label === point.label;
                  return (
                    <div
                      key={point.label}
                      className="grid grid-cols-[42px_1fr_42px] items-center gap-2 text-xs"
                    >
                      <span
                        className={`font-semibold ${isPeak ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {point.label}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${isPeak ? "bg-primary" : "bg-primary/35"}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-right font-semibold">{point.orders}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Melhor janela:</span>{" "}
                {hourPeak?.label ?? "-"} concentra {hourPeak?.orders ?? 0} pedidos.
              </div>
            </ChartCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <ChartCard
              title="Pratos mais pedidos"
              description="Produtos que mais contribuem para o faturamento do período."
              icon={Utensils}
            >
              <div className="space-y-4 pt-2">
                {snapshot.popularDishes.map((dish, index) => (
                  <div key={dish.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{dish.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {dish.units} unidades • {dish.orders} pedidos
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-display font-bold text-primary">
                        {brl(dish.sales)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/75"
                        style={{ width: `${Math.max(8, (dish.sales / maxDishSales) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Saldo da operação"
              description="Distribuição do faturamento conforme o status dos pedidos."
              icon={BarChart3}
            >
              <div className="space-y-4 pt-2">
                {financialBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-bold">{brl(item.value)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.max(4, item.percentage)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {item.percentage.toFixed(1).replace(".", ",")}% do bruto
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/20 bg-accent p-3 text-xs leading-relaxed text-primary">
                <TrendingUp className="mt-0.5 size-4 shrink-0" />
                <span>
                  O saldo líquido considera somente pedidos concluídos. Pedidos em aberto ainda
                  podem alterar o resultado final.
                </span>
              </div>
            </ChartCard>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <InsightCard
              icon={TrendingUp}
              label="Melhor dia"
              value={dayPeak?.label ?? "-"}
              helper={`${dayPeak?.orders ?? 0} pedidos no pico`}
              tone="primary"
            />
            <InsightCard
              icon={Clock3}
              label="Melhor horário"
              value={hourPeak?.label ?? "-"}
              helper={`${hourPeak?.orders ?? 0} pedidos concentrados`}
              tone="amber"
            />
            <InsightCard
              icon={Truck}
              label="Receita de entrega"
              value={brl(snapshot.summary.deliveryRevenue)}
              helper="taxas no período"
              tone="emerald"
            />
          </section>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            Os dados exibidos nesta etapa são mockados para validação visual. A leitura financeira
            do Supabase será conectada quando o fluxo real de pedidos estiver ativo.
          </p>
        </main>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: typeof BarChart3;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5"
      aria-labelledby={`chart-${title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id={`chart-${title}`} className="font-display font-bold">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
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
  value: string;
  helper: string;
  icon: typeof DollarSign;
  tone: "primary" | "emerald" | "violet" | "blue" | "red";
}) {
  const iconClasses = {
    primary: "bg-accent text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate font-display text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClasses[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "amber" | "emerald";
}) {
  const classes = {
    primary: "bg-accent text-primary",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${classes[tone]}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-display text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}
