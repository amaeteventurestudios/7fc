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
- File-based JSON data store for local dev, with a Cloudflare D1 schema for production (`/migrations/0001_init.sql`)
- Generated WebP placeholder images (no PNG/JPEG anywhere)

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
| `SESSION_SECRET` | Signs admin session cookies. **Required in production.** |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG URL (default `https://7fc.net`). |
| `TEMP_ADMIN_EMAIL` / `TEMP_ADMIN_PASSWORD` | Optional overrides for the bootstrap admin. |

No secrets are committed. Passwords are stored as scrypt hashes only.

## Admin setup & temporary login

On first run the app is in **setup mode**:

1. Go to `/admin/login`. A **“Fill Temporary Admin Login”** button appears (only in setup mode).
2. It fills the temporary credentials — default `admin@7fc.net` / `ChangeMe-7FC-Now`.
3. After logging in with temporary credentials you are redirected to `/admin/settings/security`.
4. Change the email and password there (current password required; new password min 10 chars).
5. Changing the password **disables setup mode** and the temporary-login button disappears permanently.

## Cloudflare D1 setup

The local JSON store (`lib/store.ts`) is a development fallback with the same
shape as the D1 schema. To move to D1:

```bash
npx wrangler d1 create 7fc-db
npx wrangler d1 migrations apply 7fc-db
```

Tables created by `migrations/0001_init.sql`: `admin_users`, `supporters`,
`global_wall_settings`, `affiliate_products`, `legal_disclaimers`,
`activity_log`, `affiliate_clicks`. Then replace the read/mutate functions in
`lib/store.ts` with D1 queries (all data access goes through that one module).

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

## Deploy

Any Node host works out of the box:

```bash
npm run build
npm start
```

Set `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` in the host's environment.
For Cloudflare Pages/Workers, use `@cloudflare/next-on-pages` or OpenNext and
bind the D1 database, swapping the store layer as described above. Note the
JSON store needs a writable filesystem; on serverless hosts move to D1 (or
another DB) before going live.
