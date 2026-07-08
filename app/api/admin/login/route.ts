import { NextRequest, NextResponse } from "next/server";
import {
  getStore,
  setupModeEnvEnabled,
  ADMIN_TEMP_EMAIL,
  ADMIN_TEMP_PASSWORD,
} from "@/lib/data";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/request";

export async function GET() {
  // Exposes only whether setup mode is on (temporary credentials still active).
  const store = await getStore();
  const setup = setupModeEnvEnabled() && (await store.isSetupMode());
  return NextResponse.json({
    setup_mode: setup,
    temp_email: setup ? ADMIN_TEMP_EMAIL : null,
    temp_password: setup ? ADMIN_TEMP_PASSWORD : null,
  });
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }
  let email = "", password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const store = await getStore();
  const admin = await store.getAdminByEmail(email);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

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
