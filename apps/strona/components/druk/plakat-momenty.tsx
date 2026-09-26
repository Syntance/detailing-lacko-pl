import { TriangleAlert } from "lucide-react";
import {
  BEZ_DANYCH,
  MOMENTY_KOL,
  PROCEDURA,
  ZRODLA,
  rozbiezny,
  type MarkaMomentow,
} from "@/lib/momenty-kol";

/** Ile kartek z tabelami marek (kartka nr 1 to wstęp: jak czytać, procedura, źródła). */
export const KARTKI_MOMENTOW = 4;

/** Szacunek wysokości karty w wierszach: nazwy modeli i uwagi zawijają się w wąskiej kolumnie. */
const wagaMarki = (m: MarkaMomentow) =>
  2 +
  m.wpisy.reduce(
    (suma, wpis) =>
      suma + Math.ceil(wpis.modele.length / 24) + (wpis.uwaga ? Math.ceil(wpis.uwaga.length / 40) * 0.7 : 0) + 0.3,
    0,
  );

/** Długa karta (np. busy) rozpychałaby jedną kolumnę — dzielimy ją na części „cd.". */
const MAX_WPISOW = 9;
function pociete(): MarkaMomentow[] {
  return MOMENTY_KOL.flatMap((m) => {
    if (m.wpisy.length <= MAX_WPISOW) return [m];
    const czesci = Math.ceil(m.wpisy.length / MAX_WPISOW);
    const naCzesc = Math.ceil(m.wpisy.length / czesci);
    return Array.from({ length: czesci }, (_, i) => ({
      marka: i === 0 ? m.marka : `${m.marka} (cd.)`,
      wpisy: m.wpisy.slice(i * naCzesc, (i + 1) * naCzesc),
    }));
  });
}

/** Marki po kolei (alfabetycznie) dzielone na kartki tak, żeby każda miała podobną wysokość. */
function podzielMarki(): MarkaMomentow[][] {
  const lista = pociete();
  const razem = lista.reduce((suma, m) => suma + wagaMarki(m), 0);
  const cel = razem / KARTKI_MOMENTOW;
  const kartki: MarkaMomentow[][] = Array.from({ length: KARTKI_MOMENTOW }, () => []);
  let biezaca = 0;
  let suma = 0;
  for (const marka of lista) {
    if (suma >= cel * (biezaca + 1) && biezaca < KARTKI_MOMENTOW - 1) biezaca += 1;
    kartki[biezaca]!.push(marka);
    suma += wagaMarki(marka);
  }
  return kartki;
}

/** Trzy kolumny bez łamania kart marek: każda marka idzie do aktualnie najniższej kolumny. */
function naKolumny(marki: MarkaMomentow[]): MarkaMomentow[][] {
  const kolumny: MarkaMomentow[][] = [[], [], []];
  const wysokosci = [0, 0, 0];
  for (const marka of marki) {
    const cel = wysokosci.indexOf(Math.min(...wysokosci));
    kolumny[cel]!.push(marka);
    wysokosci[cel]! += wagaMarki(marka);
  }
  return kolumny;
}

function Nm({ nm }: { nm: [number, number] }) {
  const [min, max] = nm;
  return (
    <span className="shrink-0 text-[15px] leading-none font-bold whitespace-nowrap tabular-nums">
      <span>{min === max ? min : `${min}–${max}`}</span>
      <span className="ml-0.5 text-[9px] font-medium text-muted-foreground">Nm</span>
    </span>
  );
}

