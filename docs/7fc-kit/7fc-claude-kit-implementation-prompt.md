You are working inside the existing **7FC** project repository.

Do not restart the project. Do not replace the existing design system. Do not build a second parallel product system. Inspect the current codebase, database, routes, components, admin system, deployment configuration, and storage setup before making changes.

The objective is to complete the 7FC Kit product system, import the 15 approved products, connect the approved cinematic product images, build strong product pages, expand the administration interface, improve mobile administration, and create a clear site architecture that helps Google understand the major sections of the website and potentially generate useful sitelinks for branded searches.

This must be completed as one coordinated implementation.

---

# 1. Project Context

7FC is a dark, premium, cinematic unofficial fan tribute website inspired by the legacy, discipline, standards, mentality, and global impact associated with the number 7.

The established visual system must remain consistent across the entire implementation.

## Visual language

- Dark navy and black backgrounds
- Gold typography and gold accents
- Red and blue cinematic lighting
- Premium sports-luxury presentation
- High contrast
- Clean glassmorphism where appropriate
- Cinematic studio reflections
- Strong negative space
- Masculine, disciplined, focused presentation
- Consistent typography and spacing
- No generic marketplace appearance
- No Amazon-style screenshots on public pages
- No major redesign of the established site

## Legal positioning

7FC must always be presented as:

- An unofficial fan tribute
- Not affiliated with Cristiano Ronaldo
- Not endorsed by Cristiano Ronaldo
- Not sponsored by Cristiano Ronaldo
- Not connected to CR7, any club, federation, sponsor, Amazon, LEGO, adidas, or another referenced brand unless explicitly and independently true

Do not imply official licensing, endorsement, authentication, or authorization.

---

# 2. Uploaded Source Files

Three approved source files have been provided in the Claude chat.

Locate the uploaded files and place exact copies into the repository using the following paths.

```text
/content/7fc-kit/7fc-kit-seo-content.csv
/docs/7fc-kit/7fc-kit-seo-content.xlsx
/docs/7fc-kit/7fc-claude-kit-implementation-prompt.md
```

File responsibilities

CSV

```text
/content/7fc-kit/7fc-kit-seo-content.csv
```

This is the machine-readable import and initial content source for the 15 approved products.
Use it to populate the application database or existing product-storage system.
The application must not read the CSV on every page request after the import is complete.
The correct data flow is:

```text
CSV import → application database/admin system → public website
```

The public website must use the database or existing persistent application data as the runtime source of truth.

XLSX

```text
/docs/7fc-kit/7fc-kit-seo-content.xlsx
```

This is a human-review copy.
The production application must not depend on this spreadsheet at runtime.
Do not parse the XLSX inside public page rendering.

Markdown implementation document

```text
/docs/7fc-kit/7fc-claude-kit-implementation-prompt.md
```

Save this complete implementation specification at that path.
If an older file already exists at this path, replace or update it with this complete master specification.

Directory creation

Create these directories if they do not already exist:

```text
/content/7fc-kit/
/docs/7fc-kit/
```

Do not place the CSV or XLSX in the public directory.
Do not expose the CSV or XLSX as public website downloads unless that is explicitly requested later.

# 3. Existing Product Images

All 15 approved cinematic product images are already located in:

```text
/public/images/amazon/
```

Inspect this directory and confirm that all required files exist.

Expected filenames:

```text
7fc-amazon-lego-soccer-highlights.webp
7fc-amazon-lego-soccer-legend.webp
7fc-amazon-cr7-play-it-cool.webp
7fc-amazon-ronaldo-sticker-pack.webp
7fc-amazon-cr7-original-red-cologne.webp
7fc-amazon-portugal-action-figure.webp
7fc-amazon-ronaldo-wall-tapestry.webp
7fc-amazon-dragon-kids-jersey.webp
7fc-amazon-ronaldo-signed-photo.webp
7fc-amazon-lego-fifa-trophy.webp
7fc-amazon-agility-cones.webp
7fc-amazon-portable-ball-pump.webp
7fc-amazon-soccer-fidget-spinners.webp
7fc-amazon-ankle-stabilizer.webp
7fc-amazon-adidas-low-cut-socks.webp
```

The corresponding public paths should be:

```text
/images/amazon/[filename]
```

Example:

```text
/images/amazon/7fc-amazon-agility-cones.webp
```

Image validation

For every image:

* Confirm that the file exists.
* Confirm that the file is a valid WebP image.
* Confirm that it can be rendered by the application.
* Confirm that the filename matches the CSV.
* Confirm that the path uses the correct capitalization.
* Confirm that the image does not cause layout overflow.
* Confirm that responsive image behavior works on mobile.
* Use the project's existing optimized-image system when available.
* Preserve the full image composition.
* Do not crop away major product content or headline text.
* Use `object-fit` and aspect-ratio rules appropriate for a 640 × 420 landscape image.

