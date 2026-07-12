/**
 * Shared request guards for public mutation endpoints: Turnstile gate
 * (fail-closed in production), durable rate limiting with Retry-After,
 * and signed form-state timing checks.
 */
import { NextResponse } from "next/server";
import type { Store } from "@/lib/data";
import {
  verifyTurnstile,
  SECURITY_UNAVAILABLE_MESSAGE,
  TURNSTILE_FAILED_MESSAGE,
} from "@/lib/turnstile";
import { durableRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/ratelimit";
import { verifyFormState } from "@/lib/formstate";

/** Validate Turnstile; returns an error response to send, or null to proceed. */
export async function turnstileGate(
  token: unknown,
  ip: string,
  action: string
): Promise<NextResponse | null> {
  const result = await verifyTurnstile(token, ip, action);
  if (result.ok) return null;
  if (!result.configured) {
    // Fail closed with an honest, non-technical message.
    return NextResponse.json(
      { error: SECURITY_UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: TURNSTILE_FAILED_MESSAGE }, { status: 400 });
}

/** Apply one or more durable limits; returns a 429 response or null. */
export async function limitGate(
  store: Store,
  checks: Array<{
    scope: string;
    identifier: string;
    limit: number;
    windowMs: number;
  }>
): Promise<NextResponse | null> {
  for (const c of checks) {
    const res = await durableRateLimit(
      store,
      c.scope,
      c.identifier,
      c.limit,
      c.windowMs
    );
    if (!res.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        {
          status: 429,
          headers: { "Retry-After": String(res.retryAfterSeconds) },
        }
      );
    }
  }
  return null;
}

/** Reject forged/absent/too-fast form state with the generic message. */
export function formStateGate(state: unknown): NextResponse | null {
  if (verifyFormState(state)) return null;
  return NextResponse.json({ error: TURNSTILE_FAILED_MESSAGE }, { status: 400 });
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
