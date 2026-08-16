import { Plus } from "lucide-react";
import type { MenuItem } from "@/lib/menu";
import { brl } from "@/lib/format";

type Props = {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
};

export function ProductCard({ item, onOpen, onQuickAdd }: Props) {
  return (
    <article
      onClick={() => onOpen(item)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]"
    >
      {item.badge && item.available ? (
        <span className="absolute left-2 top-2 z-10 rounded-lg bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">
          {item.badge}
        </span>
      ) : null}
      {!item.available ? (
        <span className="absolute left-2 top-2 z-10 rounded-lg bg-muted-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-background">
          Esgotado
        </span>
      ) : null}

      <img
        src={item.image_url}
        alt={item.name}
        width={600}
        height={600}
        loading="lazy"
        decoding="async"
        className={`aspect-square w-full bg-muted object-cover ${item.available ? "" : "opacity-50 grayscale"}`}
      />

      <div className="p-3">
        <h3 className="line-clamp-2-fix font-display text-sm font-semibold leading-tight">
          {item.name}
        </h3>
        <p className="line-clamp-2-fix mt-1 text-xs leading-snug text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-base font-bold text-primary">{brl(item.price)}</span>
          <button
            type="button"
            aria-label={`Adicionar ${item.name}`}
            disabled={!item.available}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            className="bg-brasa flex size-8 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-110 active:scale-90 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
