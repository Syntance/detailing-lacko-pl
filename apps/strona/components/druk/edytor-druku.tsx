"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { CZCIONKI, PUSTA_EDYCJA, type EdycjaDruku } from "@/lib/druk-edycja";

type Styl = EdycjaDruku["styl"];

/** Elementy z tekstem, które da się edytować — tylko „liście", żeby edycja nie zjadała zagnieżdżonych. */
const SELEKTOR = "h1,h2,h3,h4,p,li,dt,dd,td,th,span";

/** Klucz „kartka:indeks" jest stabilny, dopóki nie zmieni się kod plakatu (patrz lib/druk-edycja.ts). */
export function elementyEdytowalne(): Map<string, HTMLElement> {
  const mapa = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>(".arkusz-a4").forEach((kartka, i) => {
    let j = 0;
    kartka.querySelectorAll<HTMLElement>(SELEKTOR).forEach((el) => {
      if (el.closest("svg") || el.querySelector(SELEKTOR) || !el.textContent?.trim()) return;
      mapa.set(`${i}:${j}`, el);
      j += 1;
    });
  });
  return mapa;
}

const fontCss = (id?: string) => CZCIONKI.find((c) => c.id === id)?.css;

export function zastosujStyl(styl: Styl) {
  document.querySelectorAll<HTMLElement>(".arkusz-a4").forEach((kartka) => {
    const ustaw = (nazwa: string, wartosc?: string) =>
      wartosc ? kartka.style.setProperty(nazwa, wartosc) : kartka.style.removeProperty(nazwa);
    ustaw("--akcent", styl.akcent);
    ustaw("--ink", styl.tekst);
    ustaw("--tekst", styl.tekst);
    ustaw("--background", styl.tlo);
    kartka.style.fontFamily = fontCss(styl.fontTekst) ?? "";
    // Inline zamiast reguły CSS ze zmienną: `var(--x, inherit)` w :is() wywracał kompilację globals.css.
    kartka.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
      h.style.fontFamily = fontCss(styl.fontNaglowki) ?? "";
    });
  });
}

/** Nakłada zapisane teksty; pomija te, pod którymi w kodzie stoi już inny oryginał. */
export function zastosujTeksty(mapa: Map<string, HTMLElement>, teksty: EdycjaDruku["teksty"]) {
  for (const [klucz, { oryginal, tekst }] of Object.entries(teksty)) {
    const el = mapa.get(klucz);
    if (el && el.textContent === oryginal) el.textContent = tekst;
  }
}

/** Kolor tokenu na pierwszej kartce — punkt startowy dla pola wyboru koloru. */
function kolorKartki(nazwa: string, zapas: string): string {
  const kartka = document.querySelector<HTMLElement>(".arkusz-a4");
  const wartosc = kartka ? getComputedStyle(kartka).getPropertyValue(nazwa).trim() : "";
  return /^#[0-9a-f]{6}$/i.test(wartosc) ? wartosc : zapas;
}

export function PanelEdycji({
  plakatId,
  styl,
  onStyl,
  zbierzTeksty,
  onZapisano,
  onZamknij,
}: {
  plakatId: string;
  styl: Styl;
  onStyl: (zmiana: (styl: Styl) => Styl) => void;
  zbierzTeksty: () => EdycjaDruku["teksty"];
  onZapisano: () => void;
  onZamknij: () => void;
}) {
  const [status, setStatus] = useState<"" | "zapisuje" | "zapisano" | "blad">("");
  const [domyslne] = useState(() => ({
    akcent: kolorKartki("--akcent", "#f0392e"),
    tekst: kolorKartki("--ink", "#0e0f11"),
    tlo: kolorKartki("--background", "#ffffff"),
  }));

  const zapisz = async (dane: EdycjaDruku) => {
    setStatus("zapisuje");
    try {
      const odp = await fetch(`/api/magazyn/druk/${plakatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dane),
      });
      if (!odp.ok) throw new Error(String(odp.status));
      setStatus("zapisano");
      onZapisano();
    } catch {
      setStatus("blad");
    }
  };

  const przywroc = async () => {
    if (!window.confirm("Przywrócić oryginalną treść, kolory i czcionki tego plakatu?")) return;
    await zapisz(PUSTA_EDYCJA);
    window.location.reload();
  };

  const pole = "flex flex-col gap-1 text-xs font-semibold";
  const wybor =
    "h-9 rounded-lg border-2 border-ink bg-background px-2 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none";

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-3 border-t-2 border-dashed border-kreska px-4 py-3">
      <p className="text-sm text-tekst">
        <strong>Tryb edycji:</strong> kliknij dowolny tekst na kartce i wpisz nowy (Enter kończy). Kolory i
        czcionki zmieniasz poniżej — widać je od razu. Rysunków i schematów nie da się tu edytować.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        {(
          [
            ["akcent", "Kolor akcentu"],
            ["tekst", "Tekst i ramki"],
            ["tlo", "Tło kartki"],
          ] as const
        ).map(([klucz, etykieta]) => (
          <label key={klucz} className={pole}>
            {etykieta}
            <input
              type="color"
              value={styl[klucz] ?? domyslne[klucz]}
              onChange={(e) => {
                const wartosc = e.target.value;
                onStyl((s) => ({ ...s, [klucz]: wartosc }));
              }}
              className="h-9 w-16 cursor-pointer rounded-lg border-2 border-ink bg-background p-0.5"
            />
          </label>
        ))}
        {(
          [
            ["fontNaglowki", "Czcionka nagłówków"],
            ["fontTekst", "Czcionka tekstu"],
          ] as const
        ).map(([klucz, etykieta]) => (
          <label key={klucz} className={pole}>
            {etykieta}
            <select
              value={styl[klucz] ?? "space"}
              onChange={(e) => {
                const wartosc = e.target.value;
                onStyl((s) => ({ ...s, [klucz]: wartosc }));
              }}
              className={wybor}
            >
              {CZCIONKI.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nazwa}
                </option>
              ))}
            </select>
          </label>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => zapisz({ styl, teksty: zbierzTeksty() })}
            disabled={status === "zapisuje"}
            className="cien-3 inline-flex items-center gap-1.5 rounded-xl border-[3px] border-ink bg-akcent px-3 py-1.5 text-sm font-bold disabled:opacity-60"
          >
            <Check className="size-4" aria-hidden />
            {status === "zapisuje" ? "Zapisuję…" : "Zapisz zmiany"}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-ink bg-background px-3 py-1.5 text-sm font-bold hover:bg-piasek"
            title="Odrzuć niezapisane zmiany"
          >
            <X className="size-4" aria-hidden />
            Anuluj
          </button>
          <button
            type="button"
            onClick={przywroc}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink/40 px-3 py-1.5 text-sm font-semibold text-tekst hover:bg-piasek"
            title="Usuń wszystkie zmiany tego plakatu"
          >
            <RotateCcw className="size-4" aria-hidden />
            Przywróć oryginał
          </button>
          <button type="button" onClick={onZamknij} className="px-2 py-1.5 text-sm font-semibold underline">
            Zamknij edycję
          </button>
        </div>
      </div>
      {status === "zapisano" ? (
        <p className="text-sm font-semibold text-[#15803d]">Zapisano — zmiany będą też na wydruku i w miniaturze.</p>
      ) : status === "blad" ? (
        <p className="text-sm font-semibold text-[var(--czerwony-mocny)]">
          Nie udało się zapisać. Sprawdź, czy jesteś zalogowany, i spróbuj ponownie.
        </p>
      ) : null}
    </div>
  );
}
