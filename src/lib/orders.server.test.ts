import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = {
  settings: {
    name: "La Bella Pizza",
    whatsapp: "5588998340085",
    delivery_fee: 5,
    min_order: 30,
    payment_methods: { pix: true, dinheiro: true, cartao: true },
  },
  menu: [
    {
      id: "menu-1",
      name: "Calabresa",
      price: 40,
      available: true,
      addons: [{ name: "Catupiry", price: 8 }],
    },
  ],
  insertedOrders: [] as Array<Record<string, unknown>>,
};

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from(table: string) {
      if (table === "store_settings") {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: mockState.settings, error: null }) }),
          }),
        };
      }

      if (table === "menu_items") {
        return {
          select: () => ({
            in: async () => ({ data: mockState.menu, error: null }),
          }),
        };
      }

      return {
        insert: async (order: Record<string, unknown>) => {
          mockState.insertedOrders.push(order);
          return { error: null };
        },
      };
    },
  },
}));

import { buildWhatsappMessage, createOrder } from "./orders.server";

describe("orders.server", () => {
  beforeEach(() => {
    mockState.insertedOrders.length = 0;
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key";
  });

  it("monta comprovante com adicionais discriminados", () => {
    const message = buildWhatsappMessage(
      {
        clientOrderId: "00000000-0000-4000-8000-000000000001",
        customerName: "João Silva",
        phone: "(88) 99999-0000",
        orderType: "delivery",
        street: "Rua Central",
        number: "10",
        neighborhood: "Centro",
        paymentMethod: "pix",
        items: [
          {
            name: "Calabresa",
            qty: 1,
            unitPrice: 48,
            addons: [{ name: "Catupiry", price: 8 }],
            obs: "Bem assada",
          },
        ],
      },
      { subtotal: 48, deliveryFee: 5, total: 53 },
      "LBP-123456",
      "La Bella Pizza",
    );

    expect(message).toContain("LBP-123456");
    expect(message).toContain("Catupiry (+R$ 8,00)");
    expect(message).toContain("TOTAL DO PEDIDO: R$ 53,00");
  });

  it("ignora o preço enviado pelo cliente e usa o preço do banco", async () => {
    const result = await createOrder({
      clientOrderId: "00000000-0000-4000-8000-000000000002",
      customerName: "Maria Silva",
      phone: "88999990000",
      orderType: "delivery",
      street: "Rua Central",
      number: "10",
      neighborhood: "Centro",
      paymentMethod: "pix",
      items: [
        {
          id: "menu-1",
          qty: 1,
          addons: [{ name: "Catupiry", price: 0 }],
          obs: "",
        },
      ],
    });

    expect(result.total).toBe(53);
    expect(mockState.insertedOrders[0]).toMatchObject({
      subtotal: 48,
      delivery_fee: 5,
      total: 53,
      client_order_id: "00000000-0000-4000-8000-000000000002",
    });
  });

  it("confirma o pedido com o catálogo mockado sem Supabase", async () => {
    delete process.env["SUPABASE_URL"];
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];

    const result = await createOrder({
      clientOrderId: "00000000-0000-4000-8000-000000000003",
      customerName: "Ana Silva",
      phone: "88999990000",
      orderType: "delivery",
      street: "Rua Central",
      number: "10",
      neighborhood: "Centro",
      paymentMethod: "dinheiro",
      changeFor: "50",
      items: [
        {
          id: "1",
          qty: 1,
          addons: [{ name: "Catupiry", price: 0 }],
          obs: "",
        },
      ],
    });

    expect(result.code).toMatch(/^LBP-\d{6}$/);
    expect(result.total).toBe(53);
    expect(result.whatsappUrl).toContain("wa.me/5588998340085");
  });
});
