"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import type { DostepnoscData } from "@/lib/rezerwacje";
import { trackReservationSubmit } from "@/lib/track";

type Props = { config: DostepnoscData };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDatePl(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${dateStr}T12:00:00`));
  } catch {
    return dateStr;
  }
}

/** Etykieta kroku — mono, uppercase, jak plakietki sekcji w makiecie. */
function Krok({ numer, children }: { numer: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-zolty text-xs font-bold"
      >
        {numer}
      </span>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
        {children}
      </span>
    </span>
  );
}

/** Wspólny wygląd pól formularza — twarda kreska 2px zamiast szarej ramki. */
const POLE =
  "h-12 w-full rounded-xl border-2 border-ink bg-background px-3.5 text-[15px] font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * Widget rezerwacji online: data → wolne godziny → dane kontaktowe.
 * Sloty liczy serwer (GET /api/rezerwacje/sloty), rezerwację przyjmuje
 * POST /api/rezerwacje (walidacja + anty-dubel). Rezerwacja jest wstępna —
 * właściciel potwierdza w panelu Magazyn.
 *
 * Wygląd w języku makiety „kreskówka": biała karta z kreską 3px, żółty
 * nagłówek, godziny jako pigułki z twardym cieniem po wybraniu.
 */
export function Rezerwacja({ config }: Props) {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.horizonDays);
  const minStr = isoLocal(today);
  const maxStr = isoLocal(maxDate);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(config.services[0] ?? "");
  const [note, setNote] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setTime("");
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setTime("");
    setError(null);
    fetch(`/api/rezerwacje/sloty?date=${date}`)
      .then((r) => r.json())
      .then((data: { slots?: string[] }) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!date || !time) {
      setError("Wybierz datę i godzinę.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/rezerwacje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, name, phone, email, service, note }),
      });
      if (res.status === 201) {
        trackReservationSubmit(email);
        setDone(true);
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      setError(body?.error ?? "Nie udało się zarezerwować. Spróbuj ponownie.");
      // Slot zniknął w międzyczasie — odśwież listę godzin.
      if (body?.code === "slot_taken" || body?.code === "slot_unavailable") {
        setTime("");
        setSlotsLoading(true);
        const r = await fetch(`/api/rezerwacje/sloty?date=${date}`);
        const d = (await r.json()) as { slots?: string[] };
        setSlots(d.slots ?? []);
        setSlotsLoading(false);
      }
    } catch {
      setError("Brak połączenia — spróbuj ponownie.");
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="cien-6 flex items-start gap-4 rounded-2xl border-[3px] border-ink bg-zolty p-6 sm:p-8"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-background">
          <Check className="size-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-xl font-bold">Termin zaklepany!</h3>
          <p className="mt-2 text-[15px] text-pretty">
            Zapisałem <strong className="font-bold">{formatDatePl(date)}</strong>{" "}
            na <strong className="font-bold">{time}</strong>. Potwierdzę
            telefonicznie — do usłyszenia!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cien-6 overflow-hidden rounded-2xl border-[3px] border-ink bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink bg-zolty px-5 py-[18px]">
        <h3 className="text-xl font-bold">{config.heading}</h3>
        <span className="rounded-full bg-ink px-2.5 py-[5px] font-mono text-[9px] tracking-[0.18em] text-zolty uppercase">
          online 24/7
        </span>
      </div>

      <div className="p-5 sm:p-7">
        {config.note ? (
          <p className="text-[14.5px] leading-[1.55] text-pretty text-tekst">
            {config.note}
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="rez-date">
              <Krok numer={1}>Wybierz dzień</Krok>
            </label>
            <input
              id="rez-date"
              type="date"
              value={date}
              min={minStr}
              max={maxStr}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`${POLE} max-w-xs`}
            />
          </div>

          {date ? (
            <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-kreska pt-6">
              <Krok numer={2}>Wybierz godzinę · {formatDatePl(date)}</Krok>
              {slotsLoading ? (
                <p className="flex items-center gap-2 py-2 text-sm font-medium text-tekst">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Sprawdzam wolne godziny…
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-kreska px-4 py-3 text-sm font-medium text-tekst">
                  Brak wolnych terminów tego dnia. Wybierz inny dzień albo
                  zadzwoń.
                </p>
              ) : (
                <div
                  className="flex flex-wrap gap-2.5"
                  role="group"
                  aria-label="Wolne godziny"
                >
                  {slots.map((s) => {
                    const active = s === time;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTime(s)}
                        aria-pressed={active}
                        className={`min-w-[4.5rem] rounded-full border-2 border-ink px-4 py-2.5 text-[15px] font-semibold transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                          active
                            ? "cien-3 bg-zolty"
                            : "bg-background hover:-translate-y-0.5"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {date && time ? (
            <div className="flex flex-col gap-4 border-t-2 border-dashed border-kreska pt-6">
              <Krok numer={3}>Twoje dane</Krok>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">Imię</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Jan"
                    className={POLE}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">Telefon</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    placeholder="600 000 000"
                    className={POLE}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">
                    E-mail{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcjonalnie)
                    </span>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="jan@przyklad.pl"
                    className={POLE}
                  />
                </label>
                {config.services.length > 0 ? (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold">Usługa</span>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className={POLE}
                    >
                      {config.services.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">
                  Auto i uwagi{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcjonalnie)
                  </span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="np. Golf VII, plamy na fotelach"
                  className="w-full rounded-xl border-2 border-ink bg-background px-3.5 py-2.5 text-[15px] font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="cien-zolty-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-6 py-3 text-[15px] font-bold text-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {pending ? "Rezerwuję…" : `Rezerwuję ${time}`}
                </button>
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  wstępna rezerwacja · potwierdzam telefonicznie
                </span>
              </div>

              {/* Obowiązek informacyjny RODO — dane z formularza przetwarzamy,
                  żeby zrealizować rezerwację; użytkownik musi wiedzieć gdzie
                  szukać szczegółów (art. 13 RODO). */}
              <p className="text-xs text-pretty text-muted-foreground">
                Podane dane wykorzystam wyłącznie do obsługi tej rezerwacji.
                Szczegóły:{" "}
                <Link
                  href="/polityka-prywatnosci"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  polityka prywatności
                </Link>
                .
              </p>
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
