import { queryOptions } from "@tanstack/react-query";

export type AddonGroup = "mistura" | "guarnicao" | "extra";

export type Addon = {
  name: string;
  price: number;
  group?: AddonGroup;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  size: string;
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

const QUENTINHA_IMAGE = "/catalog/quentinha-real-reference.png";
const MISTURAS_IMAGE = "/catalog/misturas-guarnicoes-real.jpg";
const SALADAS_IMAGE = "/catalog/saladas-real.jpg";
const BEBIDAS_IMAGE = "/catalog/bebidas-real.jpg";

const MISTURAS: Addon[] = [
  {
    name: "Panqueca de frango ao molho branco com queijo gratinado",
    price: 0,
    group: "mistura",
  },
  { name: "Galinha caipira ao molho com pirão", price: 0, group: "mistura" },
  { name: "Filé trinchado ao acréscimo de 2 reais", price: 2, group: "mistura" },
  { name: "Strogonoff de carne", price: 0, group: "mistura" },
  {
    name: "Carne de panela ao purê de batata acréscimo de 2 reais",
    price: 2,
    group: "mistura",
  },
  { name: "Linguiça Toscana frita", price: 0, group: "mistura" },
  { name: "Ovos fritos ou cozidos — 2 unidades", price: 0, group: "mistura" },
];

const GUARNICOES: Addon[] = [
  { name: "Baião de dois", price: 0, group: "guarnicao" },
  { name: "Arroz de cenoura refogado", price: 0, group: "guarnicao" },
  { name: "Feijão carioca", price: 0, group: "guarnicao" },
  { name: "Macarrão espaguete", price: 0, group: "guarnicao" },
  { name: "Farofa tradicional ou pirão", price: 0, group: "guarnicao" },
];

const QUENTINHA_OPTIONS = [...MISTURAS, ...GUARNICOES];

export const QUENTINHA_PROTEIN_LIMITS: Record<string, number> = {
  P: 1,
  M: 1,
  G: 2,
  GG: 3,
};

export function isQuentinha(item: Pick<MenuItem, "category"> | null | undefined) {
  return item?.category === "quentinhas";
}

export function proteinLimitForSize(size: string) {
  return QUENTINHA_PROTEIN_LIMITS[size.trim().toUpperCase()] ?? 1;
}

export function addonGroupLabel(group?: AddonGroup) {
  if (group === "mistura") return "Mistura";
  if (group === "guarnicao") return "Guarnição";
  return "Adicional";
}

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: "quentinha-p",
    name: "Quentinha P",
    description: "01 proteína + guarnições. Escolha sua mistura e acompanhamento.",
    size: "P",
    price: 12,
    category: "quentinhas",
    image_url: QUENTINHA_IMAGE,
    badge: "Econômica",
    addons: QUENTINHA_OPTIONS,
    available: true,
    sort_order: 1,
  },
  {
    id: "quentinha-m",
    name: "Quentinha M",
    description: "01 proteína + guarnições. Porção individual caprichada.",
    size: "M",
    price: 14,
    category: "quentinhas",
    image_url: QUENTINHA_IMAGE,
    badge: "Mais pedida",
    addons: QUENTINHA_OPTIONS,
    available: true,
    sort_order: 2,
  },
  {
    id: "quentinha-g",
    name: "Quentinha G",
    description: "02 proteínas + guarnições. Mais sabor para matar a fome.",
    size: "G",
    price: 20,
    category: "quentinhas",
    image_url: QUENTINHA_IMAGE,
    badge: "Mais vendida",
    addons: QUENTINHA_OPTIONS,
    available: true,
    sort_order: 3,
  },
  {
    id: "quentinha-gg",
    name: "Quentinha GG",
    description: "03 proteínas + guarnições. A opção família da casa.",
    size: "GG",
    price: 30,
    category: "quentinhas",
    image_url: QUENTINHA_IMAGE,
    badge: "Família",
    addons: QUENTINHA_OPTIONS,
    available: true,
    sort_order: 4,
  },
  {
    id: "salada-legumes",
    name: "Salada de legumes na maionese",
    description: "Salada cremosa e refrescante para acompanhar sua quentinha.",
    size: "Porção",
    price: 7,
    category: "saladas",
    image_url: SALADAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 5,
  },
  {
    id: "salada-colorida",
    name: "Salada colorida na maionese",
    description: "Seleção colorida de legumes com maionese da casa.",
    size: "Porção",
    price: 7,
    category: "saladas",
    image_url: SALADAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 6,
  },
  {
    id: "refri-250",
    name: "Refrigerante 250 ml",
    description: "Bebida gelada para acompanhar sua refeição.",
    size: "250 ml",
    price: 5,
    category: "adicionais",
    image_url: BEBIDAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 7,
  },
  {
    id: "refri-1l",
    name: "Refrigerante 1 litro",
    description: "Refrigerante gelado para compartilhar.",
    size: "1 litro",
    price: 8,
    category: "adicionais",
    image_url: BEBIDAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 8,
  },
  {
    id: "refri-2l",
    name: "Refrigerante 2 litros",
    description: "Garrafa de 2 litros bem gelada.",
    size: "2 litros",
    price: 12,
    category: "adicionais",
    image_url: BEBIDAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 9,
  },
  {
    id: "suco-goiaba",
    name: "Suco de goiaba",
    description: "Suco de goiaba gelado.",
    size: "Copo 300 ml",
    price: 7,
    category: "adicionais",
    image_url: BEBIDAS_IMAGE,
    badge: "Natural",
    addons: [],
    available: true,
    sort_order: 10,
  },
  {
    id: "extra-file",
    name: "Filé trinchado extra",
    description: "Adicione uma porção extra de filé trinchado à sua quentinha.",
    size: "Extra",
    price: 2,
    category: "adicionais",
    image_url: MISTURAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 11,
  },
  {
    id: "extra-carne-panela",
    name: "Carne de panela extra",
    description: "Adicione uma porção extra de carne de panela com purê.",
    size: "Extra",
    price: 2,
    category: "adicionais",
    image_url: MISTURAS_IMAGE,
    badge: null,
    addons: [],
    available: true,
    sort_order: 12,
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
