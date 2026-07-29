"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/cennik";
import type {
  DostepnoscData,
  RezerwacjaKategoria,
  SlotPropozycja,
} from "@/lib/rezerwacje";
import { trackReservationSubmit } from "@/lib/track";

type Props = { config: DostepnoscData; kategorie: RezerwacjaKategoria[] };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function isoOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
function isoLocal(d: Date): string {
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
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

/** Etykieta kroku — numer w żółtym kółku + mono uppercase, jak plakietki sekcji. */
function Krok({ numer, children }: { numer: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-zolty text-xs font-bold"
      >
        {numer}
      </span>
      <span className="etykieta-sm">{children}</span>
    </span>
  );
}

/** Komunikat o odbiorze auta dla wybranej godziny. */
function OdbiorInfo({ slot }: { slot: SlotPropozycja }) {
  return (
    <p className="cien-3 flex flex-wrap items-baseline gap-x-2 rounded-xl border-2 border-ink bg-zolty px-4 py-3 text-sm">
      <span className="font-bold">
        {slot.sameDay
          ? `Auto do odbioru tego samego dnia ok. ${slot.pickupTime}.`
          : `Auto zostaje u nas — odbiór ${formatDatePl(slot.pickupDate)} ok. ${slot.pickupTime}.`}
      </span>
      {!slot.sameDay ? (
        <span className="font-medium">
          Robota nie mieści się w godzinach pracy tego dnia, więc kończymy
          następnego dnia roboczego.
        </span>
      ) : null}
    </p>
  );
}

const DNI_TYGODNIA = ["pn", "wt", "śr", "cz", "pt", "so", "nd"] as const;

/**
 * Kalendarz w języku makiety zamiast natywnego <input type="date"> —
 * systemowa kontrolka gryzła się ze stylem strony. Dni wolne (konfiguracja
 * tygodnia, urlopy) i daty poza horyzontem są wygaszone od razu, bez
 * odpytywania serwera.
 */
function Kalendarz({
  config,
  value,
  onChange,
}: {
  config: DostepnoscData;
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const today = new Date();
  const minStr = isoLocal(today);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.horizonDays);
  const maxStr = isoLocal(maxDate);

  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const monthLabel = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(new Date(view.year, view.month, 1));

  const canPrev =
    view.year > today.getFullYear() ||
    (view.year === today.getFullYear() && view.month > today.getMonth());
  const canNext =
    view.year < maxDate.getFullYear() ||
    (view.year === maxDate.getFullYear() && view.month < maxDate.getMonth());

  const move = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Kolumna pierwszego dnia (pon=0 … nd=6) — getDay() liczy od niedzieli.
  const firstColumn = (new Date(view.year, view.month, 1).getDay() + 6) % 7;

  const enabledWeekdays = new Set(
    config.weekly.filter((w) => w.enabled).map((w) => w.day),
  );

  return (
    <div className="w-full max-w-sm rounded-xl border-2 border-ink bg-background p-3.5">
      <div className="flex items-center justify-between gap-2 pb-3">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="Poprzedni miesiąc"
          className="grid size-9 place-items-center rounded-full border-2 border-ink bg-background transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none enabled:hover:-translate-y-0.5 disabled:border-kreska disabled:text-muted-foreground motion-reduce:transition-none"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span aria-live="polite" className="text-[15px] font-bold capitalize">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canNext}
          aria-label="Następny miesiąc"
          className="grid size-9 place-items-center rounded-full border-2 border-ink bg-background transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none enabled:hover:-translate-y-0.5 disabled:border-kreska disabled:text-muted-foreground motion-reduce:transition-none"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div aria-hidden className="grid grid-cols-7 gap-1 pb-1.5">
        {DNI_TYGODNIA.map((d) => (
          <span key={d} className="etykieta-sm text-center text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstColumn }, (_, i) => (
          <span key={`pusty-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = isoOf(view.year, view.month, day);
          const dostepny =
            iso >= minStr &&
            iso <= maxStr &&
            enabledWeekdays.has(new Date(view.year, view.month, day).getDay()) &&
            !config.blockedDates.includes(iso);
          const active = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={!dostepny}
              onClick={() => onChange(iso)}
              aria-pressed={active}
              aria-label={formatDatePl(iso)}
              className={`grid aspect-square place-items-center rounded-lg border-2 text-sm font-semibold transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                active
                  ? "cien-3 border-ink bg-zolty"
                  : dostepny
                    ? "border-ink bg-background hover:-translate-y-0.5"
                    : "border-transparent text-muted-foreground/60"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Wspólny wygląd pól formularza — twarda kreska 2px zamiast szarej ramki. */
const POLE =
  "h-12 w-full rounded-xl border-2 border-ink bg-background px-3.5 text-[15px] font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * Widget rezerwacji online: usługi z cennika (multi-select) → dzień →
 * wolna godzina z wyliczonym odbiorem auta → dane kontaktowe.
 *
 * Sloty i moment odbioru liczy serwer (GET /api/rezerwacje/sloty — czas
 * z `durationMinutes` pozycji cennika, dzienny limit i przelewanie pracy na
 * kolejne dni), rezerwację przyjmuje POST /api/rezerwacje (walidacja +
 * anty-dubel). Rezerwacja jest wstępna — właściciel potwierdza w panelu.
 *
 * Wygląd w języku makiety „kreskówka": biała karta z kreską 3px, żółty
 * nagłówek, usługi/dni/godziny jako pigułki z twardym cieniem po wybraniu.
 */
export function Rezerwacja({ config, kategorie }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotPropozycja[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<SlotPropozycja | null>(null);
  const submitting = useRef(false);

  const pozycje = useMemo(() => kategorie.flatMap((k) => k.pozycje), [kategorie]);
  const wybrane = useMemo(
    () => pozycje.filter((p) => selected.includes(p.id)),
    [pozycje, selected],
  );
  const razemMinuty = wybrane.reduce((sum, p) => sum + p.durationMinutes, 0);
  const razemCena = wybrane.reduce((sum, p) => sum + p.priceFrom, 0);
  const servicesKey = selected.join(",");

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  useEffect(() => {
    if (!date || !servicesKey) {
      setSlots([]);
      setTime("");
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setTime("");
    setError(null);
    fetch(`/api/rezerwacje/sloty?date=${date}&services=${servicesKey}`)
      .then((r) => r.json())
      .then((data: { slots?: SlotPropozycja[] }) => {
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
  }, [date, servicesKey]);

  const slot = slots.find((s) => s.time === time) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (selected.length === 0 || !date || !time) {
      setError("Wybierz usługi, datę i godzinę.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/rezerwacje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          serviceIds: selected,
          name,
          phone,
          email,
          note,
        }),
      });
      if (res.status === 201) {
        trackReservationSubmit(email);
        setDone(
          slot ?? { time, pickupDate: date, pickupTime: "", sameDay: true },
        );
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
        const r = await fetch(
          `/api/rezerwacje/sloty?date=${date}&services=${servicesKey}`,
        );
        const d = (await r.json()) as { slots?: SlotPropozycja[] };
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
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold">Termin zaklepany!</h3>
          <p className="text-[15px] text-pretty">
            Zapisałem <strong className="font-bold">{formatDatePl(date)}</strong>{" "}
            na <strong className="font-bold">{done.time}</strong>
            {wybrane.length ? (
              <> — {wybrane.map((p) => p.name).join(", ")}</>
            ) : null}
            . Potwierdzę telefonicznie — do usłyszenia!
          </p>
          {done.pickupTime ? (
            <p className="text-[15px] font-semibold">
              {done.sameDay
                ? `Auto do odbioru tego samego dnia ok. ${done.pickupTime}.`
                : `Auto do odbioru ${formatDatePl(done.pickupDate)} ok. ${done.pickupTime}.`}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="cien-6 overflow-hidden rounded-2xl border-[3px] border-ink bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink bg-zolty px-5 py-[18px]">
        <h3 className="text-xl font-bold">{config.heading}</h3>
        <span className="etykieta-sm rounded-full bg-ink px-2.5 py-[5px] text-zolty">
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
          <div className="flex flex-col gap-4">
            <Krok numer={1}>Zaznacz usługi · możesz kilka</Krok>

            {kategorie.map((kategoria) => (
              <fieldset key={kategoria.id} className="flex flex-col gap-2">
                <legend className="etykieta-sm mb-2 text-muted-foreground">
                  {kategoria.name}
                </legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {kategoria.pozycje.map((p) => {
                    const active = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-pressed={active}
                        className={`flex items-start justify-between gap-3 rounded-xl border-2 border-ink px-3.5 py-3 text-left transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                          active
                            ? "cien-3 bg-zolty"
                            : "bg-background hover:-translate-y-0.5"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="text-[14px] leading-snug font-semibold">
                            {p.name}
                          </span>
                          <span className="etykieta-sm text-muted-foreground">
                            {p.priceLabel}
                            {p.durationMinutes > 0
                              ? ` · ${formatDuration(p.durationMinutes)}`
                              : ""}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 border-ink ${
                            active ? "bg-ink text-zolty" : "bg-background"
                          }`}
                        >
                          {active ? <Check className="size-3.5" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {wybrane.length > 0 ? (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border-2 border-dashed border-kreska px-4 py-3">
                <span className="etykieta-sm text-muted-foreground">razem</span>
                <span className="text-[15px] font-bold">
                  od {razemCena} zł
                  {razemMinuty > 0
                    ? ` · ok. ${formatDuration(razemMinuty)} pracy`
                    : ""}
                </span>
              </p>
            ) : (
              <p className="text-sm font-medium text-tekst">
                Zaznacz przynajmniej jedną usługę, żeby przejść do wyboru
                terminu.
              </p>
            )}
          </div>

          {selected.length > 0 ? (
            <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-kreska pt-6">
              <Krok numer={2}>Wybierz dzień</Krok>
              <Kalendarz config={config} value={date} onChange={setDate} />
            </div>
          ) : null}

          {selected.length > 0 && date ? (
            <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-kreska pt-6">
              <Krok numer={3}>Wybierz godzinę · {formatDatePl(date)}</Krok>
              {slotsLoading ? (
                <p className="flex items-center gap-2 py-2 text-sm font-medium text-tekst">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Sprawdzam wolne godziny…
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-kreska px-4 py-3 text-sm font-medium text-tekst">
                  Brak wolnych terminów tego dnia dla wybranych usług. Wybierz
                  inny dzień albo zadzwoń.
                </p>
              ) : (
                <>
                  <div
                    className="flex flex-wrap gap-2.5"
                    role="group"
                    aria-label="Wolne godziny"
                  >
                    {slots.map((s) => {
                      const active = s.time === time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setTime(s.time)}
                          aria-pressed={active}
                          className={`min-w-[4.5rem] rounded-full border-2 border-ink px-4 py-2.5 text-[15px] font-semibold transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                            active
                              ? "cien-3 bg-zolty"
                              : "bg-background hover:-translate-y-0.5"
                          }`}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                  {slot ? <OdbiorInfo slot={slot} /> : null}
                </>
              )}
            </div>
          ) : null}

          {selected.length > 0 && date && time ? (
            <div className="flex flex-col gap-4 border-t-2 border-dashed border-kreska pt-6">
              <Krok numer={4}>Twoje dane</Krok>
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
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">
                    Auto i uwagi{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcjonalnie)
                    </span>
                  </span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="np. Golf VII, plamy na fotelach"
                    className={POLE}
                  />
                </label>
              </div>

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
                <span className="etykieta-sm text-muted-foreground">
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
