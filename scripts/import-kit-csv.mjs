/**
 * 7FC Kit CSV importer — idempotent upsert of the 15 approved products.
 *
 * Source: /content/7fc-kit/7fc-kit-seo-content.csv
 *
 * Policy (documented per spec):
 *   - Matches existing products by SLUG.
 *   - On match, UPDATES all approved CSV fields (full refresh of CSV-owned
 *     content). Click counts, product ids, and sort history are preserved.
 *   - Missing products are INSERTED.
 *   - Active products whose slug is NOT in the CSV (the old placeholder set)
 *     are DEACTIVATED, never deleted — click history is preserved.
 *   - Running twice produces no duplicates.
 *   - The import only runs when explicitly invoked; the app never reads the
 *     CSV at runtime. Admin edits after import are the source of truth until
 *     the import is explicitly re-run.
 *
 * Usage:
 *   node scripts/import-kit-csv.mjs --json     # local dev JSON store (.data/db.json)
 *   node scripts/import-kit-csv.mjs --local    # wrangler local D1
 *   node scripts/import-kit-csv.mjs --remote   # production D1
 *   node scripts/import-kit-csv.mjs --print    # print SQL only
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DB_NAME = "7fc-prod";
const CSV_PATH = "content/7fc-kit/7fc-kit-seo-content.csv";
const FEATURED_SLUGS = new Set([
  "lego-cristiano-ronaldo-soccer-highlights",
  "lego-cristiano-ronaldo-soccer-legend",
  "cr7-play-it-cool-fragrance",
  "portugal-cristiano-ronaldo-action-figure",
  "dragon-edition-kids-soccer-jersey-kit",
  "lego-fifa-world-cup-trophy",
]);

// ---------- CSV parsing (RFC-4180 quoted fields) ----------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadProducts() {
  const raw = readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
  const rows = parseCsv(raw);
  const header = rows[0];
  const records = rows.slice(1).map((r) => {
    const rec = {};
    header.forEach((h, i) => (rec[h] = (r[i] ?? "").trim()));
    return rec;
  });

  const errors = [];
  const slugs = new Set();
  const products = records.map((r) => {
    const slug = r.slug;
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.push(`Bad slug: ${slug}`);
    if (slugs.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    slugs.add(slug);
    if (!r.full_product_name) errors.push(`${slug}: missing title`);
    if (!/^https:\/\//.test(r.amazon_affiliate_url))
      errors.push(`${slug}: bad affiliate URL "${r.amazon_affiliate_url}"`);
    const imgFile = path.join("public", r.image_path.replace(/^\//, ""));
    const imageExists = existsSync(imgFile);
    if (!imageExists)
      console.warn(`WARN ${slug}: image missing on disk: ${r.image_path} (fallback will render)`);

    const faqs = [];
    for (let n = 1; n <= 4; n++) {
      const q = r[`faq_question_${n}`];
      const a = r[`faq_answer_${n}`];
      if (q && a) faqs.push({ question: q, answer: a });
    }
    const splitPipe = (s) => s.split("|").map((x) => x.trim()).filter(Boolean);

    return {
      slug,
      title: r.full_product_name,
      short_title: r.short_product_name,
      brand: r.brand,
      category: r.category,
      tags: r.tags,
      image_path: r.image_path,
      image_alt: r.image_alt,
      description: r.hero_summary,
      affiliate_url: r.amazon_affiliate_url,
      button_text: r.amazon_button_text || "Check Current Price on Amazon",
      seo_title: r.seo_title,
      seo_description: r.meta_description,
      og_title: r.og_title,
      og_description: r.og_description,
      og_image: r.og_image,
      primary_keyword: r.primary_keyword,
      secondary_keywords: r.secondary_keywords,
      search_intent: r.search_intent,
      h1: r.h1,
      eyebrow: r.eyebrow,
      image_disclaimer: r.image_disclaimer,
      affiliate_disclosure: r.affiliate_disclosure,
      legal_disclaimer: r.legal_disclaimer,
      content: {
        why_7fc: r.why_it_made_the_7fc_kit,
        overview: r.product_overview,
        best_for: r.best_for,
        how_to_use: r.how_to_use_or_display,
        gift_occasions: r.gift_occasion,
        what_to_check: r.what_to_check_before_buying,
        verdict: r.editorial_verdict,
        verified_facts: splitPipe(r.verified_facts),
        unverified_fields: splitPipe(r.unverified_fields),
      },
      faqs,
      related_fallback_slugs: r.related_fallback_slugs,
      featured: FEATURED_SLUGS.has(slug),
      indexable: r.indexable === "true",
      active: r.active === "true",
      sort_order: Number(r.display_order) - 1,
    };
  });
  if (errors.length) {
    console.error("Import aborted — CSV validation errors:");
    errors.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }
  return products;
}

// ---------- SQL generation (D1) ----------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const COLS = [
  "title", "short_title", "brand", "category", "image_path", "image_alt",
  "description", "affiliate_url", "button_text", "slug", "tags",
  "gallery_images", "seo_title", "seo_description", "og_title",
  "og_description", "og_image", "primary_keyword", "secondary_keywords",
  "search_intent", "h1", "eyebrow", "image_disclaimer",
  "affiliate_disclosure", "legal_disclaimer", "content_json", "faqs_json",
  "related_fallback_slugs", "featured", "indexable", "active", "sort_order",
  "updated_at",
];

function rowValues(p, now) {
  return {
    title: q(p.title), short_title: q(p.short_title), brand: q(p.brand),
    category: q(p.category), image_path: q(p.image_path),
    image_alt: q(p.image_alt), description: q(p.description),
    affiliate_url: q(p.affiliate_url), button_text: q(p.button_text),
    slug: q(p.slug), tags: q(p.tags), gallery_images: q("[]"),
    seo_title: q(p.seo_title), seo_description: q(p.seo_description),
    og_title: q(p.og_title), og_description: q(p.og_description),
    og_image: q(p.og_image), primary_keyword: q(p.primary_keyword),
    secondary_keywords: q(p.secondary_keywords),
    search_intent: q(p.search_intent), h1: q(p.h1), eyebrow: q(p.eyebrow),
    image_disclaimer: q(p.image_disclaimer),
    affiliate_disclosure: q(p.affiliate_disclosure),
    legal_disclaimer: q(p.legal_disclaimer),
    content_json: q(JSON.stringify(p.content)),
    faqs_json: q(JSON.stringify(p.faqs)),
    related_fallback_slugs: q(p.related_fallback_slugs),
    featured: p.featured ? 1 : 0, indexable: p.indexable ? 1 : 0,
    active: p.active ? 1 : 0, sort_order: p.sort_order, updated_at: q(now),
  };
}

function buildSql(products) {
  const now = new Date().toISOString();
  const statements = [];
  for (const p of products) {
    const v = rowValues(p, now);
    const setClause = COLS.filter((c) => c !== "slug")
      .map((c) => `${c} = ${v[c]}`)
      .join(", ");
    statements.push(
      `UPDATE affiliate_products SET ${setClause} WHERE slug = ${q(p.slug)};`
    );
    statements.push(
      `INSERT INTO affiliate_products (id, click_count, ${COLS.join(", ")})
       SELECT ${q(crypto.randomUUID())}, 0, ${COLS.map((c) => v[c]).join(", ")}
       WHERE NOT EXISTS (SELECT 1 FROM affiliate_products WHERE slug = ${q(p.slug)});`
    );
  }
  const slugList = products.map((p) => q(p.slug)).join(", ");
  statements.push(
    `UPDATE affiliate_products SET active = 0 WHERE slug NOT IN (${slugList});`
  );
  return statements.join("\n");
}

// ---------- JSON store mode (local dev) ----------
function importJson(products) {
  const dbPath = ".data/db.json";
  if (!existsSync(dbPath)) {
    console.error(".data/db.json not found — start `next dev` once first.");
    process.exit(1);
  }
  const db = JSON.parse(readFileSync(dbPath, "utf8"));
  const now = new Date().toISOString();
  let inserted = 0;
  let updated = 0;
  for (const p of products) {
    const { sort_order, ...fields } = p;
    const existing = db.affiliate_products.find((x) => x.slug === p.slug);
    if (existing) {
      Object.assign(existing, fields, {
        sort_order,
        gallery_images: existing.gallery_images ?? [],
        updated_at: now,
      });
      updated++;
    } else {
      db.affiliate_products.push({
        id: crypto.randomUUID(),
        ...fields,
        gallery_images: [],
        sort_order,
        click_count: 0,
        updated_at: now,
      });
      inserted++;
    }
  }
  const approved = new Set(products.map((p) => p.slug));
  let deactivated = 0;
  for (const x of db.affiliate_products) {
    if (!approved.has(x.slug) && x.active) {
      x.active = false;
      deactivated++;
    }
  }
  writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log(
    `JSON import complete: ${inserted} inserted, ${updated} updated, ${deactivated} deactivated.`
  );
}

// ---------- main ----------
const products = loadProducts();
console.log(`Validated ${products.length} products from ${CSV_PATH}.`);
const mode = process.argv[2];

if (mode === "--json") {
  importJson(products);
  process.exit(0);
}
const sql = buildSql(products);
if (mode === "--print") {
  console.log(sql);
  process.exit(0);
}
if (mode !== "--local" && mode !== "--remote") {
  console.error(
    "Usage: node scripts/import-kit-csv.mjs --json | --local | --remote | --print"
  );
  process.exit(1);
}
const file = path.join(mkdtempSync(path.join(tmpdir(), "7fc-kit-")), "import.sql");
writeFileSync(file, sql, "utf8");
console.log(`Importing into ${DB_NAME} (${mode.slice(2)})…`);
const res = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", DB_NAME, mode, "--file", file],
  { stdio: "inherit" }
);
process.exit(res.status ?? 1);