The generated images are editorial product presentations. They are not exact retail photography.

Display a concise disclosure near the main product image:

7FC editorial product presentation. Actual product appearance, packaging, colors and specifications may vary. Review the current retailer listing before purchasing.

Do not treat text shown inside an image as verified product data.

# 4. Approved Product Set

Import the 15 products from the CSV in their approved display order.

The approved products are:

1. LEGO Editions Cristiano Ronaldo Soccer Highlights Building Set, 43012
2. LEGO Editions Cristiano Ronaldo Soccer Legend Building Set, 43016
3. Cristiano Ronaldo CR7 Play It Cool Men's Fragrance, 1.7 oz
4. 50PCS Football Player Cristiano Ronaldo Water Bottle Stickers
5. CR7 Cristiano Ronaldo Eau de Toilette Cologne, 1.7 oz
6. Sockers Banbo Toys Portugal Cristiano Ronaldo 8-inch Collectible Soccer Action Figure
7. IDOLUSTER Cristiano Ronaldo Signed Wall Tapestry Poster
8. Number 7 Special Dragon Edition Kids Soccer Jersey Kit Shorts
9. Ikonic Fotohaus Cristiano Ronaldo Signed Photo Autograph Print Wall Art
10. LEGO Editions FIFA World Cup Official Trophy Building Set, 43020
11. 25/50/100-piece Disc Cones, Agility Soccer Cones with Carry Bag and Holder
12. Portable Ball Pump with 4 Needles, 2 Nozzles, and Extension Hose
13. Thremhoo 32-piece Soccer World Cup Fidget Spinner Balls Party Favors
14. Med Spec ASO Ankle Stabilizer Lace-Up Ankle Brace
15. adidas Men's Athletic Cushioned Low-Cut Ankle Socks, 6 Pairs

The CSV already contains the approved affiliate URLs, product copy, metadata, image paths, categories, tags, FAQ content, disclosures, and related-product configuration.

Use the exact affiliate URLs provided in the CSV.
Do not replace them with placeholder Amazon links.
Do not invent or alter affiliate codes.

# 5. Initial Repository Audit

Before changing code, inspect and report internally on:

* Current framework and framework version
* Current routing system
* Current database or persistence layer
* Current product schema
* Current affiliate-product admin implementation
* Current image handling
* Current authentication and authorization
* Current hosting environment
* Current deployment target
* Current storage provider, if any
* Current sitemap implementation
* Current metadata implementation
* Current structured-data implementation
* Current navigation components
* Current mobile navigation
* Current footer
* Current `/wall` page navigation
* Current `/kit` route, if it exists
* Current `/kit/[slug]` route
* Current public homepage product cards
* Current product analytics or click-tracking system
* Current test and lint commands
* Current Git branch and upstream

Use the existing architectural patterns where they are sound.
Do not install large new frameworks when the current stack can support the work.
Do not create duplicate database tables, product APIs, admin routes, or rendering systems without first confirming that an equivalent system does not already exist.

# 6. Product Import and Database Migration

Create a repeatable and idempotent import or seed process for:

```text
/content/7fc-kit/7fc-kit-seo-content.csv
```

Import behavior

The import must:

* Read all 15 CSV rows.
* Match records using a stable identifier, preferably `product_id` or `slug`.
* Insert missing products.
* Update approved fields on matching imported products during the initial migration.
* Avoid creating duplicates when run twice.
* Preserve product click analytics where possible.
* Preserve unrelated administrative data.
* Validate required fields.
* Validate unique slugs.
* Validate image paths.
* Validate affiliate URLs.
* Log a clear import summary.
* Fail safely if malformed data is encountered.
* Use a transaction when supported.
* Avoid leaving partially imported product data.

Existing placeholder products

The current admin contains placeholder products such as:

* Books & Biographies
* Training Cones
* Agility Ladder
* Resistance Bands
* Football
* Shin Guards
* Recovery Roller
* Water Bottle
* Gym Bag
* Speed Hurdles
* Training Bibs
* Ball Pump
* Compression Socks
* Captain Armband
* Stretching Strap

These placeholders must not remain active on the public site after the approved import.
Handle them safely.

Preferred approach:

1. Back up or preserve the current records through the normal database migration process.
2. Import the 15 approved products.
3. Deactivate, archive, or remove placeholder products that are not part of the approved CSV.
4. Do not expose old placeholder products on `/kit`, product pages, homepage cards, related picks, sitemap, or search indexing.
5. Avoid deleting historical click data unless deletion is clearly safe and necessary.

Source of truth after import

After the initial import:

* The database and admin interface become the live source of truth.
* Editing a product in the admin must update the public site.
* The website must not overwrite later admin changes by re-reading the CSV automatically.
* Re-running the import must require an explicit action.
* Document whether the import is intended to update all fields or only create missing records.
* Do not silently overwrite manually edited content in production.

