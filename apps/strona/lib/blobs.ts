import "server-only";

import type { z } from "zod";
import { getPostgresClient } from "./db";

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Generyczny magazyn JSON-ów witryny (tabela `site_blobs`, klucz → jsonb).
 * Wzorzec jak `siteSettings` w @moduly/data-store: jeden wiersz na zasób,
 * zapis atomowy (upsert). Brak DATABASE_URL (build, świeży projekt) →
 * czytamy wartości domyślne z kodu.
 */
export async function readBlob<S extends z.ZodTypeAny>(
  key: string,
  schema: S,
  fallback: z.infer<S>,
): Promise<z.infer<S>> {
  if (!hasDb()) return fallback;
  try {
    const { sql } = getPostgresClient();
    const rows = await sql<{ data: unknown }[]>`
      select data from site_blobs where key = ${key} limit 1
    `;
    const row = rows[0];
    if (!row) return fallback;
    // Wiersze zapisane starym writeBlob są podwójnie zakodowane (jsonb trzyma
    // STRING z JSON-em, nie obiekt) — sterownik zwraca wtedy stringa. Rozpakowanie
    // tutaj sprawia, że stare wiersze działają bez migracji; pierwszy zapis
    // z panelu naprawia je na stałe.
    const raw = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      // Cichy fallback ukrywał tę awarię tygodniami: panel zapisywał, a strona
      // renderowała wartości z kodu. Walidacja musi krzyczeć.
      console.error(
        `[site_blobs] Blob "${key}" nie przeszedł walidacji — strona użyje wartości domyślnych:`,
        parsed.error.issues.slice(0, 5),
      );
      return fallback;
    }
    return parsed.data;
  } catch (error) {
    console.error(`[site_blobs] Odczyt "${key}" nie powiódł się:`, error);
    return fallback;
  }
}

export async function writeBlob(key: string, data: unknown): Promise<void> {
  const { sql } = getPostgresClient();
  // Podwójne rzutowanie ::text::jsonb jest konieczne. Przy samym ${json}::jsonb
  // postgres.js wnioskuje typ parametru z rzutowania, uznaje go za jsonb
  // i SAM serializuje wartość — a że `json` jest już stringiem, w bazie lądował
  // jsonb typu "string" (JSON w stringu) zamiast obiektu. Wymuszenie ::text
  // wysyła parametr jako tekst, a dopiero Postgres parsuje go do jsonb.
  // (sql.json() odpada — rzuca ERR_INVALID_ARG_TYPE w route handlerze pod Turbopackiem.)
  const json = JSON.stringify(data);
  await sql`
    insert into site_blobs (key, data, updated_at)
    values (${key}, ${json}::text::jsonb, now())
    on conflict (key) do update
      set data = excluded.data, updated_at = now()
  `;
}
