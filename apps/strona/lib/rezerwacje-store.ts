import "server-only";

import { getPostgresClient } from "./db";
import { readBlob, writeBlob } from "./blobs";
import {
  dostepnoscSchema,
  DEFAULT_DOSTEPNOSC,
  type DostepnoscData,
  type PracaRezerwacji,
  type Rezerwacja,
  type RezerwacjaStatus,
  type RezerwacjaUsluga,
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
  services: unknown;
  duration_minutes: number;
  pickup_date: string | null;
  pickup_time: string | null;
  note: string;
  status: string;
  created_at: string;
};

function parseServices(raw: unknown): RezerwacjaUsluga[] {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is RezerwacjaUsluga =>
      Boolean(s) && typeof s.id === "string" && typeof s.name === "string",
  );
}

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
    services: parseServices(row.services),
    durationMinutes: row.duration_minutes ?? 0,
    pickupDate: row.pickup_date ? String(row.pickup_date).slice(0, 10) : "",
    pickupTime: row.pickup_time ?? "",
    note: row.note,
    status: (row.status as RezerwacjaStatus) ?? "nowa",
    createdAt: row.created_at,
  };
}

/**
 * Aktywne prace do zbudowania zajętości. Zakres od `fromDate` MINUS 14 dni —
 * praca sprzed paru dni (np. korekta dwuetapowa) może wciąż zajmować dzisiejsze
 * godziny przez przelanie na kolejne dni.
 */
export async function listPraceAktywne(fromDate: string): Promise<PracaRezerwacji[]> {
  if (!hasDb()) return [];
  const { sql } = getPostgresClient();
  const rows = await sql<{ date: string; time: string; duration_minutes: number }[]>`
    select date::text as date, time, duration_minutes
    from reservations
    where status <> 'odrzucona' and date >= (${fromDate}::date - interval '14 days')
  `;
  return rows.map((r) => ({
    date: r.date.slice(0, 10),
    time: r.time,
    durationMinutes: r.duration_minutes ?? 0,
  }));
}

/** Dane zapisu rezerwacji — policzona przez serwer migawka usług i odbiór. */
export type NowaRezerwacja = {
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  services: RezerwacjaUsluga[];
  durationMinutes: number;
  pickupDate: string;
  pickupTime: string;
};

/**
 * Tworzy rezerwację (status `nowa`). Anty-dubel: unikalny indeks na aktywny
 * slot → przy kolizji zwracamy `taken`, nie rzucamy 500. Kolizje nakładających
 * się przedziałów (inny start, wspólne minuty) łapie walidacja slotu w POST;
 * wyścig dwóch takich zapisów rozstrzyga właściciel przy telefonicznym
 * potwierdzaniu — stąd status „wstępna".
 */
export async function createRezerwacja(
  input: NowaRezerwacja,
): Promise<{ ok: true } | { ok: false; reason: "taken" }> {
  const { sql } = getPostgresClient();
  const serviceText = input.services.map((s) => s.name).join(", ");
  try {
    await sql`
      insert into reservations (
        date, time, name, phone, email, service, services,
        duration_minutes, pickup_date, pickup_time, note, status
      )
      values (
        ${input.date}, ${input.time}, ${input.name}, ${input.phone},
        ${input.email}, ${serviceText}, ${JSON.stringify(input.services)}::jsonb,
        ${input.durationMinutes}, ${input.pickupDate}, ${input.pickupTime},
        ${input.note}, 'nowa'
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
    select id, date::text as date, time, name, phone, email, service, services,
           duration_minutes, pickup_date::text as pickup_date, pickup_time,
           note, status, created_at
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