# 7. Product Data Model

Expand the existing product data model so the important CSV content can be stored and edited.

Use the project's current database conventions.
A normalized schema or structured JSON fields are both acceptable, provided the data remains editable and queryable.

Support, at minimum:

Identity and publication

* Product ID
* Title
* Short title
* Slug
* Category
* Tags
* Display order
* Active status
* Draft or published status
* Featured status
* Created timestamp
* Updated timestamp

Media

* Main image URL
* Main image alt text
* Optional gallery images
* Optional Open Graph image
* Image disclaimer

Affiliate information

* Amazon affiliate URL
* Button text
* Affiliate disclosure
* Optional outbound click count
* Optional last-link-validation timestamp

SEO

* Primary keyword
* Secondary keywords
* Search intent
* SEO title
* Meta description
* Canonical path
* Open Graph title
* Open Graph description
* Open Graph image
* Indexable status

Hero content

* Eyebrow
* H1
* Hero summary
* Hero supporting line

Editorial page content

* Why it made the 7FC Kit
* Product overview
* What makes it interesting
* Best for
* How to use or display
* Gift occasions
* What to check before buying
* Editorial verdict

FAQs

Store a reorderable collection of:

* Question
* Answer
* Display order

Product facts

Support verified facts without inventing missing details.

Examples:

* Size
* Quantity
* Material
* Model number
* Piece count
* Age range
* Listing notes
* Facts last checked

Related-product configuration

* Dynamic-related-products enabled
* Related fallback slugs
* Optional manual overrides

# 8. Admin Product Editor

The existing Affiliate Products admin page must remain functional and must be expanded.

The admin must allow a non-developer to edit the live product pages without touching source code or the CSV.

Do not put every field in one unstructured wall of inputs.
Organize the editor using tabs, sections, or accessible collapsible panels.

Recommended sections:

Basic Information

* Product title
* Short title
* Slug
* Category
* Tags
* Display order
* Active
* Draft or published
* Featured on homepage

Images

* Main image upload
* Current image preview
* Replace image
* Remove image
* Main image URL
* Image alt text
* Optional gallery-image upload
* Gallery reordering
* Open Graph image
* Image disclaimer

Affiliate

* Amazon affiliate URL
* Button text
* Affiliate disclosure
* Outbound click count, read-only where appropriate
* Link validation state

SEO

* Primary keyword
* Secondary keywords
* Search intent
* SEO title
* Meta description
* Canonical path
* Open Graph title
* Open Graph description
* Indexable toggle

Add useful character guidance:

* SEO title character count
* Meta-description character count
* Open Graph title character count
* Open Graph description character count

Do not prevent saving solely because a title exceeds a suggested character count. Show a warning instead.

Page Content

* Eyebrow
* H1
* Hero summary
* Supporting line
* Why it made the 7FC Kit
* Product overview
* What makes it interesting
* Best for
* How to use or display
* Gift occasions
* What to check before buying
* Editorial verdict

FAQs

Provide a repeatable FAQ editor with:

* Add FAQ
* Edit FAQ
* Delete FAQ
* Reorder FAQ

Related Products

Show:

* Dynamic related-products enabled
* Current category
* Current tags
* Optional fallback products
* Optional manual override
* A preview of currently selected related products

Publishing

Show:

* Draft or published status
* Active status
* Last updated date
* Save
* Publish
* Cancel
* Preview public page

# 9. Admin Image Uploads

The current image-path field is not sufficient.
Implement real image uploading for administrators.

Required behavior

The administrator must be able to:

* Upload a product image from desktop or mobile.
* Drag and drop an image where supported.
* See upload progress.
* Preview the image.
* Replace the image.
* Remove the image.
* Edit the image alt text.
* Save the image URL to the product record.
* See the new image reflected on the public site after saving or publishing.

The uploaded image must update all relevant uses:

* `/kit` collection card
* `/kit/[slug]` product hero
* Related 7FC Kit picks
* Homepage featured-product cards
* Open Graph metadata when configured to use the main image

Persistent storage

Do not store administrator uploads only in the runtime filesystem of a serverless deployment.

Inspect the existing project and hosting setup.
Use the existing configured persistent storage provider if one exists.

Possible acceptable providers include:

* Vercel Blob
* Supabase Storage
* Cloudinary
* Amazon S3
* Another persistent object-storage service already configured in the project

Prefer the provider that already exists in the stack.
Do not introduce multiple storage providers.

If no persistent provider exists:

1. Implement a clean storage adapter compatible with the current hosting environment.
2. Use the smallest reasonable provider integration.
3. Document required environment variables.
4. Do not commit secrets.
5. Do not break the application when credentials are absent.
6. Provide a clear error message in the admin when upload storage is not configured.

Initial static images in `/public/images/amazon/` may continue to use local public paths.
New administrator-uploaded images must use persistent storage.

Upload validation

