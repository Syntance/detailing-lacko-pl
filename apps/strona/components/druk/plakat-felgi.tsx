import { cal, UKLAD_FELG, zakresFelgi, type BlokFelg } from "@/lib/felgi";

/** Optimum (felga pomiarowa) — zielone tło, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

/**
 * Wąskie tabele: opona | profil | optimum | zakres. Bez średnic — w ETRTO
 * szerokość felgi zależy tylko od szerokości i profilu opony.
 */
const KOLUMNY_NAGLOWKA = "grid-cols-[10mm_9mm_minmax(0,1fr)_14mm]";
const KOLUMNY_WIERSZA = "grid-cols-[9mm_minmax(0,1fr)_14mm]";
/** Opona + profil — tu stoi przerywana kreska oddzielająca oponę od felgi. */
const KRESKA_LEFT = "left-[19mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-ink">
      {/* Rozstaw liter węższy niż w zwykłej etykiecie — w wąskich kolumnach nagłówki się zlewały. */}
      <div className={`grid ${KOLUMNY_NAGLOWKA} items-end border-b-2 border-ink bg-akcent`}>
        <p className="etykieta-sm px-1 py-1 text-[6.5px] tracking-[0.04em] whitespace-nowrap">opona</p>
        <p className="etykieta-sm py-1 text-[6.5px] tracking-[0.04em] whitespace-nowrap">prof.</p>
        <p className="etykieta-sm py-1 text-center text-[6.5px] font-bold tracking-[0.04em] whitespace-nowrap">opt. ″</p>
        <p className="etykieta-sm py-1 text-center text-[6.5px] tracking-[0.04em] whitespace-nowrap">zakres ″</p>
      </div>
      {bloki.map((blok, b) => (
        <div key={`${blok.szerokosc}-${blok.ciagDalszy}`} className={`relative flex ${b > 0 ? "border-t-2 border-ink" : ""}`}>
          {/* Jedna przerywana kreska na całą wysokość bloku — równe kreski, bez faz z każdego wiersza osobno. */}
          <div aria-hidden className={`pointer-events-none absolute inset-y-0 ${KRESKA_LEFT} border-l-2 border-dashed border-ink`} />
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
                  <p className="py-[2.5px] text-[9.5px] leading-tight font-bold tabular-nums">/{w.profil}</p>
                  <div className="flex justify-center py-[2px]">
                    <strong className={`${ZIELONY} w-[10mm] rounded-sm py-px text-center text-[10px] leading-tight tabular-nums`}>
                      {cal(zakres.opt)}
                    </strong>
                  </div>
                  <p className="py-[2.5px] text-center text-[8px] leading-tight whitespace-nowrap text-tekst tabular-nums">
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

/** Kartka tabeli doboru felg: wąskie kolumny obok siebie. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  return (
    <div className="grid grid-cols-4 items-start gap-1.5">
      {kolumny.map((bloki, i) => (
        <Kolumna key={i} bloki={bloki} />
      ))}
    </div>
  );
}
