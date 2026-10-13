"use client";

import { cn } from "@moduly/ui";
import { KSZTALTY_MODULOW, KSZTALTY_OCZEK, KSZTALTY_SRODKOW } from "@/lib/kody-qr";
import {
  probkaModulow,
  ramkaOczka,
  srodekOczka,
  type KsztaltModulu,
  type KsztaltOczka,
  type KsztaltSrodka,
} from "@/lib/qr-geometria";

export const NAZWY_MODULOW: Record<KsztaltModulu, string> = {
  kwadrat: "Kwadraty",
  odstepy: "Kwadraty z odstępem",
  zaokraglone: "Zaokrąglone kwadraty",
  drobne: "Drobne kwadraty",
  kropki: "Kropki",
  "male-kropki": "Małe kropki",
  plynne: "Płynne",
  metro: "Kropki połączone",
  pionowe: "Pionowe paski",
  poziome: "Poziome paski",
  lisc: "Liście",
  romby: "Romby",
  osmiokaty: "Ośmiokąty",
  plusy: "Plusy",
  krzyzyki: "Krzyżyki",
  gwiazdki: "Gwiazdki",
  iskry: "Iskry",
  serca: "Serca",
};

export const NAZWY_RAMEK: Record<KsztaltOczka, string> = {
  kwadrat: "Kwadratowa",
  zaokraglone: "Zaokrąglona",
  kolo: "Okrągła",
  miekkie: "Miękki środek",
  lisc: "Liść",
  kropla: "Kropla",
  osmiokat: "Ośmiokątna",
  kropki: "Z kropek",
};

export const NAZWY_SRODKOW: Record<KsztaltSrodka, string> = {
  kwadrat: "Kwadrat",
  zaokraglony: "Zaokrąglony",
  kolo: "Koło",
  osmiokat: "Ośmiokąt",
  lisc: "Liść",
  kropla: "Kropla",
  plus: "Plus",
  romb: "Romb",
  kropki: "Dziewięć kropek",
  poziome: "Poziome paski",
  pionowe: "Pionowe paski",
};

/**
 * Kształty, które w teście odczytu (jsQR + ZXing, 300–1200 px) czytał tylko
 * jeden dekoder — działają, ale słabsze aparaty mogą mieć problem.
 */
export const OZDOBNE_MODULY = new Set<KsztaltModulu>([
  "male-kropki",
  "metro",
  "pionowe",
  "poziome",
  "romby",
  "plusy",
  "krzyzyki",
  "gwiazdki",
  "iskry",
  "serca",
]);
export const OZDOBNE_SRODKI = new Set<KsztaltSrodka>(["plus", "romb", "kropki"]);

function Kafelki<T extends string>({
  nazwa,
  opcje,
  wartosc,
  nazwy,
  ozdobne,
  onChange,
  viewBox,
  rysuj,
  evenodd,
}: {
  nazwa: string;
  opcje: readonly T[];
  wartosc: T;
  nazwy: Record<T, string>;
  ozdobne?: Set<T>;
  onChange: (v: T) => void;
  viewBox: string;
  rysuj: (k: T) => string;
  evenodd?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={nazwa} className="grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-2">
      {opcje.map((k) => {
        const wybrany = wartosc === k;
        const etykieta = `${nazwy[k]}${ozdobne?.has(k) ? " (ozdobny — słabiej czytelny)" : ""}`;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={wybrany}
            aria-label={etykieta}
            title={etykieta}
            onClick={() => onChange(k)}
            className={cn(
              "relative flex aspect-square items-center justify-center rounded-lg border-2 bg-card p-2 text-foreground transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              wybrany ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50 hover:bg-muted",
            )}
          >
            <svg viewBox={viewBox} className="size-full" aria-hidden>
              <path d={rysuj(k)} fill="currentColor" fillRule={evenodd ? "evenodd" : undefined} />
            </svg>
            {ozdobne?.has(k) ? (
              <span
                aria-hidden
                className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function KafelkiModulow({ wartosc, onChange }: { wartosc: KsztaltModulu; onChange: (k: KsztaltModulu) => void }) {
  return (
    <Kafelki
      nazwa="Kształt modułów"
      opcje={KSZTALTY_MODULOW}
      wartosc={wartosc}
      nazwy={NAZWY_MODULOW}
      ozdobne={OZDOBNE_MODULY}
      onChange={onChange}
      viewBox="-0.15 -0.15 5.3 5.3"
      rysuj={probkaModulow}
    />
  );
}

export function KafelkiRamek({ wartosc, onChange }: { wartosc: KsztaltOczka; onChange: (k: KsztaltOczka) => void }) {
  return (
    <Kafelki
      nazwa="Kształt ramki oczek"
      opcje={KSZTALTY_OCZEK}
      wartosc={wartosc}
      nazwy={NAZWY_RAMEK}
      onChange={onChange}
      viewBox="-0.3 -0.3 7.6 7.6"
      rysuj={(k) => ramkaOczka(0, 0, k, 0)}
      evenodd
    />
  );
}

export function KafelkiSrodkow({ wartosc, onChange }: { wartosc: KsztaltSrodka; onChange: (k: KsztaltSrodka) => void }) {
  return (
    <Kafelki
      nazwa="Kształt środka oczek"
      opcje={KSZTALTY_SRODKOW}
      wartosc={wartosc}
      nazwy={NAZWY_SRODKOW}
      ozdobne={OZDOBNE_SRODKI}
      onChange={onChange}
      viewBox="-0.4 -0.4 3.8 3.8"
      rysuj={(k) => srodekOczka(0, 0, k, 0)}
    />
  );
}
