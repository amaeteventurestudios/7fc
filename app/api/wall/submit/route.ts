import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { countryByCode } from "@/lib/countries";
import { ERAS } from "@/lib/types";

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

  const store = await getStore();
  const result = await store.submitSupporter({
    first_name,
    last_name: last_name || null,
    email,
    country_name: country.name,
    country_code: country.code,
    favorite_era: favorite_era || null,
    message: message || null,
    show_full_name,
  });

  if ("error" in result) return NextResponse.json(result, { status: 403 });
  return NextResponse.json(result, { status: 201 });
}
