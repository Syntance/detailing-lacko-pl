import { z } from "zod";
import { formatItemPrice, type CennikData } from "./cennik";

/**
 * Rezerwacje online + konfiguracja dostępności.
 *
 * Model: właściciel definiuje w panelu okna godzinowe per dzień tygodnia,
 * długość slotu, wyprzedzenie, horyzont i dzienny limit pracy. Klient wybiera
 * datę → usługi z cennika (multi-select) → dostępną godzinę → zostawia dane.
 * Czas realizacji sumuje się z `durationMinutes` pozycji cennika; praca, która
 * nie mieści się do końca dnia (albo w dziennym limicie), przelewa się na
 * kolejne dni robocze — klient od razu widzi, kiedy odbierze auto.
 * Rezerwacja trafia jako „nowa" do panelu Magazyn, gdzie właściciel ją
 * potwierdza lub odrzuca (odrzucenie zwalnia zajętość).
 *
 * Ten plik jest czysty (bez `server-only`) — planowanie liczy się po stronie
 * serwera (walidacja POST), ale funkcje są czyste i testowalne.
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
  /** Siatka godzin startu w minutach (co ile proponujemy początek wizyty). */
  slotMinutes: z.number().int().min(15).max(600),
  /** Minimalne wyprzedzenie rezerwacji w godzinach. */
  leadHours: z.number().int().min(0).max(240),
  /** Ile dni w przód można rezerwować. */
  horizonDays: z.number().int().min(1).max(180),
  /**
   * Dzienny limit przyjmowanej pracy w MINUTACH (0 = bez limitu, liczy się
   * samo okno godzin). Gdy suma prac danego dnia dobije do limitu, reszta
   * roboty przelewa się na następny dzień roboczy — a nowe starty tego dnia
   * znikają z widgetu.
   */
  maxDailyMinutes: z.number().int().min(0).max(1440).default(0),
  /** 7 okien — po jednym na każdy dzień tygodnia. */
  weekly: z.array(dayWindowSchema).length(7),
  /** Wyłączone daty (urlop, święta) — "YYYY-MM-DD". */
  blockedDates: z.array(z.string().regex(DATE)),
  /**
   * @deprecated Lista tekstowa usług sprzed multi-selecta z cennika. Widget
   * bierze usługi z panelu Magazyn → Cennik (`durationMinutes` per pozycja);
   * pole zostaje w schemacie, żeby stare blob-y w bazie dalej się parsowały.
   */
  services: z.array(z.string().min(1)).default([]),
});

export type DayWindow = z.infer<typeof dayWindowSchema>;
export type DostepnoscData = z.infer<typeof dostepnoscSchema>;

export const REZERWACJA_STATUSY = [
  "nowa",
  "potwierdzona",
  "odrzucona",
] as const;
export type RezerwacjaStatus = (typeof REZERWACJA_STATUSY)[number];

export const REZERWACJA_STATUS_LABEL: Record<RezerwacjaStatus, string> = {
  nowa: "Nowa",
  potwierdzona: "Potwierdzona",
  odrzucona: "Odrzucona",
};

/** Migawka pozycji cennika w chwili rezerwacji (cennik może się zmienić). */
export type RezerwacjaUsluga = {
  id: string;
  name: string;
  priceLabel: string;
  durationMinutes: number;
};

export type Rezerwacja = {
  id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  /** Czytelna lista usług (nazwy po przecinku) — stare wiersze mają tu tekst z selecta. */
  service: string;
  /** Migawki wybranych pozycji cennika; stare wiersze: []. */
  services: RezerwacjaUsluga[];
  /** Łączny czas pracy w minutach; stare wiersze: 0. */
  durationMinutes: number;
  /** Wyliczony moment odbioru auta (stare wiersze: puste). */
  pickupDate: string;
  pickupTime: string;
  note: string;
  status: RezerwacjaStatus;
  createdAt: string;
  /** Id wydarzenia w Kalendarzu Google (puste, gdy sync wyłączony). */
  calendarEventId: string;
};

