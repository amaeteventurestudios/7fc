/**
 * Cloudflare Turnstile server-side validation.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * When TURNSTILE_SECRET_KEY is not configured the check is skipped and
 * `configured: false` is reported — deployment docs list adding the keys as a
 * required manual step. The honeypot and rate limits still apply either way.
 */

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(
  token: unknown,
  ip: string
): Promise<{ ok: boolean; configured: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, configured: false };
  if (typeof token !== "string" || !token || token.length > 2048)
    return { ok: false, configured: true };
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: ip !== "unknown" ? ip : undefined,
        }),
      }
    );
    const json = (await res.json()) as { success?: boolean };
    return { ok: json.success === true, configured: true };
  } catch {
    return { ok: false, configured: true };
  }
}
