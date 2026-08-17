import type { Addon } from "@/lib/menu";

export type PdvPaymentMethod = "pix" | "dinheiro" | "cartao";

export type PdvCartLine = {
  lineId: string;
  itemId: string;
  name: string;
  size?: string;
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
        itemId: "quentinha-g",
        name: "Quentinha G",
        size: "G",
        qty: 1,
        unitPrice: 20,
        addons: [{ name: "Strogonoff de carne", price: 0, group: "mistura" }],
      },
      {
        lineId: "pdv-sale-1-line-2",
        itemId: "refri-250",
        name: "Refrigerante 250 ml",
        size: "250 ml",
        qty: 1,
        unitPrice: 5,
        addons: [],
      },
    ],
    subtotal: 25,
    total: 25,
    paymentMethod: "pix",
    receivedAmount: 25,
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
        itemId: "quentinha-m",
        name: "Quentinha M",
        size: "M",
        qty: 1,
        unitPrice: 16,
        addons: [{ name: "Filé trinchado", price: 2, group: "mistura" }],
      },
    ],
    subtotal: 16,
    total: 16,
    paymentMethod: "cartao",
    receivedAmount: 16,
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
        itemId: "quentinha-gg",
        name: "Quentinha GG",
        size: "GG",
        qty: 1,
        unitPrice: 30,
        addons: [{ name: "Carne de panela com purê", price: 2, group: "mistura" }],
      },
    ],
    subtotal: 32,
    total: 32,
    paymentMethod: "dinheiro",
    receivedAmount: 50,
    changeAmount: 18,
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
