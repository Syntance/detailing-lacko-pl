import { TriangleAlert } from "lucide-react";
import {
  ELEMENTY,
  GDZIE_SZUKAC,
  GWINT_DROBNY,
  GWINT_ZWYKLY,
  KLASY,
  TYLKO_PRODUCENT,
  ZASADY,
  ZRODLA_SRUB,
  nm,
  type WierszGwintu,
} from "@/lib/momenty-srub";

const WYROZNIENIE = "bg-[color-mix(in_srgb,var(--akcent)_18%,var(--background))]";

function TabelaKlas({ tytul, opis, wiersze }: { tytul: string; opis: string; wiersze: WierszGwintu[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className="border-b-[3px] border-ink bg-akcent px-4 py-2">
        <p className="text-[16px] font-bold">{tytul}</p>
        <p className="text-[11px] leading-snug text-pretty">{opis}</p>
      </div>
      <div className="grid grid-cols-[1fr_repeat(3,1.2fr)]">
        <p className="etykieta-sm px-4 py-2 text-muted-foreground">gwint</p>
        {KLASY.map((k) => (
          <p key={k} className="px-3 py-2 text-center text-[14px] font-bold tabular-nums">
            klasa {k}
          </p>
        ))}
        {wiersze.map((w) => (
          <div key={w.gwint} className="contents">
            <p className="border-t border-dashed border-kreska px-4 py-[7px] text-[15px] font-bold tabular-nums">
              {w.gwint}
            </p>
            {KLASY.map((k) => (
              <p
                key={k}
                className="border-t border-dashed border-kreska px-3 py-[7px] text-center text-[15px] font-semibold whitespace-nowrap tabular-nums"
              >
                {nm(w.nm[k])}
                <span className="ml-0.5 text-[9px] font-medium text-muted-foreground">Nm</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartka 1: śruby stalowe według klasy wytrzymałości i zasady dokręcania. */
export function PlakatMomentySrubKlasy() {
  return (
    <>
      <TabelaKlas
        tytul="Gwint metryczny zwykły"
        opis="Momenty maksymalne dla śrub stalowych (ISO 898-1), µ 0,12–0,14 — przedział od gwintu suchego do lekko naoliwionego."
        wiersze={GWINT_ZWYKLY}
      />
      <TabelaKlas
        tytul="Gwint metryczny drobny"
        opis="Jedno źródło (TR Fastenings), wartości zaokrąglone do 5 Nm. Skok gwintu sprawdź przed dokręceniem."
        wiersze={GWINT_DROBNY}
      />
      <div className="rounded-xl border-[2.5px] border-ink p-3.5">
        <p className="text-[14px] font-bold">Zanim dokręcisz</p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[12px] leading-snug text-pretty text-tekst">
          {ZASADY.map((z) => (
            <li key={z}>{z}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Kartka 2: elementy samochodu z danymi, śruby tylko wg producenta, źródła. */
export function PlakatMomentySrubElementy() {
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-3">
        {ELEMENTY.map((grupa) => (
          <div key={grupa.nazwa} className="overflow-hidden rounded-xl border-[2.5px] border-ink">
            <div className="border-b-[2.5px] border-ink bg-akcent px-3 py-1.5">
              <p className="text-[13.5px] leading-tight font-bold">{grupa.nazwa}</p>
            </div>
            <ul>
              {grupa.wpisy.map((wpis) => (
                <li
                  key={wpis.element}
                  className={`flex flex-col gap-0.5 border-t border-dashed border-kreska px-3 py-1.5 first:border-t-0 ${
                    wpis.niepewny ? WYROZNIENIE : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] leading-tight font-medium">{wpis.element}</p>
                    <span className="flex items-center gap-1">
                      {wpis.niepewny ? (
                        <TriangleAlert aria-label="Jedno źródło lub źródła się różnią" className="size-3 shrink-0" strokeWidth={2.5} />
                      ) : null}
                      <span className="text-[15px] leading-none font-bold whitespace-nowrap tabular-nums">
                        {nm(wpis.nm)}
                        <span className="ml-0.5 text-[9px] font-medium text-muted-foreground">Nm</span>
                      </span>
                    </span>
                  </div>
                  {wpis.uwaga ? (
                    <p className="text-[9.5px] leading-snug text-pretty text-muted-foreground">{wpis.uwaga}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            {grupa.opis ? (
              <p className="border-t-2 border-ink px-3 py-1.5 text-[10.5px] leading-snug text-pretty text-tekst">
                {grupa.opis}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
        <TriangleAlert aria-hidden className="size-3 shrink-0" strokeWidth={2.5} />
        Kolorem zaznaczono wpisy z jednego źródła albo z rozbieżnymi źródłami — sprawdź dane producenta.
      </p>

      <div className={`rounded-xl border-[3px] border-ink p-3.5 ${WYROZNIENIE}`}>
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <TriangleAlert aria-hidden className="size-5 shrink-0" strokeWidth={2.5} />
          Tylko według danych producenta — nie z tabeli
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {TYLKO_PRODUCENT.map((p) => (
            <li key={p.co} className="text-[11.5px] leading-snug text-pretty">
              <span className="font-bold">{p.co}</span>
              <span className="text-tekst"> — {p.dlaczego}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Gdzie szukać momentu</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[11px] leading-snug text-pretty text-tekst">
            {GDZIE_SZUKAC.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Źródła zestawienia</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[10px] leading-snug text-pretty text-tekst">
            {ZRODLA_SRUB.map((z) => (
              <li key={z}>{z}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
