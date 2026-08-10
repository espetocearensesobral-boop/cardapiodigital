import { CheckCircle2, MessageCircle } from "lucide-react";
import { brl } from "@/lib/format";

type Props = {
  open: boolean;
  code: string;
  total: number;
  whatsappUrl: string;
  onNewOrder: () => void;
};

export function SuccessOverlay({ open, code, total, whatsappUrl, onNewOrder }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex animate-fade-in flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <div className="bg-brasa flex size-20 animate-pop items-center justify-center rounded-full text-primary-foreground shadow-brand">
        <CheckCircle2 className="size-10" />
      </div>
      <h2 className="font-display text-2xl font-bold">Pedido {code} registrado!</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Seu pedido de <strong className="text-foreground">{brl(total)}</strong> já foi salvo. Envie
        no WhatsApp para a churrascaria confirmar o preparo.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-success py-4 font-display font-semibold text-success-foreground shadow-brand transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-5" />
        Enviar no WhatsApp
      </a>
      <button
        type="button"
        onClick={onNewOrder}
        className="w-full max-w-xs rounded-xl border-2 border-border py-3.5 font-display font-semibold text-muted-foreground"
      >
        Fazer novo pedido
      </button>
    </div>
  );
}
