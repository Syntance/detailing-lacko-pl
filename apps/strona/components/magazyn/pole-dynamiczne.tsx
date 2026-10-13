"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Button, Input, cn } from "@moduly/ui";
import { CircleDollarSign, Search, Sparkles, TriangleAlert, X } from "lucide-react";
import { formatItemKwota, itemVariants } from "@/lib/cennik";
import {
  FORMATY_CENY,
  OPISY_FORMATU,
  PROSTE_ZNACZNIKI,
  cenaZCennika,
  czyMaZnaczniki,
  rozwinTekst,
  znacznikCeny,
  type DaneDynamiczne,
  type FormatCeny,
} from "@/lib/dynamiczne";
import { LINIA_INFO, LINIE, type Linia } from "@/lib/linie";

type PoleProps = {
  value: string;
  onChange: (value: string) => void;
  dane: DaneDynamiczne;
  /** Linia otwierana domyślnie w wyborze ceny. */
  linia?: Linia;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: ComponentProps<"input">["aria-invalid"];
};

/**
 * Pole tekstowe z paskiem „Wstaw dynamiczny element". Klik wstawia znacznik
 * w miejscu kursora (albo zamiast zaznaczenia); cena otwiera okno wyboru
 * pozycji z cennika. Pod polem — podgląd, jak tekst wygląda na stronie.
 */
export function PoleDynamiczne({
  value,
  onChange,
  dane,
  linia = "detailing",
  multiline,
  rows = 3,
  placeholder,
  className,
  ...aria
}: PoleProps) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  // Ostatnie zaznaczenie — klik w przycisk/okno zabiera fokus z pola.
  // `null` = pole jeszcze nieużywane → wstawiamy na końcu tekstu.
  const zaznaczenie = useRef<[number, number] | null>(null);
  const [oknoCeny, setOknoCeny] = useState(false);

  /** Zapamiętuje kursor, gdy pole ma fokus (wołane też tuż przed klikiem w przycisk). */
  const zapamietaj = () => {
    const el = ref.current;
    if (el && document.activeElement === el) {
      zaznaczenie.current = [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length];
    }
  };

  function wstaw(znacznik: string) {
    const [s, k] = zaznaczenie.current ?? [value.length, value.length];
    const start = Math.min(s, value.length);
    const koniec = Math.min(k, value.length);
    const przed = value.slice(0, start);
    const po = value.slice(koniec);
    // Spacje wokół znacznika, gdy przylega do słowa — „od{cena}" byłoby nieczytelne.
    const lewa = przed && !/[\s(„"]$/.test(przed) ? " " : "";
    const prawa = po && !/^[\s,.;:!?)”"]/.test(po) ? " " : "";
    const nowy = `${przed}${lewa}${znacznik}${prawa}${po}`;
    onChange(nowy);
    const kursor = przed.length + lewa.length + znacznik.length + prawa.length;
    zaznaczenie.current = [kursor, kursor];
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(kursor, kursor);
    });
  }

  const podglad = useMemo(
    () => (czyMaZnaczniki(value) ? rozwinTekst(value, dane) : null),
    [value, dane],
  );

  const wspolne = {
    ref,
    value,
    placeholder,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    onSelect: zapamietaj,
    onKeyUp: zapamietaj,
    onClick: zapamietaj,
    onBlur: zapamietaj,
    ...aria,
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {multiline ? (
        <textarea
          {...wspolne}
          rows={rows}
          className={cn(
            "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            className,
          )}
        />
      ) : (
        <Input {...wspolne} className={className} />
      )}

      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Wstaw dynamiczny element">
        <span className="mr-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden /> Wstaw:
        </span>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); zapamietaj(); }}
          onClick={() => setOknoCeny(true)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <CircleDollarSign className="size-3.5" aria-hidden /> Cena z cennika…
        </button>
        {PROSTE_ZNACZNIKI.map((z) => (
          <button
            key={z.id}
            type="button"
            title={`${z.opis} — wstawia {${z.id}}`}
            onMouseDown={(e) => { e.preventDefault(); zapamietaj(); }}
            onClick={() => wstaw(`{${z.id}}`)}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {z.etykieta}
          </button>
        ))}
      </div>

      {podglad ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">Na stronie: </span>
          <span className="whitespace-pre-line text-foreground">{podglad.tekst || "(pusto)"}</span>
          {podglad.problemy.map((p) => (
            <p key={p} role="alert" className="mt-1 flex items-start gap-1.5 text-destructive">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              Element pominięty: {p}.
            </p>
          ))}
        </div>
      ) : null}

      {oknoCeny ? (
        <OknoCeny
          dane={dane}
          liniaStartowa={linia}
          onClose={() => setOknoCeny(false)}
          onWstaw={(znacznik) => {
            setOknoCeny(false);
            wstaw(znacznik);
          }}
        />
      ) : null}
    </div>
  );
}

type Wybor = { itemId: string; wariantId: string | null };

