import { useEffect } from "react";

export function PwaRuntime() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
    };
    const updateDisplayMode = () => {
      const standaloneMedia = window.matchMedia("(display-mode: standalone)");
      const legacyStandalone = Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone,
      );
      const isStandalone = standaloneMedia.matches || legacyStandalone;
      document.documentElement.toggleAttribute("data-pwa-standalone", isStandalone);
    };

    updateViewport();
    updateDisplayMode();
    window.addEventListener("resize", updateViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
    window.visualViewport?.addEventListener("scroll", updateViewport, { passive: true });
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    standaloneMedia.addEventListener("change", updateDisplayMode);

    let cancelled = false;
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (!cancelled) void registration.update();
        })
        .catch((error) => {
          console.warn("[PWA] Não foi possível registrar o service worker.", error);
        });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      standaloneMedia.removeEventListener("change", updateDisplayMode);
      document.documentElement.removeAttribute("data-pwa-standalone");
    };
  }, []);

  return null;
}
