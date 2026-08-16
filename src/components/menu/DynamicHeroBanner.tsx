import { useState, useEffect } from "react";
import { Flame, Sparkles, Bike, ShieldCheck, ChevronRight } from "lucide-react";
import { brl } from "@/lib/format";
import { useSystemSettings } from "@/lib/settings";

export function DynamicHeroBanner() {
  const systemSettings = useSystemSettings();
  const [currentSlide, setCurrentSlide] = useState(0);

  const minOrder = systemSettings.minOrder ?? 30;
  const deliveryFee = systemSettings.deliveryFee ?? 5;

  const slides = [
    {
      badge: "Forno a lenha",
      title: "Pizzas artesanais",
      subtitle: "entregues quentinhas",
      info: `Pedido mínimo ${brl(minOrder)} • entrega ${brl(deliveryFee)}`,
      icon: Flame,
      gradient: "from-amber-600 via-red-600 to-rose-700",
    },
    {
      badge: "Massa Especial",
      title: "Fermentação Natural",
      subtitle: "crocante e saborosa",
      info: "Ingredientes selecionados & bordas recheadas",
      icon: Sparkles,
      gradient: "from-red-600 via-rose-600 to-amber-700",
    },
    {
      badge: "Entrega Rápida",
      title: "Direto na sua Mesa",
      subtitle: "ou na sua Casa",
      info: "Pagamento facilitado no Pix, Cartão ou Dinheiro",
      icon: Bike,
      gradient: "from-rose-700 via-red-600 to-orange-600",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] ?? slides[0];
  if (!slide) return null;
  const Icon = slide.icon;

  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-brand transition-all duration-500 md:mx-6 lg:mx-8">
      <div
        className={`bg-gradient-to-r ${slide.gradient} relative flex min-h-[148px] items-center px-5 py-4 text-primary-foreground transition-colors duration-700 md:min-h-[190px] md:px-8 lg:min-h-[220px] lg:px-10`}
      >
        {/* Background Decorative Icon */}
        <Icon className="absolute -bottom-6 -right-6 size-44 opacity-15 transition-transform duration-700 scale-105" />

        <div className="relative z-10 w-full pr-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 backdrop-blur-md border border-amber-300/30">
              <Flame className="size-3 text-amber-400 animate-pulse" />
              {slide.badge}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/90">
              La Bella Pizza
            </span>
          </div>

          <h2 className="mt-2 font-display text-xl font-bold leading-tight drop-shadow-sm md:text-3xl lg:text-4xl">
            {slide.title}
            <br />
            <span className="text-amber-200">{slide.subtitle}</span>
          </h2>

          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-white/90">
            <ShieldCheck className="size-3.5 text-amber-300 shrink-0" />
            <span>{slide.info}</span>
          </p>
        </div>

        {/* Slide navigation controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Ir para slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx
                  ? "w-2.5 bg-amber-300 shadow-sm"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
