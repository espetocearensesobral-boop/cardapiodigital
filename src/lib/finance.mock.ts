export type FinancePeriod = "today" | "7d" | "30d";

export type FinanceSummary = {
  grossSales: number;
  completedSales: number;
  pendingAmount: number;
  cancelledAmount: number;
  netBalance: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  averageTicket: number;
  deliveryRevenue: number;
};

export type FinanceDayPoint = {
  label: string;
  orders: number;
  sales: number;
};

export type FinanceHourPoint = {
  label: string;
  orders: number;
  sales: number;
};

export type PopularDish = {
  name: string;
  orders: number;
  units: number;
  sales: number;
  share: number;
};

export type FinanceSnapshot = {
  periodLabel: string;
  updatedAt: string;
  summary: FinanceSummary;
  days: FinanceDayPoint[];
  hours: FinanceHourPoint[];
  popularDishes: PopularDish[];
};

export const FINANCE_SNAPSHOTS: Record<FinancePeriod, FinanceSnapshot> = {
  today: {
    periodLabel: "Hoje, 16 de agosto",
    updatedAt: "Atualizado às 22:00",
    summary: {
      grossSales: 4469.8,
      completedSales: 3826.9,
      pendingAmount: 481.2,
      cancelledAmount: 161.7,
      netBalance: 3826.9,
      totalOrders: 76,
      completedOrders: 64,
      cancelledOrders: 3,
      cancellationRate: 3.9,
      averageTicket: 59.8,
      deliveryRevenue: 245,
    },
    days: [
      { label: "10/08", orders: 48, sales: 2790 },
      { label: "11/08", orders: 55, sales: 3210 },
      { label: "12/08", orders: 51, sales: 2985 },
      { label: "13/08", orders: 63, sales: 3740 },
      { label: "14/08", orders: 69, sales: 4105 },
      { label: "15/08", orders: 72, sales: 4275 },
      { label: "16/08", orders: 76, sales: 4469.8 },
    ],
    hours: [
      { label: "18h", orders: 7, sales: 402 },
      { label: "19h", orders: 13, sales: 780 },
      { label: "20h", orders: 19, sales: 1124 },
      { label: "21h", orders: 22, sales: 1335 },
      { label: "22h", orders: 15, sales: 828 },
    ],
    popularDishes: [
      { name: "Muçarela", orders: 26, units: 31, sales: 1240, share: 25 },
      { name: "Calabresa", orders: 22, units: 25, sales: 1072.5, share: 21 },
      { name: "Frango com Catupiry", orders: 18, units: 20, sales: 918, share: 18 },
      { name: "Portuguesa", orders: 14, units: 16, sales: 734.4, share: 15 },
      { name: "Pepperoni", orders: 11, units: 12, sales: 550.8, share: 11 },
    ],
  },
  "7d": {
    periodLabel: "Últimos 7 dias",
    updatedAt: "Atualizado agora",
    summary: {
      grossSales: 23680.4,
      completedSales: 20490.8,
      pendingAmount: 2472.2,
      cancelledAmount: 717.4,
      netBalance: 20490.8,
      totalOrders: 402,
      completedOrders: 351,
      cancelledOrders: 18,
      cancellationRate: 4.5,
      averageTicket: 58.9,
      deliveryRevenue: 1290,
    },
    days: [
      { label: "10/08", orders: 48, sales: 2790 },
      { label: "11/08", orders: 55, sales: 3210 },
      { label: "12/08", orders: 51, sales: 2985 },
      { label: "13/08", orders: 63, sales: 3740 },
      { label: "14/08", orders: 69, sales: 4105 },
      { label: "15/08", orders: 72, sales: 4275 },
      { label: "16/08", orders: 76, sales: 4469.8 },
    ],
    hours: [
      { label: "18h", orders: 34, sales: 1940 },
      { label: "19h", orders: 76, sales: 4420 },
      { label: "20h", orders: 104, sales: 6180 },
      { label: "21h", orders: 116, sales: 6920 },
      { label: "22h", orders: 72, sales: 4220 },
    ],
    popularDishes: [
      { name: "Muçarela", orders: 138, units: 166, sales: 6640, share: 24 },
      { name: "Calabresa", orders: 116, units: 133, sales: 5700, share: 21 },
      { name: "Frango com Catupiry", orders: 94, units: 105, sales: 4820, share: 17 },
      { name: "Portuguesa", orders: 76, units: 88, sales: 4040, share: 14 },
      { name: "Pepperoni", orders: 61, units: 68, sales: 3120, share: 11 },
    ],
  },
  "30d": {
    periodLabel: "Últimos 30 dias",
    updatedAt: "Atualizado agora",
    summary: {
      grossSales: 94128.6,
      completedSales: 82455.2,
      pendingAmount: 8130.8,
      cancelledAmount: 3542.6,
      netBalance: 82455.2,
      totalOrders: 1638,
      completedOrders: 1432,
      cancelledOrders: 72,
      cancellationRate: 4.4,
      averageTicket: 57.5,
      deliveryRevenue: 5280,
    },
    days: [
      { label: "18/07", orders: 49, sales: 2840 },
      { label: "23/07", orders: 54, sales: 3110 },
      { label: "28/07", orders: 61, sales: 3590 },
      { label: "02/08", orders: 65, sales: 3830 },
      { label: "07/08", orders: 68, sales: 4010 },
      { label: "12/08", orders: 72, sales: 4260 },
      { label: "16/08", orders: 76, sales: 4469.8 },
    ],
    hours: [
      { label: "18h", orders: 138, sales: 8020 },
      { label: "19h", orders: 284, sales: 16350 },
      { label: "20h", orders: 410, sales: 23890 },
      { label: "21h", orders: 472, sales: 28140 },
      { label: "22h", orders: 334, sales: 17728.6 },
    ],
    popularDishes: [
      { name: "Muçarela", orders: 540, units: 668, sales: 26720, share: 24 },
      { name: "Calabresa", orders: 468, units: 532, sales: 22950, share: 21 },
      { name: "Frango com Catupiry", orders: 382, units: 429, sales: 19680, share: 17 },
      { name: "Portuguesa", orders: 312, units: 365, sales: 16790, share: 15 },
      { name: "Pepperoni", orders: 258, units: 291, sales: 13320, share: 12 },
    ],
  },
};

export const FINANCE_PERIOD_LABELS: Record<FinancePeriod, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
};

export function getPeakPoint<T extends { orders: number }>(points: T[]) {
  return points.reduce<T | null>(
    (peak, point) => (!peak || point.orders > peak.orders ? point : peak),
    null,
  );
}
