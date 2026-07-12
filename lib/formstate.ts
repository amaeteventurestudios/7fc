/**
 * Signed form-initialization state: a server-issued HMAC over the time the
 * form was rendered. Submissions completed impossibly fast (bots) or with a
 * forged/absent state are rejected. Deliberately lenient (2s minimum) so
 * password managers and assistive technology are never punished; this is a
 * supporting layer, never the only defense.
 */
import crypto from "crypto";

const MIN_FILL_MS = 2_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.SESSION_SECRET || "dev-form-state-pepper";
}

export function issueFormState(now = Date.now()): string {
  const payload = String(now);
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyFormState(state: unknown, now = Date.now()): boolean {
  if (typeof state !== "string" || state.length > 120) return false;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return false;
  const expected = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const issued = Number(payload);
  if (!Number.isFinite(issued)) return false;
  const age = now - issued;
  return age >= MIN_FILL_MS && age <= MAX_AGE_MS;
}
