/**
 * Copy „kreskówka" — treści trzymane w bazie (nadpisują wartości z kodu).
 *
 * Redesign według makiety Claude Design („Strona Detailing Łącko - kreskówka")
 * zmienił copy sekcji, a te pola żyją w `site_blobs` (panel Magazyn), nie
 * w kodzie — bez tego zapisu strona pokazuje nagłówki z poprzedniej wersji
 * („Cennik", „Zakres usług", „Zewnątrz", „Polerowanie i korekta lakieru").
 *
 * Aktualizuje:
 *  - site_blobs.cennik      → settings (nagłówek, wstęp, notka i CTA czarnego pasa)
 *                             + nazwy kolumn „Mycie i wosk" / „Polerowanie"
 *  - site_blobs.metamorfozy → nagłówek „Przed i po — zobacz różnicę"
 *
 * Pozycje cennika, ceny, FAQ i pary zdjęć zostają nietknięte.
 *
 * Użycie:  node scripts/seed-copy-kreskowka.mjs
 * Idempotentne — nadpisuje tylko wymienione pola.
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

/** Nagłówek sekcji, wstęp obok nagłówka i treść czarnego pasa pakietu. */
const CENNIK_SETTINGS = {
  heading: "Zobacz, ile to kosztuje",
  subheading:
    "Czas realizacji otrzymasz po wybraniu usług, które Cię interesują",
  noteText: "",
  // CTA czarnego pasa prowadzi do sekcji rezerwacji (#rezerwacja), nie do SMS-a.
  noteCtaLabel: "Zarezerwuj termin →",
};

/** Nazwy kolumn cennika 1:1 z makietą (po id kategorii). */
const CENNIK_CATEGORY_NAMES = {
  zewnatrz: "Mycie i wosk",
  "polerowanie-korekta": "Polerowanie",
};

const METAMORFOZY = {
  heading: "Przed i po — zobacz różnicę",
  // Makieta nie ma podtytułu pod nagłówkiem „Efekty".
  subheading: "",
};

/**
 * Czas realizacji pozycji w MINUTACH — źródło prawdy dla rezerwacji online
 * (godzina odbioru, dzienny limit). Wartości wyprowadzone z opisowych
 * `timeLabel` (środek widełek; „1 dzień" = 480 min pracy). 1:1 z
 * DEFAULT_CENNIK w lib/cennik.ts.
 */
const CENNIK_DURATIONS = {
  "odswiezenie-in-out": 180,
  "detailing-kompletny-in-out": 480,
  "przygotowanie-do-sprzedazy": 480,
  "przygotowanie-do-sprzedazy-pro": 720,
  "mycie-detailingowe-baza": 90,
  "dekontaminacja-lakieru": 30,
  "wosk-syntetyczny-adbl-ssw": 30,
  "wosk-twardy-premium": 60,
  "wycieraczka-szyba-czolowa": 30,
  "wycieraczka-komplet-szyb": 90,
  "mycie-dekontaminacja-wosk": 150,
  "sprzatanie-wnetrza-podstawowe": 90,
  "pranie-tapicerki-komplet": 180,
  "kompleksowe-czyszczenie-wnetrza": 300,
  "czyszczenie-impregnacja-skory": 180,
  ozonowanie: 30,
  "siersc-zwierzat": 45,
  "polerowanie-reflektorow": 90,
  "one-step-hatchback": 390,
  "one-step-sedan-kombi": 450,
  "one-step-suv-van": 510,
  "one-step-wosk-twardy": 60,
  "korekta-dwuetapowa": 960,
};

async function patchBlob(key, patch, describe) {
  const rows = await sql`select data from site_blobs where key = ${key} limit 1`;
  if (!rows[0]) {
    console.log(`• site_blobs.${key} nie istnieje — strona użyje wartości z kodu.`);
    return;
  }
  const current =
    typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
  const next = patch(current);
  await sql`
    update site_blobs
    set data = ${JSON.stringify(next)}::jsonb, updated_at = now()
    where key = ${key}
  `;
  console.log(`✓ site_blobs.${key} — ${describe}`);
}

try {
  await patchBlob(
    "cennik",
    (cennik) => ({
      ...cennik,
      settings: { ...cennik.settings, ...CENNIK_SETTINGS },
      categories: (cennik.categories ?? []).map((category) =>
        CENNIK_CATEGORY_NAMES[category.id]
          ? { ...category, name: CENNIK_CATEGORY_NAMES[category.id] }
          : category,
      ),
      // Czas realizacji tylko tam, gdzie panel go jeszcze nie ustawił —
      // ręczna edycja w Magazyn → Cennik ma pierwszeństwo przed seedem.
      items: (cennik.items ?? []).map((item) =>
        !item.durationMinutes && CENNIK_DURATIONS[item.id]
          ? { ...item, durationMinutes: CENNIK_DURATIONS[item.id] }
          : item,
      ),
    }),
    'copy sekcji, nazwy kolumn i czasy realizacji pozycji (rezerwacje)',
  );

  await patchBlob(
    "metamorfozy",
    (metamorfozy) => ({ ...metamorfozy, ...METAMORFOZY }),
    'nagłówek „Przed i po — zobacz różnicę"',
  );

  console.log("Gotowe. Odśwież stronę (ISR: rewalidacja co 10 min).");
} finally {
  await sql.end();
}
