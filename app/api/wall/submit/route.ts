import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { mutate, logActivity } from "@/lib/store";
import { rateLimit, clientIp } from "@/lib/request";
import { countryByCode } from "@/lib/countries";
import { ERAS } from "@/lib/types";
import type { Supporter } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  if (!rateLimit(`wall:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Submission rejected." }, { status: 400 });
  }

  const first_name = String(body.first_name ?? "").trim();
  const last_name = String(body.last_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const country_code = String(body.country_code ?? "").trim().toUpperCase();
  const favorite_era = String(body.favorite_era ?? "").trim();
  const message = String(body.message ?? "").trim();
  const show_full_name = body.show_full_name === "1" || body.show_full_name === true;

  if (!first_name || first_name.length > 60)
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  if (last_name.length > 60)
    return NextResponse.json({ error: "Last name is too long." }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 200)
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  const country = countryByCode(country_code);
  if (!country)
    return NextResponse.json({ error: "Please select your country." }, { status: 400 });
  if (favorite_era && !(ERAS as readonly string[]).includes(favorite_era))
    return NextResponse.json({ error: "Invalid era." }, { status: 400 });
  if (message.length > 500)
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const result = await mutate((db) => {
    const settings = db.global_wall_settings;
    if (!settings.enable_submissions || settings.emergency_lock) {
      return { error: "Submissions are currently closed." };
    }
    const supporter: Supporter = {
      id: crypto.randomUUID(),
      supporter_number: db.next_supporter_number++,
      first_name,
      last_name: last_name || null,
      email,
      country_name: country.name,
      country_code: country.code,
      favorite_era: favorite_era || null,
      message: settings.allow_fan_messages && message ? message : null,
      show_full_name: settings.allow_full_names && show_full_name,
      status: settings.require_manual_approval ? "pending" : "approved",
      created_at: new Date().toISOString(),
    };
    db.supporters.push(supporter);
    logActivity(
      db,
      "supporter_submitted",
      `New supporter #${supporter.supporter_number} (${supporter.first_name}, ${supporter.country_name}) submitted`
    );
    return {
      supporter_number: supporter.supporter_number,
      status: supporter.status,
    };
  });

  if ("error" in result)
    return NextResponse.json(result, { status: 403 });
  return NextResponse.json(result, { status: 201 });
}
