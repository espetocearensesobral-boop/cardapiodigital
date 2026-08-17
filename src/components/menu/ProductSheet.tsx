import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { Addon, MenuItem } from "@/lib/menu";
import { isQuentinha, proteinLimitForSize } from "@/lib/menu";
import { brl } from "@/lib/format";
import { BottomSheet } from "./BottomSheet";

type Props = {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdd: (item: MenuItem, qty: number, addons: Addon[], obs: string) => void;
};

function optionLabel(addon: Addon, checked: boolean) {
  if (checked) {
    return addon.price > 0 ? `+ ${brl(addon.price)} · Adicionado` : "Adicionado";
  }
  return addon.price > 0 ? `+ ${brl(addon.price)}` : "Incluso";
}

function AddonOption({
  addon,
  checked,
  disabled,
  onToggle,
}: {
  addon: Addon;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        checked ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted hover:bg-secondary"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex size-5.5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
          }`}
        >
          {checked ? <Check className="size-3.5" /> : null}
        </span>
        <span className="text-sm font-medium leading-snug">{addon.name}</span>
      </span>
      <span
        className={`ml-3 shrink-0 text-right text-xs font-semibold ${
          checked ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {optionLabel(addon, checked)}
      </span>
    </button>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ProductSheet({ item, open, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (open) {
      setQty(1);
      setSelected([]);
      setObs("");
    }
  }, [open, item?.id]);

  const selection = useMemo(() => {
    if (!item) {
      return { selectedAddons: [], proteins: [], garnishes: [], extras: [] };
    }
    const selectedAddons = item.addons.filter((addon) => selected.includes(addon.name));
    return {
      selectedAddons,
      proteins: selectedAddons.filter((addon) => addon.group === "mistura"),
      garnishes: selectedAddons.filter((addon) => addon.group === "guarnicao"),
      extras: selectedAddons.filter(
        (addon) => addon.group !== "mistura" && addon.group !== "guarnicao",
      ),
    };
  }, [item, selected]);

  if (!item)
    return (
      <BottomSheet open={false} onClose={onClose}>
        {null}
      </BottomSheet>
    );

  const quentinha = isQuentinha(item);
  const proteinLimit = quentinha ? proteinLimitForSize(item.size) : 0;
  const proteinReady = !quentinha || selection.proteins.length === proteinLimit;
  const remainingProteins = Math.max(0, proteinLimit - selection.proteins.length);
  const canAdd = item.available && proteinReady;
  const unit = item.price + selection.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const total = unit * qty;

  function toggleAddon(addon: Addon) {
    setSelected((current) => {
      if (!item) return current;
      const checked = current.includes(addon.name);
      if (checked) return current.filter((name) => name !== addon.name);

      if (quentinha && addon.group === "mistura") {
        const selectedProteinCount = item.addons.filter(
          (option) => option.group === "mistura" && current.includes(option.name),
        ).length;
        if (selectedProteinCount >= proteinLimit) return current;
      }

      return [...current, addon.name];
    });
  }

  const proteinOptions = item.addons.filter((addon) => addon.group === "mistura");
  const garnishOptions = item.addons.filter((addon) => addon.group === "guarnicao");
  const extraOptions = item.addons.filter(
    (addon) => addon.group !== "mistura" && addon.group !== "guarnicao",
  );

  const actionLabel = !item.available
    ? "Esgotado"
    : !proteinReady
      ? `Selecione ${remainingProteins} ${remainingProteins === 1 ? "proteína" : "proteínas"}`
      : `Adicionar • ${brl(total)}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            onAdd(item, qty, selection.selectedAddons, obs);
            onClose();
          }}
          className="bg-brasa flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="size-5" />
          {actionLabel}
        </button>
      }
    >
      <div className="relative">
        <img
          src={item.image_url}
          alt={item.name}
          width={600}
          height={375}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] w-full object-cover"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-30 flex size-10 items-center justify-center rounded-full border border-border/70 bg-card/95 text-foreground shadow-soft backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4 sm:top-4"
        >
          <X className="size-4" />
        </button>
        {item.badge ? (
          <span className="absolute left-4 top-4 rounded-lg bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-foreground">
            {item.badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h2 className="font-display text-2xl font-bold">{item.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Tamanho: {item.size}
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{brl(item.price)}</p>
        </div>

        {quentinha ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Obrigatório
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Escolha {proteinLimit} {proteinLimit === 1 ? "proteína" : "proteínas"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  proteinReady ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                }`}
              >
                {selection.proteins.length}/{proteinLimit}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A quantidade segue o tamanho escolhido: P/M com 1, G com 2 e GG com 3.
            </p>
          </div>
        ) : null}

        {proteinOptions.length > 0 ? (
          <section>
            <SectionHeader
              title="Misturas"
              description={
                quentinha
                  ? `Selecione ${proteinLimit} ${proteinLimit === 1 ? "opção" : "opções"} de proteína.`
                  : "Escolha uma opção para acompanhar."
              }
            />
            <div className="space-y-2">
              {proteinOptions.map((addon) => {
                const checked = selected.includes(addon.name);
                const reachedLimit = quentinha && selection.proteins.length >= proteinLimit;
                return (
                  <AddonOption
                    key={addon.name}
                    addon={addon}
                    checked={checked}
                    disabled={!checked && reachedLimit}
                    onToggle={() => toggleAddon(addon)}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {garnishOptions.length > 0 ? (
          <section>
            <SectionHeader
              title="Guarnições"
              description="Escolha os acompanhamentos que vão compor sua quentinha."
            />
            <div className="space-y-2">
              {garnishOptions.map((addon) => (
                <AddonOption
                  key={addon.name}
                  addon={addon}
                  checked={selected.includes(addon.name)}
                  onToggle={() => toggleAddon(addon)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {extraOptions.length > 0 ? (
          <section>
            <SectionHeader
              title="Adicionais"
              description="Inclua opções extras para completar seu pedido."
            />
            <div className="space-y-2">
              {extraOptions.map((addon) => (
                <AddonOption
                  key={addon.name}
                  addon={addon}
                  checked={selected.includes(addon.name)}
                  onToggle={() => toggleAddon(addon)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold">Observações</h3>
          <textarea
            value={obs}
            maxLength={200}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            placeholder="Ex: sem feijão, pouco sal, bem quente..."
            className="w-full resize-none rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card"
          />
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQty((current) => Math.max(1, current - 1))}
            className="flex size-11 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-primary hover:text-primary"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center font-display text-xl font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQty((current) => Math.min(50, current + 1))}
            className="flex size-11 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
