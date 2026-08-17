export type SalonTableStatus = "livre" | "ocupada" | "aguardando_pagamento";
export type CommandStatus = "aberta" | "aguardando_pagamento";

export type SalonCommandItem = {
  id: string;
  name: string;
  size?: string;
  qty: number;
  unitPrice: number;
  note?: string;
};

export type SalonCommand = {
  id: string;
  code: string;
  tableId: string;
  customerName?: string;
  openedAt: string;
  status: CommandStatus;
  items: SalonCommandItem[];
};

export type SalonTable = {
  id: string;
  number: number;
  seats: number;
  status: SalonTableStatus;
  command?: SalonCommand;
};

export const SALON_STATUS_META: Record<
  SalonTableStatus,
  { label: string; description: string; tone: "emerald" | "amber" | "violet" }
> = {
  livre: {
    label: "Livre",
    description: "Pronta para receber",
    tone: "emerald",
  },
  ocupada: {
    label: "Ocupada",
    description: "Comanda em aberto",
    tone: "violet",
  },
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    description: "Fechar comanda",
    tone: "amber",
  },
};

export const MOCK_SALON_TABLES: SalonTable[] = [
  {
    id: "table-01",
    number: 1,
    seats: 2,
    status: "ocupada",
    command: {
      id: "command-01",
      code: "CMD-001",
      tableId: "table-01",
      customerName: "Família Silva",
      openedAt: "2026-08-16T20:14:00-03:00",
      status: "aberta",
      items: [
        { id: "quentinha-m", name: "Quentinha M", size: "M", qty: 1, unitPrice: 14 },
        { id: "refri-250", name: "Refrigerante 250 ml", size: "250 ml", qty: 1, unitPrice: 5 },
      ],
    },
  },
  {
    id: "table-02",
    number: 2,
    seats: 4,
    status: "ocupada",
    command: {
      id: "command-02",
      code: "CMD-002",
      tableId: "table-02",
      customerName: "Pedro e amigos",
      openedAt: "2026-08-16T20:32:00-03:00",
      status: "aberta",
      items: [
        { id: "quentinha-g", name: "Quentinha G", size: "G", qty: 1, unitPrice: 20 },
        {
          id: "salada-colorida",
          name: "Salada colorida na maionese",
          size: "Porção",
          qty: 1,
          unitPrice: 7,
        },
        { id: "refri-1l", name: "Refrigerante 1 litro", size: "1 litro", qty: 1, unitPrice: 8 },
      ],
    },
  },
  {
    id: "table-03",
    number: 3,
    seats: 4,
    status: "aguardando_pagamento",
    command: {
      id: "command-03",
      code: "CMD-003",
      tableId: "table-03",
      customerName: "Beatriz Lima",
      openedAt: "2026-08-16T19:48:00-03:00",
      status: "aguardando_pagamento",
      items: [
        { id: "quentinha-p", name: "Quentinha P", size: "P", qty: 1, unitPrice: 12 },
        { id: "suco-goiaba", name: "Suco de goiaba", size: "Copo 300 ml", qty: 2, unitPrice: 7 },
      ],
    },
  },
  {
    id: "table-04",
    number: 4,
    seats: 6,
    status: "ocupada",
    command: {
      id: "command-04",
      code: "CMD-004",
      tableId: "table-04",
      customerName: "Grupo Oliveira",
      openedAt: "2026-08-16T20:50:00-03:00",
      status: "aberta",
      items: [
        { id: "quentinha-gg", name: "Quentinha GG", size: "GG", qty: 1, unitPrice: 30 },
        { id: "extra-file", name: "Filé trinchado extra", size: "Extra", qty: 1, unitPrice: 2 },
      ],
    },
  },
  { id: "table-05", number: 5, seats: 2, status: "livre" },
  { id: "table-06", number: 6, seats: 2, status: "livre" },
  { id: "table-07", number: 7, seats: 4, status: "livre" },
  { id: "table-08", number: 8, seats: 4, status: "livre" },
  { id: "table-09", number: 9, seats: 6, status: "livre" },
  { id: "table-10", number: 10, seats: 2, status: "livre" },
  { id: "table-11", number: 11, seats: 4, status: "livre" },
  { id: "table-12", number: 12, seats: 6, status: "livre" },
];

export function salonCommandTotal(command?: SalonCommand) {
  return command?.items.reduce((total, item) => total + item.qty * item.unitPrice, 0) ?? 0;
}

export function salonCommandItemCount(command?: SalonCommand) {
  return command?.items.reduce((total, item) => total + item.qty, 0) ?? 0;
}

export function formatSalonTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
