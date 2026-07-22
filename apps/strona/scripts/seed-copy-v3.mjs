/**
 * Copy v3 — treści trzymane w bazie (nadpisują wartości z kodu).
 *
 * Aktualizuje:
 *  - site_blobs.cennik → settings (nagłówek „Cennik", krótszy wstęp i notka)
 *  - site_blobs.seo    → title + description spójne z nowym hero
 *
 * Reszta copy (hero, proces, wyróżniki, kontakt, galeria) żyje w kodzie
 * i nie wymaga zapisu do bazy.
 *
 * Użycie:  node scripts/seed-copy-v3.mjs
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

const CENNIK_SETTINGS_V3 = {
  heading: "Cennik",
  subheading:
    "Te ceny obowiązują — widełki tylko tam, gdzie liczy się rozmiar auta.",
  noteText:
    "Kupujący zbije cenę o brudne wnętrze mocniej, niż kosztuje jego wyczyszczenie. Handlarze i komisy: od 2 aut miesięcznie stała stawka ok. 400 zł/auto.",
};

const SEO_V3 = {
  title: "Detailing Łącko — pranie tapicerki, polerowanie | ceny z góry",
  description:
    "Pranie tapicerki od 300 zł, kompleksowe wnętrze 500 zł — pełny cennik na stronie, płacisz po obejrzeniu efektu. Czerniec 72, gmina Łącko.",
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
      settings: { ...cennik.settings, ...CENNIK_SETTINGS_V3 },
    }),
    'nagłówek „Cennik", krótszy wstęp i notka sprzedażowa',
  );

  await patchBlob(
    "seo",
    (seo) => ({ ...seo, ...SEO_V3 }),
    "title + description spójne z nowym hero",
  );

  console.log("Gotowe.");
} finally {
  await sql.end();
}
