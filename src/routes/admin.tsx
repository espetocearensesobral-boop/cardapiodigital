import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Package,
  Layers,
  Sparkles,
  Save,
  ShoppingBag,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { menuQueryOptions, type MenuItem, type Addon } from "@/lib/menu";
import { brl } from "@/lib/format";
import {
  useSystemSettings,
  saveSystemSettings,
  useCategories,
  saveCategories,
  useGlobalAddons,
  saveGlobalAddons,
  type SystemSettings,
  type CategoryItem,
  type GlobalAddon,
} from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQueryOptions),
  component: AdminPage,
});

interface DbOrder {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  order_type: "delivery" | "local";
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  reference?: string | null;
  table_number?: string | null;
  payment_method?: string | null;
  change_for?: string | null;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    addons?: Array<{ name: string; price: number }>;
    obs?: string;
  }>;
  notes?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
}

function AdminPage() {
  const { data: menu } = useSuspenseQuery(menuQueryOptions);
  const queryClient = useQueryClient();

  // Settings & Store State
  const systemSettings = useSystemSettings();
  const categories = useCategories();
  const globalAddons = useGlobalAddons();

  // Local state for System Form
  const [sysForm, setSysForm] = useState<SystemSettings>(systemSettings);

  // Modals state
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🍕");

  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState<number | "">("");

  // Orders Cloud Database Query
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<DbOrder | null>(null);
  const {
    data: cloudOrders = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["cloud_orders_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Could not load cloud orders:", error);
        return [];
      }
      return (data || []) as unknown as DbOrder[];
    },
  });

  // Product Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (item: Partial<MenuItem>) => {
      const { id, ...rest } = item;
      if (id && !id.match(/^\d+$/)) {
        const { error } = await supabase.from("menu_items").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert([rest as Omit<MenuItem, "id">]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Produto salvo com sucesso!");
      setIsItemDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Produto removido!");
    },
    onError: (error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const handleEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsItemDialogOpen(true);
  };

  const handleAddItem = () => {
    setEditingItem({
      name: "",
      description: "",
      price: 0,
      category: categories[0]?.id || "tradicional",
      image_url: "",
      available: true,
      badge: null,
      addons: globalAddons.map((a) => ({ name: a.name, price: a.price })),
      sort_order: menu.length + 1,
    });
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  // Category Actions
  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    const slug = newCatLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-");

    const updated = [...categories, { id: slug, label: newCatLabel.trim(), emoji: newCatEmoji }];
    saveCategories(updated);
    setNewCatLabel("");
    toast.success("Categoria adicionada!");
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) {
      toast.error("É necessário ter pelo menos uma categoria.");
      return;
    }
    const updated = categories.filter((c) => c.id !== id);
    saveCategories(updated);
    toast.success("Categoria removida!");
  };

  // Addon Actions
  const handleAddAddon = () => {
    if (!newAddonName.trim() || newAddonPrice === "") return;
    const newAddon: GlobalAddon = {
      id: String(Date.now()),
      name: newAddonName.trim(),
      price: Number(newAddonPrice),
    };
    const updated = [...globalAddons, newAddon];
    saveGlobalAddons(updated);
    setNewAddonName("");
    setNewAddonPrice("");
    toast.success("Adicional/Borda salvo!");
  };

  const handleDeleteAddon = (id: string) => {
    const updated = globalAddons.filter((a) => a.id !== id);
    saveGlobalAddons(updated);
    toast.success("Adicional removido!");
  };

  // System Settings Save
  const handleSaveSystemSettings = () => {
    saveSystemSettings(sysForm);
    toast.success("Configurações do sistema salvas com sucesso!");
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl bg-background p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie produtos, categorias, adicionais e configurações da {systemSettings.name}
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="size-4" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2">
            <ShoppingBag className="size-4" /> Pedidos Nuvem
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-2">
            <SettingsIcon className="size-4" /> Painel Sistema
          </TabsTrigger>
        </TabsList>

        {/* TAB PRODUTOS */}
        <TabsContent value="produtos" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="gap-1.5"
              >
                <Layers className="size-4" /> Categorias ({categories.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddonDialogOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="size-4" /> Adicionais & Bordas ({globalAddons.length})
              </Button>
            </div>
            <Button onClick={handleAddItem} className="gap-2">
              <Plus className="size-4" /> Novo Produto
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Adicionais</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menu.map((item) => {
                  const categoryLabel =
                    categories.find((c) => c.id === item.category)?.label || item.category;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="size-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                            <ImageIcon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.badge ? (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="capitalize">{categoryLabel}</TableCell>
                      <TableCell>{brl(item.price)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.addons?.length ? `${item.addons.length} opção(ões)` : "Nenhum"}
                      </TableCell>
                      <TableCell>
                        {item.available ? (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                            Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                            Indisponível
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB PEDIDOS NUVEM */}
        <TabsContent value="pedidos" className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                📦 Pedidos Gravados no Banco de Dados
              </h3>
              <p className="text-xs text-muted-foreground">
                Acompanhe em tempo real todos os pedidos recebidos e salvos na nuvem
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOrders()}
              className="gap-2"
              disabled={isLoadingOrders}
            >
              <RefreshCw className={`size-4 ${isLoadingOrders ? "animate-spin" : ""}`} />
              Atualizar Lista
            </Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Comprovante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cloudOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoadingOrders
                        ? "Carregando pedidos da nuvem..."
                        : "Nenhum pedido gravado no banco de dados até o momento."}
                    </TableCell>
                  </TableRow>
                ) : (
                  cloudOrders.map((ord: DbOrder) => (
                    <TableRow key={ord.id}>
                      <TableCell className="font-bold text-primary">{ord.code}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ord.created_at
                          ? new Date(ord.created_at).toLocaleString("pt-BR")
                          : "Recente"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{ord.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{ord.phone}</div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {ord.order_type === "delivery" ? "🛵 Entrega" : "🍽 Local"}
                      </TableCell>
                      <TableCell className="capitalize">{ord.payment_method || "—"}</TableCell>
                      <TableCell className="font-semibold">{brl(Number(ord.total))}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="gap-1.5"
                        >
                          <FileText className="size-4" /> Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB PAINEL SISTEMA */}
        <TabsContent value="sistema" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Dados do Restaurante */}
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                🏠 Identidade & Contato
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sys-name">Nome do Restaurante</Label>
                  <Input
                    id="sys-name"
                    value={sysForm.name}
                    onChange={(e) => setSysForm({ ...sysForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sys-tagline">Slogan / Subtítulo</Label>
                  <Input
                    id="sys-tagline"
                    value={sysForm.tagline}
                    onChange={(e) => setSysForm({ ...sysForm, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sys-whatsapp">WhatsApp Internacional (Ex: 5588981764990)</Label>
                  <Input
                    id="sys-whatsapp"
                    value={sysForm.whatsapp}
                    onChange={(e) => setSysForm({ ...sysForm, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sys-whatsapp-display">WhatsApp Exibição</Label>
                  <Input
                    id="sys-whatsapp-display"
                    value={sysForm.whatsappDisplay}
                    onChange={(e) => setSysForm({ ...sysForm, whatsappDisplay: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Taxas & Horários */}
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                🚚 Entrega & Horários
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sys-fee">Taxa de Entrega (R$)</Label>
                    <Input
                      id="sys-fee"
                      type="number"
                      step="0.5"
                      value={sysForm.deliveryFee}
                      onChange={(e) =>
                        setSysForm({ ...sysForm, deliveryFee: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sys-min">Pedido Mínimo (R$)</Label>
                    <Input
                      id="sys-min"
                      type="number"
                      step="1"
                      value={sysForm.minOrder}
                      onChange={(e) => setSysForm({ ...sysForm, minOrder: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label htmlFor="sys-open">Abertura (Hora 0-23)</Label>
                    <Input
                      id="sys-open"
                      type="number"
                      min={0}
                      max={23}
                      value={sysForm.openHour}
                      onChange={(e) => setSysForm({ ...sysForm, openHour: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sys-close">Fechamento (Hora 0-23)</Label>
                    <Input
                      id="sys-close"
                      type="number"
                      min={0}
                      max={23}
                      value={sysForm.closeHour}
                      onChange={(e) =>
                        setSysForm({ ...sysForm, closeHour: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm md:col-span-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                💳 Formas de Pagamento Aceitas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                  <Label htmlFor="pay-pix" className="cursor-pointer font-medium">
                    Pix Online / Entrega
                  </Label>
                  <Switch
                    id="pay-pix"
                    checked={sysForm.paymentMethods.pix}
                    onCheckedChange={(val) =>
                      setSysForm({
                        ...sysForm,
                        paymentMethods: { ...sysForm.paymentMethods, pix: val },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                  <Label htmlFor="pay-dinheiro" className="cursor-pointer font-medium">
                    Dinheiro em Espécie
                  </Label>
                  <Switch
                    id="pay-dinheiro"
                    checked={sysForm.paymentMethods.dinheiro}
                    onCheckedChange={(val) =>
                      setSysForm({
                        ...sysForm,
                        paymentMethods: { ...sysForm.paymentMethods, dinheiro: val },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                  <Label htmlFor="pay-cartao" className="cursor-pointer font-medium">
                    Cartão na Entrega
                  </Label>
                  <Switch
                    id="pay-cartao"
                    checked={sysForm.paymentMethods.cartao}
                    onCheckedChange={(val) =>
                      setSysForm({
                        ...sysForm,
                        paymentMethods: { ...sysForm.paymentMethods, cartao: val },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSystemSettings} size="lg" className="gap-2">
              <Save className="size-5" /> Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL NOVO / EDITAR PRODUTO */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nome do Produto</Label>
                <Input
                  id="item-name"
                  value={editingItem?.name || ""}
                  onChange={(e) => setEditingItem((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Categoria</Label>
                <Select
                  value={editingItem?.category || categories[0]?.id || "tradicional"}
                  onValueChange={(value) =>
                    setEditingItem((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="item-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Preço (R$)</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={editingItem?.price || 0}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-badge">Selo / Destaque (Opcional)</Label>
                <Input
                  id="item-badge"
                  placeholder="Ex: Mais Vendida, Favorito"
                  value={editingItem?.badge || ""}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      badge: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="item-available"
                  checked={editingItem?.available ?? true}
                  onCheckedChange={(checked) =>
                    setEditingItem((prev) => ({ ...prev, available: checked }))
                  }
                />
                <Label htmlFor="item-available">Disponível</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-desc">Descrição</Label>
              <Textarea
                id="item-desc"
                value={editingItem?.description || ""}
                onChange={(e) =>
                  setEditingItem((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">URL da Imagem</Label>
              <Input
                id="item-image"
                value={editingItem?.image_url || ""}
                onChange={(e) => setEditingItem((prev) => ({ ...prev, image_url: e.target.value }))}
              />
            </div>

            {/* Adicionais & Bordas vinculadas */}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm font-semibold">
                Adicionais & Bordas Vinculadas a este Produto
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {globalAddons.map((ga) => {
                  const currentAddons: Addon[] = editingItem?.addons || [];
                  const isChecked = currentAddons.some((a) => a.name === ga.name);

                  return (
                    <label
                      key={ga.id}
                      className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let next: Addon[];
                          if (e.target.checked) {
                            next = [...currentAddons, { name: ga.name, price: ga.price }];
                          } else {
                            next = currentAddons.filter((a) => a.name !== ga.name);
                          }
                          setEditingItem((prev) => ({ ...prev, addons: next }));
                        }}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>
                        {ga.name} ({brl(ga.price)})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => editingItem && saveMutation.mutate(editingItem)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL GERENCIAR CATEGORIAS */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nova Categoria (Ex: Especiais)"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
              />
              <Input
                placeholder="Emoji"
                className="w-20 text-center"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
              />
              <Button onClick={handleAddCategory}>Adicionar</Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm"
                >
                  <span className="font-medium">
                    {cat.emoji} {cat.label}{" "}
                    <span className="text-xs text-muted-foreground">({cat.id})</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsCategoryDialogOpen(false)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL GERENCIAR ADICIONAIS / BORDAS */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Adicionais & Bordas Globais</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nome (Ex: Borda de Catupiry)"
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
              />
              <Input
                type="number"
                step="0.5"
                placeholder="Preço R$"
                className="w-28"
                value={newAddonPrice}
                onChange={(e) =>
                  setNewAddonPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <Button onClick={handleAddAddon}>Adicionar</Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              {globalAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm"
                >
                  <span className="font-medium">{addon.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">{brl(addon.price)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAddon(addon.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsAddonDialogOpen(false)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALHES / COMPROVANTE DO PEDIDO NUVEM */}
      <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comprovante de Pedido</span>
              <span className="text-primary font-mono text-sm">{selectedOrderDetails?.code}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrderDetails && (
            <div className="space-y-4 py-2 text-sm font-sans">
              <div className="rounded-lg bg-muted/60 p-3 space-y-1 text-xs">
                <div>
                  <strong>Cliente:</strong> {selectedOrderDetails.customer_name} (
                  {selectedOrderDetails.phone})
                </div>
                <div>
                  <strong>Data/Hora:</strong>{" "}
                  {selectedOrderDetails.created_at
                    ? new Date(selectedOrderDetails.created_at).toLocaleString("pt-BR")
                    : "—"}
                </div>
                <div>
                  <strong>Tipo:</strong>{" "}
                  {selectedOrderDetails.order_type === "delivery"
                    ? "Delivery / Entrega"
                    : "Consumo no Local"}
                </div>
                {selectedOrderDetails.order_type === "delivery" ? (
                  <div>
                    <strong>Endereço:</strong> {selectedOrderDetails.street},{" "}
                    {selectedOrderDetails.number} - {selectedOrderDetails.neighborhood}
                    {selectedOrderDetails.complement ? ` (${selectedOrderDetails.complement})` : ""}
                    {selectedOrderDetails.reference
                      ? ` | Ref: ${selectedOrderDetails.reference}`
                      : ""}
                  </div>
                ) : (
                  selectedOrderDetails.table_number && (
                    <div>
                      <strong>Mesa:</strong> Nº {selectedOrderDetails.table_number}
                    </div>
                  )
                )}
              </div>

              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Itens do Pedido
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-card">
                  {Array.isArray(selectedOrderDetails.items) &&
                    selectedOrderDetails.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="border-b last:border-0 pb-2 last:pb-0 text-xs space-y-0.5"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>
                            {it.qty}x {it.name}
                          </span>
                          <span>{brl(it.unitPrice * it.qty)}</span>
                        </div>
                        {it.addons && it.addons.length > 0 && (
                          <div className="text-muted-foreground text-[11px] pl-2">
                            + {it.addons.map((a) => `${a.name} (${brl(a.price)})`).join(", ")}
                          </div>
                        )}
                        {it.obs && (
                          <div className="text-muted-foreground italic text-[11px] pl-2">
                            Obs: {it.obs}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {selectedOrderDetails.notes && (
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 p-2.5 rounded-md">
                  <strong>Observação do Pedido:</strong> {selectedOrderDetails.notes}
                </div>
              )}

              <div className="space-y-1.5 border-t pt-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>{brl(Number(selectedOrderDetails.subtotal))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de Entrega:</span>
                  <span>{brl(Number(selectedOrderDetails.delivery_fee))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Forma de Pagamento:</span>
                  <span className="capitalize">{selectedOrderDetails.payment_method || "—"}</span>
                </div>
                {selectedOrderDetails.change_for && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Troco para:</span>
                    <span>R$ {selectedOrderDetails.change_for}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                  <span>Total do Pedido:</span>
                  <span className="text-primary">{brl(Number(selectedOrderDetails.total))}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedOrderDetails(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
