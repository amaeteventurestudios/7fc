import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { requireAdmin } from "@/lib/request";
import { hashPassword, verifyPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  return NextResponse.json({
    email: auth.admin.email,
    is_temporary: auth.admin.is_temporary,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const current_password = String(body.current_password ?? "");
  const new_email = String(body.new_email ?? "").trim().toLowerCase();
  const new_password = String(body.new_password ?? "");

  if (!verifyPassword(current_password, auth.admin.password_hash)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }
  if (new_email && !EMAIL_RE.test(new_email)) {
    return NextResponse.json({ error: "Invalid new email." }, { status: 400 });
  }
  if (new_password && new_password.length < 10) {
    return NextResponse.json(
      { error: "New password must be at least 10 characters." },
      { status: 400 }
    );
  }
  if (!new_email && !new_password) {
    return NextResponse.json(
      { error: "Provide a new email and/or password." },
      { status: 400 }
    );
  }

  const store = await getStore();
  // Passwords are stored as scrypt hashes only; changing the password
  // clears is_temporary and permanently disables setup mode.
  await store.updateAdminCredentials(auth.admin.id, {
    email: new_email || undefined,
    passwordHash: new_password ? hashPassword(new_password) : undefined,
  });
  return NextResponse.json({ ok: true });
}
