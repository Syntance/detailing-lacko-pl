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
    const parsed = schema.safeParse(row.data);
    return parsed.success ? parsed.data : fallback;
  } catch (error) {
    console.error(`[site_blobs] Odczyt "${key}" nie powiódł się:`, error);
    return fallback;
  }
}

export async function writeBlob(key: string, data: unknown): Promise<void> {
  const { sql } = getPostgresClient();
  await sql`
    insert into site_blobs (key, data, updated_at)
    values (${key}, ${sql.json(data as never)}, now())
    on conflict (key) do update
      set data = excluded.data, updated_at = now()
  `;
}
