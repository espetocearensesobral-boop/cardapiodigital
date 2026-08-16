import { queryOptions } from "@tanstack/react-query";
export type Addon = { name: string; price: number };

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  badge: string | null;
  addons: Addon[];
  available: boolean;
  sort_order: number;
};

export type CartLine = {
  lineId: string;
  item: MenuItem;
  qty: number;
  addons: Addon[];
  obs: string;
  unitPrice: number;
};

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Muçarela",
    description: "Molho de tomate, muçarela, rodelas de tomate e orégano",
    price: 40.0,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1573821663912-569905455b1c?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 1,
  },
  {
    id: "2",
    name: "Calabresa",
    description: "Molho de tomate, muçarela, calabresa fatiada, cebola e orégano",
    price: 42.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop",
    badge: "Mais Vendida",
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 2,
  },
  {
    id: "3",
    name: "Portuguesa",
    description: "Molho de tomate, muçarela, presunto, ovos, cebola, ervilha e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 3,
  },
  {
    id: "4",
    name: "Frango com Catupiry",
    description: "Molho de tomate, muçarela, frango desfiado, catupiry e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
    badge: "Favorito",
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 4,
  },
  {
    id: "5",
    name: "Quatro Queijos",
    description: "Molho de tomate, muçarela, catupiry, provolone e parmesão",
    price: 42.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 5,
  },
  {
    id: "6",
    name: "Pepperoni",
    description: "Molho de tomate, muçarela, pepperoni fatiado e orégano",
    price: 45.9,
    category: "especial",
    image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=600&fit=crop",
    badge: "Especial",
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 6,
  },
  {
    id: "7",
    name: "Carne de Sol/Catupiry",
    description: "Molho de tomate, muçarela, carne de sol desfiada, catupiry e orégano",
    price: 48.9,
    category: "especial",
    image_url: "https://images.unsplash.com/photo-1593504049359-7b7974468677?w=600&h=600&fit=crop",
    badge: "Especial",
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 7,
  },
  {
    id: "8",
    name: "Calabresa/Catupiry",
    description: "Molho de tomate, muçarela, calabresa, catupiry e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 8,
  },
  {
    id: "9",
    name: "Calabresa/Cheddar",
    description: "Molho de tomate, muçarela, calabresa, cheddar e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 9,
  },
  {
    id: "10",
    name: "Carne de Sol/Cheddar",
    description: "Molho de tomate, muçarela, carne de sol, cheddar e orégano",
    price: 48.9,
    category: "especial",
    image_url: "https://images.unsplash.com/photo-1593504049359-7b7974468677?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 10,
  },
  {
    id: "11",
    name: "Frango/Cream Cheese",
    description: "Molho de tomate, muçarela, frango desfiado, cream cheese e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 11,
  },
  {
    id: "12",
    name: "Calabresa/Cream Cheese",
    description: "Molho de tomate, muçarela, calabresa, cream cheese e orégano",
    price: 45.9,
    category: "tradicional",
    image_url: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop",
    badge: null,
    addons: [
      { name: "Requeijão Cremoso", price: 6 },
      { name: "Catupiry", price: 8 },
      { name: "Cheddar", price: 6 },
      { name: "Chocolate Harold", price: 6 },
    ],
    available: true,
    sort_order: 12,
  },
  {
    id: "13",
    name: "Coca-Cola 2L",
    description: "Garrafa 2 Litros bem gelada",
    price: 14.0,
    category: "bebidas",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop",
    badge: null,
    addons: [],
    available: true,
    sort_order: 13,
  },
  {
    id: "14",
    name: "Guaraná Antarctica 2L",
    description: "Garrafa 2 Litros gelada",
    price: 12.0,
    category: "bebidas",
    image_url: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=600&fit=crop",
    badge: null,
    addons: [],
    available: true,
    sort_order: 14,
  },
];

export async function fetchMenu(): Promise<MenuItem[]> {
  // Mock temporário: a integração Supabase pode ser reativada sem alterar o contrato da query.
  return DEFAULT_MENU_ITEMS.filter((item) => item.available);
}

export const menuQueryOptions = queryOptions({
  queryKey: ["menu"],
  queryFn: fetchMenu,
  staleTime: 60_000,
});

export function lineTotal(line: CartLine) {
  return line.unitPrice * line.qty;
}

export function cartSubtotal(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + lineTotal(line), 0);
}
