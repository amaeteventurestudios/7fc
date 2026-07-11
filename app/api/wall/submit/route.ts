import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { countryByCode } from "@/lib/countries";
import { ERAS } from "@/lib/types";
import { verifyTurnstile } from "@/lib/turnstile";
import { normalizeEmail } from "@/lib/tokens";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/policy";
import { emailEnabled } from "@/lib/email/outbox";
import { queueVerificationEmail } from "@/lib/wall-lifecycle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`wall:${ip}`, 5, 60_000)) {
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

  const turnstile = await verifyTurnstile(body.turnstile_token, ip, "wall_signup");
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 400 }
    );
  }

  const first_name = String(body.first_name ?? "").trim();
  const last_name = String(body.last_name ?? "").trim();
  const email = normalizeEmail(String(body.email ?? ""));
  const country_code = String(body.country_code ?? "").trim().toUpperCase();
  const favorite_era = String(body.favorite_era ?? "").trim();
  const message = String(body.message ?? "").trim();
  const show_full_name = body.show_full_name === "1" || body.show_full_name === true;
  const age_attested = body.age_attested === "1" || body.age_attested === true;
  const terms_accepted = body.terms_accepted === "1" || body.terms_accepted === true;
  const display_consent = body.display_consent === "1" || body.display_consent === true;
  const marketing_consent =
    body.marketing_consent === "1" || body.marketing_consent === true;

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
  if (!terms_accepted)
    return NextResponse.json(
      { error: "Please agree to the Terms of Use and acknowledge the Privacy Policy." },
      { status: 400 }
    );
  if (!age_attested)
    // Age requirement not met or not attested: nothing is stored.
    return NextResponse.json(
      {
        error:
          "Global 7 Wall signup is open to fans aged 16 and over. You are welcome to keep enjoying the site — no information from this form has been saved.",
      },
      { status: 400 }
    );

  // Signups require a working verification email. Refuse cleanly BEFORE
  // creating any record — never a dead-end "check your email" promise.
  if (!emailEnabled()) {
    return NextResponse.json(
      {
        error:
          "New signups are temporarily paused for maintenance. Nothing from this form has been saved — please try again soon.",
      },
      { status: 503 }
    );
  }

  const store = await getStore();

  // One active supporter record per email.
  const existing = await store.findSupporterByEmail(email);
  if (existing) {
    if (!existing.email_verified_at && existing.status === "pending") {
      return NextResponse.json(
        {
          error:
            "This email already has a pending signup. Check your inbox for the verification link, or request a new one below the form.",
          duplicate: "unverified",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error:
          "This email is already on the Global 7 Wall. Request a management link on the Manage page to update your entry.",
        duplicate: "active",
      },
      { status: 409 }
    );
  }

  const result = await store.submitSupporter({
    first_name,
    last_name: last_name || null,
    email,
    country_name: country.name,
    country_code: country.code,
    favorite_era: favorite_era || null,
    message: message || null,
    show_full_name,
    consents: {
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      display_consent,
      marketing_consent,
      age_attested,
      require_email_verification: true,
    },
  });

  if ("error" in result) return NextResponse.json(result, { status: 403 });

  const supporter = await store.getSupporterById(result.id);
  if (supporter) await queueVerificationEmail(store, supporter);
  return NextResponse.json(
    {
      supporter_number: result.supporter_number,
      status: "pending_email_verification",
      needs_verification: true,
    },
    { status: 201 }
  );
}
