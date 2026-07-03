import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAdminSecret(): string | null {
  return process.env.ADMIN_SECRET ?? null;
}

export function createSessionToken(secret: string): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  const sig = createHmac("sha256", secret).update(exp).digest("hex");
  return `${exp}.${sig}`;
}

export function verifySessionToken(token: string, secret: string): boolean {
  const separator = token.lastIndexOf(".");
  if (separator === -1) {
    return false;
  }

  const exp = token.slice(0, separator);
  const sig = token.slice(separator + 1);
  const expMs = Number(exp);

  if (!exp || !sig || Number.isNaN(expMs) || Date.now() > expMs) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(exp).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function verifyAdminSecret(candidate: string, secret: string): boolean {
  try {
    return timingSafeEqual(
      Buffer.from(candidate),
      Buffer.from(secret),
    );
  } catch {
    return false;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifySessionToken(token, secret);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export function assertAdminSecretConfigured(): string {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("ADMIN_SECRET is not configured");
  }

  return secret;
}
