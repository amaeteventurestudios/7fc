# 7FC Personal-Data Inventory

Internal document — not published on the website. Last updated: 2026-07-11.

## Data subjects

Supporters (Global 7 Wall), contact-form senders, privacy requesters, entry reporters, site administrators.

## Personal data processed

| Data | Where stored | Source | Purpose | Public? |
|---|---|---|---|---|
| First name, optional last name | `supporters` (D1) | Signup form | Wall entry | First name public after consent+approval; last name only if opted in (else initial) |
| Email address | `supporters` | Signup form | Verification, transactional email, dedupe | Never |
| Country, favorite era, message | `supporters` | Signup form | Wall entry | Public after consent+approval |
| Supporter number | `supporters` | Assigned | Identity on the Wall | Public |
| Consent evidence (terms/privacy versions, display, marketing, age attestation, timestamps, withdrawal/deletion timestamps) | `supporters` | Signup + self-service | Compliance evidence | Never |
| Verification/management/privacy token hashes | `security_tokens` | Generated | One-time links (SHA-256 only; raw never stored/logged) | Never |
| Outbound email (recipient, subject, body until sent) | `email_outbox` | System | Durable delivery + retry; bodies redacted after send (7d max) | Never |
| Contact submissions (name, email, subject, message) | `email_outbox` only (transit) | Contact form | Routed to alias inbox; redacted after delivery | Never |
| Privacy requests (email, type, details, status) | `privacy_requests` | Privacy Request page | Rights handling; kept 24 months as evidence | Never |
| Entry reports (reason, details, salted IP hash) | `entry_reports` | Report form | Moderation | Never |
| Suppression list (email, reason) | `email_suppressions` | Provider webhook | Stop mailing bounced/complained addresses | Never |
| IP addresses | Not persisted by the app (transient rate-limit keys in memory; truncated salted hash only for report dedupe). Cloudflare processes IPs at the edge per its policies. | — | Security | Never |

## Processors

- Cloudflare (hosting, Workers, D1, R2, Turnstile) — USA
- Resend (transactional email, when configured) — USA
- Amazon Associates (outbound affiliate links only; no personal data sent)

## Where data is NOT

No analytics, no advertising trackers, no personal data in llms.txt/llms-full.txt/sitemap, no personal data in ordinary logs, no owner personal identity in public content.
