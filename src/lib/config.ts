export const RESTAURANT = {
  name: "Brasa Premium",
  tagline: "Churrasco na brasa • Delivery e local",
  /** WhatsApp em formato internacional (55 + DDD + número) */
  whatsapp: "5588998340085",
  whatsappDisplay: "(88) 99834-0085",
  deliveryFee: 5,
  minOrder: 15,
  /** Horário de funcionamento por dia da semana (0 = domingo) */
  hours: {
    open: 17,
    close: 23,
  },
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  espetinhos: "Espetinhos",
  carnes: "Carnes",
  frango: "Frango",
  queijos: "Queijos",
  medalhoes: "Medalhões",
  bebidas: "Bebidas",
  acompanhamentos: "Acompanhamentos",
  sobremesas: "Sobremesas",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  all: "🔥",
  espetinhos: "🍢",
  carnes: "🥩",
  frango: "🍗",
  queijos: "🧀",
  medalhoes: "🥓",
  bebidas: "🥤",
  acompanhamentos: "🍟",
  sobremesas: "🍮",
};
