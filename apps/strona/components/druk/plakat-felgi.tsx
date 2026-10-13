import { cal, UKLAD_FELG, zakresFelgi, zakresySrednic, type BlokFelg } from "@/lib/felgi";

/** Optimum (felga pomiarowa) — zielone tło, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

/**
 * Wiersz = jeden element z JEDNĄ kreską przerywaną nad nim (pełna szerokość,
 * bez kresek na każdej komórce osobno — przy kilku komórkach fazy kresek się
 * rozjeżdżały). Pionowa linia przy felgach to pełna, ciągła ramka komórki.
 */
const WIERSZ = "grid grid-cols-[10mm_minmax(0,1fr)_31mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className="grid grid-cols-[12mm_10mm_minmax(0,1fr)_31mm] items-end border-b-[3px] border-ink bg-akcent">
        <p className="etykieta-sm px-1.5 py-2 text-[9px]">opona</p>
        <p className="etykieta-sm py-2 text-[9px]">prof.</p>
        <p className="etykieta-sm py-2 text-[9px]">średnice R</p>
        <p className="etykieta-sm border-l-2 border-solid border-ink py-2 text-center text-[9px]">felga ″</p>
      </div>
      {bloki.map((blok, b) => (
        <div key={`${blok.szerokosc}-${blok.ciagDalszy}`} className={`flex ${b > 0 ? "border-t-2 border-ink" : ""}`}>
          <div className="flex w-[12mm] shrink-0 flex-col items-start justify-center px-1.5 py-1">
            <p className="text-[14px] leading-none font-bold tabular-nums">{blok.szerokosc}</p>
            {blok.ciagDalszy ? <p className="etykieta-sm mt-0.5 text-[7px] text-muted-foreground">cd.</p> : null}
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
                  <p className="py-[5px] text-[13px] leading-tight font-bold tabular-nums">/{w.profil}</p>
                  <p className="py-[5px] pr-1.5 text-[11px] leading-tight text-pretty text-tekst tabular-nums">
                    {zakresySrednic(w.srednice)}
                    {w.spozaNormy.length ? (
                      <span className="text-muted-foreground">
                        {w.srednice.length ? ", " : ""}({zakresySrednic(w.spozaNormy)})
                      </span>
                    ) : null}
                    {w.zrodlo === "goodyear" ? <sup className="ml-0.5 text-[8px] font-bold text-ink">*</sup> : null}
                  </p>
                  <div className="grid grid-cols-[1fr_11mm_1fr] items-center border-l-2 border-solid border-ink py-[5px] text-[12px] leading-tight whitespace-nowrap tabular-nums">
                    <span className="text-right">{cal(zakres.min)}–</span>
                    <strong className={`${ZIELONY} rounded-sm py-px text-center text-[14px]`}>{cal(zakres.opt)}</strong>
                    <span className="text-left">–{cal(zakres.max)}</span>
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

/** Jedna kartka tabeli doboru felg: dwie kolumny. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {kolumny.map((bloki, i) => (
        <Kolumna key={i} bloki={bloki} />
      ))}
    </div>
  );
}
