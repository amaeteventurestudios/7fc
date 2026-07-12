# 7FC Data-Retention Schedule

Internal document. Values are centralized in `lib/policy.ts` (`RETENTION`) and
enforced by `Store.retentionCleanup()` (runs with every admin outbox
processing call, `POST /api/admin/outbox`). The Privacy Policy
(`app/privacy/page.tsx`) must be kept in sync with this table.

| Data | Retention | Enforcement |
|---|---|---|
| Verification tokens | Expire after **24 hours** (fixed) | Expiry check at consumption |
| Management links | Expire after **1 hour**; revoked on deletion or reissue | Expiry check + invalidation |
| Privacy-request verification tokens | Expire after **24 hours**, one-time | Expiry check at consumption |
| Unverified signups | Deleted after **7 days** | retentionCleanup |
| Used/expired token rows | Purged after **30 days** | retentionCleanup |
| Sent email bodies (incl. contact payloads) | Redacted immediately on send; stragglers redacted after **7 days** | send path + retentionCleanup |
| Outbox metadata rows | Purged after **90 days** (non-pending) | retentionCleanup |
| Resolved/dismissed entry reports | Purged after **180 days** | retentionCleanup |
| Completed/rejected privacy requests | Purged after **24 months** (kept as compliance evidence) | retentionCleanup |
| Approved supporter records | Kept while the supporter relationship/Wall entry exists; anonymized on deletion request | self-service `/manage`, privacy requests |
| Rejected submissions | Remain non-public; anonymized/deleted on request; unverified ones fall under the 7-day rule | moderation + cleanup |
| Suppression entries | Kept while needed to prevent re-mailing; removable after re-verification of the corrected address | manual |
| Cookie-consent record | Client-side cookie, 12 months, re-requested when policy version changes | cookie expiry |
| Rate-limit counters (HMAC-hashed IP/email keys, never raw) | Expire with their window (15 min – 24 h); purged every cron run | retentionCleanup |
| Moderation history (activity log) | Operational log, no emails/PII in detail strings | — |
| Raw IPs | Never persisted by the app; in-memory rate-limit keys only | design |
| Backups (D1 exports + Cloudflare D1 Time Travel) | Manual export files kept max **90 days** in private storage; D1 Time Travel follows Cloudflare's ~30-day window | manual procedure |

Notes:
- None of these values is claimed to be "legally required"; they are
  conservative operational choices.
- Deleted data may persist in third-party caches (search engines, AI
  services, recipients' inboxes) that 7FC does not control — the Privacy
  Policy says so explicitly.
