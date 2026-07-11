# 7FC Email Delivery Operations

Internal document. Last updated: 2026-07-11.

## Architecture

- **Outbox**: every transactional message is written to the `email_outbox`
  D1 table with a unique `event_key` (idempotent — repeats can never create
  duplicates), then delivery is attempted immediately via
  `ctx.waitUntil` and retried with backoff (1, 5, 30, 120, 720 minutes; max
  6 attempts) whenever `POST /api/admin/outbox` runs (admin-authenticated;
  the admin should trigger it when the dashboard shows pending items).
  There is **no unauthenticated retry endpoint** and no cron trigger in the
  current OpenNext worker (documented limitation; the opportunistic
  send-on-enqueue covers the normal path).
- **Provider**: Resend HTTPS API when `RESEND_API_KEY` is set. Local dev
  without a key uses a `dev-log` provider (logs metadata, marks sent).
  **Production without a key**: `emailEnabled()` returns false and the wall
  signup falls back to the legacy no-verification flow — the UI never claims
  an email was sent when none can be.
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
