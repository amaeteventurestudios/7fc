# 7FC Privacy-Request & Moderation Procedures

Internal document. Last updated: 2026-07-11.

## Privacy requests (/privacy-request)

Flow: request → verification email (24h one-time token) → verified →
auto-processed or manual.

Auto-processed on verification:
- marketing_opt_out → marketing_consent off + withdrawal timestamp
- consent_withdrawal / wall_removal → status hidden, display consent off,
  removed from public data/sitemap/structured data immediately
- deletion → requires an extra explicit confirmation click, then
  `anonymizeSupporter` (personal fields wiped, email replaced with an
  invalid placeholder, tokens revoked, number retired)
- access / export → requester's own record returned as JSON download
  (only ever for the verified address itself)

Manual (via privacy@sevenfc.net, alerted automatically): correction, other.
Mark handled requests completed via the `privacy_requests` table
(status/completed_at/note).

Never disclose data for an address the requester has not verified.

## Supporter self-service (/manage)

Emailed link (1h, hashed, revocable, invalidated on reissue/deletion) lets a
verified supporter view, correct (public-text edits re-enter moderation),
toggle display/marketing consent, unpublish, export JSON, or delete with
reconfirmation.

## Deletion procedure (manual fallback)

If self-service fails, verify the requester by email round-trip, then run
`anonymizeSupporter` via a temporary admin script. Never hard-delete a row
with a supporter number unless it is an unverified signup.

## Export procedure (manual fallback)

Verify by email round-trip, then produce the same JSON shape as
`exportView` in `app/api/manage/route.ts` for that supporter only.

## Moderation

- Queue: admin → supporters filtered by `pending` (verified entries only —
  unverified never publish). Approve/hide/delete as today; approve stamps
  `published_at`.
- Reports: `GET /api/admin/reports?status=open`; resolve/dismiss via POST.
  Reporter identity is only a salted hash — never published.
- Unpublish without deleting: `hide` keeps the private record.
- Moderation notes: `supporters.moderation_note` field.
- Activity log records approve/hide/delete events (no emails in details).