/**
 * Okno wyboru ceny: linia → pozycja (lub jej wariant) → format. Natywny
 * <dialog> (pułapka fokusu, Esc) w portalu — poza <label> pola, inaczej
 * kliknięcia w oknie aktywowałyby pole tekstowe.
 */
function OknoCeny({
  dane,
  liniaStartowa,
  onClose,
  onWstaw,
}: {
  dane: DaneDynamiczne;
  liniaStartowa: Linia;
  onClose: () => void;
  onWstaw: (znacznik: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [linia, setLinia] = useState<Linia>(liniaStartowa);
  const [szukaj, setSzukaj] = useState("");
  const [wybor, setWybor] = useState<Wybor | null>(null);
  const [format, setFormat] = useState<FormatCeny>("auto");

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const cennik = dane.cenniki[linia];
  const fraza = szukaj.trim().toLowerCase();
  const grupy = cennik.categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((kat) => ({
      kat,
      pozycje: cennik.items
        .filter((i) => i.categoryId === kat.id)
        .filter(
          (i) =>
            !fraza ||
            i.name.toLowerCase().includes(fraza) ||
            kat.name.toLowerCase().includes(fraza) ||
            itemVariants(i).some((v) => v.label.toLowerCase().includes(fraza)),
        )
        .sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.pozycje.length > 0);

  const wynik = wybor ? cenaZCennika(cennik, wybor.itemId, wybor.wariantId, format) : null;

  return createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="okno-ceny-tytul"
      className="m-auto flex max-h-[min(44rem,90dvh)] w-[min(40rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 open:flex"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id="okno-ceny-tytul" className="font-semibold">
          Wstaw cenę z cennika
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Zamknij">
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="space-y-3 border-b border-border px-5 py-3">
        <div role="radiogroup" aria-label="Cennik" className="flex gap-1.5">
          {LINIE.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={linia === l}
              onClick={() => {
                setLinia(l);
                setWybor(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                linia === l ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
              )}
            >
              Cennik: {LINIA_INFO[l].etykieta}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Szukaj usługi…"
            aria-label="Szukaj usługi w cenniku"
            className="pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        {grupy.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Brak pasujących pozycji.</p>
        ) : (
          <div role="radiogroup" aria-label="Pozycja cennika" className="space-y-4">
            {grupy.map(({ kat, pozycje }) => (
              <div key={kat.id}>
                <p className="mb-1.5 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
                  {kat.name}
                  {kat.disabled ? " · ukryta na stronie" : ""}
                </p>
                <ul className="space-y-1">
                  {pozycje.map((item) => {
                    const warianty = itemVariants(item);
                    const opcje: { wariantId: string | null; nazwa: string; cena: string }[] = [
                      {
                        wariantId: null,
                        nazwa: warianty.length ? `${item.name} — wszystkie warianty` : item.name,
                        cena: formatItemKwota(item),
                      },
                      ...warianty.map((v) => ({
                        wariantId: v.id,
                        nazwa: v.label,
                        cena: v.priceTo > v.priceFrom ? `${v.priceFrom}–${v.priceTo} zł` : `${v.priceFrom} zł`,
                      })),
                    ];
                    return opcje.map((o) => {
                      const aktywny = wybor?.itemId === item.id && wybor.wariantId === o.wariantId;
                      const ukryta = item.disabled || kat.disabled || item.priceHidden;
                      return (
                        <li key={`${item.id}:${o.wariantId ?? ""}`}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={aktywny}
                            onClick={() => setWybor({ itemId: item.id, wariantId: o.wariantId })}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                              o.wariantId ? "ml-4 w-[calc(100%-1rem)]" : "",
                              aktywny ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
                            )}
                          >
                            <span className={cn("min-w-0", ukryta && "text-muted-foreground")}>
                              {o.nazwa}
                              {item.disabled ? <span className="ml-1.5 text-xs">(ukryta)</span> : null}
                            </span>
                            <span className="shrink-0 font-medium tabular-nums">{o.cena}</span>
                          </button>
                        </li>
                      );
                    });
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border bg-card px-5 py-4">
        <div role="radiogroup" aria-label="Format ceny" className="flex flex-wrap gap-1.5">
          {FORMATY_CENY.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={format === f}
              onClick={() => setFormat(f)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                format === f ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {OPISY_FORMATU[f]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 text-sm" aria-live="polite">
            {!wynik ? (
              <span className="text-muted-foreground">Wybierz pozycję z listy.</span>
            ) : "problem" in wynik ? (
              <span className="text-destructive">Nie da się wstawić: {wynik.problem}.</span>
            ) : (
              <>
                <span className="text-muted-foreground">Wstawi: </span>
                <strong>{wynik.wartosc}</strong>
                <span className="text-muted-foreground"> — zmieni się sama razem z cennikiem</span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={!wybor || !wynik || "problem" in wynik}
              onClick={() => wybor && onWstaw(znacznikCeny(linia, wybor.itemId, wybor.wariantId, format))}
            >
              Wstaw cenę
            </Button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
