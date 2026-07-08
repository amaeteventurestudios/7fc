# 7FC — Seven FC

**The CR7 Legacy. Forever 7.**

7FC is an independent, **unofficial** football fan tribute and culture site
celebrating the legacy, discipline, records, and global fan energy associated
with Cristiano Ronaldo and the number 7. It is not affiliated with, endorsed
by, sponsored by, or connected to Cristiano Ronaldo, CR7, any club,
federation, sponsor, or official brand.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- **Cloudflare D1 in production** (via `@opennextjs/cloudflare` and the `DB` binding), JSON file store as the local-dev fallback
- Generated WebP placeholder images (no PNG/JPEG anywhere)

### Data layer

All data access goes through the `Store` interface in `lib/data.ts`:

- **Production (Cloudflare):** `lib/d1-store.ts` runs SQL against D1 through the `DB` binding. Detection is automatic — if the binding exists in the Cloudflare context, D1 is used.
- **Local dev (`next dev`):** `lib/json-store.ts` uses a JSON file at `.data/db.json` (gitignored, auto-seeded). This fallback is for development only.

## Routes

**Public**
- `/` — the full cinematic one-pager (hero, stats, manifesto, Code of 7, journey, eras, moments, record wall, quote banner, world map, latest supporters, Global 7 Wall form, 7FC Kit, about/FAQ/disclaimer)

**Admin** (never linked from the public site)
- `/admin/login` — login (with temporary bootstrap login in setup mode)
- `/admin` — dashboard
- `/admin/supporters` — supporters table (approve / hide / delete, filters, search)
- `/admin/settings` — Global Wall settings toggles
- `/admin/products` — affiliate product manager
- `/admin/legal` — legal disclaimer editor
- `/admin/settings/security` — change admin email/password

**API** — `/api/wall/submit`, `/api/kit/click`, and `/api/admin/*` (session-protected).

## Local setup

```bash
npm install
node scripts/generate-placeholders.mjs   # regenerate WebP placeholders (already committed)
npm run dev
```

Open http://localhost:3000. The first request seeds `.data/db.json`
(gitignored) with default settings, the 9 affiliate products, and a few
sample approved supporters.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs admin session cookies. **Required in production.** On Cloudflare: `npx wrangler secret put SESSION_SECRET`. |
| `ADMIN_SETUP_MODE` | Set to `false` to force-disable the temporary-login button. Setup mode also ends permanently when the admin password is changed. |
| `ADMIN_TEMP_EMAIL` / `ADMIN_TEMP_PASSWORD` | Optional overrides for the bootstrap admin (defaults `admin@7fc.net` / `ChangeMe-7FC-Now`). Set as Cloudflare secrets in production. |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG URL (default `https://7fc.net`). |

No secrets are committed. Passwords are stored as scrypt hashes only — never plaintext.

## Admin setup & temporary login

On first run the app is in **setup mode**:

1. Go to `/admin/login`. A **“Fill Temporary Admin Login”** button appears (only in setup mode).
2. It fills the temporary credentials — default `admin@7fc.net` / `ChangeMe-7FC-Now`.
3. After logging in with temporary credentials you are redirected to `/admin/settings/security`.
4. Change the email and password there (current password required; new password min 10 chars).
5. Changing the password **disables setup mode** and the temporary-login button disappears permanently.

## Cloudflare D1 setup

The production database is already created and configured in `wrangler.toml`:

| Setting | Value |
|---|---|
| Database name | `7fc-prod` |
| Binding | `DB` |
| Database ID | `747fcf59-7492-4b73-97ca-edad62806f27` |

Exact setup steps:

```bash
# 1. Authenticate wrangler (once)
npx wrangler login

# 2. Apply the schema migration (migrations/0001_init.sql)
npm run db:migrate            # production (--remote)
npm run db:migrate:local      # local wrangler D1 (for cf:preview testing)

# 3. Seed defaults (temp admin, wall settings, legal disclaimers, 9 products)
npm run db:seed               # production (--remote)
npm run db:seed:local         # local wrangler D1

# 4. Set production secrets
npx wrangler secret put SESSION_SECRET
```

Tables created by `migrations/0001_init.sql`: `admin_users`, `supporters`,
`global_wall_settings`, `affiliate_products`, `legal_disclaimers`,
`activity_log`, `affiliate_clicks`.

The seed script (`scripts/seed-d1.mjs`) is idempotent — it only inserts the
temporary admin if no admin exists, and only inserts settings/legal/products
that are missing. It hashes the temporary password with scrypt before writing
(no plaintext is ever stored). Use `node scripts/seed-d1.mjs --print` to
inspect the SQL without executing.

Even without seeding, the D1 store self-heals: missing settings/legal keys
fall back to defaults, and the temporary bootstrap admin is created on the
first login-page request.

## Managing affiliate products

`/admin/products` lets you add, edit, hide/show, delete, and reorder the 9
Amazon affiliate cards, and shows per-product click counts. Set each card's
`affiliate_url` to your tagged Amazon link (seed value is a placeholder with
`tag=YOUR_AFFILIATE_TAG`). All product buttons use `rel="nofollow sponsored"`.

## Replacing WebP placeholders

Every image lives in `/public/images/` and is documented in
[`/public/images/IMAGE_MANIFEST.md`](public/images/IMAGE_MANIFEST.md) with
dimensions, section, description, and alt text. Export final art as WebP with
the **same filename** and overwrite the file — no code changes needed.
Regenerate placeholders anytime with `node scripts/generate-placeholders.mjs`.

## Deploy (Cloudflare Workers via OpenNext)

```bash
npm run db:migrate     # apply migrations to 7fc-prod (once per new migration)
npm run db:seed        # seed defaults (idempotent)
npx wrangler secret put SESSION_SECRET
npm run cf:deploy      # opennextjs-cloudflare build && deploy
```

`npm run cf:preview` builds and runs the Worker locally against wrangler's
local D1 (use `db:migrate:local` + `db:seed:local` first) — this exercises
the real D1 code path before deploying.

After deploying, log in at `/admin/login` with the temporary credentials and
immediately change them on `/admin/settings/security` — this permanently
disables setup mode.

The classic Node path (`npm run build && npm start`) still works and uses the
JSON file store; it is intended for local development only.
