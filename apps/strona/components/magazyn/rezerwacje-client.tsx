"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Check, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import {
  REZERWACJA_STATUS_LABEL,
  WEEKDAY_LABEL,
  weeklyInDisplayOrder,
  type DostepnoscData,
  type Rezerwacja,
  type RezerwacjaStatus,
} from "@/lib/rezerwacje";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Checkbox,
  Field,
  Fieldset,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

const TABS = [
  { id: "zgloszenia", label: "Zgłoszenia" },
  { id: "dostepnosc", label: "Dostępność" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function formatDatePl(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateStr}T12:00:00`));
  } catch {
    return dateStr;
  }
}

const STATUS_TONE: Record<RezerwacjaStatus, string> = {
  nowa: "bg-amber-500/15 text-amber-700",
  potwierdzona: "bg-emerald-500/15 text-emerald-700",
  odrzucona: "bg-muted text-muted-foreground line-through",
};

export function RezerwacjeClient({
  initialReservations,
  initialConfig,
}: {
  initialReservations: Rezerwacja[];
  initialConfig: DostepnoscData;
}) {
  const [tab, setTab] = useState<Tab>("zgloszenia");
  const newCount = initialReservations.filter((r) => r.status === "nowa").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rezerwacje"
        description="Zgłoszenia z rezerwacji online i konfiguracja dostępności terminów."
      />

      <nav
        aria-label="Sekcje rezerwacji"
        className="flex flex-row flex-wrap gap-1"
      >
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            aria-current={tab === entry.id ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
              tab === entry.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {entry.label}
            {entry.id === "zgloszenia" && newCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-amber-700">
                {newCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "zgloszenia" ? (
        <ReservationsPanel initial={initialReservations} />
      ) : (
        <AvailabilityPanel initial={initialConfig} />
      )}
    </div>
  );
}

/* ------------------------------- Zgłoszenia ------------------------------- */

function ReservationsPanel({ initial }: { initial: Rezerwacja[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: RezerwacjaStatus) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/magazyn/rezerwacje", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      router.refresh();
    } catch {
      setError("Nie udało się zmienić statusu.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Usunąć rezerwację na stałe?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/magazyn/rezerwacje?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch {
      setError("Nie udało się usunąć.");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Brak rezerwacji. Nowe zgłoszenia z formularza rezerwacji online pojawią się tutaj.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <StatusMessage message={error} error />
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {formatDatePl(r.date)} · {r.time}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status]}`}
              >
                {REZERWACJA_STATUS_LABEL[r.status]}
              </span>
            </div>
            <p className="text-sm">
              <span className="font-medium">{r.name}</span> ·{" "}
              <a
                href={`tel:${r.phone.replace(/\s/g, "")}`}
                className="text-primary-strong hover:underline"
              >
                {r.phone}
              </a>
              {r.email ? (
                <>
                  {" · "}
                  <a
                    href={`mailto:${r.email}`}
                    className="text-primary-strong hover:underline"
                  >
                    {r.email}
                  </a>
                </>
              ) : null}
            </p>
            {r.service ? (
              <p className="text-sm text-muted-foreground">Usługa: {r.service}</p>
            ) : null}
            {r.note ? (
              <p className="text-sm text-pretty text-muted-foreground">
                „{r.note}"
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {r.status !== "potwierdzona" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "potwierdzona")}
                className="gap-1.5"
              >
                <Check className="size-4" aria-hidden /> Potwierdź
              </Button>
            ) : null}
            {r.status !== "odrzucona" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "odrzucona")}
                className="gap-1.5"
              >
                <X className="size-4" aria-hidden /> Odrzuć
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "nowa")}
                className="gap-1.5"
              >
                <RotateCcw className="size-4" aria-hidden /> Przywróć
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={busyId === r.id}
              onClick={() => remove(r.id)}
              aria-label="Usuń rezerwację"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Dostępność ------------------------------- */