/** Dane wysyłane przez klienta przy rezerwacji (POST /api/rezerwacje). */
export const rezerwacjaInputSchema = z.object({
  date: z.string().regex(DATE),
  time: z.string().regex(TIME),
  /** Id pozycji z cennika — serwer sam liczy czas i ceny (nigdy z klienta). */
  serviceIds: z.array(z.string().min(1).max(80)).min(1).max(20),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().or(z.literal("")),
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
    (day) =>
      weekly.find((w) => w.day === day) ?? {
        day,
        enabled: false,
        from: "09:00",
        to: "17:00",
      },
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

/* --------------------------- Usługi z cennika --------------------------- */

/** Pozycja cennika w widgecie rezerwacji (odchudzona do potrzeb klienta). */
export type RezerwacjaPozycja = {
  id: string;
  name: string;
  priceLabel: string;
  /** Do sumy „razem od X zł" (0 przy ukrytej cenie). */
  priceFrom: number;
  durationMinutes: number;
  popular: boolean;
  /**
   * Składowe pakietu — widget na ich podstawie blokuje dobieranie usług już
   * zawartych w cenie. Same id, bez nazw: nazwy widget ma w swojej liście.
   */
  includedItemIds?: string[];
};

export type RezerwacjaKategoria = {
  id: string;
  name: string;
  pozycje: RezerwacjaPozycja[];
};

/** Cennik → grupy do multi-selecta w widgecie (bez opisów — lżejszy payload). */
export function buildRezerwacjaCennik(
  cennik: CennikData,
): RezerwacjaKategoria[] {
  const categories = cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order);
  return categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      pozycje: cennik.items
        .filter((i) => !i.disabled && i.categoryId === c.id)
        .sort((a, b) => a.order - b.order)
        .map((i) => ({
          id: i.id,
          name: i.name.replace(/^•\s*/, ""),
          priceLabel: formatItemPrice(i),
          priceFrom: i.priceHidden ? 0 : i.priceFrom,
          durationMinutes: i.durationMinutes,
          popular: i.popular,
          includedItemIds: i.includedItemIds,
        })),
    }))
    .filter((c) => c.pozycje.length > 0);
}

/**
 * Id z formularza → migawki usług + łączny czas. Null, gdy którekolwiek id
 * nie istnieje albo jest wyłączone (klient majstrował przy payloadzie).
 */
export function resolveUslugi(
  cennik: CennikData,
  serviceIds: string[],
): { services: RezerwacjaUsluga[]; durationMinutes: number } | null {
  const unique = [...new Set(serviceIds)];
  const services: RezerwacjaUsluga[] = [];
  for (const id of unique) {
    const item = cennik.items.find((i) => i.id === id && !i.disabled);
    if (!item) return null;
    services.push({
      id: item.id,
      name: item.name.replace(/^•\s*/, ""),
      priceLabel: formatItemPrice(item),
      durationMinutes: item.durationMinutes,
    });
  }
  return {
    services,
    durationMinutes: services.reduce((sum, s) => sum + s.durationMinutes, 0),
  };
}

/* ------------------------------- Harmonogram ------------------------------- */

/**
 * Praca do rozplanowania — istniejąca rezerwacja widziana przez scheduler.
 * `durationMinutes` 0 (stare wiersze sprzed multi-selecta) = jeden slot.
 */
export type PracaRezerwacji = {
  date: string;
  time: string;
  durationMinutes: number;
};

/** Zajęty przedział minut w dobie [from, to). */
type Przedzial = { from: number; to: number };

type PlanDnia = { przedzialy: Przedzial[]; used: number };

/** Zajętość dni: data → posortowane przedziały + suma minut pracy. */
export type Obciazenie = Map<string, PlanDnia>;

/** Wynik rozplanowania jednej pracy. */
export type PlanPracy = {
  segmenty: { date: string; from: number; to: number }[];
  /** Moment zakończenia (odbiór auta). */
  koniecDate: string;
  koniecMinute: number;
};

/** Bezpiecznik pętli po dniach — chroni przed configiem bez dni roboczych. */
const MAX_DNI_PLANOWANIA = 120;

/** Okno pracy dla konkretnej daty albo null (dzień wolny / zablokowany). */
function dayWindow(
  config: DostepnoscData,
  dateStr: string,
): { from: number; to: number } | null {
  if (config.blockedDates.includes(dateStr)) return null;
  const window = config.weekly.find((w) => w.day === weekdayOf(dateStr));
  if (!window || !window.enabled) return null;
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  return to > from ? { from, to } : null;
}

/** Pojemność dnia w minutach: okno przycięte dziennym limitem (0 = bez limitu). */
function dayCapacity(
  config: DostepnoscData,
  window: { from: number; to: number },
): number {
  const windowLen = window.to - window.from;
  return config.maxDailyMinutes > 0
    ? Math.min(windowLen, config.maxDailyMinutes)
    : windowLen;
}

