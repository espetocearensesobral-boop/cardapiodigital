import { useEffect } from "react";
import { CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { brl } from "@/lib/format";
import { playSuccessSound } from "@/lib/sound";

type Props = {
  open: boolean;
  code: string;
  total: number;
  whatsappUrl: string;
  onNewOrder: () => void;
};

export function SuccessOverlay({ open, code, total, whatsappUrl, onNewOrder }: Props) {
  useEffect(() => {
    if (open) {
      // Play sound effect
      playSuccessSound();

      // Trigger colorful confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#dc2626", "#f59e0b", "#10b981", "#ef4444", "#ffffff"],
        });
      } catch (e) {
        console.warn("Confetti error:", e);
      }

      if (whatsappUrl) {
        // Automatic redirect to WhatsApp
        const timer = setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = whatsappUrl;
          }
        }, 800);

        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [open, whatsappUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex animate-fade-in flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <div className="bg-brasa flex size-20 animate-pop items-center justify-center rounded-full text-primary-foreground shadow-brand">
        <CheckCircle2 className="size-10" />
      </div>
      <h2 className="font-display text-2xl font-bold">Pedido {code} gravado!</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Seu pedido de <strong className="text-foreground">{brl(total)}</strong> foi gravado com
        sucesso na nuvem.
      </p>

      <div className="my-1 flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Loader2 className="size-3.5 animate-spin" />
        Redirecionando automaticamente para o WhatsApp...
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-success py-4 font-display font-semibold text-success-foreground shadow-brand transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-5" />
        Abrir WhatsApp Agora
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
