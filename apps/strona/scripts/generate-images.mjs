/**
 * Generuje grafiki strony (sharp, deterministycznie):
 *  - public/images/hero.jpg            — ciemna scena z sylwetką auta + cyan
 *  - public/images/przed-po/*.jpg      — 6 par placeholderów przed/po
 *  - public/og.jpg                     — OpenGraph 1200×630
 *
 * To art-directed PLACEHOLDERY — do podmiany na prawdziwe zdjęcia
 * (panel Magazyn → Galeria przed/po). Spec sesji: docs/zdjecia-spec.md.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = join(appDir, "public", "images");
const galDir = join(imagesDir, "galeria");
mkdirSync(galDir, { recursive: true });

const GRAIN = `
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
    <feComposite operator="over" in2="SourceGraphic"/>
  </filter>`;

function carSilhouette(x, y, scale, fill, stroke) {
  // Stylizowana sylwetka kombi/SUV — profil boczny.
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M 40 130
             C 70 128 90 122 110 105
             C 140 78 170 62 230 58
             C 300 53 370 55 420 68
             C 450 76 470 90 500 100
             C 545 108 590 112 620 120
             C 640 125 648 132 648 142
             L 646 160 L 40 160 Z"
          fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 150 100 C 175 80 205 68 250 65 L 250 100 Z" fill="#0d1420" opacity="0.9"/>
    <path d="M 262 64 C 320 60 380 62 420 72 L 428 100 L 262 100 Z" fill="#0d1420" opacity="0.9"/>
    <circle cx="170" cy="160" r="34" fill="#05070c" stroke="${stroke}" stroke-width="2"/>
    <circle cx="170" cy="160" r="14" fill="#141c2a"/>
    <circle cx="520" cy="160" r="34" fill="#05070c" stroke="${stroke}" stroke-width="2"/>
    <circle cx="520" cy="160" r="14" fill="#141c2a"/>
  </g>`;
}

async function hero() {
  const w = 2400;
  const h = 1600;
  const svg = `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e7eef4"/>
      <stop offset="0.55" stop-color="#dde6ee"/>
      <stop offset="1" stop-color="#f7fafc"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.74" cy="0.26" r="0.7">
      <stop offset="0" stop-color="#ffde78" stop-opacity="0.5"/>
      <stop offset="0.5" stop-color="#ffecb0" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#dde6ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f5c400" stop-opacity="0.05"/>
      <stop offset="0.5" stop-color="#ffc800" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#f5c400" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c2836" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#f7fafc" stop-opacity="0"/>
    </linearGradient>
    ${GRAIN}
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <g opacity="0.65">
    <rect x="1350" y="120" width="10" height="900" fill="#ffd24d" opacity="0.16" transform="skewX(-18)"/>
    <rect x="1520" y="80" width="26" height="980" fill="#ffdd75" opacity="0.11" transform="skewX(-18)"/>
    <rect x="1730" y="60" width="7" height="1020" fill="#ffc800" opacity="0.18" transform="skewX(-18)"/>
    <rect x="1900" y="140" width="16" height="880" fill="#ffd24d" opacity="0.09" transform="skewX(-18)"/>
  </g>

  <rect x="0" y="1245" width="${w}" height="8" fill="url(#rim)" opacity="0.4"/>
  ${carSilhouette(760, 855, 2.6, "#232e3c", "url(#rim)")}
  <rect x="620" y="1270" width="1700" height="240" fill="url(#floor)"/>

  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.25"/>
</svg>`;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(imagesDir, "hero.jpg"));
  console.log("→ images/hero.jpg");
}

/** Kształty tematów galerii — czysty (po detailingu) wygląd. */
const SHAPES = {
  kanapa: `
      <rect x="220" y="430" width="1160" height="470" rx="60" fill="#2b3547"/>
      <rect x="260" y="330" width="1080" height="220" rx="60" fill="#33405a"/>
      <line x1="600" y1="430" x2="600" y2="900" stroke="#212a3b" stroke-width="14"/>
      <line x1="1000" y1="430" x2="1000" y2="900" stroke="#212a3b" stroke-width="14"/>`,
  fotel: `
      <rect x="560" y="240" width="480" height="560" rx="90" fill="#33405a"/>
      <rect x="520" y="700" width="560" height="290" rx="70" fill="#2b3547"/>
      <rect x="620" y="300" width="360" height="420" rx="70" fill="#242e40"/>`,
  reflektor: `
      <ellipse cx="800" cy="600" rx="520" ry="300" fill="#1c2534"/>
      <ellipse cx="800" cy="600" rx="430" ry="230" fill="#dff5fa" opacity="0.92"/>
      <circle cx="620" cy="600" r="120" fill="#f7fdff" opacity="0.9"/>`,
  lakier: `
      <rect x="140" y="330" width="1320" height="560" rx="40" fill="#141d2c"/>
      <rect x="140" y="330" width="1320" height="180" rx="40" fill="#1f2b3e" opacity="0.85"/>`,
  dywanik: `
      <rect x="330" y="260" width="940" height="700" rx="50" fill="#2a3346"/>
      <rect x="400" y="330" width="800" height="560" rx="30" fill="#212a3b"/>
      <rect x="430" y="640" width="740" height="180" rx="20" fill="#2b354a"/>`,
  felga: `
      <circle cx="800" cy="600" r="430" fill="#161e2c"/>
      <circle cx="800" cy="600" r="330" fill="#2a3548"/>
      <circle cx="800" cy="600" r="90" fill="#121a28"/>
      <g stroke="#3a4864" stroke-width="52" stroke-linecap="round">
        <line x1="800" y1="330" x2="800" y2="870"/>
        <line x1="530" y1="600" x2="1070" y2="600"/>
        <line x1="615" y1="415" x2="985" y2="785"/>
        <line x1="985" y1="415" x2="615" y2="785"/>
      </g>`,
};

