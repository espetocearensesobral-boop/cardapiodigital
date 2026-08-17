import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Armchair,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { brl } from "@/lib/format";
import {
  DEFAULT_MENU_ITEMS,
  isQuentinha,
  proteinLimitForSize,
  type Addon,
  type MenuItem,
} from "@/lib/menu";
import {
  MOCK_SALON_TABLES,
  SALON_STATUS_META,
  formatSalonTime,
  salonCommandItemCount,
  salonCommandTotal,
  type SalonTable,
  type SalonTableStatus,
} from "@/lib/salon.mock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/salao")({
  component: SalonPage,
});

type TableFilter = "all" | SalonTableStatus;

type CatalogItem = Pick<MenuItem, "id" | "name" | "size" | "price" | "category" | "addons">;

const SALON_CATALOG: CatalogItem[] = DEFAULT_MENU_ITEMS;

const tableStatusClasses: Record<SalonTableStatus, string> = {
  livre: "border-emerald-500/30 bg-emerald-500/5",
  ocupada: "border-violet-500/35 bg-violet-500/5",
  aguardando_pagamento: "border-amber-500/40 bg-amber-500/10",
};

const statusPillClasses: Record<SalonTableStatus, string> = {
  livre: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ocupada: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  aguardando_pagamento: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function SalonPage() {
  const access = useAdminAccess();

  if (access.status === "loading") {
    return <AccessState title="Verificando acesso..." />;
  }

  if (access.status === "unauthenticated") {
    return (
      <AccessState
        title="Entre para gerenciar o salão"
        description="Mesas e comandas ficam disponíveis apenas para a equipe autorizada."
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
        description={access.error ?? "Sua conta não possui permissão para gerenciar o salão."}
        action={
          <Button type="button" onClick={() => void access.signOut()}>
            Sair
          </Button>
        }
      />
    );
  }

  return <SalonWorkspace onSignOut={access.signOut} />;
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
          <Store className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

function SalonWorkspace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [tables, setTables] = useState<SalonTable[]>(MOCK_SALON_TABLES);
  const [filter, setFilter] = useState<TableFilter>("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [draftItemId, setDraftItemId] = useState(SALON_CATALOG[0]?.id ?? "");
  const [draftQuantity, setDraftQuantity] = useState("1");
  const [draftAddons, setDraftAddons] = useState<Addon[]>([]);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const draftItem = SALON_CATALOG.find((item) => item.id === draftItemId) ?? null;
  const draftProteinLimit =
    draftItem && isQuentinha(draftItem) ? proteinLimitForSize(draftItem.size) : 0;
  const draftProteinCount = draftAddons.filter((addon) => addon.group === "mistura").length;
  const draftReady =
    !draftItem || !isQuentinha(draftItem) || draftProteinCount === draftProteinLimit;
  const filteredTables = useMemo(
    () => tables.filter((table) => filter === "all" || table.status === filter),
    [filter, tables],
  );
  const occupiedCount = tables.filter((table) => table.status === "ocupada").length;
  const paymentCount = tables.filter((table) => table.status === "aguardando_pagamento").length;
  const freeCount = tables.filter((table) => table.status === "livre").length;
  const openTotal = tables.reduce((total, table) => total + salonCommandTotal(table.command), 0);

  function updateTable(tableId: string, updater: (table: SalonTable) => SalonTable) {
    setTables((current) => current.map((table) => (table.id === tableId ? updater(table) : table)));
  }

  function openTable(table: SalonTable) {
    if (table.command) {
      setSelectedTableId(table.id);
      return;
    }

    const nextCommandNumber = tables.length + 1;
    updateTable(table.id, (current) => ({
      ...current,
      status: "ocupada",
      command: {
        id: `command-${current.number}`,
        code: `CMD-${String(nextCommandNumber).padStart(3, "0")}`,
        tableId: current.id,
        openedAt: new Date().toISOString(),
        status: "aberta",
        items: [],
      },
    }));
    setSelectedTableId(table.id);
    toast.success(`Comanda da mesa ${table.number} aberta.`);
  }

  function toggleDraftAddon(addon: Addon) {
    setDraftAddons((current) => {
      const checked = current.some((item) => item.name === addon.name);
      if (checked) return current.filter((item) => item.name !== addon.name);
      if (draftItem && isQuentinha(draftItem) && addon.group === "mistura") {
        const currentProteinCount = current.filter((item) => item.group === "mistura").length;
        if (currentProteinCount >= draftProteinLimit) return current;
      }
      return [...current, addon];
    });
  }

  function addItem() {
    if (!selectedTable?.command || !draftItem) return;
    if (!draftReady) {
      toast.error(
        `Selecione ${draftProteinLimit} ${draftProteinLimit === 1 ? "proteína" : "proteínas"} para lançar.`,
      );
      return;
    }
    const quantity = Math.max(1, Number.parseInt(draftQuantity, 10) || 1);
    const addonKey = draftAddons
      .map((addon) => addon.name)
      .sort()
      .join("|");

    updateTable(selectedTable.id, (current) => {
      if (!current.command) return current;
      const existing = current.command.items.find(
        (item) =>
          item.id === draftItem.id &&
          (item.addons ?? [])
            .map((addon) => addon.name)
            .sort()
            .join("|") === addonKey,
      );
      const items = existing
        ? current.command.items.map((item) =>
            item.id === existing.id ? { ...item, qty: item.qty + quantity } : item,
          )
        : [
            ...current.command.items,
            {
              id: draftItem.id,
              name: draftItem.name,
              size: draftItem.size,
              qty: quantity,
              unitPrice: draftItem.price,
              addons: draftAddons,
            },
          ];
      return { ...current, command: { ...current.command, items } };
    });
    setDraftQuantity("1");
    setDraftAddons([]);
    setIsAddingItem(false);
    toast.success(`${quantity} item(ns) adicionado(s) à comanda.`);
  }

  function sendToPayment() {
    if (!selectedTable?.command) return;
    updateTable(selectedTable.id, (current) => {
      if (!current.command) return current;
      return {
        ...current,
        status: "aguardando_pagamento",
        command: { ...current.command, status: "aguardando_pagamento" },
      };
    });
    toast.success(`Mesa ${selectedTable.number} aguardando pagamento.`);
  }

  function closeCommand() {
    if (!selectedTable?.command) return;
    updateTable(selectedTable.id, (current) => {
      const { command: _command, ...tableWithoutCommand } = current;
      return { ...tableWithoutCommand, status: "livre" };
    });
    setSelectedTableId(null);
    toast.success(`Comanda ${selectedTable.command.code} fechada.`);
  }

  function resetTables() {
    setTables(MOCK_SALON_TABLES);
    setSelectedTableId(null);
    setFilter("all");
    toast.success("Mesas e comandas mockadas restauradas.");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-12">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
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
                  Operação presencial
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" /> Salão ativo
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Salão
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Controle as mesas, abra comandas e acompanhe o consumo em tempo real.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 pl-14 sm:w-auto sm:pl-0">
            <Button asChild type="button" variant="outline" className="gap-2">
              <Link to="/pedidos">
                <ShoppingBag className="size-4" /> Pedidos
              </Link>
            </Button>
            <Button asChild type="button" variant="outline" className="gap-2">
              <Link to="/financeiro">
                <BarChart3 className="size-4" /> Financeiro
              </Link>
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={resetTables}>
              <RefreshCw className="size-4" /> Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={() => void onSignOut()}>
              Sair
            </Button>
          </div>
        </header>

        <main className="space-y-6 py-6">
          <section aria-labelledby="salon-overview-title">
            <div className="mb-3 flex items-center gap-2">
              <LayoutIcon />
              <h2 id="salon-overview-title" className="font-display text-lg font-bold">
                Visão do salão
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SalonMetric
                label="Mesas livres"
                value={freeCount}
                helper="prontas para receber"
                tone="emerald"
                icon={Check}
              />
              <SalonMetric
                label="Mesas ocupadas"
                value={occupiedCount}
                helper="comanda em aberto"
                tone="violet"
                icon={Users}
              />
              <SalonMetric
                label="Aguardando pagamento"
                value={paymentCount}
                helper="precisam ser fechadas"
                tone="amber"
                icon={CircleDollarSign}
              />
              <SalonMetric
                label="Consumo em aberto"
                value={brl(openTotal)}
                helper="total das comandas"
                tone="primary"
                icon={WalletCards}
              />
            </div>
          </section>

          <section
            className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5"
            aria-labelledby="tables-title"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="tables-title" className="font-display text-lg font-bold">
                  Mesas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione uma mesa para abrir ou acompanhar a comanda.
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-muted p-1">
                {(
                  [
                    ["all", "Todas"],
                    ["livre", "Livres"],
                    ["ocupada", "Ocupadas"],
                    ["aguardando_pagamento", "Pagamento"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`min-h-10 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors ${
                      filter === value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filteredTables.map((table) => (
                <TableCard key={table.id} table={table} onSelect={() => openTable(table)} />
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">Comandas em aberto</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acompanhe o consumo atual do salão.
                  </p>
                </div>
                <ClipboardList className="size-5 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                {tables
                  .filter((table) => table.command)
                  .map((table) => (
                    <button
                      key={table.command?.id}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-muted/45 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card font-display font-bold text-primary">
                          {table.number}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{table.command?.code}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {table.command?.customerName ?? "Comanda sem identificação"} •{" "}
                            {salonCommandItemCount(table.command)} item(ns)
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-display font-bold text-primary">
                          {brl(salonCommandTotal(table.command))}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-accent p-4 shadow-card sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-primary">Fluxo recomendado</h2>
                  <p className="mt-1 text-sm leading-relaxed text-primary/75">
                    Abra a comanda ao receber a mesa, adicione os itens durante o atendimento e
                    envie para pagamento quando o cliente solicitar a conta.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-primary/80">
                <p className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-card font-bold text-primary">
                    1
                  </span>{" "}
                  Abra a mesa livre.
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-card font-bold text-primary">
                    2
                  </span>{" "}
                  Lance produtos na comanda.
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-card font-bold text-primary">
                    3
                  </span>{" "}
                  Feche após receber o pagamento.
                </p>
              </div>
            </div>
          </section>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Esta versão usa mesas e comandas mockadas para validação do fluxo. A persistência e a
            sincronização com o Supabase serão conectadas em uma próxima etapa.
          </p>
        </main>
      </div>

      <Dialog
        open={Boolean(selectedTable)}
        onOpenChange={(open) => !open && setSelectedTableId(null)}
      >
        {selectedTable ? (
          <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-primary">
                  Mesa {selectedTable.number}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses[selectedTable.status]}`}
                >
                  {SALON_STATUS_META[selectedTable.status].label}
                </span>
              </div>
              <DialogTitle className="text-xl">
                {selectedTable.command ? selectedTable.command.code : "Abrir nova comanda"}
              </DialogTitle>
              <DialogDescription>
                {selectedTable.command
                  ? `Comanda aberta às ${formatSalonTime(selectedTable.command.openedAt)}.`
                  : `Mesa para ${selectedTable.seats} pessoas, pronta para atendimento.`}
              </DialogDescription>
            </DialogHeader>

            {selectedTable.command ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-3.5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <UserRound className="size-4 text-primary" /> Cliente
                    </div>
                    <p className="text-sm font-semibold">
                      {selectedTable.command.customerName ?? "Não informado"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-3.5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock3 className="size-4 text-primary" /> Abertura
                    </div>
                    <p className="text-sm font-semibold">
                      {formatSalonTime(selectedTable.command.openedAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display font-bold">Itens consumidos</h3>
                    <span className="text-xs text-muted-foreground">
                      {salonCommandItemCount(selectedTable.command)} item(ns)
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {selectedTable.command.items.length === 0 ? (
                      <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">
                        Nenhum item lançado ainda.
                      </p>
                    ) : (
                      selectedTable.command.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {item.qty}x {item.name}
                            </p>
                            {item.size ? (
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                Tamanho: {item.size}
                              </p>
                            ) : null}
                            {item.addons?.length ? (
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                {item.addons.map((addon) => (
                                  <p key={addon.name}>
                                    {addon.group === "guarnicao"
                                      ? "Guarnição"
                                      : addon.group === "extra"
                                        ? "Extra"
                                        : "Mistura"}
                                    : {addon.name}{" "}
                                    {addon.price > 0 ? `(+${brl(addon.price)})` : "(Adicionado)"}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                            {item.note ? (
                              <p className="mt-0.5 text-xs italic text-muted-foreground">
                                Obs.: {item.note}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-semibold">
                            {brl(item.qty * item.unitPrice)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-display text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {brl(salonCommandTotal(selectedTable.command))}
                    </span>
                  </div>
                </div>

                {isAddingItem ? (
                  <div className="rounded-2xl border border-primary/25 bg-accent p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_90px_auto] sm:items-end">
                      <label className="text-xs font-semibold text-primary">
                        Produto
                        <select
                          value={draftItemId}
                          onChange={(event) => {
                            setDraftItemId(event.target.value);
                            setDraftAddons([]);
                          }}
                          className="mt-1.5 h-11 w-full rounded-xl border border-primary/20 bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                        >
                          {SALON_CATALOG.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.size}) — {brl(item.price)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-primary">
                        Qtd.
                        <input
                          type="number"
                          min="1"
                          max="20"
                          inputMode="numeric"
                          value={draftQuantity}
                          onChange={(event) => setDraftQuantity(event.target.value)}
                          className="mt-1.5 h-11 w-full rounded-xl border border-primary/20 bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </label>
                      <Button
                        type="button"
                        className="h-11 gap-2"
                        onClick={addItem}
                        disabled={!draftReady}
                      >
                        <Plus className="size-4" /> {draftReady ? "Lançar" : "Escolha a proteína"}
                      </Button>
                    </div>
                    {draftItem && isQuentinha(draftItem) ? (
                      <div className="mt-4 rounded-xl border border-primary/20 bg-card/60 px-3 py-2 text-primary">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold uppercase tracking-wide">
                            Obrigatório
                          </span>
                          <span className="text-xs font-bold">
                            {draftProteinCount}/{draftProteinLimit} proteína(s)
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          P/M permitem 1 proteína, G permite 2 e GG permite 3.
                        </p>
                      </div>
                    ) : null}
                    {draftItem?.addons.length ? (
                      <div className="mt-4 space-y-4">
                        {(["mistura", "guarnicao", "extra"] as const).map((group) => {
                          const options = draftItem.addons.filter((addon) =>
                            group === "extra"
                              ? addon.group !== "mistura" && addon.group !== "guarnicao"
                              : addon.group === group,
                          );
                          if (options.length === 0) return null;
                          const label =
                            group === "mistura"
                              ? "Misturas"
                              : group === "guarnicao"
                                ? "Guarnições"
                                : "Adicionais";
                          return (
                            <section key={group}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                                    {label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {group === "mistura"
                                      ? "Proteína obrigatória"
                                      : "Opções do prato"}
                                  </p>
                                </div>
                                {group === "mistura" ? (
                                  <span className="text-xs font-bold text-primary">
                                    {draftProteinCount}/{draftProteinLimit}
                                  </span>
                                ) : null}
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {options.map((addon) => {
                                  const checked = draftAddons.some(
                                    (item) => item.name === addon.name,
                                  );
                                  const reachedLimit =
                                    group === "mistura" && draftProteinCount >= draftProteinLimit;
                                  return (
                                    <button
                                      key={addon.name}
                                      type="button"
                                      disabled={!checked && reachedLimit}
                                      onClick={() => toggleDraftAddon(addon)}
                                      className={`flex min-h-10 items-center justify-between rounded-xl border px-3 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                                        checked
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border bg-card hover:border-primary/40"
                                      }`}
                                    >
                                      <span className="flex min-w-0 items-center gap-2 font-medium">
                                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary">
                                          {checked ? <Check className="size-2.5" /> : null}
                                        </span>
                                        <span className="leading-snug">{addon.name}</span>
                                      </span>
                                      <span className="ml-2 shrink-0 font-semibold">
                                        {checked
                                          ? addon.price > 0
                                            ? `+${brl(addon.price)} · Adicionado`
                                            : "Adicionado"
                                          : addon.price > 0
                                            ? `+${brl(addon.price)}`
                                            : "Incluso"}
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
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/30 bg-accent p-5 text-center">
                <Armchair className="mx-auto size-9 text-primary" />
                <p className="mt-3 font-display font-bold text-primary">Mesa livre</p>
                <p className="mt-1 text-sm text-primary/75">
                  Abra uma comanda para começar a lançar o consumo.
                </p>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              {selectedTable.command ? (
                <>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-none"
                      onClick={() => setIsAddingItem((current) => !current)}
                    >
                      <Plus className="size-4" />{" "}
                      {isAddingItem ? "Fechar lançamento" : "Adicionar item"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setTables((current) =>
                          current.map((table) => {
                            if (table.id !== selectedTable.id) return table;
                            const { command: _command, ...tableWithoutCommand } = table;
                            return { ...tableWithoutCommand, status: "livre" };
                          }),
                        );
                        setSelectedTableId(null);
                        toast.success(`Comanda ${selectedTable.command?.code} cancelada.`);
                      }}
                      aria-label="Cancelar comanda"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  {selectedTable.status === "aguardando_pagamento" ? (
                    <Button type="button" className="w-full gap-2 sm:w-auto" onClick={closeCommand}>
                      <Check className="size-4" /> Fechar comanda
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full gap-2 sm:w-auto"
                      onClick={sendToPayment}
                    >
                      Enviar para pagamento <ChevronRight className="size-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => openTable(selectedTable)}
                >
                  <Plus className="size-4" /> Abrir comanda
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function LayoutIcon() {
  return (
    <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
      <Store className="size-4" />
    </div>
  );
}

function SalonMetric({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  tone: "primary" | "emerald" | "violet" | "amber";
  icon: typeof Check;
}) {
  const classes = {
    primary: "bg-accent text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate font-display text-2xl font-bold">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${classes[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function TableCard({ table, onSelect }: { table: SalonTable; onSelect: () => void }) {
  const meta = SALON_STATUS_META[table.status];
  const total = salonCommandTotal(table.command);
  return (
    <article
      className={`rounded-2xl border p-4 shadow-card transition-shadow hover:shadow-lg ${tableStatusClasses[table.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-card font-display text-xl font-bold text-primary">
          {table.number}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusPillClasses[table.status]}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="mt-4">
        <p className="font-display font-bold">Mesa {table.number}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5" /> {table.seats} lugares
        </p>
      </div>
      {table.command ? (
        <div className="mt-3 rounded-xl bg-card/75 p-2.5">
          <p className="text-xs font-bold text-primary">{table.command.code}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {salonCommandItemCount(table.command)} item(ns)
          </p>
          <p className="mt-1 font-display text-sm font-bold">{brl(total)}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-card/60 p-2.5 text-xs text-muted-foreground">
          Sem comanda ativa
        </div>
      )}
      <Button
        type="button"
        variant={table.command ? "outline" : "default"}
        className="mt-4 h-10 w-full gap-2"
        onClick={onSelect}
      >
        {table.command ? "Abrir comanda" : "Abrir mesa"}
        <ChevronRight className="size-4" />
      </Button>
    </article>
  );
}
