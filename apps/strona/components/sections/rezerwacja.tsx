"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@moduly/ui";
import { CalendarCheck, Check, Clock, Loader2 } from "lucide-react";
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

/**
 * Widget rezerwacji online: data → wolne godziny → dane kontaktowe.
 * Sloty liczy serwer (GET /api/rezerwacje/sloty), rezerwację przyjmuje
 * POST /api/rezerwacje (walidacja + anty-dubel). Rezerwacja jest wstępna —
 * właściciel potwierdza w panelu Magazyn.
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
      <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium">
              Rezerwacja przyjęta
            </h3>
            <p className="mt-2 text-pretty text-muted-foreground">
              Zapisałem termin <strong>{formatDatePl(date)}</strong> na{" "}
              <strong>{time}</strong>. Potwierdzę go telefonicznie — do usłyszenia!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-strong">
          <CalendarCheck className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-xl font-medium">{config.heading}</h3>
        </div>
      </div>
      {config.note ? (
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          {config.note}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-2">
          <label htmlFor="rez-date" className="text-sm font-medium">
            1. Wybierz dzień
          </label>
          <input
            id="rez-date"
            type="date"
            value={date}
            min={minStr}
            max={maxStr}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-11 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        </div>

        {date ? (
          <div className="grid gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="size-4 text-primary-strong" aria-hidden />
              2. Wybierz godzinę
              <span className="font-normal text-muted-foreground">
                · {formatDatePl(date)}
              </span>
            </span>
            {slotsLoading ? (
              <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sprawdzam wolne godziny…
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Brak wolnych terminów tego dnia. Wybierz inny dzień albo zadzwoń.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Wolne godziny">
                {slots.map((s) => {
                  const active = s === time;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      aria-pressed={active}
                      className={`min-w-16 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary-strong/60 hover:text-primary-strong"
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
          <div className="grid gap-4 border-t border-border pt-6">
            <span className="text-sm font-medium">3. Twoje dane</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Imię</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jan"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Telefon</span>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="600 000 000"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">
                  E-mail{" "}
                  <span className="text-xs">(opcjonalnie)</span>
                </span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="jan@przyklad.pl"
                />
              </label>
              {config.services.length > 0 ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Usługa</span>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">
                Auto i uwagi{" "}
                <span className="text-xs">(opcjonalnie)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="np. Golf VII, plamy na fotelach"
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70 motion-reduce:transition-none"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CalendarCheck className="size-4" aria-hidden />
                )}
                {pending ? "Rezerwuję…" : `Rezerwuję ${time}`}
              </button>
              <span className="text-xs text-muted-foreground">
                Wstępna rezerwacja — potwierdzę telefonicznie.
              </span>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
