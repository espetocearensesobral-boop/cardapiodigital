import { useState, useMemo } from "react";
import { Bike, Loader2, Store } from "lucide-react";
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

const fieldClass =
  "w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card";

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
  const [clientOrderId, setClientOrderId] = useState(createClientOrderId);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          clientOrderId,
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          orderType,
          ...(orderType === "delivery"
            ? {
                street: form.street.trim(),
                number: form.number.trim(),
                complement: form.complement.trim() || undefined,
                neighborhood: form.neighborhood.trim(),
                reference: form.reference.trim() || undefined,
                paymentMethod: payment,
                changeFor: payment === "dinheiro" && form.changeFor ? form.changeFor : undefined,
              }
            : { tableNumber: form.tableNumber.trim() || undefined }),
          notes: notes.trim() || undefined,
          items: cart.map((line) => ({
            id: line.item.id,
            qty: line.qty,
            addons: line.addons,
            obs: line.obs,
          })),
        },
      }),
    onSuccess: (result) => {
      onSuccess(result);
      setClientOrderId(createClientOrderId());
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível enviar o pedido."),
  });

  function validate() {
    const next: Record<string, string> = {};
    if (form.customerName.trim().length < 2) next["customerName"] = "Informe seu nome";
    if (!isValidPhone(form.phone)) next["phone"] = "Telefone inválido";
    if (orderType === "delivery") {
      if (!form.street.trim()) next["street"] = "Informe a rua";
      if (!form.number.trim()) next["number"] = "Nº";
      if (!form.neighborhood.trim()) next["neighborhood"] = "Informe o bairro";
    } else if (!form.tableNumber.trim()) {
      next["tableNumber"] = "Informe a mesa";
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, nextId?: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextId) {
        const nextEl = document.getElementById(nextId);
        if (nextEl) {
          nextEl.focus();
          return;
        }
      }
      // If no nextId, attempt to submit if valid
      if (validate()) {
        mutation.mutate();
      } else {
        toast.error("Revise os campos destacados.");
      }
    }
  }

  const getFieldClass = (fieldKey: string) => {
    if (errors[fieldKey]) {
      return `${fieldClass} border-destructive bg-destructive/5 text-destructive placeholder:text-destructive/50 focus:border-destructive`;
    }
    return fieldClass;
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Finalizar pedido"
      footer={
        <button
          type="button"
          disabled={mutation.isPending || cart.length === 0}
          onClick={() => {
            if (!validate()) {
              toast.error("Revise os campos destacados.");
              return;
            }
            mutation.mutate();
          }}
          className="bg-brasa flex w-full items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>Enviar pedido • {brl(total)}</>
          )}
        </button>
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
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
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 transition-colors ${
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
              onChange={(e) => set("customerName", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "input-tel")}
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
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              onKeyDown={(e) =>
                handleKeyDown(e, orderType === "delivery" ? "input-rua" : "input-mesa")
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
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-rua">
                    Rua / Avenida <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="input-rua"
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "input-num")}
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
                    value={form.number}
                    onChange={(e) => set("number", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "input-bairro")}
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
                  onChange={(e) => set("neighborhood", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "input-complement")}
                  enterKeyHint="next"
                  placeholder="Ex: Centro"
                  className={getFieldClass("neighborhood")}
                />
                {errors["neighborhood"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["neighborhood"]}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-complement">
                    Complemento
                  </label>
                  <input
                    id="input-complement"
                    value={form.complement}
                    onChange={(e) => set("complement", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "input-reference")}
                    enterKeyHint="next"
                    placeholder="Apto, Bloco..."
                    aria-label="Complemento"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-reference">
                    Ponto de Referência
                  </label>
                  <input
                    id="input-reference"
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value)}
                    onKeyDown={(e) =>
                      handleKeyDown(e, payment === "dinheiro" ? "input-changeFor" : undefined)
                    }
                    enterKeyHint={payment === "dinheiro" ? "next" : "done"}
                    placeholder="Próximo ao mercadinho"
                    aria-label="Ponto de referência"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold">Forma de pagamento</p>
                <div className="flex flex-wrap gap-2">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPayment(option.value)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
                        payment === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {payment === "dinheiro" ? (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold" htmlFor="input-changeFor">
                      Troco para quanto?
                    </label>
                    <input
                      id="input-changeFor"
                      value={form.changeFor}
                      onChange={(e) => set("changeFor", onlyDigits(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e)}
                      enterKeyHint="done"
                      inputMode="numeric"
                      placeholder="Ex: 50 ou 100"
                      aria-label="Troco para"
                      className={fieldClass}
                    />
                  </div>
                ) : null}
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
                onChange={(e) => set("tableNumber", onlyDigits(e.target.value))}
                onKeyDown={(e) => handleKeyDown(e)}
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
      </div>
    </BottomSheet>
  );
}
