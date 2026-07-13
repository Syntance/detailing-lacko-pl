import "server-only";

import { getPostgresClient } from "./db";
import { readBlob, writeBlob } from "./blobs";
import {
  dostepnoscSchema,
  DEFAULT_DOSTEPNOSC,
  type DostepnoscData,
  type Rezerwacja,
  type RezerwacjaInput,
  type RezerwacjaStatus,
} from "./rezerwacje";

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/* ---------- Konfiguracja dostępności (site_blobs, klucz `dostepnosc`) ---------- */

export async function getDostepnosc(): Promise<DostepnoscData> {
  return readBlob("dostepnosc", dostepnoscSchema, DEFAULT_DOSTEPNOSC);
}

export async function saveDostepnosc(data: DostepnoscData): Promise<void> {
  await writeBlob("dostepnosc", data);
}

/* ---------- Rezerwacje (tabela reservations) ---------- */

type ReservationRow = {
  id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  note: string;
  status: string;
  created_at: string;
};

function mapRow(row: ReservationRow): Rezerwacja {
  return {
    id: row.id,
    // node-postgres zwraca DATE jako string "YYYY-MM-DD" (mode string w driverze)
    date: typeof row.date === "string" ? row.date.slice(0, 10) : row.date,
    time: row.time,
    name: row.name,
    phone: row.phone,
    email: row.email,
    service: row.service,
    note: row.note,
    status: (row.status as RezerwacjaStatus) ?? "nowa",
    createdAt: row.created_at,
  };
}

/** Godziny zajęte (nowa/potwierdzona) dla danej daty — do wyliczenia slotów. */
export async function getTakenSlots(dateStr: string): Promise<string[]> {
  if (!hasDb()) return [];
  const { sql } = getPostgresClient();
  const rows = await sql<{ time: string }[]>`
    select time from reservations
    where date = ${dateStr} and status <> 'odrzucona'
  `;
  return rows.map((r) => r.time);
}

/**
 * Tworzy rezerwację (status `nowa`). Anty-dubel: unikalny indeks na aktywny
 * slot → przy kolizji zwracamy `taken`, nie rzucamy 500.
 */
export async function createRezerwacja(
  input: RezerwacjaInput,
): Promise<{ ok: true } | { ok: false; reason: "taken" }> {
  const { sql } = getPostgresClient();
  try {
    await sql`
      insert into reservations (date, time, name, phone, email, service, note, status)
      values (
        ${input.date}, ${input.time}, ${input.name}, ${input.phone},
        ${input.email}, ${input.service}, ${input.note}, 'nowa'
      )
    `;
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return { ok: false, reason: "taken" };
    throw error;
  }
}

export async function listRezerwacje(): Promise<Rezerwacja[]> {
  if (!hasDb()) return [];
  const { sql } = getPostgresClient();
  const rows = await sql<ReservationRow[]>`
    select id, date::text as date, time, name, phone, email, service, note, status, created_at
    from reservations
    order by
      case status when 'nowa' then 0 when 'potwierdzona' then 1 else 2 end,
      date asc, time asc
  `;
  return rows.map(mapRow);
}

export async function updateRezerwacjaStatus(
  id: string,
  status: RezerwacjaStatus,
): Promise<void> {
  const { sql } = getPostgresClient();
  await sql`update reservations set status = ${status} where id = ${id}`;
}

export async function deleteRezerwacja(id: string): Promise<void> {
  const { sql } = getPostgresClient();
  await sql`delete from reservations where id = ${id}`;
}
