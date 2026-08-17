import type { Addon } from "@/lib/menu";

export type PdvPaymentMethod = "pix" | "dinheiro" | "cartao";

export type PdvCartLine = {
  lineId: string;
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  addons: Addon[];
};

export type PdvSale = {
  id: string;
  code: string;
  customerName: string;
  tableNumber: string;
  items: PdvCartLine[];
  subtotal: number;
  total: number;
  paymentMethod: PdvPaymentMethod;
  receivedAmount: number;
  changeAmount: number;
  createdAt: string;
  status: "concluida" | "cancelada";
};

export const PDV_PAYMENT_LABELS: Record<PdvPaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

export const MOCK_PDV_SALES: PdvSale[] = [
  {
    id: "pdv-sale-1",
    code: "PDV-9021",
    customerName: "Mariana Costa",
    tableNumber: "Balcão",
    items: [
      {
        lineId: "pdv-sale-1-line-1",
        itemId: "3",
        name: "Portuguesa",
        qty: 1,
        unitPrice: 45.9,
        addons: [],
      },
      {
        lineId: "pdv-sale-1-line-2",
        itemId: "14",
        name: "Guaraná Antarctica 2L",
        qty: 1,
        unitPrice: 12,
        addons: [],
      },
    ],
    subtotal: 57.9,
    total: 57.9,
    paymentMethod: "pix",
    receivedAmount: 57.9,
    changeAmount: 0,
    createdAt: "2026-08-17T00:58:00-03:00",
    status: "concluida",
  },
  {
    id: "pdv-sale-2",
    code: "PDV-9020",
    customerName: "Cliente balcão",
    tableNumber: "Balcão",
    items: [
      {
        lineId: "pdv-sale-2-line-1",
        itemId: "2",
        name: "Calabresa",
        qty: 1,
        unitPrice: 42.9,
        addons: [{ name: "Catupiry", price: 8 }],
      },
    ],
    subtotal: 50.9,
    total: 50.9,
    paymentMethod: "cartao",
    receivedAmount: 50.9,
    changeAmount: 0,
    createdAt: "2026-08-17T00:42:00-03:00",
    status: "concluida",
  },
  {
    id: "pdv-sale-3",
    code: "PDV-9019",
    customerName: "Rafael Oliveira",
    tableNumber: "Mesa 07",
    items: [
      {
        lineId: "pdv-sale-3-line-1",
        itemId: "4",
        name: "Frango com Catupiry",
        qty: 2,
        unitPrice: 45.9,
        addons: [],
      },
    ],
    subtotal: 91.8,
    total: 91.8,
    paymentMethod: "dinheiro",
    receivedAmount: 100,
    changeAmount: 8.2,
    createdAt: "2026-08-17T00:24:00-03:00",
    status: "concluida",
  },
];

export function pdvLineTotal(line: PdvCartLine) {
  const addonsTotal = line.addons.reduce((sum, addon) => sum + addon.price, 0);
  return (line.unitPrice + addonsTotal) * line.qty;
}

export function pdvSubtotal(lines: PdvCartLine[]) {
  return lines.reduce((sum, line) => sum + pdvLineTotal(line), 0);
}

export function pdvItemCount(lines: PdvCartLine[]) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function pdvTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
