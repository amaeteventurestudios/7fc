import { NextRequest, NextResponse } from "next/server";
import { mutate, logActivity } from "@/lib/store";
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

  await mutate((db) => {
    const admin = db.admin_users.find((a) => a.id === auth.admin.id);
    if (!admin) return;
    if (new_email) admin.email = new_email;
    if (new_password) admin.password_hash = hashPassword(new_password);
    // Changing the password ends temporary setup mode.
    if (new_password) admin.is_temporary = false;
    admin.updated_at = new Date().toISOString();
    logActivity(db, "credentials_changed", "Admin credentials updated");
  });
  return NextResponse.json({ ok: true });
}
