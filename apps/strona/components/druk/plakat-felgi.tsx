import { Fragment } from "react";
import { UKLAD_FELG, cal, zakresFelgi, zakresySrednic, type BlokFelg } from "@/lib/felgi";

/** Optimum (felga pomiarowa) — zielone tło, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

const KOLUMNY = "grid-cols-[11mm_9mm_minmax(0,1fr)_19mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className={`grid ${KOLUMNY} items-end border-b-[3px] border-ink bg-akcent`}>
        <p className="etykieta-sm px-1.5 py-1.5 text-[8px]">opona</p>
        <p className="etykieta-sm py-1.5 text-[8px]">prof.</p>
        <p className="etykieta-sm py-1.5 text-[8px]">średnice R</p>
        <p className="etykieta-sm border-l-2 border-ink py-1.5 text-center text-[8px]">felga ″</p>
      </div>
      {bloki.map((blok, b) => (
        <div key={`${blok.szerokosc}-${blok.ciagDalszy}`} className={`grid ${KOLUMNY} ${b > 0 ? "border-t-2 border-ink" : ""}`}>
          <div
            className="flex flex-col items-start justify-center px-1.5 py-1"
            style={{ gridRow: `span ${blok.wiersze.length} / span ${blok.wiersze.length}` }}
          >
            <p className="text-[14px] leading-none font-bold tabular-nums">{blok.szerokosc}</p>
            {blok.ciagDalszy ? <p className="etykieta-sm mt-0.5 text-[7px] text-muted-foreground">cd.</p> : null}
          </div>
          {blok.wiersze.map((w, i) => {
            const ramka = i > 0 ? "border-t border-dashed border-kreska" : "";
            const zakres = zakresFelgi(w);
            return (
              <Fragment key={w.profil}>
                <p className={`${ramka} py-[3px] text-[11.5px] leading-tight font-bold tabular-nums`}>/{w.profil}</p>
                <p className={`${ramka} py-[3px] pr-1 text-[9.5px] leading-tight text-pretty text-tekst tabular-nums`}>
                  {zakresySrednic(w.srednice)}
                  {w.spozaNormy.length ? (
                    <span className="text-muted-foreground">
                      {w.srednice.length ? ", " : ""}({zakresySrednic(w.spozaNormy)})
                    </span>
                  ) : null}
                  {w.zrodlo === "goodyear" ? <sup className="ml-0.5 text-[8px] font-bold text-ink">*</sup> : null}
                </p>
                <p className={`${ramka} border-l-2 border-l-ink py-[3px] text-center text-[10px] leading-tight whitespace-nowrap tabular-nums`}>
                  {cal(zakres.min)}–
                  <strong className={`${ZIELONY} rounded-sm px-0.5 text-[11.5px]`}>{cal(zakres.opt)}</strong>
                  –{cal(zakres.max)}
                </p>
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Jedna kartka tabeli doboru felg: trzy kolumny. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  return (
    <div className="grid grid-cols-3 items-start gap-2.5">
      {kolumny.map((bloki, i) => (
        <Kolumna key={i} bloki={bloki} />
      ))}
    </div>
  );
}
