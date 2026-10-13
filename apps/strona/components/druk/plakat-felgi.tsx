import { Fragment } from "react";
import { UKLAD_FELG, cal, zakresySrednic, type BlokKolumny } from "@/lib/felgi";

/** Wiersz z innymi wartościami niż reszta profilu — jak wyróżnienia w plakatach momentów. */
const WYROZNIENIE = "bg-[color-mix(in_srgb,var(--akcent)_22%,var(--background))]";
/** Optymalna felga — zielona, jak zalecany moment na plakacie śrub. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

const KOLUMNY = "grid-cols-[12.5mm_10mm_minmax(0,1fr)_9.5mm_11.5mm_9.5mm]";

function Kolumna({ bloki, przypisy }: { bloki: BlokKolumny[]; przypisy: Map<string, number> }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className={`grid ${KOLUMNY} items-end border-b-[3px] border-ink bg-akcent`}>
        <p className="etykieta-sm px-1.5 py-1.5 text-[8.5px]">opona</p>
        <p className="etykieta-sm py-1.5 text-[8.5px]">prof.</p>
        <p className="etykieta-sm py-1.5 pl-0.5 text-[8.5px]">średnice R</p>
        <p className="etykieta-sm border-l-2 border-ink py-1.5 text-center text-[8.5px]">min</p>
        <p className="etykieta-sm py-1.5 text-center text-[8.5px] font-bold">OK</p>
        <p className="etykieta-sm py-1.5 text-center text-[8.5px]">maks</p>
      </div>
      {bloki.map((blok, b) => (
        <div
          key={`${blok.szerokosc}-${blok.ciagDalszy}`}
          className={`grid ${KOLUMNY} ${b > 0 ? "border-t-2 border-ink" : ""}`}
        >
          <div
            className="flex flex-col items-start justify-center px-1.5 py-1"
            style={{ gridRow: `span ${blok.wiersze.length} / span ${blok.wiersze.length}` }}
          >
            <p className="text-[15px] leading-none font-bold tabular-nums">{blok.szerokosc}</p>
            {blok.ciagDalszy ? <p className="etykieta-sm mt-0.5 text-[7.5px] text-muted-foreground">cd.</p> : null}
          </div>
          {blok.wiersze.map((w, i) => {
            const tlo = w.wyjatek ? WYROZNIENIE : "";
            const ramka = i > 0 ? "border-t border-dashed border-kreska" : "";
            const nr = w.uwagi.map((u) => przypisy.get(u)).filter((n): n is number => n !== undefined);
            const pokazProfil = !w.wyjatek || blok.wiersze[i - 1]?.profil !== w.profil;
            return (
              <Fragment key={`${w.profil}-${w.srednice.join(".")}`}>
                <p className={`${ramka} ${tlo} py-[3px] text-[12px] leading-tight font-bold tabular-nums`}>
                  {pokazProfil ? `/${w.profil}` : <span className="pl-1 text-[10px] text-tekst">↳</span>}
                </p>
                <p className={`${ramka} ${tlo} py-[3px] pr-1 text-[10px] leading-tight text-pretty text-tekst tabular-nums`}>
                  {zakresySrednic(w.srednice)}
                  {nr.length ? <sup className="ml-0.5 text-[8px] font-bold text-ink">{nr.join(",")}</sup> : null}
                </p>
                <p className={`${ramka} ${tlo} border-l-2 border-l-ink py-[3px] text-center text-[10.5px] leading-tight text-tekst tabular-nums`}>
                  {cal(w.felga.min)}
                </p>
                <p className={`${ramka} ${ZIELONY} py-[3px] text-center text-[12.5px] leading-tight font-bold tabular-nums`}>
                  {cal(w.felga.ok)}
                </p>
                <p className={`${ramka} ${tlo} py-[3px] text-center text-[10.5px] leading-tight text-tekst tabular-nums`}>
                  {cal(w.felga.max)}
                </p>
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Jedna kartka tabeli doboru felg: dwie kolumny szerokości + legenda i przypisy tej kartki. */
export function PlakatFelgi({ kartka }: { kartka: number }) {
  const kolumny = UKLAD_FELG[kartka] ?? [];
  // Przypisy numerowane w obrębie kartki — tylko te, które na niej występują.
  const przypisy = new Map<string, number>();
  for (const kolumna of kolumny)
    for (const blok of kolumna)
      for (const w of blok.wiersze) for (const u of w.uwagi) if (!przypisy.has(u)) przypisy.set(u, przypisy.size + 1);

  return (
    <>
      <div className="grid grid-cols-2 items-start gap-3">
        {kolumny.map((bloki, i) => (
          <Kolumna key={i} bloki={bloki} przypisy={przypisy} />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] items-start gap-x-5 gap-y-1 rounded-xl border-[2.5px] border-ink px-3.5 py-2 text-[10.5px] leading-snug text-pretty">
        <p>
          <strong>Jak czytać:</strong> opona 205/55 R16 → blok <strong>205</strong>, wiersz <strong>/55</strong>,
          średnica 16 mieści się w „13–18” → felga <strong>6,5″</strong> (dopuszczalnie 5,5–7,5″). Szerokość felgi
          w calach.
        </p>
        <div className="flex flex-col gap-1 text-[9.5px]">
          <p className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-5 rounded-sm border border-ink ${ZIELONY}`} /> optymalna (OK)
          </p>
          <p className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-5 rounded-sm border border-ink ${WYROZNIENIE}`} /> ↳ inne wartości
            dla tej średnicy
          </p>
        </div>
        {przypisy.size ? (
          <ul className="col-span-2 flex flex-wrap gap-x-4 text-[9.5px] text-tekst">
            {[...przypisy].map(([tekst, nr]) => (
              <li key={nr}>
                <sup className="font-bold text-ink">{nr}</sup> {tekst}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="col-span-2 text-[9px] text-muted-foreground">
          Dane przykładowe wg katalogu technicznego Goodyear (zestawienie wulkanizacja.krakow.pl). Nie uwzględniają
          wymagań konkretnego auta — o dopuszczalnym rozmiarze decydują dane pojazdu (COC / homologacja).
        </p>
      </div>
    </>
  );
}
