import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteMenuItem,
  adminListOrders,
  adminSaveMenuItem,
  adminSaveStoreSettings,
  adminUpdateOrderStatus,
} from "@/lib/admin.functions";
import { menuQueryOptions, type MenuItem, type Addon } from "@/lib/menu";
import { brl } from "@/lib/format";
import { playNotificationSound } from "@/lib/sound";
import { ADMIN_DEMO_MODE, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/admin-demo";
import {
  useSystemSettings,
  useCategories,
  useGlobalAddons,
  storeSettingsQueryOptions,
  type SystemSettings,
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
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(menuQueryOptions),
      context.queryClient.ensureQueryData(storeSettingsQueryOptions),
    ]),
  component: AdminPage,
});

type OrderStatus =
  "recebido" | "confirmado" | "em_preparo" | "saiu_entrega" | "concluido" | "cancelado";

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "recebido", label: "Recebido" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_preparo", label: "Em preparo" },
  { value: "saiu_entrega", label: "Saiu para entrega" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

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
  status: OrderStatus;
  created_at: string;
}

function AdminPage() {
  const access = useAdminAccess();

  if (access.status === "loading") {
    return <AdminAccessState title="Verificando acesso..." />;
  }

  if (access.status === "unauthenticated") {
    return <AdminLogin onSignIn={access.signIn} error={access.error} />;
  }

  if (access.status === "unauthorized") {
    return (
      <AdminAccessState
        title="Acesso não autorizado"
        description={access.error ?? "Sua conta não possui permissão para acessar este painel."}
        action={<Button onClick={() => void access.signOut()}>Sair</Button>}
      />
    );
  }

  return <AdminWorkspace onSignOut={access.signOut} />;
}