Validate:

* Supported file type
* Maximum file size
* Image dimensions
* Safe filename handling
* Upload errors
* Authentication
* Authorization

Do not allow unauthenticated public uploads.

# 10. Mobile-Responsive Admin

The complete admin interface must be usable on a phone.
This is a major requirement, not a minor CSS adjustment.

Test the following approximate widths:

```text
320px
375px
390px
430px
768px
1024px
desktop
```

Mobile navigation

Collapse the desktop admin navigation into an accessible mobile menu.

The mobile admin menu must include:

* View Site
* Dashboard
* Supporters
* Wall Settings
* Affiliate Products
* Legal
* Security
* Log out

Mobile product list

Do not force the desktop product table to overflow horizontally.
On mobile, convert product rows into readable cards.

Each card should show:

* Product thumbnail
* Product title
* Category
* Status
* Click count
* Display order
* Edit
* Hide or publish control
* Delete

Use clear tap targets.

Mobile product editor

On mobile:

* Convert two-column fields to one column.
* Keep labels above fields.
* Make inputs full width.
* Make text areas full width.
* Make upload controls easy to use.
* Prevent horizontal page scrolling.
* Use collapsible sections.
* Keep important controls visible.
* Add a sticky Save and Cancel action bar where practical.
* Ensure the mobile keyboard does not cover essential controls.
* Use appropriate input types for URLs, numbers, and text.
* Preserve unsaved form state where practical.

Mobile editing safeguards

Add:

* Unsaved-changes warning
* Delete confirmation
* Success messages
* Error messages
* Affiliate URL validation
* Image-upload progress
* Image-upload error handling
* Clear save state
* Clear published state

Audit all admin pages:

* Dashboard
* Supporters
* Wall Settings
* Affiliate Products
* Legal
* Security

There must be no unusable controls or forced horizontal scrolling at common phone widths.

# 11. Admin Home and View Site Navigation

Add a clearly visible button to the admin header labeled:

```text
View Site
```

or:

```text
Home
```

It must link to:

```text
/
```

Open it in a new tab so an administrator does not lose unsaved work.

Use:

```html
target="_blank"
rel="noopener"
```

The button must appear in both desktop and mobile admin navigation.
Do not hide it inside an obscure menu on desktop.

# 12. Public Navigation

The public site must make major destinations easy to reach.

The 7FC logo must link to:

```text
/
```

Add a clear Home link throughout the public site.
Add a clear 7FC Kit link throughout the public site.

At minimum, ensure navigation consistency on:

* Homepage
* `/wall`
* `/kit`
* Every `/kit/[slug]`
* `/journey`
* `/moments`
* `/records`
* `/about`
* Desktop navigation
* Mobile navigation
* Wall-page floating mobile menu
* Footer

Recommended primary public navigation:

```text
Home
Journey
Moments
Records
Supporter Wall
7FC Kit
About
```

Preserve X as the only active social platform unless the existing project has been explicitly changed.
Do not add Instagram, Facebook, or YouTube.

# 13. Google Sitelink-Oriented Site Architecture

The objective is to create a clear information architecture that helps Google understand the major sections of 7FC.

Google decides whether sitelinks appear. Do not claim that sitelinks are guaranteed.
Do not implement fake sitelink markup.
Do not assume that `SiteNavigationElement` forces Google to show sitelinks.

Instead, build a logical, stable, internally linked architecture.

The primary target pages are:

```text
/
/kit
/wall
/journey
/moments
/records
/about
```

Existing homepage sections

Some of these sections may currently exist only as anchors on the homepage.
Inspect the project.
Where a major subject exists only as a homepage section, create a meaningful dedicated page if one does not already exist.

Do not create thin placeholder pages.
Each major page must have useful original content and a stable URL.

Target sitelink candidates

The strongest sitelink candidates should be:

* 7FC Kit
* Global Supporter Wall
* The Journey
* Iconic Moments
* Record Wall
* About 7FC

Main navigation consistency

Use the same primary labels across:

* Desktop navigation
* Mobile navigation
* Footer
* Homepage section links
* Internal contextual links

Avoid vague primary link labels such as:

* Explore
* Learn more
* Click here
* Discover more

Use descriptive anchor text such as:

* Explore the 7FC Kit
* Visit the Global Supporter Wall
* Explore the Journey
* See Iconic Moments
* View the Record Wall
* Learn About 7FC

# 14. Major Page Titles and H1 Structure

Every major page must have:

* One clear primary H1
* A unique SEO title
* A unique meta description
* A self-referencing canonical URL
* Descriptive introductory content
* Strong internal links
* Breadcrumbs where appropriate

Do not use the same H1 across multiple pages.
Do not repeat the same title template mechanically without meaningful differentiation.

Recommended direction:

Homepage

Suggested title direction:

```text
7FC | The Standard Behind the Number 7
```

