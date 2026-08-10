import { useState } from "react";
import { Bike, Loader2, Store } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CartLine } from "@/lib/menu";
import { cartSubtotal } from "@/lib/menu";
import { brl, isValidPhone, maskPhone, onlyDigits } from "@/lib/format";
import { RESTAURANT } from "@/lib/config";
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

const paymentOptions: { value: Payment; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão na entrega" },
];

const fieldClass =
  "w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-card";

export function CheckoutSheet({ open, onClose, cart, notes, onSuccess }: Props) {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useServerFn(placeOrder);
  const subtotal = cartSubtotal(cart);
  const deliveryFee = orderType === "delivery" ? RESTAURANT.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
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
            name: line.item.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
            addons: line.addons,
            obs: line.obs,
          })),
        },
      }),
    onSuccess: (result) => onSuccess(result),
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
  }

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
            <label className="mb-1.5 block text-xs font-semibold" htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              placeholder="Seu nome completo"
              className={fieldClass}
            />
            {errors["customerName"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["customerName"]}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" htmlFor="tel">
              WhatsApp
            </label>
            <input
              id="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              placeholder="(88) 99999-0000"
              className={fieldClass}
            />
            {errors["phone"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p>
            ) : null}
          </div>

          {orderType === "delivery" ? (
            <>
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="rua">
                    Rua
                  </label>
                  <input
                    id="rua"
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    placeholder="Rua / Avenida"
                    className={fieldClass}
                  />
                  {errors["street"] ? (
                    <p className="mt-1 text-xs text-destructive">{errors["street"]}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" htmlFor="num">
                    Número
                  </label>
                  <input
                    id="num"
                    value={form.number}
                    onChange={(e) => set("number", e.target.value)}
                    placeholder="123"
                    className={fieldClass}
                  />
                  {errors["number"] ? (
                    <p className="mt-1 text-xs text-destructive">{errors["number"]}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold" htmlFor="bairro">
                  Bairro
                </label>
                <input
                  id="bairro"
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  placeholder="Centro"
                  className={fieldClass}
                />
                {errors["neighborhood"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["neighborhood"]}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.complement}
                  onChange={(e) => set("complement", e.target.value)}
                  placeholder="Complemento"
                  aria-label="Complemento"
                  className={fieldClass}
                />
                <input
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  placeholder="Ponto de referência"
                  aria-label="Ponto de referência"
                  className={fieldClass}
                />
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
                  <input
                    value={form.changeFor}
                    onChange={(e) => set("changeFor", onlyDigits(e.target.value))}
                    inputMode="numeric"
                    placeholder="Troco para quanto? Ex: 100"
                    aria-label="Troco para"
                    className={`${fieldClass} mt-3`}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold" htmlFor="mesa">
                Número da mesa
              </label>
              <input
                id="mesa"
                value={form.tableNumber}
                onChange={(e) => set("tableNumber", e.target.value)}
                placeholder="Ex: 12"
                className={fieldClass}
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