function AvailabilityPanel({ initial }: { initial: DostepnoscData }) {
  const router = useRouter();
  const history = useMagazynHistory<DostepnoscData>(initial);
  const cfg = history.state;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [newDate, setNewDate] = useState("");

  const patch = (next: Partial<DostepnoscData>) =>
    history.setState((draft) => ({ ...draft, ...next }));

  const setDay = (day: number, next: Partial<DostepnoscData["weekly"][number]>) =>
    history.setState((draft) => ({
      ...draft,
      weekly: draft.weekly.map((w) => (w.day === day ? { ...w, ...next } : w)),
    }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/dostepnosc", history.state);
    if (result.ok) {
      setStatus("Dostępność zapisana — strona odświeży się w kilka sekund.");
      history.commitSaved();
      router.refresh();
    } else {
      setError(true);
      setStatus(result.error);
    }
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <Fieldset legend="Rezerwacje online">
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={cfg.enabled}
            onCheckedChange={(v) => patch({ enabled: v })}
            ariaLabel="Rezerwacje online włączone"
          />
          <span>
            Rezerwacje online włączone
            <span className="block text-xs text-muted-foreground">
              Gdy wyłączone — na stronie zostaje sam kontakt telefoniczny i formularz.
            </span>
          </span>
        </label>
        <Field label="Nagłówek widgetu">
          <Input
            value={cfg.heading}
            onChange={(e) => patch({ heading: e.target.value })}
          />
        </Field>
        <Field label="Opis pod nagłówkiem">
          <Input
            value={cfg.note}
            onChange={(e) => patch({ note: e.target.value })}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Reguły terminów">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Długość slotu (min)">
            <Input
              type="number"
              min={15}
              step={15}
              value={cfg.slotMinutes}
              onChange={(e) =>
                patch({ slotMinutes: Number(e.target.value) || 60 })
              }
            />
          </Field>
          <Field label="Min. wyprzedzenie (godz.)" hint="Ile godzin naprzód">
            <Input
              type="number"
              min={0}
              value={cfg.leadHours}
              onChange={(e) => patch({ leadHours: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Horyzont (dni)" hint="Jak daleko w przód">
            <Input
              type="number"
              min={1}
              value={cfg.horizonDays}
              onChange={(e) =>
                patch({ horizonDays: Number(e.target.value) || 30 })
              }
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Godziny pracy (dni tygodnia)">
        <div className="space-y-2">
          {weeklyInDisplayOrder(cfg.weekly).map((w) => (
            <div
              key={w.day}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
            >
              <label className="flex w-40 items-center gap-2.5 text-sm">
                <Checkbox
                  checked={w.enabled}
                  onCheckedChange={(v) => setDay(w.day, { enabled: v })}
                  ariaLabel={`${WEEKDAY_LABEL[w.day]} — dostępny`}
                />
                <span className={w.enabled ? "font-medium" : "text-muted-foreground"}>
                  {WEEKDAY_LABEL[w.day]}
                </span>
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={w.from}
                  disabled={!w.enabled}
                  onChange={(e) => setDay(w.day, { from: e.target.value })}
                  className="h-9 rounded-lg border border-input bg-background px-2 disabled:opacity-50"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={w.to}
                  disabled={!w.enabled}
                  onChange={(e) => setDay(w.day, { to: e.target.value })}
                  className="h-9 rounded-lg border border-input bg-background px-2 disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Wyłączone dni (urlop, święta)">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Dodaj datę">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              if (!newDate || cfg.blockedDates.includes(newDate)) return;
              patch({ blockedDates: [...cfg.blockedDates, newDate].sort() });
              setNewDate("");
            }}
          >
            <Plus className="size-4" aria-hidden /> Dodaj
          </Button>
        </div>
        {cfg.blockedDates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {cfg.blockedDates.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm"
              >
                {formatDatePl(d)}
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      blockedDates: cfg.blockedDates.filter((x) => x !== d),
                    })
                  }
                  aria-label={`Usuń ${d}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Brak wyłączonych dni.
          </p>
        )}
      </Fieldset>

      <Fieldset legend="Usługi do wyboru w rezerwacji">
        <Field
          label="Lista usług"
          hint="Każda usługa w osobnej linii — pokazują się w polu wyboru."
        >
          <textarea
            rows={5}
            value={cfg.services.join("\n")}
            onChange={(e) =>
              patch({
                services: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz dostępność"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
