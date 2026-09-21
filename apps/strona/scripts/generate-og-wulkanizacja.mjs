/**
 * Obraz OpenGraph linii Wulkanizacja (public/og-wulkanizacja.jpg, 1200×630) —
 * generowany deterministycznie z SVG przez sharp, w języku makiety
 * „kreskówka": czerwone tło w kropki, przekrzywiona biała karta z kołem
 * (realne logo klienta — ten sam plik co sygnet w nagłówku, patrz niżej),
 * twarda kreska i offsetowy cień.
 *
 * Osobny skrypt, nie `generate-images.mjs`: tamten nadpisałby też hero.jpg
 * i galerię placeholderami. Uruchomienie: `node scripts/generate-og-wulkanizacja.mjs`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const INK = "#0e0f11";
const CZERWONY = "#f0392e";
const PIASEK = "#f4f3f1";

/**
 * Koło na karcie = realne logo klienta, wczytane z tego samego pliku co
 * sygnet nagłówka (components/sections/marka-switch.tsx) — jedno źródło
 * prawdy, żeby OG-obrazek nigdy nie rozjechał się z tym, co widać na stronie.
 * Wewnętrzne <path> wklejamy do zagnieżdżonego <svg> z własnym viewBox
 * (372×383, ten sam co w źródle), pozycjonowanym i skalowanym w karcie.
 */
const sygnetSvg = readFileSync(join(appDir, "public", "brand", "wulk-sygnet.svg"), "utf8");
const sygnetPaths = sygnetSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

const KARTA = { x: 693, y: 83, w: 400, h: 420 };
const ikonaW = 336;
const ikonaH = Math.round((ikonaW * 383) / 372);
const ikonaX = Math.round(KARTA.x + (KARTA.w - ikonaW) / 2);
const ikonaY = Math.round(KARTA.y + (KARTA.h - ikonaH) / 2);

const kolo = `
  <svg x="${ikonaX}" y="${ikonaY}" width="${ikonaW}" height="${ikonaH}" viewBox="0 0 372 383">
    ${sygnetPaths}
  </svg>`;

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="kropki" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="11" cy="11" r="1.5" fill="${INK}" fill-opacity="0.16"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${CZERWONY}"/>
  <rect width="1200" height="630" fill="url(#kropki)"/>

  <!-- karta z kołem -->
  <g transform="rotate(2 900 300)">
    <rect x="700" y="90" width="400" height="420" rx="24" fill="${INK}"/>
    <rect x="693" y="83" width="400" height="420" rx="24" fill="#fff" stroke="${INK}" stroke-width="6"/>
  </g>
  ${kolo}

  <!-- naklejka lokalizacji -->
  <g transform="rotate(-2 200 110)">
    <rect x="72" y="80" width="400" height="52" rx="26" fill="${INK}"/>
    <rect x="69" y="77" width="400" height="52" rx="26" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <text x="269" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="${INK}">CZERNIEC 72 · 33-390 ŁĄCKO</text>
  </g>

  <text x="72" y="255" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="${INK}">Wulkanizacja</text>
  <text x="72" y="335" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="${INK}">i wymiana opon</text>
  <text x="72" y="400" font-family="Arial, sans-serif" font-size="30" font-weight="500" fill="${INK}">Przekładka · wyważanie · naprawa przebić</text>
  <text x="72" y="442" font-family="Arial, sans-serif" font-size="30" font-weight="500" fill="${INK}">Przechowywanie kół · termin telefonicznie</text>

  <!-- kafel ceny -->
  <g transform="rotate(1.2 300 520)">
    <rect x="77" y="483" width="560" height="76" rx="14" fill="${INK}"/>
    <rect x="72" y="478" width="560" height="76" rx="14" fill="#fff" stroke="${INK}" stroke-width="6"/>
    <text x="96" y="527" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${INK}">Ceny z góry · zero czekania w kolejce</text>
  </g>

  <rect x="0" y="618" width="1200" height="12" fill="${INK}"/>
  <rect x="0" y="0" width="1200" height="1" fill="${PIASEK}" fill-opacity="0"/>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(appDir, "public", "og-wulkanizacja.jpg"));
console.log("→ og-wulkanizacja.jpg");
