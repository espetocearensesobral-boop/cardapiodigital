import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { Addon, MenuItem } from "@/lib/menu";
import { brl } from "@/lib/format";
import { BottomSheet } from "./BottomSheet";

type Props = {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdd: (item: MenuItem, qty: number, addons: Addon[], obs: string) => void;
};

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

  if (!item)
    return (
      <BottomSheet open={false} onClose={onClose}>
        {null}
      </BottomSheet>
    );

  const addons = item.addons.filter((a) => selected.includes(a.name));
  const unit = item.price + addons.reduce((s, a) => s + a.price, 0);
  const total = unit * qty;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={!item.available}
          onClick={() => {
            onAdd(item, qty, addons, obs);
            onClose();
          }}
          className="bg-brasa flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <ShoppingBag className="size-5" />
          {item.available ? `Adicionar • ${brl(total)}` : "Esgotado"}
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
          <p className="mt-3 font-display text-2xl font-bold text-primary">{brl(item.price)}</p>
        </div>

        {item.addons.length > 0 ? (
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold">Bordas & Adicionais</h3>
            <div className="space-y-2">
              {item.addons.map((addon) => {
                const checked = selected.includes(addon.name);
                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        checked ? prev.filter((n) => n !== addon.name) : [...prev, addon.name],
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex size-5.5 items-center justify-center rounded-md border-2 transition-colors ${
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                      >
                        {checked ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="text-sm font-medium">{addon.name}</span>
                    </span>
                    <span className="font-display text-sm font-semibold text-muted-foreground">
                      + {brl(addon.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold">Observações</h3>
          <textarea
            value={obs}
            maxLength={200}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            placeholder="Ex: massa fina, sem orégano, bem assada..."
            className="w-full resize-none rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card"
          />
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-primary hover:text-primary"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center font-display text-xl font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQty((q) => Math.min(50, q + 1))}
            className="flex size-11 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
