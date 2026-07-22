/**
 * Scalenie dwóch kategorii pakietów w jedną „Pakiety" (site_blobs.cennik).
 *
 * Przed: „Pakiety całego auta (IN+OUT)" (pakiety-in-out) + „Pakiety —
 * przygotowanie do sprzedaży" (pakiety-sprzedaz).
 * Po:    jedna kategoria „Pakiety" (pakiety) z czterema pozycjami.
 *
 * Użycie:  node scripts/merge-pakiety.mjs
 * Idempotentne — po scaleniu kolejne uruchomienie nic nie zmienia.
 * Żadna pozycja cennika nie jest kasowana, zmienia się tylko przypisanie
 * do kategorii i kolejność.
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

const OLD_IDS = ["pakiety-in-out", "pakiety-sprzedaz"];
const NEW_CATEGORY = {
  id: "pakiety",
  name: "Pakiety",
  description:
    "Całe auto w jednej wizycie oraz przygotowanie pod sprzedaż, ze zdjęciami do ogłoszenia.",
  priceFrom: 200,
  timeLabel: "3 h – 2 dni",
  highlight:
    "Detailing kompletny IN+OUT — 650 zł, czyli 100 zł taniej niż suma składowych",
  order: 0,
  disabled: false,
};

/** Kolejność pozycji w scalonej kategorii: najpierw IN+OUT, potem sprzedażowe. */
const ITEM_ORDER = [
  "odswiezenie-in-out",
  "detailing-kompletny-in-out",
  "przygotowanie-do-sprzedazy",
  "przygotowanie-do-sprzedazy-pro",
];

try {
  const rows = await sql`select data from site_blobs where key = 'cennik' limit 1`;
  if (!rows[0]) {
    console.log("• site_blobs.cennik nie istnieje — strona użyje DEFAULT_CENNIK.");
    process.exit(0);
  }

  const cennik =
    typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;

  const hasOld = (cennik.categories ?? []).some((c) => OLD_IDS.includes(c.id));
  if (!hasOld && (cennik.categories ?? []).some((c) => c.id === NEW_CATEGORY.id)) {
    console.log("• Kategorie już scalone — bez zmian.");
    process.exit(0);
  }

  // Kategorie: usuwamy stare pakietowe, wstawiamy jedną „Pakiety" na początku.
  const rest = (cennik.categories ?? []).filter(
    (c) => !OLD_IDS.includes(c.id) && c.id !== NEW_CATEGORY.id,
  );
  cennik.categories = [
    NEW_CATEGORY,
    ...rest.map((c, index) => ({ ...c, order: index + 1 })),
  ];

  // Pozycje: przepinamy na nową kategorię i ustawiamy kolejność.
  let moved = 0;
  for (const item of cennik.items ?? []) {
    if (!OLD_IDS.includes(item.categoryId) && item.categoryId !== NEW_CATEGORY.id) {
      continue;
    }
    item.categoryId = NEW_CATEGORY.id;
    const index = ITEM_ORDER.indexOf(item.id);
    item.order = index === -1 ? ITEM_ORDER.length : index;
    moved += 1;
  }

  await sql`
    update site_blobs
    set data = ${JSON.stringify(cennik)}::jsonb, updated_at = now()
    where key = 'cennik'
  `;

  console.log(`✓ Scalono pakiety w jedną kategorię „Pakiety" (${moved} pozycji).`);
  console.log(
    "Kategorie:",
    cennik.categories.map((c) => c.name).join(" · "),
  );
} finally {
  await sql.end();
}
