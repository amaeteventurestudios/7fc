import { NextRequest, NextResponse } from "next/server";
import { getStore, type SupporterAction } from "@/lib/data";
import { requireAdmin } from "@/lib/request";
import {
  queueApprovalWelcome,
  queueRejectionNotice,
} from "@/lib/wall-lifecycle";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const params = req.nextUrl.searchParams;
  const store = await getStore();
  const supporters = await store.listSupporters({
    status: params.get("status"),
    country: params.get("country"),
    era: params.get("era"),
    q: params.get("q"),
  });
  return NextResponse.json({ supporters });
}

const ACTIONS: SupporterAction[] = ["approve", "hide", "delete"];

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let id = "",
    action = "",
    notify = false;
  try {
    const body = await req.json();
    id = String(body.id ?? "");
    action = String(body.action ?? "");
    notify = body.notify === true;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!ACTIONS.includes(action as SupporterAction))
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const store = await getStore();
  const ok = await store.setSupporterStatus(id, action as SupporterAction);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const supporter = await store.getSupporterById(id);
  if (supporter && supporter.email_verified_at) {
    if (action === "approve") {
      // Exactly one welcome email per supporter (idempotent event key);
      // publication itself still requires active display consent.
      await queueApprovalWelcome(store, supporter);
    } else if (action === "hide" && notify) {
      // Optional respectful status notice — never internal notes.
      await queueRejectionNotice(store, supporter);
    }
  }
  return NextResponse.json({ ok: true });
}
