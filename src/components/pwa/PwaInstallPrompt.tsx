import { Download, WifiOff, X } from "lucide-react";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  const showInstall = Boolean(installEvent) && !dismissed;
  if (!offline && !showInstall) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:items-end md:justify-end">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-float">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {offline ? <WifiOff className="size-5" /> : <Download className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">
              {offline ? "Você está offline" : "Instale o cardápio"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {offline
                ? "O menu continua disponível com os dados carregados. Reconecte-se para enviar novos pedidos."
                : "Acesse o cardápio mais rápido como um aplicativo no seu celular."}
            </p>
            {showInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
              >
                Instalar agora
              </button>
            ) : null}
          </div>
          {showInstall ? (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Fechar aviso de instalação"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
