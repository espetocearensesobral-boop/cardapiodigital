import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const addonSchema = z.object({
  name: z.string().trim().min(1).max(80),
  price: z.number().finite().min(0),
});

const orderSchema = z
  .object({
    clientOrderId: z.string().uuid(),
    customerName: z.string().trim().min(2, "Informe seu nome").max(80),
    phone: z.string().trim().min(10, "Informe um telefone válido").max(20),
    orderType: z.enum(["delivery", "local"]),
    street: z.string().trim().max(120).optional(),
    number: z.string().trim().max(20).optional(),
    complement: z.string().trim().max(80).optional(),
    neighborhood: z.string().trim().max(80).optional(),
    reference: z.string().trim().max(120).optional(),
    tableNumber: z.string().trim().max(10).optional(),
    paymentMethod: z.enum(["pix", "dinheiro", "cartao"]).optional(),
    changeFor: z.string().trim().max(20).optional(),
    notes: z.string().trim().max(500).optional(),
    items: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80),
          size: z.string().trim().max(40).default(""),
          qty: z.number().int().min(1).max(50),
          addons: z.array(addonSchema).max(30),
          obs: z.string().max(200),
        }),
      )
      .min(1, "Carrinho vazio"),
  })
  .refine(
    (data) =>
      data.orderType !== "delivery" ||
      (!!data.street && !!data.number && !!data.neighborhood && !!data.paymentMethod),
    { message: "Preencha o endereço e a forma de pagamento" },
  );

export const placeOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { createOrder } = await import("./orders.server");
    return createOrder(data);
  });
