/**
 * Aktualizacja treści CMS do planu www v2 (Notion, 22.07.2026).
 *
 * Copy strony (hero, FAQ, sekcje) żyje w kodzie — tu aktualizujemy tylko
 * bloby, które zostają w CMS:
 *  - site_blobs.kontakt → serviceAreas (dolina Dunajca), hoursNote (po 16:00 i w weekendy)
 *  - site_blobs.cennik → settings (nagłówki anty-„od"), PRO 1000–1300 wg rozmiaru,
 *    korekta dwuetapowa wyłączona, highlight polerowania bez „od"
 *
 * Użycie:  node scripts/seed-copy-v2.mjs
 * Idempotentne — scala z istniejącą treścią, nie kasuje bloków spoza zakresu.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const envPath = join(appDir, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const databaseUrl = (
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
)?.trim();
if (!databaseUrl) {
  console.error("Brak DATABASE_URL (env albo apps/strona/.env.local).");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 15 });

const KONTAKT_V2 = {
  serviceAreas: [
    "Łącko",
    "Czerniec",
    "Zabrzeż",
    "Jazowsko",
    "Maszkowice",
    "Zagorzyn",
    "Kicznia",
    "Obidza",
    "Brzyna",
  ],
  hoursNote: "po 16:00 i w weekendy",
};

const CENNIK_SETTINGS_V2 = {
  heading: "Cennik — ceny z góry, bez wyceny indywidualnej",
  subheading:
    "Jako jedyni w okolicy publikujemy pełny cennik i rozliczamy dokładnie według niego. Widełki tylko tam, gdzie cena zależy od rozmiaru auta.",
  noteTitle: "Sprzedajesz auto?",
  noteText:
    "Kupujący zbije cenę o brudne wnętrze mocniej, niż kosztuje jego wyczyszczenie. Handlarze i komisy od 2 aut miesięcznie — stała stawka ok. 400 zł/auto, ten sam standard i termin za każdym razem.",
  noteCtaLabel: "Wyślij zdjęcie",
};

try {
  // 1. site_blobs.kontakt — dolina Dunajca + godziny.
  const kontaktRows = await sql`
    select data from site_blobs where key = 'kontakt' limit 1
  `;
  if (kontaktRows[0]) {
    const kontakt =
      typeof kontaktRows[0].data === "string"
        ? JSON.parse(kontaktRows[0].data)
        : kontaktRows[0].data;
    const nextKontakt = { ...kontakt, ...KONTAKT_V2 };
    await sql`
      update site_blobs
      set data = ${JSON.stringify(nextKontakt)}::jsonb, updated_at = now()
      where key = 'kontakt'
    `;
    console.log("✓ site_blobs.kontakt — dolina Dunajca, po 16:00 i w weekendy");
  } else {
    console.log("• site_blobs.kontakt nie istnieje — strona użyje DEFAULT_KONTAKT");
  }

  // 2. site_blobs.cennik — settings + poprawki anty-„od".
  const cennikRows = await sql`
    select data from site_blobs where key = 'cennik' limit 1
  `;
  if (cennikRows[0]) {
    const cennik =
      typeof cennikRows[0].data === "string"
        ? JSON.parse(cennikRows[0].data)
        : cennikRows[0].data;

    cennik.settings = { ...cennik.settings, ...CENNIK_SETTINGS_V2 };

    for (const category of cennik.categories ?? []) {
      if (category.id === "polerowanie-korekta") {
        category.description = "Polerowanie jednoetapowe (one step) i reflektory.";
        category.timeLabel = "1,5 h – 1 dzień";
        category.highlight =
          "One step: 600 / 750 / 900 zł wg rozmiaru auta — usuwa 50–70% rys";
      }
    }

    for (const item of cennik.items ?? []) {
      if (item.id === "przygotowanie-do-sprzedazy-pro") {
        item.description =
          "Kompleksowe wnętrze + dekontaminacja + one step + wosk + zdjęcia do ogłoszenia. Hatchback 1000 / sedan-kombi 1150 / SUV-van 1300.";
        item.priceFrom = 1000;
        item.priceTo = 1300;
        item.pricePrefix = "";
        item.unit = "wg rozmiaru auta";
      }
      if (item.id === "korekta-dwuetapowa") {
        item.disabled = true;
      }
    }

    await sql`
      update site_blobs
      set data = ${JSON.stringify(cennik)}::jsonb, updated_at = now()
      where key = 'cennik'
    `;
    console.log("✓ site_blobs.cennik — settings v2, PRO 1000–1300, korekta off");
  } else {
    console.log("• site_blobs.cennik nie istnieje — strona użyje DEFAULT_CENNIK");
  }

  console.log("Gotowe. Strona przeładuje treść przy najbliższej rewalidacji (ISR 10 min) albo po redeployu.");
} finally {
  await sql.end();
}
