import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  MapPin,
  Store,
  WalletCards,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CartLine } from "@/lib/menu";
import { cartSubtotal } from "@/lib/menu";
import { brl, isValidPhone, maskPhone, onlyDigits } from "@/lib/format";
import { RESTAURANT } from "@/lib/config";
import { useSystemSettings } from "@/lib/settings";
import { placeOrder } from "@/lib/orders.functions";
import { BottomSheet } from "./BottomSheet";

type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  notes: string;
  onSuccess: (result: { code: string; total: number; whatsappUrl: string }) => void;
};

type OrderType = "delivery" | "local";
type Payment = "pix" | "dinheiro" | "cartao";
type CheckoutStep = 1 | 2 | 3;

const fieldClass =
  "w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card";

const STEP_LABELS = [
  { step: 1 as CheckoutStep, label: "Dados", shortLabel: "Entrega" },
  { step: 2 as CheckoutStep, label: "Revisão", shortLabel: "Revisar" },
  { step: 3 as CheckoutStep, label: "Pagamento", shortLabel: "Pagar" },
];

function createClientOrderId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return Math.floor(value).toString(16);
  });
}

export function CheckoutSheet({ open, onClose, cart, notes, onSuccess }: Props) {
  const systemSettings = useSystemSettings();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    reference: "",
    tableNumber: "",
    changeFor: "",
  });
  const [payment, setPayment] = useState<Payment>("pix");
  const changeForRef = useRef<HTMLInputElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [clientOrderId, setClientOrderId] = useState(createClientOrderId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setErrors({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => stepHeadingRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open, step]);

  useEffect(() => {
    if (!open || step !== 3 || payment !== "dinheiro") return;
    const timer = window.setTimeout(() => changeForRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open, payment, step]);

  const paymentOptions = useMemo(() => {
    const list: { value: Payment; label: string }[] = [];
    if (systemSettings.paymentMethods?.pix ?? true) list.push({ value: "pix", label: "Pix" });
    if (systemSettings.paymentMethods?.dinheiro ?? true)
      list.push({ value: "dinheiro", label: "Dinheiro" });
    if (systemSettings.paymentMethods?.cartao ?? true)
      list.push({ value: "cartao", label: "Cartão na entrega" });
    return list.length > 0
      ? list
      : [
          { value: "pix" as Payment, label: "Pix" },
          { value: "dinheiro" as Payment, label: "Dinheiro" },
        ];
  }, [systemSettings]);

  const submit = useServerFn(placeOrder);
  const subtotal = cartSubtotal(cart);
  const activeDeliveryFee = systemSettings.deliveryFee ?? RESTAURANT.deliveryFee;
  const deliveryFee = orderType === "delivery" ? activeDeliveryFee : 0;
  const total = subtotal + deliveryFee;
  const cashAmount = form.changeFor ? Number(form.changeFor) : 0;
  const changeDue = payment === "dinheiro" && cashAmount >= total ? cashAmount - total : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!systemSettings.acceptingOrders) {
        throw new Error("No momento não estamos aceitando novos pedidos.");
      }
      return submit({
        data: {
          clientOrderId,
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          orderType,
          paymentMethod: payment,
          ...(orderType === "delivery"
            ? {
                street: form.street.trim(),
                number: form.number.trim(),
                complement: form.complement.trim() || undefined,
                neighborhood: form.neighborhood.trim(),
                reference: form.reference.trim() || undefined,
                changeFor: payment === "dinheiro" && form.changeFor ? form.changeFor : undefined,
              }
            : { tableNumber: form.tableNumber.trim() || undefined }),
          notes: notes.trim() || undefined,
          items: cart.map((line) => ({
            id: line.item.id,
            size: line.item.size,
            qty: line.qty,
            addons: line.addons,
            obs: line.obs,
          })),
        },
      });
    },
    onSuccess: (result) => {
      onSuccess(result);
      setClientOrderId(createClientOrderId());
      setStep(1);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível enviar o pedido."),
  });

  function validateDetails() {
    const next: Record<string, string> = {};
    if (form.customerName.trim().length < 2) next["customerName"] = "Informe seu nome";
    if (!isValidPhone(form.phone)) next["phone"] = "Telefone inválido";
    if (orderType === "delivery") {
      if (!form.street.trim()) next["street"] = "Informe a rua";
      if (!form.number.trim()) next["number"] = "Informe o número";
      if (!form.neighborhood.trim()) next["neighborhood"] = "Informe o bairro";
    } else if (!form.tableNumber.trim()) {
      next["tableNumber"] = "Informe a mesa";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePayment() {
    const next: Record<string, string> = {};
    if (payment === "dinheiro") {
      if (!form.changeFor) {
        next["changeFor"] = "Informe quanto você vai entregar";
      } else if (cashAmount < total) {
        next["changeFor"] = `O valor precisa ser igual ou maior que ${brl(total)}`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, nextId?: string) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (nextId) {
      document.getElementById(nextId)?.focus();
      return;
    }
    if (step === 1) goToNext();
    if (step === 3 && validatePayment()) mutation.mutate();
  }

  function goToNext() {
    if (step === 1) {
      if (!validateDetails()) {
        toast.error("Revise os dados destacados antes de continuar.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) setStep(3);
  }

  function goBack() {
    if (step === 1) {
      onClose();
      return;
    }
    setStep((current) => (current - 1) as CheckoutStep);
  }

  function finalize() {
    if (!validatePayment()) {
      toast.error("Revise o pagamento antes de finalizar.");
      return;
    }
    mutation.mutate();
  }

  const getFieldClass = (fieldKey: string) => {
    if (errors[fieldKey]) {
      return `${fieldClass} border-destructive bg-destructive/5 text-destructive placeholder:text-destructive/50 focus:border-destructive`;
    }
    return fieldClass;
  };

  const destinationSummary =
    orderType === "delivery"
      ? `${form.street}, Nº ${form.number} — ${form.neighborhood}${form.complement ? `, ${form.complement}` : ""}`
      : `Mesa ${form.tableNumber}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Finalizar pedido"
      className="h-[92dvh] md:h-[min(92dvh,760px)]"
      footer={
        <div className="space-y-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={mutation.isPending}
              className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Voltar
            </button>
          ) : null}
          <button
            type="button"
            disabled={mutation.isPending || cart.length === 0 || !systemSettings.acceptingOrders}
            onClick={step === 3 ? finalize : goToNext}
            className="bg-brasa flex min-h-14 w-full items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : !systemSettings.acceptingOrders ? (
              <>Pedidos pausados no momento</>
            ) : step === 1 ? (
              <>
                Revisar pedido <ChevronRight className="size-5" />
              </>
            ) : step === 2 ? (
              <>
                Ir para pagamento <ChevronRight className="size-5" />
              </>
            ) : (
              <>Finalizar pedido • {brl(total)}</>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5 p-5 pb-6">
        {!systemSettings.acceptingOrders ? (
          <div
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
            role="status"
          >
            No momento, a loja não está aceitando novos pedidos. Tente novamente mais tarde.
          </div>
        ) : null}

        <nav aria-label="Etapas do pedido">
          <ol className="grid grid-cols-3 gap-2">
            {STEP_LABELS.map(({ step: itemStep, label, shortLabel }) => {
              const completed = itemStep < step;
              const current = itemStep === step;
              return (
                <li key={itemStep}>
                  <button
                    type="button"
                    disabled={!completed || mutation.isPending}
                    onClick={() => completed && setStep(itemStep)}
                    aria-current={current ? "step" : undefined}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                      current
                        ? "bg-primary text-primary-foreground"
                        : completed
                          ? "bg-accent text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-card/25 text-xs">
                      {completed ? <Check className="size-3.5" /> : itemStep}
                    </span>
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section aria-labelledby="checkout-step-title">
          <h2
            ref={stepHeadingRef}
            id="checkout-step-title"
            tabIndex={-1}
            className="font-display text-xl font-bold outline-none"
          >
            {step === 1
              ? "Onde vamos entregar?"
              : step === 2
                ? "Revise seu pedido"
                : "Como você vai pagar?"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1
              ? "Informe seus dados para continuar."
              : step === 2
                ? "Confira os dados antes de escolher o pagamento."
                : "Escolha a forma de pagamento e finalize com segurança."}
          </p>
        </section>

        {step === 1 ? (
          <div className="space-y-4" key="details-step">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "delivery", label: "Entrega", icon: Bike },
                  { value: "local", label: "No local", icon: Store },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderType(value)}
                  aria-pressed={orderType === value}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-4 transition-colors active:scale-[0.98] ${
                    orderType === value
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="font-display text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-nome">
                  Nome Completo <span className="text-destructive">*</span>
                </label>
                <input
                  id="input-nome"
                  value={form.customerName}
                  onChange={(event) => set("customerName", event.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, "input-tel")}
                  enterKeyHint="next"
                  autoComplete="name"
                  placeholder="Ex: João Silva"
                  className={getFieldClass("customerName")}
                />
                {errors["customerName"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["customerName"]}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-tel">
                  WhatsApp / Contato <span className="text-destructive">*</span>
                </label>
                <input
                  id="input-tel"
                  inputMode="tel"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => set("phone", maskPhone(event.target.value))}
                  onKeyDown={(event) =>
                    handleKeyDown(event, orderType === "delivery" ? "input-rua" : "input-mesa")
                  }
                  enterKeyHint="next"
                  autoComplete="tel"
                  placeholder="(88) 99999-0000"
                  className={getFieldClass("phone")}
                />
                {errors["phone"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p>
                ) : null}
              </div>

              {orderType === "delivery" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_88px]">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-rua">
                        Rua / Avenida <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="input-rua"
                        value={form.street}
                        onChange={(event) => set("street", event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, "input-num")}
                        enterKeyHint="next"
                        autoComplete="street-address"
                        placeholder="Nome da sua rua"
                        className={getFieldClass("street")}
                      />
                      {errors["street"] ? (
                        <p className="mt-1 text-xs text-destructive">{errors["street"]}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-num">
                        Número <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="input-num"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.number}
                        onChange={(event) => set("number", onlyDigits(event.target.value))}
                        onKeyDown={(event) => handleKeyDown(event, "input-bairro")}
                        enterKeyHint="next"
                        placeholder="123"
                        className={getFieldClass("number")}
                      />
                      {errors["number"] ? (
                        <p className="mt-1 text-xs text-destructive">{errors["number"]}</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-bairro">
                      Bairro <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="input-bairro"
                      value={form.neighborhood}
                      onChange={(event) => set("neighborhood", event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, "input-complement")}
                      enterKeyHint="next"
                      autoComplete="address-level2"
                      placeholder="Ex: Centro"
                      className={getFieldClass("neighborhood")}
                    />
                    {errors["neighborhood"] ? (
                      <p className="mt-1 text-xs text-destructive">{errors["neighborhood"]}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-semibold"
                        htmlFor="input-complement"
                      >
                        Complemento
                      </label>
                      <input
                        id="input-complement"
                        value={form.complement}
                        onChange={(event) => set("complement", event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, "input-reference")}
                        enterKeyHint="next"
                        autoComplete="address-line2"
                        placeholder="Apto, Bloco..."
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-semibold"
                        htmlFor="input-reference"
                      >
                        Referência
                      </label>
                      <input
                        id="input-reference"
                        value={form.reference}
                        onChange={(event) => set("reference", event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event)}
                        enterKeyHint="done"
                        placeholder="Próximo ao mercadinho"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-mesa">
                    Número da mesa <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="input-mesa"
                    value={form.tableNumber}
                    onChange={(event) => set("tableNumber", onlyDigits(event.target.value))}
                    onKeyDown={(event) => handleKeyDown(event)}
                    enterKeyHint="done"
                    inputMode="numeric"
                    placeholder="Ex: 12"
                    className={getFieldClass("tableNumber")}
                  />
                  {errors["tableNumber"] ? (
                    <p className="mt-1 text-xs text-destructive">{errors["tableNumber"]}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4" key="review-step">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {orderType === "delivery" ? "Endereço de entrega" : "Consumo no local"}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{destinationSummary}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.customerName} • {form.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent"
                >
                  Editar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                <h3 className="font-display text-base font-semibold">Itens do pedido</h3>
              </div>
              <div className="space-y-3">
                {cart.map((line) => (
                  <div key={line.lineId} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {line.qty}x {line.item.name}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Tamanho: {line.item.size}
                      </p>
                      {line.addons.length > 0 ? (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {(["mistura", "guarnicao", "extra"] as const).map((group) => {
                            const groupAddons = line.addons.filter((addon) =>
                              group === "extra"
                                ? addon.group !== "mistura" && addon.group !== "guarnicao"
                                : addon.group === group,
                            );
                            if (groupAddons.length === 0) return null;
                            const label =
                              group === "mistura"
                                ? "Mistura"
                                : group === "guarnicao"
                                  ? "Guarnição"
                                  : "Extra";
                            return (
                              <p key={group}>
                                <span className="font-semibold text-foreground">{label}:</span>{" "}
                                {groupAddons
                                  .map((addon) =>
                                    addon.price > 0
                                      ? `${addon.name} (+${brl(addon.price)})`
                                      : `${addon.name} (Adicionado)`,
                                  )
                                  .join(", ")}
                              </p>
                            );
                          })}
                        </div>
                      ) : null}
                      {line.obs ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">Obs.: {line.obs}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-semibold">{brl(line.unitPrice * line.qty)}</span>
                  </div>
                ))}
              </div>
              {notes.trim() ? (
                <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Observações:</span> {notes.trim()}
                </div>
              ) : null}
            </div>

            <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
          </div>
        ) : (
          <div className="space-y-4" key="payment-step">
            <div className="rounded-2xl bg-muted p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-card text-primary">
                  <WalletCards className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total do pedido
                  </p>
                  <p className="font-display text-2xl font-bold text-primary">{brl(total)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Escolha a forma de pagamento</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {paymentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPayment(option.value)}
                    aria-pressed={payment === option.value}
                    className={`min-h-12 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors active:scale-[0.98] ${
                      payment === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {payment === "dinheiro" ? (
              <div className="rounded-2xl border border-primary/30 bg-accent p-4">
                <label className="mb-1.5 block text-sm font-semibold" htmlFor="input-changeFor">
                  Você vai pagar com quanto?
                </label>
                <input
                  ref={changeForRef}
                  id="input-changeFor"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={form.changeFor}
                  onChange={(event) => set("changeFor", onlyDigits(event.target.value))}
                  onKeyDown={(event) => handleKeyDown(event)}
                  enterKeyHint="done"
                  autoComplete="off"
                  placeholder="Ex: 50 ou 100"
                  aria-invalid={Boolean(errors["changeFor"])}
                  className={getFieldClass("changeFor")}
                />
                {errors["changeFor"] ? (
                  <p className="mt-1.5 text-xs text-destructive">{errors["changeFor"]}</p>
                ) : form.changeFor ? (
                  <p className="mt-2 text-sm font-semibold text-primary" aria-live="polite">
                    {cashAmount >= total
                      ? `Seu troco será ${brl(changeDue)}`
                      : `Faltam ${brl(total - cashAmount)} para completar o pagamento`}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Informe um valor igual ou maior que o total para calcular o troco.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {payment === "pix"
                  ? "Após enviar, você receberá as instruções para concluir o pagamento via Pix."
                  : "O pagamento será realizado na entrega do pedido."}
              </div>
            )}

            <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function OrderSummary({
  subtotal,
  deliveryFee,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <div className="rounded-2xl bg-muted p-4 text-sm">
      <div className="flex justify-between py-1 text-muted-foreground">
        <span>Subtotal</span>
        <span>{brl(subtotal)}</span>
      </div>
      <div className="flex justify-between py-1 text-muted-foreground">
        <span>Taxa de entrega</span>
        <span>{deliveryFee ? brl(deliveryFee) : "Grátis"}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-2 font-display text-base font-bold">
        <span>Total</span>
        <span className="text-primary">{brl(total)}</span>
      </div>
    </div>
  );
}
