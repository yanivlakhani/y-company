import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  assertAdminSecretConfigured,
  createSessionToken,
  getSessionCookieOptions,
  verifyAdminSecret,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secret = assertAdminSecretConfigured();
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || !("secret" in body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const candidate = (body as { secret: unknown }).secret;
    if (typeof candidate !== "string" || !candidate) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!verifyAdminSecret(candidate, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_SESSION_COOKIE,
      createSessionToken(secret),
      getSessionCookieOptions(),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
