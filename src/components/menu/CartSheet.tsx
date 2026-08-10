import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/menu";
import { cartSubtotal, lineTotal } from "@/lib/menu";
import { brl } from "@/lib/format";
import { RESTAURANT } from "@/lib/config";
import { BottomSheet } from "./BottomSheet";

type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  notes: string;
  onNotesChange: (value: string) => void;
  onChangeQty: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
  onCheckout: () => void;
};

export function CartSheet({
  open,
  onClose,
  cart,
  notes,
  onNotesChange,
  onChangeQty,
  onRemove,
  onCheckout,
}: Props) {
  const subtotal = cartSubtotal(cart);
  const below = subtotal < RESTAURANT.minOrder;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Seu carrinho"
      footer={
        <>
          {below && cart.length > 0 ? (
            <p className="mb-3 rounded-lg bg-accent px-3 py-2 text-center text-xs font-medium text-accent-foreground">
              Pedido mínimo de {brl(RESTAURANT.minOrder)} — faltam{" "}
              {brl(RESTAURANT.minOrder - subtotal)}
            </p>
          ) : null}
          <button
            type="button"
            disabled={cart.length === 0 || below}
            onClick={onCheckout}
            className="bg-brasa flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            Continuar • {brl(subtotal)}
          </button>
        </>
      }
    >
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" />
          <h3 className="font-display text-lg font-semibold">Seu carrinho está vazio</h3>
          <p className="text-sm text-muted-foreground">
            Adicione itens do cardápio para começar seu pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          {cart.map((line) => (
            <div key={line.lineId} className="flex gap-3 rounded-2xl bg-muted p-3">
              <img
                src={line.item.image_url}
                alt={line.item.name}
                className="size-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">{line.item.name}</p>
                {line.addons.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    + {line.addons.map((a) => a.name).join(", ")}
                  </p>
                ) : null}
                {line.obs ? (
                  <p className="text-xs italic text-muted-foreground">"{line.obs}"</p>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-card px-2 py-1">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      onClick={() => onChangeQty(line.lineId, -1)}
                      className="flex size-6 items-center justify-center rounded-full text-primary"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-4 text-center text-sm font-semibold">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() => onChangeQty(line.lineId, 1)}
                      className="flex size-6 items-center justify-center rounded-full text-primary"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-bold text-primary">
                      {brl(lineTotal(line))}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover ${line.item.name}`}
                      onClick={() => onRemove(line.lineId)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <textarea
            value={notes}
            maxLength={500}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Observações gerais do pedido..."
            className="w-full resize-none rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card"
          />

          <div className="rounded-2xl bg-muted p-4 text-sm">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Taxa de entrega</span>
              <span>{brl(RESTAURANT.deliveryFee)} (se entrega)</span>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