/** Wolne dziury w oknie [startFrom, to) omijające zajęte przedziały. */
function freeGaps(
  przedzialy: Przedzial[],
  startFrom: number,
  to: number,
): Przedzial[] {
  const gaps: Przedzial[] = [];
  let cursor = startFrom;
  for (const p of przedzialy) {
    if (p.to <= cursor) continue;
    if (p.from >= to) break;
    if (p.from > cursor) gaps.push({ from: cursor, to: Math.min(p.from, to) });
    cursor = Math.max(cursor, p.to);
    if (cursor >= to) break;
  }
  if (cursor < to) gaps.push({ from: cursor, to });
  return gaps;
}

function planDnia(occupancy: Obciazenie, dateStr: string): PlanDnia {
  return occupancy.get(dateStr) ?? { przedzialy: [], used: 0 };
}

/** Czy minuta startu leży w zajętym przedziale. */
function minuteTaken(przedzialy: Przedzial[], minute: number): boolean {
  return przedzialy.some((p) => minute >= p.from && minute < p.to);
}

/**
 * Rozplanowanie pracy o długości `duration` od (startDate, startMinute).
 * Praca wypełnia wolne dziury dnia chronologicznie (auto stoi u nas, robota
 * może chwilę poczekać między innymi autami), z poszanowaniem dziennego
 * limitu; reszta przelewa się na kolejne dni robocze od początku okna.
 * Zwraca null, gdy start jest zajęty albo pracy nie da się domknąć
 * w MAX_DNI_PLANOWANIA.
 */
export function planPracy(
  config: DostepnoscData,
  occupancy: Obciazenie,
  startDate: string,
  startMinute: number,
  duration: number,
): PlanPracy | null {
  const startWindow = dayWindow(config, startDate);
  if (!startWindow) return null;
  if (startMinute < startWindow.from || startMinute >= startWindow.to)
    return null;

  const startDay = planDnia(occupancy, startDate);
  if (minuteTaken(startDay.przedzialy, startMinute)) return null;
  if (dayCapacity(config, startWindow) - startDay.used <= 0) return null;

  const segmenty: PlanPracy["segmenty"] = [];
  let remaining = Math.max(1, duration);
  let cursorDate = startDate;
  let first = true;

  for (let i = 0; i < MAX_DNI_PLANOWANIA && remaining > 0; i++) {
    const window = dayWindow(config, cursorDate);
    if (window) {
      const day = planDnia(occupancy, cursorDate);
      let capLeft = dayCapacity(config, window) - day.used;
      const startFrom = first ? startMinute : window.from;
      if (capLeft > 0) {
        for (const gap of freeGaps(day.przedzialy, startFrom, window.to)) {
          if (remaining <= 0 || capLeft <= 0) break;
          const take = Math.min(gap.to - gap.from, capLeft, remaining);
          if (take <= 0) continue;
          segmenty.push({
            date: cursorDate,
            from: gap.from,
            to: gap.from + take,
          });
          remaining -= take;
          capLeft -= take;
        }
      }
    }
    if (remaining > 0) {
      cursorDate = addDays(cursorDate, 1);
      first = false;
    }
  }

  const last = segmenty.at(-1);
  if (remaining > 0 || !last) return null;
  return { segmenty, koniecDate: last.date, koniecMinute: last.to };
}

/** Nanosi segmenty pracy na zajętość (scala przedziały, dolicza minuty). */
function applyPlan(occupancy: Obciazenie, plan: PlanPracy): void {
  for (const seg of plan.segmenty) {
    const day = planDnia(occupancy, seg.date);
    const przedzialy = [...day.przedzialy, { from: seg.from, to: seg.to }].sort(
      (a, b) => a.from - b.from,
    );
    // Scalanie nachodzących przedziałów — utrzymuje listę posortowaną i rozłączną.
    const merged: Przedzial[] = [];
    for (const p of przedzialy) {
      const prev = merged[merged.length - 1];
      if (prev && p.from <= prev.to) prev.to = Math.max(prev.to, p.to);
      else merged.push({ ...p });
    }
    occupancy.set(seg.date, {
      przedzialy: merged,
      used: day.used + (seg.to - seg.from),
    });
  }
}

