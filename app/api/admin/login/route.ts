import { NextRequest, NextResponse } from "next/server";
import {
  getStore,
  setupModeEnvEnabled,
  ADMIN_TEMP_EMAIL,
  ADMIN_TEMP_PASSWORD,
} from "@/lib/data";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/request";
import { turnstileConfigured } from "@/lib/turnstile";
import { turnstileGate } from "@/lib/guard";
import { durableRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/ratelimit";

export async function GET() {
  // Exposes only whether setup mode is on. Temporary credentials are only
  // ever echoed in local development — production never serves credentials.
  const store = await getStore();
  const dev = process.env.NODE_ENV !== "production";
  const setup =
    setupModeEnvEnabled() &&
    !!ADMIN_TEMP_EMAIL &&
    !!ADMIN_TEMP_PASSWORD &&
    (await store.isSetupMode());
  return NextResponse.json({
    setup_mode: setup,
    turnstile_required: turnstileConfigured(),
    temp_email: setup && dev ? ADMIN_TEMP_EMAIL : null,
    temp_password: setup && dev ? ADMIN_TEMP_PASSWORD : null,
  });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // In-memory pre-filter; the durable failed-attempt counter below is
  // authoritative across isolates.
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  let email = "",
    password = "",
    turnstileToken: unknown = null;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
    turnstileToken = body.turnstile_token;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Managed-mode Turnstile on admin login (fail-closed in production).
  const gate = await turnstileGate(turnstileToken, ip, "admin_login");
  if (gate) return gate;

  const store = await getStore();
  // Durable cooldown: 5 failed attempts per IP identity per 15 minutes.
  // Counting happens on failure only, so the owner is never locked out by
  // their own successful logins, and the window expiry is the cooldown —
  // no permanent lockout exists to weaponize.
  const FAILED_SCOPE = "login-fail";
  const check = await durableRateLimit(store, FAILED_SCOPE, ip, 5, 15 * 60_000);
  // durableRateLimit increments; a pre-check increment counts this attempt.
  // Failed attempts therefore consume budget; a success does not add more.
  if (!check.allowed) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(check.retryAfterSeconds) },
      }
    );
  }

  const admin = await store.getAdminByEmail(email);
  // Uniform error: no credential enumeration.
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Fresh session token on every successful login (state regeneration).
  const res = NextResponse.json({
    ok: true,
    is_temporary: admin.is_temporary,
  });
  res.cookies.set(SESSION_COOKIE, createSessionToken(admin.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
