"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePresence } from "@/components/motion/presence";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageCheck,
  Undo2,
  X,
} from "lucide-react";
// Z `cennik-selection`, nie z `cennik` — ten drugi buduje schematy zod przy
// imporcie, więc cały zod (~61 KB) wjeżdżałby do bundla strony głównej.
import {
  blockedItemIds,
  formatDuration,
  toggleServiceSelection,
  wymien,
} from "@/lib/cennik-selection";
import type {
  DostepnoscData,
  RezerwacjaKategoria,
  RezerwacjaPozycja,
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

/** Nazwa z wariantem — „One step" samo w sobie nie mówi, za ile i jak długo. */
function pelnaNazwa(p: RezerwacjaPozycja): string {
  return p.wariantLabel ? `${p.name} — ${p.wariantLabel}` : p.name;
}

/**
 * Pozycja cennika w widgecie: pojedyncza usługa albo kilka wariantów jednej
 * usługi (rozmiary auta), które trafiają do WSPÓLNEGO kafelka.
 */
type Grupa = { key: string; name: string; pozycje: RezerwacjaPozycja[] };

/**
 * Warianty tej samej pozycji sklejone w jedną grupę. Serwer wysyła je jako
 * osobne pozycje ze wspólną `grupaId` (każdy wariant ma własną cenę i czas,
 * więc musi być osobno wybieralny), ale klientowi pokazujemy jedną usługę
 * z wyborem rozmiaru — trzy kafelki, z których dwa zawsze są pomyłką, tylko
 * wydłużały listę.
 */
function grupujWarianty(pozycje: RezerwacjaPozycja[]): Grupa[] {
  const grupy: Grupa[] = [];
  const wgKlucza = new Map<string, Grupa>();
  for (const p of pozycje) {
    const key = p.grupaId ?? p.id;
    const istniejaca = wgKlucza.get(key);
    if (istniejaca) {
      istniejaca.pozycje.push(p);
      continue;
    }
    const grupa: Grupa = { key, name: p.name, pozycje: [p] };
    wgKlucza.set(key, grupa);
    grupy.push(grupa);
  }
  return grupy;
}

/**
 * Co widget ma powiedzieć o skutku ostatniego kliknięcia.
 *
 * `zmiana` — kliknięta pozycja przy okazji zdjęła z wyboru usługi, które
 * zawiera w cenie (`usuniete`), i/albo dołożyła wymagane dodatki (`dodane`).
 * Jedno kliknięcie może zrobić oba naraz (pakiet z wymaganym dodatkiem),
 * stąd dwie osobne listy zamiast jednego pola.
 * `zablokowane` — klient kliknął usługę, którą już obejmuje wybrany pakiet.
 */
type Callout =
  | {
      rodzaj: "zmiana";
      zrodlo: RezerwacjaPozycja;
      usuniete: RezerwacjaPozycja[];
      dodane: RezerwacjaPozycja[];
      /** Wybór sprzed kliknięcia — do „Cofnij". */
      poprzedni: string[];
    }
  | {
      rodzaj: "zablokowane";
      pozycja: RezerwacjaPozycja;
      pakiet: RezerwacjaPozycja;
    };

/**
 * Callout nad listą usług: tłumaczy, co zmieniło się w wyborze i pozwala to
 * odkręcić jednym kliknięciem.
 *
 * Świadomie NIE jest modalem: zmiana już się wydarzyła i jest widoczna na
 * pigułkach, więc blokowanie ekranu byłoby karą za normalne kliknięcie.
 * `aria-live` sprawia, że czytnik ekranu ogłasza zmianę, której użytkownik
 * nie wywołał wprost (zdjęcie usługi z wyboru).
 */
function WyborCallout({
  callout,
  onCofnij,
  onZamien,
  onZamknij,
}: {
  callout: Callout;
  onCofnij: () => void;
  onZamien: () => void;
  onZamknij: () => void;
}) {
  const zablokowane = callout.rodzaj === "zablokowane";
  return (
    <div
      role="status"
      aria-live="polite"
      className="cien-3 flex flex-col gap-2.5 rounded-xl border-2 border-ink bg-zolty px-4 py-3.5"
    >
      <div className="flex items-start gap-2.5">
        <PackageCheck className="mt-0.5 size-[18px] shrink-0" aria-hidden />
        <div className="flex flex-col gap-1 text-[14px] leading-[1.5] text-pretty">
          {zablokowane ? (
            <p>
              <strong className="font-bold">
                {pelnaNazwa(callout.pozycja)}
              </strong>{" "}
              jest już w cenie pakietu{" "}
              <strong className="font-bold">
                {pelnaNazwa(callout.pakiet)}
              </strong>{" "}
              — nie trzeba dobierać osobno.
            </p>
          ) : (
            <>
              {callout.usuniete.length > 0 ? (
                <p>
                  <strong className="font-bold">
                    {pelnaNazwa(callout.zrodlo)}
                  </strong>{" "}
                  zawiera już{" "}
                  <strong className="font-bold">
                    {wymien(callout.usuniete.map(pelnaNazwa))}
                  </strong>
                  , więc{" "}
                  {callout.usuniete.length > 1 ? "zdjęliśmy je" : "zdjęliśmy ją"}{" "}
                  z wyboru. Nie płacisz dwa razy za to samo.
                </p>
              ) : null}
              {callout.dodane.length > 0 ? (
                <p>
                  <strong className="font-bold">
                    {pelnaNazwa(callout.zrodlo)}
                  </strong>{" "}
                  wymaga też{" "}
                  <strong className="font-bold">
                    {wymien(callout.dodane.map(pelnaNazwa))}
                  </strong>
                  , więc{" "}
                  {callout.dodane.length > 1 ? "dodaliśmy je" : "dodaliśmy ją"}{" "}
                  do wyboru.
                </p>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onZamknij}
          aria-label="Zamknij komunikat"
          className="-mt-1 -mr-1.5 ml-auto grid size-8 shrink-0 place-items-center rounded-lg hover:bg-ink/10 focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={zablokowane ? onZamien : onCofnij}
        className="cien-3 inline-flex w-max items-center gap-1.5 rounded-lg border-2 border-ink bg-background px-3 py-1.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none active:translate-y-0 motion-reduce:transition-none"
      >
        <Undo2 className="size-3.5" aria-hidden />
        {zablokowane
          ? `Wolę osobno — usuń ${pelnaNazwa(callout.pakiet)}`
          : "Cofnij tę zmianę"}
      </button>
    </div>
  );
}

/**
 * Kafelek usługi z wariantami: nazwa raz, pod nią pigułki rozmiarów z cenami.
 *
 * Wybór rozmiaru jest wyborem CAŁEJ usługi (nie ma stanu „zaznaczona, ale bez
 * rozmiaru"), więc kafelek nie ma osobnego checkboxa — zaznaczona pigułka jest
 * jednocześnie zaznaczeniem usługi. Dzięki temu nie da się wysłać rezerwacji
 * bez rozmiaru, a więc bez znanej ceny i czasu pracy.
 */
function KafelekWariantow({
  grupa,
  selected,
  wPakiecie,
  onWybierz,
}: {
  grupa: Grupa;
  selected: string[];
  /** Pakiet, który zawiera tę usługę w cenie (wtedy wariantów nie wybieramy). */
  wPakiecie: RezerwacjaPozycja | undefined;
  onWybierz: (id: string, rodzenstwo: string[]) => void;
}) {
  const wybrany = grupa.pozycje.find((p) => selected.includes(p.id));
  const opisId = `warianty-${grupa.key}`;
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border-2 px-3.5 py-3 ${
        wybrany
          ? "cien-3 border-ink bg-zolty"
          : wPakiecie
            ? "border-dashed border-kreska bg-piasek"
            : "border-ink bg-background"
      }`}
    >
      <span
        className={`text-[14px] leading-snug font-semibold ${
          wPakiecie ? "text-muted-foreground" : ""
        }`}
      >
        {grupa.name}
      </span>

      {wPakiecie ? (
        <span className="etykieta-sm text-muted-foreground">
          w cenie: {wPakiecie.name}
        </span>
      ) : (
        <>
          <span id={opisId} className="etykieta-sm text-muted-foreground">
            wybierz rozmiar auta
          </span>
          <div
            role="group"
            aria-labelledby={opisId}
            className="flex flex-wrap gap-2"
          >
            {grupa.pozycje.map((p) => {
              const active = selected.includes(p.id);
              const rodzenstwo = grupa.pozycje
                .filter((x) => x.id !== p.id)
                .map((x) => x.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onWybierz(p.id, rodzenstwo)}
                  aria-pressed={active}
                  // `py-2.5` daje ~42 px wysokości — wybór rozmiaru to cel
                  // dotykowy na telefonie i nie może być drobniejszy od
                  // pigułek z godzinami obok.
                  className={`flex items-baseline gap-2 rounded-lg border-2 border-ink px-3 py-2.5 text-left transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                    active
                      ? "bg-ink text-zolty"
                      : "bg-background hover:-translate-y-0.5"
                  }`}
                >
                  <span className="text-[13px] font-semibold">
                    {p.wariantLabel}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums">
                    {p.priceLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Etykieta kroku — numer w żółtym kółku + mono uppercase, jak plakietki sekcji. */
function Krok({
  numer,
  children,
}: {
  numer: number;
  children: React.ReactNode;
}) {
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
          <span
            key={d}
            className="etykieta-sm text-center text-muted-foreground"
          >
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
            enabledWeekdays.has(
              new Date(view.year, view.month, day).getDay(),
            ) &&
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

/** Zgodne z `presence-out` w globals.css. */
const EXIT_MS = 200;

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
  const [callout, setCallout] = useState<Callout | null>(null);
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

  const pozycje = useMemo(
    () => kategorie.flatMap((k) => k.pozycje),
    [kategorie],
  );
  const wybrane = useMemo(
    () => pozycje.filter((p) => selected.includes(p.id)),
    [pozycje, selected],
  );
  const razemMinuty = wybrane.reduce((sum, p) => sum + p.durationMinutes, 0);
  const razemCena = wybrane.reduce((sum, p) => sum + p.priceFrom, 0);
  const servicesKey = selected.join(",");

  /**
   * Pozycje objęte już wybranym pakietem: id → pakiet, który je zawiera.
   * Sterują wyglądem pigułek i treścią calloutu.
   */
  const zablokowane = useMemo(
    () => blockedItemIds(pozycje, selected),
    [pozycje, selected],
  );

  /**
   * Cała reguła siedzi w `toggleServiceSelection` (wspólnej z panelem i API) —
   * tutaj zostaje wyłącznie zamiana wyniku na komunikat dla klienta.
   *
   * `rodzenstwo` to pozostałe warianty tej samej pozycji: wykluczają się, bo
   * jedno auto ma jeden rozmiar. Klik w inny rozmiar ma go PODMIENIĆ, a nie
   * dołożyć drugiego one stepa do rachunku i harmonogramu.
   */
  const toggle = (id: string, rodzenstwo: string[] = []) => {
    const pozycja = pozycje.find((p) => p.id === id);
    if (!pozycja) return;

    const bezRodzenstwa = rodzenstwo.length
      ? selected.filter((x) => !rodzenstwo.includes(x))
      : selected;
    const zmiana = toggleServiceSelection(pozycje, bezRodzenstwa, id);

    if (zmiana.blockedBy) {
      setCallout({
        rodzaj: "zablokowane",
        pozycja,
        pakiet: zmiana.blockedBy,
      });
      return;
    }

    const poprzedni = selected;
    setSelected(zmiana.selected);
    setCallout(
      zmiana.removed.length > 0 || zmiana.added.length > 0
        ? {
            rodzaj: "zmiana",
            zrodlo: pozycja,
            usuniete: zmiana.removed,
            dodane: zmiana.added,
            poprzedni,
          }
        : null,
    );
  };

  /**
   * Callout ma animację wyjścia, więc musi przeżyć wyzerowanie `callout`
   * o czas `EXIT_MS` — przez tę chwilę renderujemy ostatnią widoczną treść.
   */
  const { mounted: calloutMounted, state: calloutState } = usePresence(
    callout !== null,
    EXIT_MS,
  );
  const [ostatniCallout, setOstatniCallout] = useState<Callout | null>(null);
  useEffect(() => {
    if (callout) setOstatniCallout(callout);
  }, [callout]);
  const widocznyCallout = callout ?? ostatniCallout;

  /** „Wolę osobno": zdejmuje pakiet i wstawia klikniętą składową. */
  const zamienPakietNaPozycje = () => {
    if (!callout || callout.rodzaj !== "zablokowane") return;
    setSelected((prev) => [
      ...prev.filter((x) => x !== callout.pakiet.id),
      callout.pozycja.id,
    ]);
    setCallout(null);
  };

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
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;
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
            Zapisałem{" "}
            <strong className="font-bold">{formatDatePl(date)}</strong> na{" "}
            <strong className="font-bold">{done.time}</strong>
            {wybrane.length ? (
              <> — {wybrane.map(pelnaNazwa).join(", ")}</>
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
                  {grupujWarianty(kategoria.pozycje).map((grupa) => {
                    // Usługa z wariantami ma własny kafelek z wyborem rozmiaru.
                    if (grupa.pozycje.length > 1) {
                      const wybrany = grupa.pozycje.find((x) =>
                        selected.includes(x.id),
                      );
                      return (
                        <KafelekWariantow
                          key={grupa.key}
                          grupa={grupa}
                          selected={selected}
                          wPakiecie={
                            wybrany
                              ? undefined
                              : grupa.pozycje
                                  .map((x) => zablokowane.get(x.id))
                                  .find(Boolean)
                          }
                          onWybierz={toggle}
                        />
                      );
                    }
                    const p = grupa.pozycje[0];
                    if (!p) return null;
                    const active = selected.includes(p.id);
                    // Pozycja w cenie wybranego pakietu: zostaje klikalna,
                    // żeby dało się dopytać „dlaczego nie mogę?" — martwy,
                    // wyszarzony przycisk bez wyjaśnienia jest gorszy.
                    const wPakiecie = !active
                      ? zablokowane.get(p.id)
                      : undefined;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-pressed={active}
                        aria-describedby={
                          wPakiecie ? `w-pakiecie-${p.id}` : undefined
                        }
                        className={`flex items-start justify-between gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                          active
                            ? "cien-3 border-ink bg-zolty"
                            : wPakiecie
                              ? "border-dashed border-kreska bg-piasek"
                              : "border-ink bg-background hover:-translate-y-0.5"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col gap-1">
                          <span
                            className={`text-[14px] leading-snug font-semibold ${
                              wPakiecie ? "text-muted-foreground" : ""
                            }`}
                          >
                            {p.name}
                          </span>
                          {wPakiecie ? (
                            <span
                              id={`w-pakiecie-${p.id}`}
                              className="etykieta-sm text-muted-foreground"
                            >
                              w cenie: {wPakiecie.name}
                            </span>
                          ) : (
                            <span className="etykieta-sm text-muted-foreground">
                              {p.priceLabel}
                              {p.durationMinutes > 0
                                ? ` · ${formatDuration(p.durationMinutes)}`
                                : ""}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 ${
                            active
                              ? "border-ink bg-ink text-zolty"
                              : wPakiecie
                                ? "border-kreska bg-background text-muted-foreground"
                                : "border-ink bg-background"
                          }`}
                        >
                          {active ? <Check className="size-3.5" /> : null}
                          {wPakiecie ? (
                            <PackageCheck className="size-3.5" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {calloutMounted && widocznyCallout ? (
              // `key` przeładowuje element przy podmianie treści, więc animacja
              // wejścia gra od nowa — tak jak robił to <AnimatePresence>.
              <div
                key={
                  widocznyCallout.rodzaj === "zablokowane"
                    ? `blok-${widocznyCallout.pozycja.id}`
                    : `zmiana-${widocznyCallout.zrodlo.id}`
                }
                data-state={calloutState}
                className="presence presence-z-gory"
              >
                <WyborCallout
                  callout={widocznyCallout}
                  onCofnij={() => {
                    if (widocznyCallout.rodzaj === "zmiana")
                      setSelected(widocznyCallout.poprzedni);
                    setCallout(null);
                  }}
                  onZamien={zamienPakietNaPozycje}
                  onZamknij={() => setCallout(null)}
                />
              </div>
            ) : null}

            {wybrane.length > 0 ? (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border-2 border-dashed border-kreska px-4 py-3">
                <span className="etykieta-sm text-muted-foreground">razem</span>
                <span className="text-[15px] font-bold">
                  {/* „z VAT" jak przy każdej kwocie w cenniku — suma leci
                      z tych samych pozycji, więc musi mówić o cenie to samo,
                      co cennik. */}
                  od {razemCena} zł z VAT
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
                  prefetch={false}
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
