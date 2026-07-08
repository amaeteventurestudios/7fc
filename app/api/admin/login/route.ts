import { NextRequest, NextResponse } from "next/server";
import { readDb, isSetupMode, TEMP_ADMIN_EMAIL, TEMP_ADMIN_PASSWORD } from "@/lib/store";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/request";

export async function GET() {
  // Exposes only whether setup mode is on (temporary credentials still active).
  const db = await readDb();
  const setup = isSetupMode(db);
  return NextResponse.json({
    setup_mode: setup,
    temp_email: setup ? TEMP_ADMIN_EMAIL : null,
    temp_password: setup ? TEMP_ADMIN_PASSWORD : null,
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

  const db = await readDb();
  const admin = db.admin_users.find((a) => a.email.toLowerCase() === email);
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