The homepage H1 should remain consistent with the existing cinematic hero and established brand direction.
Do not weaken a strong existing homepage hero merely to force this exact wording.

7FC Kit

```text
SEO title:
7FC Kit | Football Collectibles, Training Gear and Fan Picks

H1:
The 7FC Kit
```

Global Supporter Wall

```text
SEO title:
Global Supporter Wall | Join the Worldwide 7FC Community

H1:
The Global Supporter Wall
```

Journey

```text
SEO title:
The Journey | Defining Eras Behind the Number 7

H1:
The Journey
```

Moments

```text
SEO title:
Iconic Moments | Performances That Defined the Number 7

H1:
Iconic Moments
```

Records

```text
SEO title:
Record Wall | Milestones Behind the Number 7

H1:
The Record Wall
```

About

```text
SEO title:
About 7FC | An Unofficial Fan Tribute to the Number 7

H1:
About 7FC
```

Review the exact titles against the existing copy and domain.
Keep titles concise, accurate, and distinct.
Do not overuse Cristiano Ronaldo's name in every major site title.

# 15. `/kit` Collection Page

Create or complete:

```text
/kit
```

This must be a real collection hub, not merely a grid with Amazon buttons.

Page structure

Include:

1. Cinematic collection hero
2. H1
3. Introductory editorial copy
4. Category filters
5. All active products
6. Product cards
7. Affiliate disclosure
8. Unofficial fan tribute disclaimer
9. Internal links to related major sections
10. Footer

Product-card content

Each product card should contain:

* Cinematic image
* Category
* Product title
* Short description
* Optional tag
* View Product button

The main card button should link to the internal product page:

```text
/kit/[slug]
```

Do not send users directly to Amazon from the collection grid unless there is a secondary clearly labeled Amazon control.
The internal product page should be the primary destination.

Categories

Use the CSV categories.

Possible categories include:

* Collectibles
* Fragrance
* Fan Display
* Apparel
* Training
* Performance
* Gifts and Fun

Category filters must work on desktop and mobile.

Do not generate indexable duplicate category URLs unless the implementation intentionally supports useful canonical category pages.

# 16. Product Detail Pages

Create or complete dynamic pages at:

```text
/kit/[slug]
```

Use the product-page reference image supplied in the Claude chat as a visual and structural reference.

Inspect that reference image carefully.
Do not blindly copy it pixel for pixel.

Translate its strengths into the existing 7FC design system:

* Strong product hero
* Large cinematic image
* Clear information hierarchy
* Premium spacing
* Gold accents
* Dark background
* Strong CTA placement
* Editorial sections
* Related products
* Mobile responsiveness

Product-page structure

A. Breadcrumbs

Example:

```text
Home > 7FC Kit > Product Name
```

Breadcrumbs must be visible and crawlable.

B. Hero

Include:

* Category or collection eyebrow
* H1
* Hero summary
* Supporting line
* Tags
* Primary Amazon CTA
* Affiliate disclosure near the CTA
* Cinematic product image
* Editorial-image disclaimer

The main CTA should use the exact affiliate URL from the product record.

Use:

```text
rel="sponsored nofollow noopener"
```

For external links opened in a new tab, include:

```text
target="_blank"
```

C. Why It Made the 7FC Kit

Render the unique CSV content.
Do not generate generic copy by swapping the product name.

D. Product Overview

Render meaningful verified information.
Do not display empty fact rows.

Do not invent:

* Price
* Availability
* Rating
* Review count
* SKU
* MPN
* GTIN
* Dimensions
* Material
* Piece count
* Age range
* Authenticity
* Licensing

unless confirmed in the CSV or current approved product data.

E. What Makes It Interesting

Use the product-specific editorial content.

F. Best For

Render a readable list or compact presentation.

G. How to Use or Display

Use product-specific guidance.

H. Gift Occasions

Render when meaningful.

I. What to Check Before Buying

This section is required.

It should help visitors verify:

* Seller
* Listing details
* Size
* Quantity
* Materials
* Included components
* Current delivery terms
* Return terms
* Whether a signature is printed or handwritten
* Whether a product is officially licensed

Do not imply that 7FC has independently authenticated third-party products.

J. Editorial Verdict

Render a short, useful, product-specific conclusion.

K. FAQ

Render all approved FAQs from the database.
FAQs must remain editable through the admin.

Do not add FAQ structured data unless the current Google guidelines and project policy explicitly support it. Visible FAQs are still required.

L. Related 7FC Kit Picks

Render four dynamic related products.

M. Disclosures

Include:

As an Amazon Associate, 7FC may earn from qualifying purchases at no additional cost to you.

Also include:

7FC is an unofficial fan tribute and is not affiliated with, endorsed by, sponsored by or officially connected to Cristiano Ronaldo, CR7, any football club, federation, product manufacturer, Amazon or any other referenced brand. Product names and trademarks belong to their respective owners.

