"use client";

import type { ReactNode } from "react";
import { Button } from "@moduly/ui";
import { ArrowDown, ArrowUp, Redo2, Trash2, Undo2 } from "lucide-react";

export function Fieldset({
  legend,
  actions,
  children,
}: {
  legend: string;
  /** Przyciski wyrównane do prawej w nagłówku (np. przesuń/usuń). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-border bg-card p-5">
      <legend className="flex w-full items-center justify-between gap-2 px-1 text-sm font-medium text-foreground">
        <span>{legend}</span>
        {actions}
      </legend>
      {children}
    </fieldset>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function StatusMessage({
  message,
  error,
}: {
  message: string | null;
  error?: boolean;
}) {
  if (!message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={`text-sm ${error ? "text-destructive" : "text-primary-strong"}`}
    >
      {message}
    </p>
  );
}

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  isDirty,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="gap-1.5"
      >
        <Undo2 className="size-4" aria-hidden /> Cofnij
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="gap-1.5"
      >
        <Redo2 className="size-4" aria-hidden /> Ponów
      </Button>
      {isDirty ? (
        <span className="text-xs text-muted-foreground">
          Niezapisane zmiany
        </span>
      ) : null}
    </div>
  );
}

/** Przyciski porządkowe wiersza listy: góra / dół / usuń. */
export function RowControls({
  onUp,
  onDown,
  onRemove,
  upDisabled,
  downDisabled,
  removeLabel,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onUp}
        disabled={upDisabled}
        aria-label="Przesuń wyżej"
      >
        <ArrowUp className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDown}
        disabled={downDisabled}
        aria-label="Przesuń niżej"
      >
        <ArrowDown className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={removeLabel}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

/** Zapis edytora: PUT JSON, komunikat po polsku. */
export async function putEditorData(
  url: string,
  payload: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      return { ok: false, error: "Sesja wygasła — zaloguj się ponownie." };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      return { ok: false, error: body?.error ?? "Zapis nie powiódł się." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Brak połączenia — spróbuj ponownie." };
  }
}
