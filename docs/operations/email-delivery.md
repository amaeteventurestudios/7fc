# 7FC Email Delivery Operations

Internal document. Last updated: 2026-07-11.

## Architecture

- **Outbox**: every transactional message is written to the `email_outbox`
  D1 table with a unique `event_key` (idempotent — repeats can never create
  duplicates). Delivery is attempted immediately via `ctx.waitUntil`, and a
  **Cloudflare cron trigger runs every 5 minutes** (wrangler.toml
  `[triggers]`; the scheduled handler in worker/index.js self-invokes
  POST /api/cron/outbox) to retry with backoff (1, 5, 30, 120, 720 minutes;
  max 6 attempts → permanent `failed`). Row claims are atomic
  (per-row conditional UPDATE) with stale-`processing` recovery after 10
  minutes, so overlapping runs can never double-send. Retention cleanup runs
  in the same cron. `POST /api/admin/outbox` remains as a protected manual
  retry tool. When no provider is configured, due rows are parked (attempt
  counter untouched) so contact payloads survive until a provider exists —
  and signup/manage/privacy flows refuse up-front with a temporary-service
  message instead of creating dead-end records.
- **Provider**: Resend HTTPS API when `RESEND_API_KEY` is set. Local dev
  without a key uses a `dev-log` provider (logs metadata, marks sent).
  **Production without a key**: `emailEnabled()` returns false; signups,
  resend-verification, management links, and automated privacy requests are
  refused up-front with an honest temporary-service message (no records or
  tokens are created), and the wall form shows a "signups temporarily
  paused" card. Contact submissions still queue durably.
- Sender: `7FC Notifications <notifications@sevenfc.net>`; Reply-To
  `support@sevenfc.net` (supporter mail) or `contact@sevenfc.net`.
  Owner alerts go to `admin@sevenfc.net`; privacy alerts to
  `privacy@sevenfc.net`. All aliases forward to the existing inbox.
- Bodies are redacted from the outbox immediately after successful send;
  metadata is purged after 90 days.

## Notification types

supporter_email_verification, supporter_welcome_confirmation,
owner_signup_alert, contact_submission_alert, contact_acknowledgment,
privacy_request_verification, privacy_request_acknowledgment,
privacy_request_alert.

## DNS / provider setup (MANUAL — required before production email works)

**Never touch the root MX records or cPanel mailboxes/forwarders. Do not
enable Cloudflare Email Routing.** Outbound-only setup with Resend:

1. Create/log in to Resend; add domain `sevenfc.net` (or subdomain
   `send.sevenfc.net` to keep the root SPF untouched — preferred).
2. Add ONLY the DNS records Resend shows for outbound sending:
   - DKIM CNAME/TXT records (new hostnames — cannot conflict with inbound mail)
   - SPF TXT on the *sending* subdomain (avoid editing the root SPF if the
     subdomain option is used)
   - Optional DMARC TXT if not present (`v=DMARC1; p=none; rua=mailto:postmaster@sevenfc.net`)
3. `npx wrangler secret put RESEND_API_KEY`
4. (Webhooks) In Resend, add endpoint `https://sevenfc.net/api/webhooks/resend`
   for `email.bounced`, `email.complained`, `email.delivered`; then
   `npx wrangler secret put RESEND_WEBHOOK_SECRET` with the signing secret.
5. Redeploy. Verify with a real signup.

## Bounce / complaint / suppression

- Webhook is Svix-signature-verified with 5-minute replay protection;
  unsigned events rejected (503 when the secret is unset).
- Hard bounces + complaints → `email_suppressions`; the outbox refuses to
  send to suppressed addresses (marked `suppressed`, never retried).
- Soft bounces/deferrals are left to the provider's own retry.
- A supporter who fixes a typo can be re-verified: remove the suppression
  row manually, then have them use the resend-verification flow.
- `postmaster@sevenfc.net` is the human contact for delivery/abuse issues
  and the DMARC report address.

## Key rotation

Resend API key: create a new key in the dashboard →
`npx wrangler secret put RESEND_API_KEY` → delete the old key.
Webhook secret: roll in Resend → `wrangler secret put RESEND_WEBHOOK_SECRET`.
Turnstile: create new widget keys → update `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
(build-time env/vars) and `TURNSTILE_SECRET_KEY` (secret) → redeploy.
