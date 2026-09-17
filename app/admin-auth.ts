import { env } from "cloudflare:workers";

const COOKIE = "mj_admin_session";
const encoder = new TextEncoder();

function secret() {
  return (env as unknown as Record<string, string>).ADMIN_PASSWORD || "";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function verifyAdminPassword(value: unknown) {
  const configured = secret();
  if (!configured || typeof value !== "string") return false;
  const [provided, expected] = await Promise.all([digest(value), digest(configured)]);
  let difference = provided.length ^ expected.length;
  for (let i = 0; i < Math.min(provided.length, expected.length); i++) difference |= provided[i] ^ expected[i];
  return difference === 0;
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function adminSessionCookie() {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: Date.now() + 30 * 60 * 1000, nonce: crypto.randomUUID() })));
  return `${COOKIE}=${payload}.${await signature(payload)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdminRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const token = request.headers.get("cookie")?.split(/;\s*/).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !secret()) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || (await signature(payload)) !== sig) return false;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
    return Number(json.exp) > Date.now();
  } catch { return false; }
}
