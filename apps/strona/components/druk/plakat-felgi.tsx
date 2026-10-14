import { cal, UKLAD_FELG, zakresFelgi, zakresySrednic, type BlokFelg } from "@/lib/felgi";

/** Optimum (felga pomiarowa) — zielone tło, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

/**
 * Trzy wąskie tabele w rzędzie: opona | profil | średnice | felga.
 * Kolumna felg (26 mm) mieści najszerszy zakres „10,5–11–11,5” bez wychodzenia
 * poza ramkę; średnice zajmują resztę i zawijają się zamiast rozciągać tabelę.
 */
const WIERSZ = "grid grid-cols-[8mm_minmax(0,1fr)_26mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-ink">
      <div className="grid grid-cols-[10mm_8mm_minmax(0,1fr)_26mm] items-end border-b-2 border-ink bg-akcent">
        <p className="etykieta-sm px-1 py-1 text-[6.5px]">opona</p>
        <p className="etykieta-sm py-1 text-[6.5px]">prof.</p>
        <p className="etykieta-sm py-1 text-[6.5px]">średnice R</p>
        <p className="etykieta-sm py-1 text-center text-[6.5px]">felga ″</p>
      </div>
      {bloki.map((blok, b) => (
        <div key={`${blok.szerokosc}-${blok.ciagDalszy}`} className={`relative flex ${b > 0 ? "border-t-2 border-ink" : ""}`}>
          {/* Jedna przerywana kreska na całą wysokość bloku — równe kreski, bez faz z każdego wiersza osobno. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[26mm] border-l-2 border-dashed border-ink" />
          <div className="flex w-[10mm] shrink-0 flex-col items-start justify-center px-1 py-0.5">
            <p className="text-[11px] leading-none font-bold tabular-nums">{blok.szerokosc}</p>
            {blok.ciagDalszy ? <p className="etykieta-sm mt-0.5 text-[5.5px] text-muted-foreground">cd.</p> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            {blok.wiersze.map((w, i) => {
              const zakres = zakresFelgi(w);
              // Pasy liczone po całej kolumnie (nie od nowa przy każdej szerokości), żeby były równe.
              const nrWKolumnie = bloki.slice(0, b).reduce((s, x) => s + x.wiersze.length, 0) + i;
              const pasek = nrWKolumnie % 2 === 1 ? "bg-muted" : "";
              return (
                <div
                  key={w.profil}
                  className={`${WIERSZ} ${pasek} ${i > 0 ? "border-t border-dashed border-kreska" : ""}`}
                >
                  <p className="py-[2px] text-[9px] leading-tight font-bold tabular-nums">/{w.profil}</p>
                  <p className="py-[2px] pr-0.5 text-[7.5px] leading-tight text-pretty text-tekst tabular-nums">
                    {zakresySrednic(w.srednice)}
                    {w.spozaNormy.length ? (
                      <span className="text-muted-foreground">
                        {w.srednice.length ? ", " : ""}({zakresySrednic(w.spozaNormy)})
                      </span>
                    ) : null}
                    {w.zrodlo === "goodyear" ? <sup className="ml-0.5 text-[6px] font-bold text-ink">*</sup> : null}
                  </p>
                  <div className="grid grid-cols-[1fr_9mm_1fr] items-center py-[2px] text-[8px] leading-tight whitespace-nowrap tabular-nums">
                    <span className="pr-px text-right">{cal(zakres.min)}–</span>
                    <strong className={`${ZIELONY} rounded-sm py-px text-center text-[9px]`}>{cal(zakres.opt)}</strong>
                    <span className="pl-px text-left">–{cal(zakres.max)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Jedna kartka tabeli doboru felg: trzy kolumny obok siebie. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  return (
    <div className="grid grid-cols-3 items-start gap-2">
      {kolumny.map((bloki, i) => (
        <Kolumna key={i} bloki={bloki} />
      ))}
    </div>
  );
}
