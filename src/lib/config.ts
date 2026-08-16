export const RESTAURANT = {
  name: "La Bella Pizza",
  tagline: "A melhor pizza da região • Delivery e local",
  /** WhatsApp em formato internacional (55 + DDD + número) */
  whatsapp: "5588998340085",
  whatsappDisplay: "(88) 99834-0085",
  deliveryFee: 5,
  minOrder: 30,
  /** Horário de funcionamento por dia da semana (0 = domingo) */
  hours: {
    open: 18,
    close: 23,
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  tradicional: "Tradicional",
  especial: "Especial",
  doce: "Doce",
  bebidas: "Bebidas",
  acompanhamentos: "Acompanhamentos",
  sobremesas: "Sobremesas",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  all: "🍕",
  tradicional: "🍕",
  especial: "🌟",
  doce: "🍫",
  bebidas: "🥤",
  acompanhamentos: "🍟",
  sobremesas: "🍮",
};
