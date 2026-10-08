import { TriangleAlert } from "lucide-react";
import {
  ELEMENTY,
  GWINT_DROBNY,
  GWINT_ZWYKLY,
  KLASY,
  TYLKO_PRODUCENT,
  ZASADY,
  liczba,
  nm,
  type StanGwintu,
  type WierszGwintu,
} from "@/lib/momenty-srub";

const WYROZNIENIE = "bg-[color-mix(in_srgb,var(--akcent)_18%,var(--background))]";
/** Zalecany moment — zielony, żeby od razu odróżniał się od min / maks. */
const ZIELONY = "bg-[oklch(0.93_0.05_150)]";

const KOLUMNY = ["min", "zalecany", "maks"] as const;

const OPISY: Record<StanGwintu, { zwykly: string; drobny: string }> = {
  sucho: {
    zwykly:
      "Śruby stalowe, Nm. Gwint czysty i suchy, bez smaru. Zalecany — typowa śruba ocynkowana; min — gwint gładszy; maks — gwint szorstki, matowy.",
    drobny: "Kolumny jak wyżej. Skok gwintu sprawdź przed dokręceniem.",
  },
  smar: {
    zwykly:
      "Śruby stalowe, Nm. Gwint naoliwiony, nasmarowany albo z pastą. Zalecany — typowo; min — smar bardzo śliski (np. MoS₂, pasta montażowa); maks — lekko naoliwiony.",
    drobny: "Kolumny jak wyżej. Skok gwintu sprawdź przed dokręceniem.",
  },
};

function TabelaKlas({ tytul, opis, wiersze, stan }: { tytul: string; opis: string; wiersze: WierszGwintu[]; stan: StanGwintu }) {
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink">
      <div className="border-b-[3px] border-ink bg-akcent px-4 py-2">
        <p className="text-[16px] font-bold">{tytul}</p>
        <p className="text-[11px] leading-snug text-pretty">{opis}</p>
      </div>
      <div className="grid grid-cols-[auto_repeat(9,1fr)]">
        <p className="etykieta-sm row-span-2 self-end px-3 pb-1.5 text-muted-foreground">gwint</p>
        {KLASY.map((k) => (
          <p key={k} className="col-span-3 border-l-2 border-ink pt-2 text-center text-[14px] font-bold tabular-nums">
            klasa {k}
          </p>
        ))}
        {KLASY.map((k) =>
          KOLUMNY.map((kol, i) => (
            <p
              key={`${k}-${kol}`}
              className={`etykieta-sm pt-0.5 pb-1.5 text-center text-[8.5px] ${i === 0 ? "border-l-2 border-ink" : ""} ${
                i === 1 ? "text-ink" : "text-muted-foreground"
              }`}
            >
              {kol}
            </p>
          )),
        )}
        {wiersze.map((w) => (
          <div key={w.gwint} className="contents">
            <p className="border-t border-dashed border-kreska px-3 py-[6px] text-[14px] font-bold whitespace-nowrap tabular-nums">
              {w.gwint}
            </p>
            {KLASY.map((k) =>
              w[stan][k].map((wartosc, i) => (
                <p
                  key={`${k}-${i}`}
                  className={`border-t border-dashed border-kreska py-[6px] text-center whitespace-nowrap tabular-nums ${
                    i === 0 ? "border-l-2 border-l-ink" : ""
                  } ${i === 1 ? `${ZIELONY} text-[14.5px] font-bold` : "text-[11.5px] font-medium text-tekst"}`}
                >
                  {liczba(wartosc)}
                </p>
              )),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartki 1–2: śruby stalowe według klasy — osobno sucha i smarowana. */
export function PlakatMomentySrubKlasy({ stan }: { stan: StanGwintu }) {
  return (
    <>
      <TabelaKlas tytul="Gwint metryczny zwykły" opis={OPISY[stan].zwykly} wiersze={GWINT_ZWYKLY} stan={stan} />
      <TabelaKlas tytul="Gwint metryczny drobny" opis={OPISY[stan].drobny} wiersze={GWINT_DROBNY} stan={stan} />
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl border-[2.5px] border-ink px-3.5 py-2.5 text-[11.5px] leading-snug text-pretty">
        {ZASADY.map((z) => (
          <li key={z} className="flex gap-2">
            <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-ink" />
            {z}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Kartka 2: elementy samochodu z danymi producentów części i śruby tylko wg producenta. */
export function PlakatMomentySrubElementy() {
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-3">
        {ELEMENTY.map((grupa) => (
          <div key={grupa.nazwa} className="overflow-hidden rounded-xl border-[2.5px] border-ink">
            <div className="border-b-[2.5px] border-ink bg-akcent px-3 py-1.5">
              <p className="text-[13.5px] leading-tight font-bold">{grupa.nazwa}</p>
              {grupa.opis ? <p className="text-[10.5px] leading-tight">{grupa.opis}</p> : null}
            </div>
            <ul>
              {grupa.wpisy.map((wpis) => (
                <li
                  key={wpis.element}
                  className={`flex items-baseline justify-between gap-2 border-t border-dashed border-kreska px-3 py-1.5 first:border-t-0 ${
                    wpis.niepewny ? WYROZNIENIE : ""
                  }`}
                >
                  <p className="text-[12px] leading-tight font-medium">{wpis.element}</p>
                  <span className="flex items-center gap-1">
                    {wpis.niepewny ? (
                      <TriangleAlert aria-label="Źródła się różnią" className="size-3 shrink-0" strokeWidth={2.5} />
                    ) : null}
                    <span className="text-[15px] leading-none font-bold whitespace-nowrap tabular-nums">
                      {nm(wpis.nm)}
                      <span className="ml-0.5 text-[9px] font-medium text-muted-foreground">Nm</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
        <TriangleAlert aria-hidden className="size-3 shrink-0" strokeWidth={2.5} />
        źródła się różnią — sprawdź dane producenta
      </p>

      <div className={`rounded-xl border-[3px] border-ink p-3.5 ${WYROZNIENIE}`}>
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <TriangleAlert aria-hidden className="size-5 shrink-0" strokeWidth={2.5} />
          Tylko według danych producenta — nie z tabeli
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {TYLKO_PRODUCENT.map((p) => (
            <li key={p.co} className="text-[12px] leading-snug text-pretty">
              <span className="font-bold">{p.co}</span>
              <span className="text-tekst"> — {p.dlaczego}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