/**
 * Zajętość zbudowana z aktywnych rezerwacji (chronologicznie — wcześniejsze
 * prace zajmują wcześniejsze dziury). Rezerwacja bez czasu (stare wiersze)
 * blokuje jeden slot. Gdy config się zmienił i praca nie daje się rozplanować
 * (np. dzień został wyłączony), blokujemy naiwnie jej przedział startowy —
 * slot nie może wrócić do sprzedaży tylko dlatego, że zmieniły się godziny.
 */
export function buildObciazenie(
  config: DostepnoscData,
  prace: PracaRezerwacji[],
): Obciazenie {
  const occupancy: Obciazenie = new Map();
  const sorted = [...prace].sort((a, b) =>
    a.date === b.date
      ? toMinutes(a.time) - toMinutes(b.time)
      : a.date < b.date
        ? -1
        : 1,
  );
  for (const praca of sorted) {
    const duration =
      praca.durationMinutes > 0 ? praca.durationMinutes : config.slotMinutes;
    const start = toMinutes(praca.time);
    const plan = planPracy(config, occupancy, praca.date, start, duration);
    if (plan) {
      applyPlan(occupancy, plan);
    } else {
      applyPlan(occupancy, {
        segmenty: [
          {
            date: praca.date,
            from: start,
            to: Math.min(start + duration, 1440),
          },
        ],
        koniecDate: praca.date,
        koniecMinute: Math.min(start + duration, 1440),
      });
    }
  }
  return occupancy;
}

/** Propozycja startu z widgetu: godzina + wyliczony moment odbioru. */
export type SlotPropozycja = {
  time: string;
  pickupDate: string;
  pickupTime: string;
  /** Odbiór tego samego dnia (false = auto zostaje na noc). */
  sameDay: boolean;
};

/**
 * Dostępne godziny startu dla daty i łącznego czasu usług: siatka slotów
 * w oknie dnia − starty zajęte/poza limitem − sloty przeszłe (wyprzedzenie)
 * − daty poza horyzontem / zablokowane. Każda propozycja niesie wyliczony
 * moment odbioru (praca może przelać się na kolejne dni robocze).
 */
export function computeSlots(
  config: DostepnoscData,
  dateStr: string,
  durationMinutes: number,
  prace: PracaRezerwacji[],
  now: Date = new Date(),
): SlotPropozycja[] {
  if (!config.enabled) return [];
  if (!DATE.test(dateStr)) return [];

  const window = dayWindow(config, dateStr);
  if (!window) return [];

  const { dateStr: todayStr, minutes: nowMin } = warsawNow(now);
  if (dateStr < todayStr) return [];
  if (dateStr > addDays(todayStr, config.horizonDays)) return [];

  // Wyprzedzenie liczone w minutach absolutnych od „teraz" — inaczej leadHours
  // działałby tylko w obrębie bieżącej doby (o 20:00 przy leadHours=12 dało się
  // zarezerwować jutrzejsze 07:00, czyli 9h naprzód).
  const MS_PER_DAY = 86_400_000;
  const dayOffset = Math.round(
    (Date.parse(`${dateStr}T12:00:00Z`) - Date.parse(`${todayStr}T12:00:00Z`)) /
      MS_PER_DAY,
  );
  const cutoff = nowMin + config.leadHours * 60;

  const occupancy = buildObciazenie(config, prace);
  const duration = durationMinutes > 0 ? durationMinutes : config.slotMinutes;

  const slots: SlotPropozycja[] = [];
  for (
    let m = window.from;
    m + config.slotMinutes <= window.to;
    m += config.slotMinutes
  ) {
    if (dayOffset * 1440 + m < cutoff) continue;
    const plan = planPracy(config, occupancy, dateStr, m, duration);
    if (!plan) continue;
    slots.push({
      time: fromMinutes(m),
      pickupDate: plan.koniecDate,
      pickupTime: fromMinutes(plan.koniecMinute),
      sameDay: plan.koniecDate === dateStr,
    });
  }
  return slots;
}

/** Domyślna konfiguracja — popołudnia w tygodniu, weekendy szerzej (jak hoursNote). */
export const DEFAULT_DOSTEPNOSC: DostepnoscData = {
  enabled: true,
  heading: "Zarezerwuj termin online",
  note: "Zaznacz usługi, wybierz dzień i godzinę — potwierdzę rezerwację telefonicznie. To wstępna rezerwacja, nie płatność.",
  slotMinutes: 60,
  leadHours: 12,
  horizonDays: 30,
  maxDailyMinutes: 0,
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
  services: [],
};