/**
 * Pojedyncze zdjęcie galerii realizacji — ciemna „studyjna" scena z ciepłym
 * połyskiem i drobnym żółtym akcentem marki (spójnie z resztą strony).
 */
function galleryScene(subject) {
  const w = 1600;
  const h = 1200;

  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#18202c"/>
      <stop offset="1" stop-color="#0d1420"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.32" stop-color="#fff4d8" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff4d8" stop-opacity="0.16"/>
      <stop offset="0.68" stop-color="#fff4d8" stop-opacity="0"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${SHAPES[subject]}
  <rect width="${w}" height="${h}" fill="url(#sheen)"/>
  <g fill="#ffe9a8" opacity="0.85">
    <path d="M 1200 300 l 9 26 26 9 -26 9 -9 26 -9 -26 -26 -9 26 -9 z"/>
    <path d="M 380 820 l 7 20 20 7 -20 7 -7 20 -7 -20 -20 -7 20 -7 z"/>
  </g>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.4"/>
</svg>`;
}

async function gallery() {
  const subjects = ["kanapa", "fotel", "reflektor", "lakier", "dywanik", "felga"];
  for (const subject of subjects) {
    const name = `${subject}.jpg`;
    await sharp(Buffer.from(galleryScene(subject)))
      .jpeg({ quality: 76, mozjpeg: true })
      .toFile(join(galDir, name));
    console.log(`→ images/galeria/${name}`);
  }
}

async function og() {
  const w = 1200;
  const h = 630;
  const svg = `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef4f8"/>
      <stop offset="1" stop-color="#dde7f0"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffc800" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffc800"/>
      <stop offset="1" stop-color="#ffc800" stop-opacity="0"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${carSilhouette(640, 340, 0.85, "#242f3d", "url(#rim)")}
  <text x="72" y="200" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#101a26">Detailing Łącko</text>
  <text x="72" y="270" font-family="Arial, sans-serif" font-size="30" fill="#41525f">Pranie tapicerki od 250 zł · Polerowanie od 600 zł</text>
  <text x="72" y="320" font-family="Arial, sans-serif" font-size="30" fill="#41525f">Detailing w Łącku — zapraszamy z okolicy Nowego Sącza</text>
  <rect x="72" y="370" width="240" height="6" rx="3" fill="#ffc800"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.18"/>
</svg>`;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(appDir, "public", "og.jpg"));
  console.log("→ og.jpg");
}

await hero();
await gallery();
await og();
console.log("Grafiki wygenerowane.");