Place concise disclosure language near the first CTA and fuller legal language near the page footer.

# 17. Dynamic Related 7FC Kit Picks

The Related 7FC Kit Picks section must not be permanently static.

Implement a controlled dynamic selection system.

Eligibility

Exclude:

* The current product
* Inactive products
* Draft products
* Products without valid public slugs
* Products that should not appear publicly

Scoring

Use a weighted relevance score:

```text
Same category: +4
Each shared tag: +2
Complementary category: +1
```

Use the complementary-category mapping in the CSV or define a clear reusable mapping based on the approved categories.

Result count

Display four products.

Diversity

Where possible:

* Avoid four nearly identical products.
* Include category diversity.
* Keep the results relevant.
* Prefer products with valid images and complete data.

Rotation

The related products should rotate automatically without becoming unstable during every render.

Use a deterministic daily seed based on:

```text
current product slug + current UTC date
```

This should produce:

* Stable results during a given UTC day
* Automatic rotation on a later day
* Consistent server and client rendering
* Better cache behavior
* No hydration mismatch

If the site uses static generation, implement a suitable revalidation strategy so the daily rotation can update without requiring a full manual deployment.

If the weighted pool cannot produce four valid products, use the CSV fallback slugs.

Admin preview

The admin product editor should show a preview of the currently selected related products.
Allow a future manual override without disabling the default dynamic behavior for all products.

# 18. Homepage Product Section

Update the homepage 7FC Kit section to use the approved product database.

Do not hardcode old placeholder cards.
Use active, published products.

Prefer a curated subset of featured products rather than displaying all 15 at once.

Recommended initial featured products:

* LEGO Soccer Highlights
* LEGO Soccer Legend
* CR7 Play It Cool
* Portugal Action Figure
* Dragon Kids Jersey
* LEGO World Cup Trophy

However, honor an existing `featured` field or admin selection if implemented.

Each homepage product card should link to the internal product page.

Add a clear collection CTA:

```text
Explore the Full 7FC Kit
```

Link it to:

```text
/kit
```

# 19. SEO for the 15 Product Pages

Use the CSV metadata as the approved initial source.

Every product page must have:

* Unique SEO title
* Unique meta description
* Unique H1
* Canonical URL
* Open Graph title
* Open Graph description
* Open Graph image
* Descriptive image alt text
* Product-specific editorial copy
* Crawlable internal links
* Breadcrumbs
* Sitemap inclusion
* Indexable status when active and published

Do not expose draft or inactive products in the sitemap.
Do not use generic descriptions for all products.
Do not keyword-stuff.
Do not put hidden SEO text on the page.
Do not create doorway pages.
Do not repeat Amazon listing copy without meaningful editorial value.

# 20. Structured Data

Add structured data only when it accurately reflects visible page content.

Homepage

Use appropriate:

* `WebSite`
* `Organization`

Include:

* Site name
* Canonical homepage URL
* Logo
* Description
* X profile under `sameAs`, when configured

Do not add a sitelinks search-box implementation solely to pursue a retired Google search feature.

Major content pages

Use appropriate:

* `WebPage`
* `CollectionPage` for `/kit`
* `BreadcrumbList`

Product pages

Use appropriate:

* `WebPage`
* `Product`
* `BreadcrumbList`

These are editorial affiliate pages, not a 7FC merchant checkout.

Do not claim that 7FC is the seller.

Do not add unverified:

* Offers
* Price
* Currency
* Availability
* Aggregate rating
* Reviews
* Shipping details
* Return policies
* SKU
* MPN
* GTIN

Structured data must match visible page content.
Do not place promotional or misleading statements in structured data.

# 21. Sitemap and Indexing

Update or create the XML sitemap using the existing framework conventions.

Include:

```text
/
/kit
/wall
/journey
/moments
/records
/about
/kit/[every active and published product slug]
```

Exclude:

* Admin routes
* Authentication routes
* Draft products
* Inactive products
* Preview routes
* Search-result pages
* Internal API routes
* Duplicate query-string URLs
* Placeholder products

Use canonical URLs derived from the project's configured site URL.
Do not hardcode a fake domain.

Inspect:

* Environment variables
* Site config
* Metadata base
* Production domain configuration

Add or verify a correct robots configuration.
Do not accidentally block the public product pages.

# 22. Internal Linking

Create strong, natural internal links.

Examples:

* Homepage to `/kit`
* Homepage to `/wall`
* Homepage to `/journey`
* Homepage to `/moments`
* Homepage to `/records`
* Homepage to `/about`
* `/kit` to every product page
* Product pages to `/kit`
* Product pages to related products
* Footer to all major pages
* `/wall` to `/kit`
* `/kit` to `/wall`
* Journey and Moments pages to Records where contextually useful

Use descriptive anchor text.

Do not add large artificial blocks of repetitive keyword links.

# 23. Public Mobile Responsiveness