function KartaMarki({ marka }: { marka: MarkaMomentow }) {
  return (
    <div className="overflow-hidden rounded-xl border-[2.5px] border-ink">
      <p className="border-b-[2.5px] border-ink bg-akcent px-3 py-1.5 text-[14px] font-bold">{marka.marka}</p>
      <ul>
        {marka.wpisy.map((wpis) => {
          const roznica = rozbiezny(wpis);
          return (
            <li
              key={wpis.modele}
              className={`flex flex-col gap-0.5 border-t border-dashed border-kreska px-3 py-1.5 first:border-t-0 ${
                roznica ? "bg-[color-mix(in_srgb,var(--akcent)_18%,var(--background))]" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[10.5px] leading-tight font-medium text-pretty">{wpis.modele}</p>
                <span className="flex items-center gap-1">
                  {roznica ? <TriangleAlert aria-label={wpis.jednoZrodlo ? "Jedno źródło" : "Źródła się różnią"} className="size-3 shrink-0" strokeWidth={2.5} /> : null}
                  <Nm nm={wpis.nm} />
                </span>
              </div>
              {wpis.uwaga ? (
                <p className="text-[8.5px] leading-snug text-pretty text-muted-foreground">{wpis.uwaga}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Kartka 1: jak czytać, procedura dokręcania, marki bez danych i źródła. */
export function PlakatMomentyWstep() {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border-[3px] border-ink bg-[color-mix(in_srgb,var(--akcent)_18%,var(--background))] p-4">
        <TriangleAlert aria-hidden className="mt-0.5 size-6 shrink-0" strokeWidth={2.5} />
        <div>
          <p className="text-[16px] leading-tight font-bold">Wartości orientacyjne — nie z instrukcji producentów</p>
          <p className="mt-1 text-[12.5px] leading-snug text-pretty text-tekst">
            Zestawiono je z kilku publicznych tabel warsztatowych. Obowiązuje moment podany w instrukcji
            pojazdu albo przez producenta felg — zwłaszcza tam, gdzie tabele się różnią lub jest tylko jedno
            źródło (wiersze zaznaczone kolorem), oraz przy nietypowych śrubach i felgach.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Jak czytać wpisy</p>
          <ul className="mt-2 flex flex-col gap-2.5 text-[11.5px] leading-snug text-tekst">
            <li className="flex items-center gap-2.5">
              <span className="w-[22mm] shrink-0 rounded-md border-2 border-ink px-2 py-1 text-center text-[13px] font-bold tabular-nums">
                120 Nm
              </span>
              <span>jedna liczba — źródła podają tę samą wartość</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex w-[22mm] shrink-0 items-center justify-center gap-1 rounded-md border-2 border-ink bg-[color-mix(in_srgb,var(--akcent)_18%,var(--background))] px-2 py-1 text-[13px] font-bold tabular-nums">
                <TriangleAlert aria-hidden className="size-3" strokeWidth={2.5} />
                110–140
              </span>
              <span>przedział — źródła się różnią; sprawdź instrukcję i rok modelu</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] leading-snug text-pretty text-muted-foreground">
            Ten sam kolor i trójkąt mają wpisy z jednego źródła (bez możliwości porównania), np. część dostawczych.
            Moment dotyczy śrub i nakrętek standardowych. Marki bez danych wymienione są niżej.
          </p>
        </div>

        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Dokręcanie — procedura</p>
          <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-[11.5px] leading-snug text-pretty text-tekst">
            {PROCEDURA.map((krok) => (
              <li key={krok}>{krok}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Bez danych w źródłach</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[11.5px] leading-snug text-tekst">
            {BEZ_DANYCH.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-pretty text-muted-foreground">
            Dla tych pojazdów bierz moment z instrukcji lub od producenta.
          </p>
        </div>
        <div className="rounded-xl border-[2.5px] border-ink p-3.5">
          <p className="text-[14px] font-bold">Źródła zestawienia</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[11px] leading-snug text-tekst">
            {ZRODLA.map((z) => (
              <li key={z}>{z}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/** Kartki 2–4: marki alfabetycznie w trzech kolumnach. */
export function PlakatMomentyMarki({ kartka }: { kartka: number }) {
  const marki = podzielMarki()[kartka] ?? [];
  const oznaczenie =
    marki.length > 0
      ? `${marki[0]!.marka} – ${marki[marki.length - 1]!.marka}`.replaceAll(" (cd.)", "")
      : "";
  return (
    <>
      <p className="etykieta-sm text-muted-foreground">{oznaczenie}</p>
      <div className="grid grid-cols-3 items-start gap-3">
        {naKolumny(marki).map((kolumna, i) => (
          <div key={i} className="flex flex-col gap-3">
            {kolumna.map((marka) => (
              <KartaMarki key={marka.marka} marka={marka} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
