-- 7FC Kit editorial/SEO product fields (CSV import support).
-- Structured content is stored as JSON text (content_json, faqs_json).

ALTER TABLE affiliate_products ADD COLUMN short_title TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN brand TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliate_products ADD COLUMN indexable INTEGER NOT NULL DEFAULT 1;
ALTER TABLE affiliate_products ADD COLUMN image_alt TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN og_image TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN og_title TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN og_description TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN image_disclaimer TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN affiliate_disclosure TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN legal_disclaimer TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN primary_keyword TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN secondary_keywords TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN search_intent TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN eyebrow TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN h1 TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN content_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE affiliate_products ADD COLUMN faqs_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE affiliate_products ADD COLUMN related_fallback_slugs TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