Test the complete public experience on common phone widths.

Audit:

* Homepage
* Wall page
* Kit page
* Product pages
* Journey
* Moments
* Records
* About
* Header
* Mobile menu
* Footer
* Product cards
* Related picks
* FAQ
* CTA buttons
* Breadcrumbs
* Long product titles
* Cinematic images

Ensure:

* No horizontal overflow
* Readable typography
* Adequate contrast
* Accessible controls
* Useful touch targets
* Correct image scaling
* Consistent 7FC visual identity

# 24. Accessibility

Maintain reasonable accessibility throughout the implementation.

At minimum:

* Semantic headings
* One primary H1 per page
* Descriptive link text
* Descriptive alt text
* Keyboard-accessible menus
* Keyboard-accessible admin accordions or tabs
* Visible focus states
* Correct form labels
* Error messages associated with inputs
* Sufficient contrast
* Accessible dialog and delete-confirmation behavior
* Reduced-motion consideration where practical

Do not remove visual focus indicators.

# 25. Performance

The public site should remain fast.

Use:

* Optimized images
* Responsive image sizing
* Lazy loading below the fold
* Appropriate priority for hero imagery
* Minimal client-side JavaScript
* Server rendering where appropriate
* Stable layouts
* Reusable components
* Efficient product queries

Do not load all full-resolution product images immediately on every page.
Avoid unnecessary animation libraries.
Do not sacrifice the cinematic design, but keep page performance practical.

# 26. Security and Data Integrity

Ensure:

* Product-editing routes require administrator authorization.
* Upload routes require administrator authorization.
* Affiliate URL fields are validated.
* Slugs are validated.
* File uploads are sanitized.
* Delete actions require confirmation.
* Database writes handle errors.
* Secrets remain in environment variables.
* No credentials are committed.
* Admin content is escaped and rendered safely.
* CSV import does not allow unsafe code execution.
* Public pages do not expose private administrative data.

# 27. Preserve Existing Functionality

Do not break:

* Supporter submissions
* Wall search and filters
* Wall statistics
* Public date formatting
* Mobile floating wall menu
* X-only social footer
* Existing admin authentication
* Existing legal settings
* Existing security settings
* Existing analytics or click tracking
* Existing product routes that can be migrated safely
* Existing visual system
* Existing deployment configuration

If a migration changes a route, add redirects where necessary.

# 28. Reference Product Page Image

A product-page reference image has been provided in the Claude chat.

Use it to understand the desired page hierarchy and presentation.

The final product pages should feel like part of the same premium pitch deck as the cinematic product images.

Do not:

* Copy marketplace clutter
* Create an Amazon listing imitation
* Use a white ecommerce template
* Replace the 7FC design system
* Overload the hero with excessive text
* Add fake pricing
* Add fake star ratings
* Add fake customer reviews
* Add fake scarcity messages
* Add fake inventory counters

# 29. Implementation Sequence

Use this sequence.

Phase 1: Audit

1. Inspect repository structure.
2. Inspect current routes and database.
3. Inspect current admin.
4. Inspect deployment and storage.
5. Inspect current image folder.
6. Inspect uploaded CSV, XLSX, and reference image.
7. Identify risks before modifying data.

Phase 2: File placement

1. Create `/content/7fc-kit/`.
2. Create `/docs/7fc-kit/`.
3. Place the uploaded CSV.
4. Place the uploaded XLSX.
5. Save this master prompt as the Markdown file.
6. Confirm checksums or file sizes where practical.

Phase 3: Data model and import

1. Expand the product schema.
2. Create migrations.
3. Build the idempotent CSV importer.
4. Import the 15 approved products.
5. Deactivate or archive placeholder products.
6. Validate image and affiliate mappings.
7. Confirm no duplicates.

Phase 4: Admin

1. Expand product editing.
2. Add image upload.
3. Add FAQ editing.
4. Add SEO editing.
5. Add related-product preview.
6. Add publishing controls.
7. Add View Site.
8. Make all admin pages mobile responsive.

Phase 5: Public collection and product pages

1. Complete `/kit`.
2. Complete `/kit/[slug]`.
3. Apply reference-page design direction.
4. Add dynamic related picks.
5. Update homepage product cards.
6. Add disclosures.

Phase 6: Navigation and major pages

1. Add Home.
2. Add 7FC Kit.
3. Standardize public navigation.
4. Build or complete Journey.
5. Build or complete Moments.
6. Build or complete Records.
7. Build or complete About.
8. Strengthen the Wall-to-Kit and Kit-to-Wall paths.

Phase 7: Technical SEO

1. Apply unique titles and H1s.
2. Add meta descriptions.
3. Add canonicals.
4. Add Open Graph metadata.
5. Add structured data.
6. Add breadcrumbs.
7. Update sitemap.
8. Verify robots.
9. Verify indexability.
10. Verify internal links.

