/**
 * Generates labeled cinematic WebP placeholder images for every required
 * 7FC asset. Run: node scripts/generate-placeholders.mjs
 * Replace outputs in /public/images/ with final art (same names, .webp).
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "images");

export const ASSETS = [
  { file: "7fc-logo-main.webp", w: 320, h: 180, section: "Header / Footer", desc: "7FC Seven FC logo" },
  { file: "7fc-og-preview.webp", w: 1200, h: 630, section: "SEO / Open Graph", desc: "OG social preview" },
  { file: "7fc-favicon.webp", w: 512, h: 512, section: "Favicon", desc: "WebP favicon source" },
  { file: "7fc-hero-stadium-bg.webp", w: 1920, h: 1080, section: "Hero", desc: "Cinematic stadium background" },
  { file: "7fc-hero-player.webp", w: 900, h: 1400, section: "Hero", desc: "Generic back-view number 7 player" },
  { file: "7fc-signature-mark.webp", w: 600, h: 240, section: "Hero", desc: "Abstract gold signature mark" },
  { file: "7fc-built-different-player.webp", w: 1000, h: 700, section: "Built Different", desc: "Generic player side profile" },
  { file: "7fc-quote-banner-player.webp", w: 1920, h: 500, section: "Quote Banner", desc: "Tunnel player silhouette" },
  { file: "7fc-era-sporting.webp", w: 320, h: 320, section: "Journey", desc: "Generic Sporting era crest" },
  { file: "7fc-era-manchester.webp", w: 320, h: 320, section: "Journey", desc: "Generic Manchester era crest" },
  { file: "7fc-era-madrid.webp", w: 320, h: 320, section: "Journey", desc: "Generic Madrid era crest" },
  { file: "7fc-era-juventus.webp", w: 320, h: 320, section: "Journey", desc: "Generic Juventus era crest" },
  { file: "7fc-era-al-nassr.webp", w: 320, h: 320, section: "Journey", desc: "Generic Al Nassr era crest" },
  { file: "7fc-era-portugal.webp", w: 320, h: 320, section: "Journey", desc: "Generic Portugal pride shield" },
  { file: "7fc-choice-sporting-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Sporting era card" },
  { file: "7fc-choice-manchester-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Manchester era card" },
  { file: "7fc-choice-madrid-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Madrid era card" },
  { file: "7fc-choice-juventus-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Juventus era card" },
  { file: "7fc-choice-al-nassr-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Al Nassr era card" },
  { file: "7fc-choice-portugal-era.webp", w: 640, h: 420, section: "Choose Your Era", desc: "Portugal era card" },
  { file: "7fc-choice-all-eras.webp", w: 640, h: 420, section: "Choose Your Era", desc: "All Eras gold 7 card" },
  { file: "7fc-moment-champions-league-nights.webp", w: 640, h: 420, section: "7FC Moments", desc: "Trophy night placeholder" },
  { file: "7fc-moment-all-time-scorer.webp", w: 640, h: 420, section: "7FC Moments", desc: "Scorer legacy placeholder" },
  { file: "7fc-moment-ballon-dor-legend.webp", w: 640, h: 420, section: "7FC Moments", desc: "Gold award placeholder" },
  { file: "7fc-moment-unforgettable-goals.webp", w: 640, h: 420, section: "7FC Moments", desc: "Acrobatic moment placeholder" },
  { file: "7fc-moment-major-titles.webp", w: 640, h: 420, section: "7FC Moments", desc: "Titles silhouette placeholder" },
  { file: "7fc-world-map.webp", w: 1600, h: 700, section: "Where the 7 Has Been Raised", desc: "Dark world map" },
  { file: "7fc-supporter-card-player.webp", w: 700, h: 900, section: "Global 7 Wall", desc: "Supporter card player" },
  { file: "7fc-kit-books.webp", w: 640, h: 420, section: "7FC Kit", desc: "Books & biographies" },
  { file: "7fc-kit-training-cones.webp", w: 640, h: 420, section: "7FC Kit", desc: "Training cones" },
  { file: "7fc-kit-agility-ladder.webp", w: 640, h: 420, section: "7FC Kit", desc: "Agility ladder" },
  { file: "7fc-kit-resistance-bands.webp", w: 640, h: 420, section: "7FC Kit", desc: "Resistance bands" },
  { file: "7fc-kit-football.webp", w: 640, h: 420, section: "7FC Kit", desc: "Football" },
  { file: "7fc-kit-shin-guards.webp", w: 640, h: 420, section: "7FC Kit", desc: "Shin guards" },
  { file: "7fc-kit-recovery-roller.webp", w: 640, h: 420, section: "7FC Kit", desc: "Recovery roller" },
  { file: "7fc-kit-water-bottle.webp", w: 640, h: 420, section: "7FC Kit", desc: "Water bottle" },
  { file: "7fc-kit-gym-bag.webp", w: 640, h: 420, section: "7FC Kit", desc: "Gym bag" },
  { file: "7fc-kit-speed-hurdles.webp", w: 640, h: 420, section: "7FC Kit", desc: "Speed hurdles" },
  { file: "7fc-kit-training-bibs.webp", w: 640, h: 420, section: "7FC Kit", desc: "Training bibs" },
  { file: "7fc-kit-ball-pump.webp", w: 640, h: 420, section: "7FC Kit", desc: "Ball pump" },
  { file: "7fc-kit-compression-socks.webp", w: 640, h: 420, section: "7FC Kit", desc: "Compression socks" },
  { file: "7fc-kit-captain-armband.webp", w: 640, h: 420, section: "7FC Kit", desc: "Captain armband" },
  { file: "7fc-kit-stretching-strap.webp", w: 640, h: 420, section: "7FC Kit", desc: "Stretching strap" },
  { file: "7fc-wall-hero-mobile.webp", w: 900, h: 1200, section: "Global 7 Wall page hero (mobile)", desc: "Generic number 7 player silhouette" },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&apos;");
}

function svg({ file, w, h, section, desc }) {
  const base = Math.min(w, h);
  const title = Math.max(Math.round(base / 14), 12);
  const small = Math.max(Math.round(base / 26), 9);
  const seven = Math.round(base * 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1530"/>
      <stop offset="0.5" stop-color="#05070f"/>
      <stop offset="1" stop-color="#1a0a12"/>
    </linearGradient>
    <radialGradient id="glowB" cx="0.2" cy="0.15" r="0.6">
      <stop offset="0" stop-color="#2b6cff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#2b6cff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="0.85" cy="0.85" r="0.6">
      <stop offset="0" stop-color="#c8102e" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#c8102e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glowB)"/>
  <rect width="100%" height="100%" fill="url(#glowR)"/>
  <text x="50%" y="52%" text-anchor="middle" font-family="Georgia, serif" font-weight="bold"
        font-size="${seven}" fill="#d4af5e" fill-opacity="0.18">7</text>
  <rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#d4af5e" stroke-opacity="0.5" stroke-width="2"/>
  <text x="50%" y="${h * 0.36}" text-anchor="middle" font-family="Georgia, serif" font-size="${title}" fill="#f0d492">${esc(file)}</text>
  <text x="50%" y="${h * 0.36 + title * 1.6}" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="${small}" fill="#9aa4c0">${esc(desc)}</text>
  <text x="50%" y="${h * 0.36 + title * 1.6 + small * 1.8}" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="${small}" fill="#7a839e">Section: ${esc(section)} · ${w}x${h} · PLACEHOLDER</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
for (const asset of ASSETS) {
  const buffer = Buffer.from(svg(asset));
  await sharp(buffer).webp({ quality: 72 }).toFile(path.join(OUT, asset.file));
  console.log("✓", asset.file, `${asset.w}x${asset.h}`);
}
console.log(`\nGenerated ${ASSETS.length} WebP placeholders in public/images/`);
