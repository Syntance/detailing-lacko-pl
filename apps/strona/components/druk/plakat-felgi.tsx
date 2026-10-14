import { cal, UKLAD_FELG, zakresFelgi, zakresySrednic, type BlokFelg } from "@/lib/felgi";

/** Optimum (felga pomiarowa) — zielone tło, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

/**
 * Trzy wąskie tabele w rzędzie: opona | profil | średnice | optimum | zakres.
 * Optimum i zakres w osobnych kolumnach — główna odpowiedź (optimum) jest
 * duża, a zakres dopuszczalny drugi w kolejności; średnice dostają resztę
 * szerokości, żeby się nie łamały.
 */
const KOLUMNY_WIERSZA = "grid-cols-[7mm_minmax(0,1fr)_9mm_12mm]";
/** Szerokość optimum + zakresu — tu stoi przerywana kreska oddzielająca felgę od opony. */
const FELGA_RIGHT = "right-[21mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-ink">
      <div className="grid grid-cols-[10mm_7mm_minmax(0,1fr)_9mm_12mm] items-end border-b-2 border-ink bg-akcent">
        {/* Rozstaw liter węższy niż w zwykłej etykiecie — wąskie kolumny inaczej zlewały i ucinały nagłówki. */}
        <p className="etykieta-sm px-1 py-1 text-[6.5px] tracking-[0.04em] whitespace-nowrap">opona</p>
        <p className="etykieta-sm py-1 text-[6.5px] tracking-[0.04em] whitespace-nowrap">prof.</p>
        <p className="etykieta-sm py-1 text-[6.5px] tracking-[0.04em] whitespace-nowrap">średnice</p>
        <p className="etykieta-sm py-1 text-center text-[6.5px] font-bold tracking-[0.04em] whitespace-nowrap">opt. ″</p>
        <p className="etykieta-sm py-1 text-center text-[6.5px] tracking-[0.04em] whitespace-nowrap">zakres ″</p>
      </div>
      {bloki.map((blok, b) => (
        <div key={`${blok.szerokosc}-${blok.ciagDalszy}`} className={`relative flex ${b > 0 ? "border-t-2 border-ink" : ""}`}>
          {/* Jedna przerywana kreska na całą wysokość bloku — równe kreski, bez faz z każdego wiersza osobno. */}
          <div aria-hidden className={`pointer-events-none absolute inset-y-0 ${FELGA_RIGHT} border-l-2 border-dashed border-ink`} />
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
                  className={`grid ${KOLUMNY_WIERSZA} items-center ${pasek} ${i > 0 ? "border-t border-dashed border-kreska" : ""}`}
                >
                  <p className="py-[2.5px] text-[9px] leading-tight font-bold tabular-nums">/{w.profil}</p>
                  <p className="py-[2.5px] pr-1 text-[7.5px] leading-tight text-pretty text-tekst tabular-nums">
                    {zakresySrednic(w.srednice)}
                    {w.spozaNormy.length ? (
                      <span className="text-muted-foreground">
                        {w.srednice.length ? ", " : ""}({zakresySrednic(w.spozaNormy)})
                      </span>
                    ) : null}
                    {w.zrodlo === "goodyear" ? <sup className="ml-0.5 text-[6px] font-bold text-ink">*</sup> : null}
                  </p>
                  <div className="flex items-center justify-center py-[2px] pl-[2.5px]">
                    <strong className={`${ZIELONY} w-full rounded-sm py-px text-center text-[9.5px] leading-tight tabular-nums`}>
                      {cal(zakres.opt)}
                    </strong>
                  </div>
                  <p className="py-[2.5px] text-center text-[7.5px] leading-tight whitespace-nowrap text-tekst tabular-nums">
                    {zakres.min === zakres.max ? cal(zakres.min) : `${cal(zakres.min)}–${cal(zakres.max)}`}
                  </p>
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
    <div className="grid grid-cols-3 items-start gap-1.5">
      {kolumny.map((bloki, i) => (
        <Kolumna key={i} bloki={bloki} />
      ))}
    </div>
  );
}
