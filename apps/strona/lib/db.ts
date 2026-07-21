import "server-only";

import {
  createPostgresClient,
  PostgresStore,
  type PostgresClient,
} from "@moduly/data-store";
import type { DataStore } from "@moduly/types";

let client: PostgresClient | null = null;

/**
 * Preferujemy połączenie BEZPOŚREDNIE (unpooled). Sterownik postgres.js używa
 * prepared statements, które psują się na poolerze Neona (PgBouncer) pod
 * współbieżnością. Integracja Neon na Vercelu wstrzykuje oba: `DATABASE_URL`
 * (pooled) i `DATABASE_URL_UNPOOLED` (direct) — bierzemy direct.
 */
function resolveDatabaseUrl(databaseUrl?: string): string {
  const url =
    databaseUrl ??
    process.env.DATABASE_URL_UNPOOLED?.trim() ??
    process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "[detailing-lacko] Brak DATABASE_URL — ustaw zmienną w .env.local.",
    );
  }
  return url;
}

/** Tworzy klienta Postgres (singleton w ramach procesu Node). */
export function getPostgresClient(databaseUrl?: string): PostgresClient {
  if (!client) {
    client = createPostgresClient(resolveDatabaseUrl(databaseUrl));
  }
  return client;
}

/** Fabryka `PostgresStore` — implementacja `DataStore` dla CMS i formularzy. */
export function createPostgresStore(databaseUrl?: string): DataStore {
  return new PostgresStore(getPostgresClient(databaseUrl));
}