Phase 8: Quality assurance

1. Run import twice and confirm no duplicates.
2. Run type checking.
3. Run lint.
4. Run unit tests.
5. Run integration tests.
6. Run the production build.
7. Test desktop.
8. Test tablet.
9. Test mobile widths.
10. Test admin editing.
11. Test mobile admin editing.
12. Test image upload.
13. Test product publishing.
14. Test Amazon links.
15. Test related-product rotation.
16. Test sitemap output.
17. Test structured data.
18. Test inactive-product behavior.
19. Test old placeholder removal.
20. Test navigation from every major page.

# 30. Acceptance Criteria

The task is not complete until all applicable conditions below are satisfied.

Files

* CSV exists at the approved content path.
* XLSX exists at the approved docs path.
* Master Markdown specification exists at the approved docs path.
* Public application does not depend on XLSX.
* Public application does not read CSV on every request.

Products

* Exactly 15 approved active products are visible.
* No placeholder products remain publicly visible.
* Each product has the correct slug.
* Each product has the correct image.
* Each product has the correct affiliate URL.
* Each product has the approved SEO fields.
* Each product page contains unique editorial content.
* Each product page contains visible FAQs.
* Each product page contains disclosures.
* Each product page contains four related picks.

Admin

* Product data is editable.
* Affiliate links are editable.
* SEO fields are editable.
* Page content is editable.
* FAQs are editable.
* Images can be uploaded and replaced.
* Product image changes appear publicly.
* Admin View Site link works.
* Admin works on mobile.
* Product list works on mobile.
* Product editor works on mobile.
* There is no forced horizontal admin scrolling.

Public navigation

* Logo links to `/`.
* Home is accessible.
* 7FC Kit is accessible.
* Wall page links to Kit.
* Kit links to Wall where appropriate.
* Mobile menu works.
* Footer navigation is complete.
* Major page labels are consistent.

Sitelink-oriented architecture

* `/kit` exists.
* `/wall` exists.
* `/journey` exists.
* `/moments` exists.
* `/records` exists.
* `/about` exists.
* Every major page has a unique title.
* Every major page has a unique H1.
* Every major page has a unique meta description.
* Every major page has internal links.
* Sitemap includes all approved public URLs.
* No fake promise of Google sitelinks is made.

Technical SEO

* Canonicals are correct.
* Open Graph metadata is correct.
* Breadcrumbs work.
* Structured data matches visible content.
* No fake price or rating data is present.
* Active product pages are indexable.
* Draft and inactive pages are excluded.
* Affiliate links use the correct relationship attributes.

Build quality

* Type checking passes.
* Lint passes, or all remaining warnings are documented and unrelated.
* Tests pass.
* Production build passes.
* No secrets are committed.
* No debug code remains.
* No broken links remain.
* No duplicate products remain.

# 31. Git Requirements

After completing the implementation:

1. Review `git status`.
2. Review the complete diff.
3. Confirm no secrets, local environment files, credentials, or unrelated generated files are staged.
4. Confirm the CSV, XLSX, and Markdown files are in the correct repository paths.
5. Confirm database migrations are included.
6. Confirm tests and build results.
7. Commit all approved changes with a clear message.

Suggested commit message:

```text
Complete 7FC Kit product, SEO, navigation, and mobile admin system
```

Use the current active branch.
Do not assume the branch is `main` without checking.
Push to the current tracked remote branch.
If the branch has no upstream, set the upstream during the push.
Do not force push.
Do not rewrite unrelated Git history.

# 32. Final Completion Report

After pushing, provide a clear report containing:

Repository

* Branch name
* Commit hash
* Remote pushed to

Files placed

* CSV path
* XLSX path
* Markdown path
* Image-directory validation result

Product import

* Number inserted
* Number updated
* Number archived or deactivated
* Confirmation that a second import does not create duplicates

Routes

* List every major public route
* List product-route behavior
* Confirm navigation updates

Admin

* Confirm image upload
* Confirm mobile responsiveness
* Confirm View Site button
* Confirm editable SEO and editorial fields

SEO

* Confirm unique titles and H1s
* Confirm sitemap
* Confirm canonicals
* Confirm structured data
* Confirm breadcrumbs
* Confirm affiliate link attributes

Testing

* Type-check result
* Lint result
* Test result
* Production-build result
* Mobile widths tested
* Any remaining known limitations

Missing configuration

Clearly identify any environment variables or external storage credentials that remain required.

Do not claim that a feature is complete if it is blocked by missing credentials.
Do not claim that Google sitelinks are guaranteed.

Final Instruction

Complete the implementation in the existing 7FC repository, preserve the established cinematic brand system, use the approved files and images, make the product database and admin the live source of truth, build the public Kit and product pages, strengthen the major site architecture, make the full administration experience mobile-friendly, run all available validations, commit the completed work, and push it to the current tracked remote branch.
