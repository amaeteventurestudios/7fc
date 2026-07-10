-- Kit product detail pages: slug, tags, gallery, SEO fields.
-- Slugs are backfilled lazily in the app layer (slugified title) when empty.

ALTER TABLE affiliate_products ADD COLUMN slug TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN tags TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN gallery_images TEXT NOT NULL DEFAULT '[]';
ALTER TABLE affiliate_products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE affiliate_products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_affiliate_products_slug ON affiliate_products(slug);
