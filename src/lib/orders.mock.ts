export type OrderStatus =
  "recebido" | "confirmado" | "em_preparo" | "saiu_entrega" | "concluido" | "cancelado";

export type OrderType = "delivery" | "local";
export type PaymentMethod = "pix" | "dinheiro" | "cartao";

export type MockOrderAddon = {
  name: string;
  price: number;
};

export type MockOrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
  addons: MockOrderAddon[];
  obs?: string;
};

export type AdminOrder = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  reference?: string;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  changeFor?: number;
  notes?: string;
  items: MockOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    tone: "slate" | "blue" | "amber" | "violet" | "emerald" | "red";
  }
> = {
  recebido: {
    label: "Recebido",
    shortLabel: "Novo",
    description: "Aguardando confirmação",
    tone: "blue",
  },
  confirmado: {
    label: "Confirmado",
    shortLabel: "Confirmado",
    description: "Pedido aceito pela loja",
    tone: "violet",
  },
  em_preparo: {
    label: "Em preparo",
    shortLabel: "Preparo",
    description: "A cozinha está preparando",
    tone: "amber",
  },
  saiu_entrega: {
    label: "Saiu para entrega",
    shortLabel: "Entrega",
    description: "A caminho do cliente",
    tone: "emerald",
  },
  concluido: {
    label: "Concluído",
    shortLabel: "Concluído",
    description: "Pedido finalizado",
    tone: "emerald",
  },
  cancelado: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    description: "Pedido não será processado",
    tone: "red",
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "recebido",
  "confirmado",
  "em_preparo",
  "saiu_entrega",
  "concluido",
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

export const MOCK_ORDERS: AdminOrder[] = [
  {
    id: "mock-order-1",
    code: "LBP-483259",
    customerName: "Ana Silva",
    phone: "(88) 99999-0000",
    orderType: "delivery",
    street: "Rua Central",
    number: "10",
    complement: "Casa azul",
    neighborhood: "Centro",
    reference: "Ao lado da praça",
    paymentMethod: "dinheiro",
    changeFor: 50,
    notes: "Enviar bem quente, por favor.",
    items: [
      {
        name: "Muçarela",
        qty: 1,
        unitPrice: 48,
        addons: [{ name: "Catupiry", price: 8 }],
      },
    ],
    subtotal: 48,
    deliveryFee: 5,
    total: 53,
    status: "recebido",
    createdAt: "2026-08-16T21:48:00-03:00",
  },
  {
    id: "mock-order-2",
    code: "LBP-483251",
    customerName: "Carlos Mendes",
    phone: "(88) 98888-1122",
    orderType: "delivery",
    street: "Avenida Principal",
    number: "245",
    neighborhood: "Junco",
    paymentMethod: "pix",
    items: [
      {
        name: "Calabresa",
        qty: 1,
        unitPrice: 42.9,
        addons: [{ name: "Cheddar", price: 6 }],
      },
      {
        name: "Coca-Cola 2L",
        qty: 1,
        unitPrice: 14,
        addons: [],
      },
    ],
    subtotal: 62.9,
    deliveryFee: 5,
    total: 67.9,
    status: "confirmado",
    createdAt: "2026-08-16T21:36:00-03:00",
  },
  {
    id: "mock-order-3",
    code: "LBP-483244",
    customerName: "Mariana Costa",
    phone: "(88) 97777-3344",
    orderType: "local",
    tableNumber: "08",
    paymentMethod: "cartao",
    items: [
      {
        name: "Frango com Catupiry",
        qty: 1,
        unitPrice: 45.9,
        addons: [],
        obs: "Sem cebola",
      },
    ],
    subtotal: 45.9,
    deliveryFee: 0,
    total: 45.9,
    status: "em_preparo",
    createdAt: "2026-08-16T21:22:00-03:00",
  },
  {
    id: "mock-order-4",
    code: "LBP-483231",
    customerName: "Rafael Oliveira",
    phone: "(88) 96666-5566",
    orderType: "delivery",
    street: "Rua das Flores",
    number: "90",
    neighborhood: "Campo dos Velhos",
    paymentMethod: "dinheiro",
    changeFor: 100,
    items: [
      {
        name: "Portuguesa",
        qty: 1,
        unitPrice: 45.9,
        addons: [
          { name: "Extra Queijo", price: 7 },
          { name: "Bacon Extra", price: 5 },
        ],
      },
    ],
    subtotal: 57.9,
    deliveryFee: 5,
    total: 62.9,
    status: "saiu_entrega",
    createdAt: "2026-08-16T21:04:00-03:00",
  },
  {
    id: "mock-order-5",
    code: "LBP-483208",
    customerName: "Beatriz Lima",
    phone: "(88) 95555-7788",
    orderType: "local",
    tableNumber: "03",
    paymentMethod: "pix",
    items: [
      {
        name: "Quatro Queijos",
        qty: 1,
        unitPrice: 42.9,
        addons: [],
      },
      {
        name: "Guaraná Antarctica 2L",
        qty: 1,
        unitPrice: 12,
        addons: [],
      },
    ],
    subtotal: 54.9,
    deliveryFee: 0,
    total: 54.9,
    status: "concluido",
    createdAt: "2026-08-16T20:42:00-03:00",
  },
  {
    id: "mock-order-6",
    code: "LBP-483190",
    customerName: "João Carvalho",
    phone: "(88) 94444-9900",
    orderType: "delivery",
    street: "Rua do Comércio",
    number: "18",
    neighborhood: "Dom Expedito",
    paymentMethod: "pix",
    items: [
      {
        name: "Pepperoni",
        qty: 1,
        unitPrice: 45.9,
        addons: [],
      },
    ],
    subtotal: 45.9,
    deliveryFee: 5,
    total: 50.9,
    status: "cancelado",
    createdAt: "2026-08-16T20:18:00-03:00",
  },
];

export function formatOrderAddress(order: AdminOrder) {
  if (order.orderType === "local") return `Mesa ${order.tableNumber ?? "-"}`;
  return [
    order.street,
    order.number ? `Nº ${order.number}` : null,
    order.complement,
    order.neighborhood,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getOrderItemCount(order: AdminOrder) {
  return order.items.reduce((count, item) => count + item.qty, 0);
}
