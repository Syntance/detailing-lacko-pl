import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type PostgresClient = ReturnType<typeof createPostgresClient>;

/**
 * Tworzy klienta Drizzle z połączenia `DATABASE_URL`.
 *
 * Pooler Neona (host z `-pooler`, PgBouncer w trybie transakcji) nie obsługuje
 * prepared statements, więc wyłączamy je dla takiego adresu. Na serverless
 * pooler jest konieczny — bezpośrednie połączenia (każda instancja po `max`)
 * wyczerpywały limit bazy i odczyty kończyły się błędem 53300.
 */
export function createPostgresClient(databaseUrl: string) {
	const przezPooler = /-pooler\./.test(databaseUrl);
	const sql = postgres(databaseUrl, {
		max: przezPooler ? 10 : 3,
		idle_timeout: 20,
		connect_timeout: 10,
		prepare: !przezPooler,
	});
	const db = drizzle(sql, { schema });
	return { db, sql, schema };
}
