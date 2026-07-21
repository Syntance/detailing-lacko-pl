/**
 * Migracje + seed admina panelu Magazyn.
 *
 * Użycie:
 *   node scripts/migrate.mjs                 # aplikuje schemat (idempotentne)
 *   MAGAZYN_ADMIN_EMAIL=... MAGAZYN_ADMIN_PASSWORD=... node scripts/migrate.mjs
 *
 * DATABASE_URL czytane z env albo z .env.local obok package.json.
 * Wszystkie migracje używają IF NOT EXISTS — bezpieczne wielokrotne uruchomienie.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import argon2 from "argon2";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(appDir, "..", "..");

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

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("Brak DATABASE_URL (env albo apps/strona/.env.local).");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 15 });

const dataStoreMigrationsDir = join(
  repoRoot,
  "packages",
  "data-store",
  "src",
  "postgres",
  "migrations",
);
const appMigrationsDir = join(appDir, "drizzle");

function sqlFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, content: readFileSync(join(dir, f), "utf8") }));
}

try {
  const migrations = [
    ...sqlFiles(dataStoreMigrationsDir),
    ...sqlFiles(appMigrationsDir),
  ];
  for (const migration of migrations) {
    process.stdout.write(`→ ${migration.name} … `);
    await sql.unsafe(migration.content);
    console.log("OK");
  }

  // Seed treści CMS strony głównej (copy z briefu) — tylko gdy brak wiersza,
  // żeby nie nadpisać edycji z panelu.
  const homeContent = {
    hero: {
      headline: "Detailing Łącko — pranie tapicerki i polerowanie lakieru",
      subtitle: "",
      description:
        "Fotele jak nowe od 300 zł. Lakier bez rys od 600 zł. Przyjmuję na miejscu w Łącku — zapraszam z okolicy: Stary Sącz, Podegrodzie, Nowy Sącz.",
      ctaLabel: "Zadzwoń",
      ctaHref: "#kontakt",
      desktopImageUrl: "/images/hero.jpg",
    },
    faq: [
      {
        id: "schniecie",
        question: "Ile schnie tapicerka po praniu?",
        answer:
          "4–8 godzin latem, do 24h zimą. Auto oddaję wilgotne, ale używalne — najlepiej prać rano.",
        order: 0,
      },
      {
        id: "plamy",
        question: "Czy usuniesz każdą plamę?",
        answer:
          "Większość tak. Po starych plamach z barwników (kawa z mlekiem sprzed roku, farba) mogą zostać ślady — powiem uczciwie przed praniem.",
        order: 1,
      },
      {
        id: "rysy",
        question: "Polerowanie usunie wszystkie rysy?",
        answer:
          "One step usuwa 50–70% rys. Głębokie rysy (paznokieć się zahacza) wymagają korekty dwuetapowej (od 1200 zł, wycena po oględzinach) albo lakiernika — ocenimy na miejscu.",
        order: 2,
      },
      {
        id: "czas",
        question: "Ile to trwa?",
        answer: "Wnętrze 3–5h, mycie z woskiem 2–3h, polerowanie cały dzień.",
        order: 3,
      },
      {
        id: "dojazd",
        question: "Przyjeżdżasz do klienta?",
        answer:
          "Na razie nie — pracuję tylko stacjonarnie w Czerńcu 72. Trzeba przyjechać do mnie. Do prania tapicerki potrzebuję dostępu do prądu, więc i tak działam u siebie.",
        order: 4,
      },
      { id: "faktura", question: "Faktura?", answer: "Tak.", order: 5 },
    ],
    gallery: [],
  };
  const inserted = await sql`
    insert into page_content (page_id, content)
    values ('home', ${sql.json(homeContent)})
    on conflict (page_id) do nothing
    returning page_id
  `;
  console.log(
    inserted.length
      ? "→ treść CMS 'home' — zasiana copy z briefu"
      : "→ treść CMS 'home' — istnieje, bez zmian",
  );

  const email = process.env.MAGAZYN_ADMIN_EMAIL?.trim();
  const password = process.env.MAGAZYN_ADMIN_PASSWORD;
  if (email && password) {
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    await sql`
      insert into admin_users (email, password_hash)
      values (${email.toLowerCase()}, ${hash})
      on conflict (email) do update
        set password_hash = excluded.password_hash, updated_at = now()
    `;
    console.log(`→ admin ${email.toLowerCase()} — utworzony/zaktualizowany`);
  } else {
    console.log(
      "→ pominięto seed admina (ustaw MAGAZYN_ADMIN_EMAIL i MAGAZYN_ADMIN_PASSWORD)",
    );
  }

  console.log("Migracje zakończone.");
} finally {
  await sql.end();
}
