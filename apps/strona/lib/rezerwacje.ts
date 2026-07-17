import { z } from "zod";

/**
 * Rezerwacje online + konfiguracja dostępności.
 *
 * Model: właściciel definiuje w panelu okna godzinowe per dzień tygodnia,
 * długość slotu, wyprzedzenie i horyzont. Klient wybiera datę → dostępną
 * godzinę → zostawia dane. Rezerwacja trafia jako „nowa" do panelu Magazyn,
 * gdzie właściciel ją potwierdza lub odrzuca (odrzucenie zwalnia slot).
 *
 * Ten plik jest czysty (bez `server-only`) — `computeSlots` liczy sloty
 * po stronie serwera (walidacja POST) i może być użyty też w testach.
 */

const TIME = /^\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Okno godzinowe dla jednego dnia tygodnia (day: 0=niedziela … 6=sobota, jak JS getDay). */
export const dayWindowSchema = z.object({
  day: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  from: z.string().regex(TIME),
  to: z.string().regex(TIME),
});

export const dostepnoscSchema = z.object({
  /** Rezerwacje online włączone (gdy false — widget pokazuje tylko telefon). */
  enabled: z.boolean(),
  heading: z.string(),
  note: z.string(),
  /** Długość pojedynczego slotu w minutach. */
  slotMinutes: z.number().int().min(15).max(600),
  /** Minimalne wyprzedzenie rezerwacji w godzinach. */
  leadHours: z.number().int().min(0).max(240),
  /** Ile dni w przód można rezerwować. */
  horizonDays: z.number().int().min(1).max(180),
  /** 7 okien — po jednym na każdy dzień tygodnia. */
  weekly: z.array(dayWindowSchema).length(7),
  /** Wyłączone daty (urlop, święta) — "YYYY-MM-DD". */
  blockedDates: z.array(z.string().regex(DATE)),
  /** Lista usług do wyboru w formularzu rezerwacji. */
  services: z.array(z.string().min(1)),
});

export type DayWindow = z.infer<typeof dayWindowSchema>;
export type DostepnoscData = z.infer<typeof dostepnoscSchema>;

export const REZERWACJA_STATUSY = ["nowa", "potwierdzona", "odrzucona"] as const;
export type RezerwacjaStatus = (typeof REZERWACJA_STATUSY)[number];

export const REZERWACJA_STATUS_LABEL: Record<RezerwacjaStatus, string> = {
  nowa: "Nowa",
  potwierdzona: "Potwierdzona",
  odrzucona: "Odrzucona",
};

export type Rezerwacja = {
  id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  note: string;
  status: RezerwacjaStatus;
  createdAt: string;
};

/** Dane wysyłane przez klienta przy rezerwacji (POST /api/rezerwacje). */
export const rezerwacjaInputSchema = z.object({
  date: z.string().regex(DATE),
  time: z.string().regex(TIME),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().or(z.literal("")),
  service: z.string().trim().max(160),
  note: z.string().trim().max(1000),
});

export type RezerwacjaInput = z.infer<typeof rezerwacjaInputSchema>;

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_LABEL: Record<number, string> = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  0: "Niedziela",
};

/** Dni tygodnia w kolejności Pon→Nd (do wyświetlania w panelu). */
export function weeklyInDisplayOrder(weekly: DayWindow[]): DayWindow[] {
  return WEEKDAY_ORDER.map(
    (day) => weekly.find((w) => w.day === day) ?? { day, enabled: false, from: "09:00", to: "17:00" },
  );
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** „Teraz" w strefie Europe/Warsaw jako {dateStr, minutes} — poprawne przy DST. */
function warsawNow(now: Date): { dateStr: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Dzień tygodnia (0=niedziela … 6=sobota) dla daty "YYYY-MM-DD". */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/**
 * Dostępne godziny startu dla danej daty: okno dnia − sloty zajęte − sloty
 * przeszłe (wyprzedzenie) − daty poza horyzontem / zablokowane.
 */
export function computeSlots(
  config: DostepnoscData,
  dateStr: string,
  taken: string[],
  now: Date = new Date(),
): string[] {
  if (!config.enabled) return [];
  if (!DATE.test(dateStr)) return [];
  if (config.blockedDates.includes(dateStr)) return [];

  const window = config.weekly.find((w) => w.day === weekdayOf(dateStr));
  if (!window || !window.enabled) return [];

  const { dateStr: todayStr, minutes: nowMin } = warsawNow(now);
  if (dateStr < todayStr) return [];
  if (dateStr > addDays(todayStr, config.horizonDays)) return [];

  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  const takenSet = new Set(taken);

  // Wyprzedzenie liczone w minutach absolutnych od „teraz" — inaczej leadHours
  // działałby tylko w obrębie bieżącej doby (o 20:00 przy leadHours=12 dało się
  // zarezerwować jutrzejsze 07:00, czyli 9h naprzód).
  const MS_PER_DAY = 86_400_000;
  const dayOffset = Math.round(
    (Date.parse(`${dateStr}T12:00:00Z`) - Date.parse(`${todayStr}T12:00:00Z`)) /
      MS_PER_DAY,
  );
  const cutoff = nowMin + config.leadHours * 60;

  const slots: string[] = [];
  for (let m = from; m + config.slotMinutes <= to; m += config.slotMinutes) {
    const label = fromMinutes(m);
    if (takenSet.has(label)) continue;
    if (dayOffset * 1440 + m < cutoff) continue;
    slots.push(label);
  }
  return slots;
}

/** Domyślna konfiguracja — popołudnia w tygodniu, weekendy szerzej (jak hoursNote). */
export const DEFAULT_DOSTEPNOSC: DostepnoscData = {
  enabled: true,
  heading: "Zarezerwuj termin online",
  note: "Wybierz dzień i godzinę — potwierdzę rezerwację telefonicznie. To wstępna rezerwacja, nie płatność.",
  slotMinutes: 60,
  leadHours: 12,
  horizonDays: 30,
  weekly: [
    { day: 0, enabled: true, from: "09:00", to: "18:00" }, // niedziela
    { day: 1, enabled: true, from: "16:00", to: "20:00" }, // poniedziałek
    { day: 2, enabled: true, from: "16:00", to: "20:00" },
    { day: 3, enabled: true, from: "16:00", to: "20:00" },
    { day: 4, enabled: true, from: "16:00", to: "20:00" },
    { day: 5, enabled: true, from: "16:00", to: "20:00" }, // piątek
    { day: 6, enabled: true, from: "09:00", to: "18:00" }, // sobota
  ],
  blockedDates: [],
  services: [
    "Pranie tapicerki",
    "Kompleksowe czyszczenie wnętrza",
    "Mycie i wosk",
    "Polerowanie lakieru",
    "Nie wiem — doradź",
  ],
};
