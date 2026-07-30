import "server-only";

import { createSign } from "node:crypto";
import type { PracaRezerwacji } from "./rezerwacje";

/**
 * Dwukierunkowa synchronizacja z Kalendarzem Google przez konto serwisowe.
 *
 * Konto serwisowe + kalendarz udostępniony jego adresowi = zero OAuth i zero
 * Workspace (delegacja domenowa jest potrzebna TYLKO do podszywania się pod
 * użytkowników — przy zasobie udostępnionym wprost nie występuje).
 *
 * Kierunek 1 (odczyt): wydarzenia z kalendarza właściciela blokują godziny
 * w widgecie — wpis „wesele 17:00" znika ze strony sam z siebie.
 * Kierunek 2 (zapis): rezerwacja tworzy wydarzenie od przyjęcia auta do
 * odbioru, oznaczone prywatną właściwością `EVENT_TAG`.
 *
 * Czytamy przez events.list, nie freeBusy: freeBusy nie mówi, KTÓRE zajęcie
 * jest nasze, więc własne rezerwacje liczyłyby się podwójnie (raz z bazy, raz
 * z kalendarza) i zjadałyby dzienny limit. Po tagu odsiewamy je jednoznacznie.
 *
 * Cała integracja jest fail-soft: gdy Google nie odpowiada, rezerwacja i tak
 * przechodzi — kalendarz nie może blokować sprzedaży.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const TZ = "Europe/Warsaw";
/** Znacznik naszych wydarzeń — po nim odsiewamy je przy liczeniu zajętości. */
const EVENT_TAG = "detailingLackoRezerwacja";

type Config = { email: string; privateKey: string; calendarId: string };

function config(): Config | null {
  const email = process.env.GOOGLE_SA_EMAIL?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  // W .env klucz jest jedną linią z "\n" — PEM wymaga prawdziwych końców linii.
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!email || !privateKey || !calendarId) return null;
  return { email, privateKey, calendarId };
}

export function isCalendarEnabled(): boolean {
  return config() !== null;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Token OAuth cache'owany w procesie — Google daje godzinę, bierzemy 55 min. */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(cfg: Config): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const iat = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: cfg.email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(cfg.privateKey));
  const assertion = `${header}.${claims}.${signature}`;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[google-calendar] Token odrzucony:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + Math.min((data.expires_in ?? 3600) - 300, 3300) * 1000,
    };
    return cachedToken.value;
  } catch (error) {
    console.error("[google-calendar] Pobranie tokenu nie powiodło się:", error);
    return null;
  }
}

/** Data i minuta w strefie Europe/Warsaw dla znacznika czasu z Google. */
function warsawParts(iso: string): { date: string; minutes: number } | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  // Intl potrafi zwrócić "24" dla północy — normalizujemy do 0.
  const hour = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
}

function addDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

type GoogleEvent = {
  id?: string;
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
};

/**
 * Zajętość z kalendarza właściciela jako bloki dla schedulera. Wydarzenie
 * przekraczające północ tniemy na doby, bo scheduler liczy w dobach lokalnych.
 * Pomijamy: własne rezerwacje (tag), wydarzenia „wolny" (transparency) oraz
 * odwołane. Wydarzenia całodniowe blokują całą dobę.
 */
export async function getBusyFromCalendar(
  fromDate: string,
  toDate: string,
): Promise<PracaRezerwacji[]> {
  const cfg = config();
  if (!cfg) return [];
  const token = await accessToken(cfg);
  if (!token) return [];

  const url = new URL(`${API}/calendars/${encodeURIComponent(cfg.calendarId)}/events`);
  url.searchParams.set("timeMin", `${fromDate}T00:00:00Z`);
  // +1 doba zapasu na strefę i wydarzenia przechodzące przez północ.
  url.searchParams.set("timeMax", `${addDay(toDate)}T23:59:59Z`);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("maxResults", "2500");

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[google-calendar] events.list:", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as { items?: GoogleEvent[] };
    const bloki: PracaRezerwacji[] = [];

    for (const event of data.items ?? []) {
      if (event.status === "cancelled") continue;
      if (event.transparency === "transparent") continue;
      if (event.extendedProperties?.private?.[EVENT_TAG]) continue;

      // Całodniowe: pole `date` zamiast `dateTime`.
      if (event.start?.date && !event.start.dateTime) {
        bloki.push({ date: event.start.date, time: "00:00", durationMinutes: 1440 });
        continue;
      }
      if (!event.start?.dateTime || !event.end?.dateTime) continue;
      const start = warsawParts(event.start.dateTime);
      const end = warsawParts(event.end.dateTime);
      if (!start || !end) continue;

      let cursor = start.date;
      let from = start.minutes;
      // Maks. 30 dób — bezpiecznik przed wydarzeniem-potworem.
      for (let i = 0; i < 30; i++) {
        const to = cursor === end.date ? end.minutes : 1440;
        if (to > from) {
          bloki.push({ date: cursor, time: hhmm(from), durationMinutes: to - from });
        }
        if (cursor === end.date) break;
        cursor = addDay(cursor);
        from = 0;
      }
    }
    return bloki;
  } catch (error) {
    console.error("[google-calendar] Odczyt kalendarza nie powiódł się:", error);
    return [];
  }
}

/**
 * Wydarzenie „auto w warsztacie": od przyjęcia do odbioru. Zwraca id wydarzenia
 * albo null — błąd nigdy nie przewraca rezerwacji.
 */
export async function createCalendarEvent(input: {
  reservationId: string;
  summary: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}): Promise<string | null> {
  const cfg = config();
  if (!cfg) return null;
  const token = await accessToken(cfg);
  if (!token) return null;

  try {
    const res = await fetch(
      `${API}/calendars/${encodeURIComponent(cfg.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          start: {
            dateTime: `${input.startDate}T${input.startTime}:00`,
            timeZone: TZ,
          },
          end: {
            dateTime: `${input.endDate}T${input.endTime}:00`,
            timeZone: TZ,
          },
          extendedProperties: { private: { [EVENT_TAG]: input.reservationId } },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      console.error("[google-calendar] events.insert:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (error) {
    console.error("[google-calendar] Zapis wydarzenia nie powiódł się:", error);
    return null;
  }
}

/** Usunięcie wydarzenia (odrzucenie rezerwacji w panelu zwalnia termin). */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const cfg = config();
  if (!cfg || !eventId) return;
  const token = await accessToken(cfg);
  if (!token) return;
  try {
    const res = await fetch(
      `${API}/calendars/${encodeURIComponent(cfg.calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    // 410 = już usunięte; traktujemy jak sukces.
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      console.error("[google-calendar] events.delete:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[google-calendar] Usunięcie wydarzenia nie powiodło się:", error);
  }
}
