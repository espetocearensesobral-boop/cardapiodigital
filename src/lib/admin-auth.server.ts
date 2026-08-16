import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "lbp_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function getSecret() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getAdminSession(): AdminSessionPayload | null {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(sign(encodedPayload), signature)) return null;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdminSession() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized: sessão administrativa inválida ou expirada.");
  return session;
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
  const expectedPassword = process.env["ADMIN_PASSWORD"];

  if (!expectedEmail || !expectedPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured in Vercel.");
  }

  return email.trim().toLowerCase() === expectedEmail && safeEqual(password, expectedPassword);
}

export function startAdminSession(email: string) {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));

  setCookie(COOKIE_NAME, `${encodedPayload}.${sign(encodedPayload)}`, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSession() {
  setCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
