import { createServerFn } from "@tanstack/react-start";
import {
  clearAdminSession,
  getAdminSession,
  startAdminSession,
  verifyAdminCredentials,
} from "./admin-auth.server";

export const adminGetSession = createServerFn({ method: "GET" }).handler(() => {
  const session = getAdminSession();
  return session
    ? { email: session.email, authenticated: true as const }
    : { authenticated: false as const };
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Credenciais inválidas.");
    const record = data as Record<string, unknown>;
    if (typeof record["email"] !== "string" || typeof record["password"] !== "string") {
      throw new Error("Informe e-mail e senha.");
    }
    return { email: record["email"], password: record["password"] };
  })
  .handler(({ data }) => {
    if (!verifyAdminCredentials(data.email, data.password)) {
      throw new Error("E-mail ou senha inválidos.");
    }
    startAdminSession(data.email);
    return { email: data.email.trim().toLowerCase(), authenticated: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(() => {
  clearAdminSession();
  return { authenticated: false as const };
});