function AdminAccessState({
  title,
  description = "Aguarde enquanto validamos sua sessão.",
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-card">
        <ShieldCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

function AdminLogin({
  onSignIn,
  error,
}: {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await onSignIn(email, password);
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card"
      >
        <div className="text-center">
          <ShieldCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com uma conta autorizada da equipe.
          </p>
          {ADMIN_DEMO_MODE ? (
            <div className="mt-4 rounded-xl border border-primary/20 bg-accent p-3 text-left text-xs text-primary">
              <p className="font-semibold">Acesso de demonstração ativo</p>
              <p className="mt-1">
                Usuário: <code className="font-mono font-semibold">{DEMO_ADMIN_EMAIL}</code>
              </p>
              <p className="mt-0.5">
                Senha: <code className="font-mono font-semibold">{DEMO_ADMIN_PASSWORD}</code>
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="h-11 w-full gap-2" disabled={isSubmitting}>
            <LogIn className="size-4" />
            {isSubmitting ? "Entrando..." : "Entrar no painel"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AdminWorkspace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { data: menu } = useSuspenseQuery(menuQueryOptions);
  const queryClient = useQueryClient();
  const systemSettings = useSystemSettings();
  const categories = useCategories();
  const globalAddons = useGlobalAddons();
  const listOrders = useServerFn(adminListOrders);
  const saveMenuItem = useServerFn(adminSaveMenuItem);
  const deleteMenuItem = useServerFn(adminDeleteMenuItem);
  const saveStoreSettings = useServerFn(adminSaveStoreSettings);
  const updateOrderStatus = useServerFn(adminUpdateOrderStatus);

  const [sysForm, setSysForm] = useState<SystemSettings>(systemSettings);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🍕");
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState<number | "">("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<DbOrder | null>(null);

  useEffect(() => {
    setSysForm(systemSettings);
  }, [systemSettings]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["cloud_orders_list"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const {
    data: cloudOrders = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useQuery<DbOrder[]>({
    queryKey: ["cloud_orders_list"],
    queryFn: async () => (await listOrders()) as unknown as DbOrder[],
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<MenuItem>) =>
      saveMenuItem({
        data: {
          id: item.id,
          name: item.name ?? "",
          description: item.description ?? "",
          price: item.price ?? 0,
          category: item.category ?? categories[0]?.id ?? "tradicional",
          image_url: item.image_url ?? "",
          badge: item.badge ?? null,
          addons: item.addons ?? [],
          available: item.available ?? true,
          sort_order: item.sort_order ?? menu.length + 1,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Produto salvo com sucesso!");
      playNotificationSound();
      setIsItemDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Produto removido!");
      playNotificationSound();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function persistSettings(
    nextSystem: SystemSettings = systemSettings,
    nextCategories = categories,
    nextAddons = globalAddons,
  ) {
    await saveStoreSettings({
      data: {
        ...nextSystem,
        categories: nextCategories,
        globalAddons: nextAddons,
      },
    });
    await queryClient.invalidateQueries({ queryKey: ["store-settings"] });
  }

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
    if (window.confirm("Tem certeza que deseja excluir este produto?")) deleteMutation.mutate(id);
  };

  const handleAddCategory = async () => {
    if (!newCatLabel.trim()) return;
    const slug = newCatLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const updated = [...categories, { id: slug, label: newCatLabel.trim(), emoji: newCatEmoji }];
    try {
      await persistSettings(systemSettings, updated, globalAddons);
      setNewCatLabel("");
      toast.success("Categoria adicionada!");
      playNotificationSound();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (categories.length <= 1) {
      toast.error("É necessário ter pelo menos uma categoria.");
      return;
    }
    try {
      await persistSettings(
        systemSettings,
        categories.filter((c) => c.id !== id),
        globalAddons,
      );
      toast.success("Categoria removida!");
      playNotificationSound();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a categoria.");
    }
  };

  const handleAddAddon = async () => {
    if (!newAddonName.trim() || newAddonPrice === "" || !Number.isFinite(newAddonPrice)) return;
    const newAddon: GlobalAddon = {
      id: crypto.randomUUID(),
      name: newAddonName.trim(),
      price: Number(newAddonPrice),
    };
    try {
      await persistSettings(systemSettings, categories, [...globalAddons, newAddon]);
      setNewAddonName("");
      setNewAddonPrice("");
      toast.success("Adicional/Borda salvo!");
      playNotificationSound();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o adicional.");
    }
  };

  const handleDeleteAddon = async (id: string) => {
    try {
      await persistSettings(
        systemSettings,
        categories,
        globalAddons.filter((a) => a.id !== id),
      );
      toast.success("Adicional removido!");
      playNotificationSound();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o adicional.");
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      await persistSettings(sysForm, categories, globalAddons);
      toast.success("Configurações do sistema salvas com sucesso!");
      playNotificationSound();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar as configurações.",
      );
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl bg-background p-3 sm:p-6 md:p-8">
      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex size-11 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Voltar ao Cardápio"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">
              Painel Administrativo
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Gerencie produtos, categorias, adicionais e configurações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button asChild type="button" variant="outline" className="h-10 gap-2">
            <Link to="/pedidos">
              <ShoppingBag className="size-4" />
              Pedidos
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => void onSignOut()}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="mb-4 sm:mb-6 flex w-full overflow-x-auto border bg-card p-1 rounded-xl shadow-xs gap-1">
          <TabsTrigger
            value="produtos"
            className="flex-1 min-w-[100px] gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <Package className="size-4 shrink-0" />
            <span className="truncate">Produtos</span>
          </TabsTrigger>
          <TabsTrigger
            value="pedidos"
            className="flex-1 min-w-[120px] gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <ShoppingBag className="size-4 shrink-0" />
            <span className="truncate">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger
            value="sistema"
            className="flex-1 min-w-[110px] gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <SettingsIcon className="size-4 shrink-0" />
            <span className="truncate">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB PRODUTOS */}
        <TabsContent value="produtos" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="gap-1.5 text-xs h-11 sm:h-9 flex-1 sm:flex-none"
              >
                <Layers className="size-4" /> Categorias ({categories.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddonDialogOpen(true)}
                className="gap-1.5 text-xs h-11 sm:h-9 flex-1 sm:flex-none"
              >
                <Sparkles className="size-4" /> Adicionais ({globalAddons.length})
              </Button>
            </div>
            <Button
              onClick={handleAddItem}
              className="gap-2 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto font-semibold"
            >
              <Plus className="size-4" /> Novo Produto
            </Button>
          </div>

          {/* Versão Mobile: Cards de Produtos */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {menu.map((item) => {
              const categoryLabel =
                categories.find((c) => c.id === item.category)?.label || item.category;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-xs transition-all"
                >
                  <div className="flex items-start gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="size-16 rounded-lg object-cover border shrink-0"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted border">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <span className="font-bold text-primary text-sm shrink-0">
                          {brl(item.price)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                          {categoryLabel}
                        </span>
                        {item.badge && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed break-words">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2.5 mt-1 text-xs">
                    <div>
                      {item.available ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          • Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
                          • Indisponível
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="h-9 gap-1 px-2.5 text-xs"
                      >
                        <Pencil className="size-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-1 px-2.5 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="size-3.5" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Versão Desktop: Tabela de Produtos */}
          <div className="hidden md:block rounded-xl border bg-card overflow-x-auto shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
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
                            className="size-10 rounded-md object-cover border"
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
                      <TableCell className="font-semibold">{brl(item.price)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.addons?.length ? `${item.addons.length} opção(ões)` : "Nenhum"}
                      </TableCell>
                      <TableCell>
                        {item.available ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                            Indisponível
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-xl border shadow-xs">
            <div>
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                📦 Pedidos Gravados na Nuvem
              </h3>
              <p className="text-xs text-muted-foreground">
                Acompanhe em tempo real todos os pedidos recebidos no banco de dados
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOrders()}
              className="gap-2 h-11 sm:h-9 text-xs sm:text-sm shrink-0 w-full sm:w-auto"
              disabled={isLoadingOrders}
            >
              <RefreshCw className={`size-3.5 ${isLoadingOrders ? "animate-spin" : ""}`} />
              Atualizar Lista
            </Button>
          </div>

          {/* Versão Mobile: Cards de Pedidos */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {cloudOrders.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-xl border p-4 text-xs text-muted-foreground">
                {isLoadingOrders
                  ? "Carregando pedidos da nuvem..."
                  : "Nenhum pedido gravado no banco de dados até o momento."}
              </div>
            ) : (
              cloudOrders.map((ord: DbOrder) => (
                <div
                  key={ord.id}
                  className="flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-primary text-sm font-mono">{ord.code}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {ord.created_at
                        ? new Date(ord.created_at).toLocaleString("pt-BR")
                        : "Recente"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between text-xs gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{ord.customer_name}</div>
                      <div className="text-muted-foreground truncate">{ord.phone}</div>
                    </div>
                    <div className="text-right font-bold text-sm text-foreground shrink-0">
                      {brl(Number(ord.total))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 mt-0.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                        {ord.order_type === "delivery" ? "🛵 Delivery" : "🍽 Local"}
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary capitalize">
                        {ord.payment_method || "—"}
                      </span>
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {ORDER_STATUS_OPTIONS.find((option) => option.value === ord.status)
                          ?.label ?? ord.status}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderDetails(ord)}
                      className="h-9 text-xs gap-1.5 w-full sm:w-auto"
                    >
                      <FileText className="size-3.5" /> Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Versão Desktop: Tabela de Pedidos */}
          <div className="hidden md:block rounded-xl border bg-card overflow-x-auto shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Comprovante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cloudOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {isLoadingOrders
                        ? "Carregando pedidos da nuvem..."
                        : "Nenhum pedido gravado no banco de dados até o momento."}
                    </TableCell>
                  </TableRow>
                ) : (
                  cloudOrders.map((ord: DbOrder) => (
                    <TableRow key={ord.id}>
                      <TableCell className="font-bold text-primary font-mono">{ord.code}</TableCell>
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
                      <TableCell>
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {ORDER_STATUS_OPTIONS.find((option) => option.value === ord.status)
                            ?.label ?? ord.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{brl(Number(ord.total))}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="gap-2"
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
            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                🏠 Identidade & Contato
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sys-name">Nome do Restaurante</Label>
                  <Input
                    id="sys-name"
                    value={sysForm.name}
                    onChange={(e) => setSysForm({ ...sysForm, name: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-tagline">Slogan / Subtítulo</Label>
                  <Input
                    id="sys-tagline"
                    value={sysForm.tagline}
                    onChange={(e) => setSysForm({ ...sysForm, tagline: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-whatsapp">WhatsApp Internacional (Ex: 5588981764990)</Label>
                  <Input
                    id="sys-whatsapp"
                    value={sysForm.whatsapp}
                    onChange={(e) => setSysForm({ ...sysForm, whatsapp: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-whatsapp-display">WhatsApp Exibição</Label>
                  <Input
                    id="sys-whatsapp-display"
                    value={sysForm.whatsappDisplay}
                    onChange={(e) => setSysForm({ ...sysForm, whatsappDisplay: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Taxas & Horários */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                🚚 Entrega & Horários
              </h3>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3.5">
                <div>
                  <Label
                    htmlFor="sys-accepting-orders"
                    className="cursor-pointer text-sm font-semibold"
                  >
                    Aceitar novos pedidos
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Desative temporariamente o checkout público sem apagar o cardápio.
                  </p>
                </div>
                <Switch
                  id="sys-accepting-orders"
                  checked={sysForm.acceptingOrders}
                  onCheckedChange={(value) => setSysForm({ ...sysForm, acceptingOrders: value })}
                />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sys-fee">Taxa de Entrega (R$)</Label>
                    <Input
                      id="sys-fee"
                      type="number"
                      step="0.5"
                      value={sysForm.deliveryFee}
                      onChange={(e) =>
                        setSysForm({ ...sysForm, deliveryFee: Number(e.target.value) })
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sys-min">Pedido Mínimo (R$)</Label>
                    <Input
                      id="sys-min"
                      type="number"
                      step="1"
                      value={sysForm.minOrder}
                      onChange={(e) => setSysForm({ ...sysForm, minOrder: Number(e.target.value) })}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sys-open">Abertura (Hora 0-23)</Label>
                    <Input
                      id="sys-open"
                      type="number"
                      min={0}
                      max={23}
                      value={sysForm.openHour}
                      onChange={(e) => setSysForm({ ...sysForm, openHour: Number(e.target.value) })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
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
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-xs md:col-span-2">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                💳 Formas de Pagamento Aceitas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border bg-muted/40">
                  <Label
                    htmlFor="pay-pix"
                    className="cursor-pointer text-xs sm:text-sm font-medium"
                  >
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
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border bg-muted/40">
                  <Label
                    htmlFor="pay-dinheiro"
                    className="cursor-pointer text-xs sm:text-sm font-medium"
                  >
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
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border bg-muted/40">
                  <Label
                    htmlFor="pay-cartao"
                    className="cursor-pointer text-xs sm:text-sm font-medium"
                  >
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

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSystemSettings}
              size="lg"
              className="gap-2 h-11 w-full sm:w-auto font-semibold"
            >
              <Save className="size-5" /> Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL NOVO / EDITAR PRODUTO */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="item-name">Nome do Produto</Label>
                <Input
                  id="item-name"
                  placeholder="Ex: Pizza Calabresa"
                  value={editingItem?.name || ""}
                  onChange={(e) => setEditingItem((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-category">Categoria</Label>
                <Select
                  value={editingItem?.category || categories[0]?.id || "tradicional"}
                  onValueChange={(value) =>
                    setEditingItem((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="item-category" className="h-11">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="item-price">Preço (R$)</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={editingItem?.price || 0}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-badge">Selo / Destaque (Opcional)</Label>
                <Input
                  id="item-badge"
                  placeholder="Ex: Mais Vendida"
                  value={editingItem?.badge || ""}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      badge: e.target.value || null,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2 sm:pt-7">
                <Switch
                  id="item-available"
                  checked={editingItem?.available ?? true}
                  onCheckedChange={(checked) =>
                    setEditingItem((prev) => ({ ...prev, available: checked }))
                  }
                />
                <Label htmlFor="item-available" className="cursor-pointer">
                  Disponível no Menu
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Descrição</Label>
              <Textarea
                id="item-desc"
                placeholder="Ingredientes e detalhes..."
                value={editingItem?.description || ""}
                onChange={(e) =>
                  setEditingItem((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-image">URL da Imagem</Label>
              <Input
                id="item-image"
                placeholder="https://..."
                value={editingItem?.image_url || ""}
                onChange={(e) => setEditingItem((prev) => ({ ...prev, image_url: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm font-semibold">
                Adicionais & Bordas Vinculadas a este Produto
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                {globalAddons.map((ga) => {
                  const currentAddons: Addon[] = editingItem?.addons || [];
                  const isChecked = currentAddons.some((a) => a.name === ga.name);
                  return (
                    <label
                      key={ga.id}
                      className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-muted cursor-pointer"
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
                        className="rounded text-primary focus:ring-primary size-4"
                      />
                      <span className="font-medium truncate">
                        {ga.name} ({brl(ga.price)})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsItemDialogOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editingItem && saveMutation.mutate(editingItem)}
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto h-11 sm:h-9 font-semibold"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL GERENCIAR CATEGORIAS */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Nova Categoria (Ex: Especiais)"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                className="flex-1 h-11 sm:h-9"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Emoji"
                  className="w-20 text-center h-11 sm:h-9"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                />
                <Button onClick={handleAddCategory} className="w-full sm:w-auto h-11 sm:h-9">
                  Adicionar
                </Button>
              </div>
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
                    className="size-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsCategoryDialogOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL GERENCIAR ADICIONAIS / BORDAS */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Gerenciar Adicionais & Bordas Globais</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Nome (Ex: Borda de Catupiry)"
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
                className="flex-1 h-11 sm:h-9"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Preço R$"
                  className="w-28 h-11 sm:h-9"
                  value={newAddonPrice}
                  onChange={(e) =>
                    setNewAddonPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
                <Button onClick={handleAddAddon} className="w-full sm:w-auto h-11 sm:h-9">
                  Adicionar
                </Button>
              </div>
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
                      className="size-8 text-destructive hover:text-destructive shrink-0"
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
            <Button
              onClick={() => setIsAddonDialogOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALHES / COMPROVANTE DO PEDIDO NUVEM */}
      <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>Comprovante de Pedido</span>
              <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2.5 py-0.5 rounded">
                {selectedOrderDetails?.code}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrderDetails && (
            <div className="space-y-4 py-2 text-sm font-sans">
              <div className="rounded-xl border bg-muted/50 p-3 space-y-1.5 text-xs">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <strong className="text-foreground">Status do pedido</strong>
                  <Select
                    value={selectedOrderDetails.status}
                    onValueChange={async (value) => {
                      try {
                        await updateOrderStatus({
                          data: { id: selectedOrderDetails.id, status: value as OrderStatus },
                        });
                        setSelectedOrderDetails({
                          ...selectedOrderDetails,
                          status: value as OrderStatus,
                        });
                        await refetchOrders();
                        toast.success("Status do pedido atualizado.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Não foi possível atualizar o status.",
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Status do pedido">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <strong className="text-foreground">Cliente:</strong>{" "}
                  {selectedOrderDetails.customer_name} ({selectedOrderDetails.phone || "—"})
                </div>
                <div>
                  <strong className="text-foreground">Data/Hora:</strong>{" "}
                  {selectedOrderDetails.created_at
                    ? new Date(selectedOrderDetails.created_at).toLocaleString("pt-BR")
                    : "—"}
                </div>
                <div>
                  <strong className="text-foreground">Tipo de Pedido:</strong>{" "}
                  {selectedOrderDetails.order_type === "delivery"
                    ? "🛵 Delivery / Entrega"
                    : "🍽 Consumo no Local"}
                </div>
                {selectedOrderDetails.order_type === "delivery" ? (
                  <div>
                    <strong className="text-foreground">Endereço:</strong>{" "}
                    {selectedOrderDetails.street}, {selectedOrderDetails.number} -{" "}
                    {selectedOrderDetails.neighborhood}
                    {selectedOrderDetails.complement ? ` (${selectedOrderDetails.complement})` : ""}
                    {selectedOrderDetails.reference
                      ? ` | Ref: ${selectedOrderDetails.reference}`
                      : ""}
                  </div>
                ) : (
                  selectedOrderDetails.table_number && (
                    <div>
                      <strong className="text-foreground">Mesa:</strong> Nº{" "}
                      {selectedOrderDetails.table_number}
                    </div>
                  )
                )}
              </div>

              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Itens do Pedido
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-3 bg-card">
                  {Array.isArray(selectedOrderDetails.items) &&
                    selectedOrderDetails.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="border-b last:border-0 pb-2 last:pb-0 text-xs space-y-0.5"
                      >
                        <div className="flex justify-between gap-2 font-semibold">
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
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 p-2.5 rounded-lg">
                  <strong>Observação do Pedido:</strong> {selectedOrderDetails.notes}
                </div>
              )}

              <div className="space-y-1 border-t pt-3 text-xs">
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
                <div className="flex justify-between font-bold text-sm text-foreground pt-2 border-t">
                  <span>Total do Pedido:</span>
                  <span className="text-primary font-bold text-base">
                    {brl(Number(selectedOrderDetails.total))}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
