# 7FC Incident Response & Data-Breach Checklist

Internal document. Last updated: 2026-07-11.

## Intake

- security@sevenfc.net (published in /security and /.well-known/security.txt)
- **Renew security.txt `Expires` before 2027-07-11**
  (edit `app/.well-known/security.txt/route.ts`).

## Incident response steps

1. **Triage** — confirm the report, assess scope (which data, which systems).
2. **Contain** — options: Cloudflare WAF rule / emergency_lock wall setting /
   `wrangler deploy` a fix / rotate secrets (`SESSION_SECRET`,
   `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`).
3. **Eradicate & recover** — patch, redeploy, restore data from backup if
   needed (see below).
4. **Notify** — if personal data was exposed: document what/when/whom;
   notify affected supporters by email and regulators where required
   (GDPR: 72h to the competent authority; California: Civ. Code §1798.82).
   Keep the log in this repo (private).
5. **Post-mortem** — write what happened and what changed.

## Data-breach checklist

- [ ] Timeline established (first access → detection → containment)
- [ ] Data categories affected listed (see docs/legal/data-inventory.md)
- [ ] Attack vector closed
- [ ] All secrets rotated
- [ ] Admin passwords reset
- [ ] Affected users notified with plain-language guidance
- [ ] Regulator notification decision documented
- [ ] Retention of incident evidence set

## Backup & restore

- Before every remote migration: `npx wrangler d1 export 7fc-prod --remote
  --output backups/7fc-prod-<date>.sql` (keep private, delete after 90 days).
- Cloudflare D1 Time Travel allows point-in-time restore (~30 days):
  `npx wrangler d1 time-travel restore 7fc-prod --timestamp=<unix>`.
- Local JSON store (.data/db.json) is dev-only.

## Log privacy

App logs must never contain raw tokens, passwords, full email bodies, or
unnecessary personal data. The dev-log email provider logs only recipient,
type, and subject — production logging stays metadata-only.
