import { Fragment } from "react";
import { UKLAD_FELG, cal, zakresPraktyczny, zakresySrednic, type BlokFelg } from "@/lib/felgi";

/** Zakres felgi — zielony, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

const KOLUMNY = "grid-cols-[11mm_9mm_minmax(0,1fr)_17mm]";

function Kolumna({ bloki }: { bloki: BlokFelg[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className={`grid ${KOLUMNY} items-end border-b-[3px] border-ink bg-akcent`}>
        <p className="etykieta-sm px-1.5 py-1.5 text-[8px]">opona</p>
        <p className="etykieta-sm py-1.5 text-[8px]">prof.</p>
        <p className="etykieta-sm py-1.5 text-[8px]">średnice R</p>
        <p className="etykieta-sm border-l-2 border-ink py-1.5 text-center text-[8px] font-bold">felga ″</p>
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
            const zakres = zakresPraktyczny(w);
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
                <p
                  className={`${ramka} ${ZIELONY} border-l-2 border-l-ink py-[3px] text-center text-[12px] leading-tight whitespace-nowrap tabular-nums`}
                >
                  <strong>{cal(zakres.od)}</strong>
                  {zakres.do !== null ? <span className="text-[10.5px] font-medium">–{cal(zakres.do)}</span> : null}
                </p>
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Jedna kartka tabeli doboru felg: trzy kolumny + legenda. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  const zGoodyear = kolumny.some((k) => k.some((b) => b.wiersze.some((w) => w.zrodlo === "goodyear")));
  return (
    <>
      <div className="grid grid-cols-3 items-start gap-2.5">
        {kolumny.map((bloki, i) => (
          <Kolumna key={i} bloki={bloki} />
        ))}
      </div>

      <div className="flex flex-col gap-1 rounded-xl border-[2.5px] border-ink px-3.5 py-2 text-[10.5px] leading-snug text-pretty">
        <p>
          <strong>Jak czytać:</strong> opona 245/45 R18 → blok <strong>245</strong>, wiersz <strong>/45</strong> →
          felga <strong>8–8,5″</strong>. Pierwsza liczba (pogrubiona) to felga pomiarowa wg normy ETRTO — najlepsze
          dopasowanie; druga to szersza, która też dobrze trzyma oponę.
        </p>
        <p className="text-[9.5px] text-tekst">
          Norma dopuszcza też węższe i szersze felgi, ale na skrajach montaż bywa niemożliwy (np. 245/45 R18 nie wchodzi
          na dopuszczone 7,5J). Średnice w nawiasie — rozmiary spoza normy ETRTO 2016, felga jak dla tej samej
          szerokości i profilu.
          {zGoodyear ? " * Para spoza normy ETRTO — wg katalogu Goodyear." : ""}
        </p>
        <p className="text-[9px] text-muted-foreground">
          Źródło: ETRTO Standards Manual 2016, felgi dopuszczone dla opon osobowych (oznaczenie metryczne). O rozmiarze
          dopuszczonym do auta decydują dane pojazdu (COC / homologacja).
        </p>
      </div>
    </>
  );
}
