"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Maximize2, Table2, X } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PROFILE, TABELE_NAPRAW, type TabelaNapraw } from "@/lib/tabela-napraw";
import {
  KOLOR_STREFY,
  MiniStrefa,
  SchematAR,
  SchematCO,
  SchematS,
  SchematStrefNaprawy,
} from "./schematy-opon";

const STREFY = [
  { nazwa: "Środek bieżnika", opis: "grzybek albo łata, do 6–10 mm", kolor: KOLOR_STREFY.bieznik },
  { nazwa: "Bark", opis: "łata radialna, do 3–6 mm", kolor: KOLOR_STREFY.bark },
  { nazwa: "Bok", opis: "łata radialna, do 6–10 mm", kolor: KOLOR_STREFY.bok },
] as const;

/** Jasny odcień koloru strefy pod komórki tabeli — sam kolor byłby za ciężki na 30 wierszy. */
const tlo = (kolor: string, procent: number) =>
  `color-mix(in srgb, ${kolor} ${procent}%, var(--background))`;

function Numer({ n, kolor }: { n: number; kolor: string }) {
  return (
    <span
      aria-hidden
      className="grid size-7 shrink-0 place-items-center rounded-full border-[3px] border-ink text-sm font-bold"
      style={{ background: kolor }}
    >
      {n}
    </span>
  );
}

/** Prędkość maksymalna dla indeksu — oznaczenia standardowe (ETRTO). */
const PREDKOSC: Record<string, { tekst: string; kmh: number }> = {
  Q: { tekst: "do 160 km/h", kmh: 160 },
  T: { tekst: "do 190 km/h", kmh: 190 },
  H: { tekst: "do 210 km/h", kmh: 210 },
  V: { tekst: "do 240 km/h", kmh: 240 },
  ZR: { tekst: "ponad 240 km/h", kmh: 270 },
};

/** Największa wartość w tabeli — do niej skalujemy kółko „dziury". */
function maxMm(tabela: TabelaNapraw): number {
  let max = 1;
  for (const g of tabela.grupy)
    for (const w of g.wiersze)
      for (const v of [...w.bieznik, w.bark, ...w.bok.flat()])
        if (v !== null && v > max) max = v;
  return max;
}

/** Pole kółka rośnie z rozmiarem dziury (pierwiastek), żeby 3 mm i 140 mm mieściły się w jednej skali. */
const srednica = (mm: number, max: number) => 6 + Math.sqrt(mm / max) * 22;

function Komorka({
  wartosci,
  kolor,
  max,
}: {
  wartosci: (number | null)[];
  kolor: string;
  max: number;
}) {
  const liczby = wartosci.filter((v): v is number => v !== null);
  return (
    <td
      className="border-t-2 border-l-2 border-ink/15 px-2 py-2 text-[15px] font-bold tabular-nums"
      style={{ background: tlo(kolor, liczby.length ? 22 : 8) }}
    >
      {liczby.length === 0 ? (
        <span className="flex items-center justify-center">
          <span className="sr-only">nie naprawiam</span>
          <X aria-hidden className="size-4 text-muted-foreground" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="flex flex-col items-center gap-1">
          {liczby.map((mm, i) => (
            <span key={i} className="flex flex-col items-center">
              {i > 0 ? (
                <span className="etykieta-sm text-[9px] font-medium text-muted-foreground">
                  lub
                </span>
              ) : null}
              <span className="flex items-center justify-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center" aria-hidden>
                  <span
                    className="rounded-full border-2 border-ink bg-ink"
                    style={{ width: srednica(mm, max), height: srednica(mm, max) }}
                  />
                </span>
                <span className="w-8 text-left">{mm}</span>
              </span>
            </span>
          ))}
        </span>
      )}
    </td>
  );
}

function NaglowekStrefy({
  n,
  nazwa,
  strefa,
  colSpan,
}: {
  n: number;
  nazwa: string;
  strefa: keyof typeof KOLOR_STREFY;
  colSpan?: number;
}) {
  const kolor = KOLOR_STREFY[strefa];
  return (
    <th
      colSpan={colSpan}
      scope="colgroup"
      className="border-l-[3px] border-ink px-3 pt-3 pb-2.5 text-left text-[13px] font-bold text-ink"
      style={{ background: tlo(kolor, strefa === "bieznik" ? 100 : 70) }}
    >
      <span className="flex flex-col items-start gap-2">
        <MiniStrefa strefa={strefa} />
        <span className="flex items-center gap-2">
          <Numer n={n} kolor={kolor} /> {nazwa}
        </span>
      </span>
    </th>
  );
}

function Tabela({ tabela }: { tabela: TabelaNapraw }) {
  const { bieznik, bark, bok } = KOLOR_STREFY;
  const max = maxMm(tabela);
  const poIndeksie = tabela.podzial === "indeks";
  const podnaglowek =
    "etykieta-sm border-t-2 border-l-2 border-ink/15 px-2 py-1.5 text-center";

  return (
    <div className="overflow-x-auto rounded-xl border-[3px] border-ink">
      <table className="w-full min-w-[720px] border-collapse md:min-w-[780px]">
        <caption className="sr-only">
          Tabela napraw opon — {tabela.nazwa}: maksymalny rozmiar uszkodzenia
          w milimetrach dla strefy, {poIndeksie ? "indeksu prędkości" : "grupy rozmiarów"}{" "}
          i łatki
        </caption>
        <thead>
          <tr className="bg-ink text-background">
            <th rowSpan={2} scope="col" className="etykieta-sm sticky left-0 z-[2] w-[86px] bg-ink px-2.5 py-2.5 text-left align-bottom md:w-[132px] md:px-3">
              {poIndeksie ? "Indeks prędkości" : "Grupa rozmiarów"}
            </th>
            <th rowSpan={2} scope="col" className="etykieta-sm w-[76px] border-l-2 border-background/25 px-2.5 py-2.5 text-left align-bottom md:w-[92px] md:px-3">
              Łatka RAD
            </th>
            <NaglowekStrefy n={1} nazwa="Środek bieżnika" strefa="bieznik" colSpan={3} />
            <NaglowekStrefy n={2} nazwa="Bark" strefa="bark" />
            <NaglowekStrefy n={3} nazwa="Bok" strefa="bok" colSpan={2} />
          </tr>
          <tr className="text-ink">
            {["CØ", "A", "R"].map((k) => (
              <th key={`b-${k}`} scope="col" className={podnaglowek} style={{ background: tlo(bieznik, 40) }}>
                {k}
              </th>
            ))}
            <th scope="col" className={podnaglowek} style={{ background: tlo(bark, 40) }}>
              S
            </th>
            {["A", "R"].map((k) => (
              <th key={`s-${k}`} scope="col" className={podnaglowek} style={{ background: tlo(bok, 40) }}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        {tabela.grupy.map((grupa) => (
          <tbody key={grupa.nazwa} className="border-t-[3px] border-ink">
            {grupa.wiersze.map((wiersz, i) => (
              <tr key={wiersz.rad}>
                {i === 0 ? (
                  <th
                    rowSpan={grupa.wiersze.length}
                    scope="rowgroup"
                    className="sticky left-0 z-[1] bg-piasek px-2.5 py-2 text-left align-middle shadow-[3px_0_0_var(--ink)] md:px-3"
                  >
                    {poIndeksie ? (
                      <>
                        <span className="block text-2xl leading-none font-bold">{grupa.nazwa}</span>
                        {PREDKOSC[grupa.nazwa] ? (
                          <>
                            <span className="etykieta-sm mt-1.5 block text-[10px] font-medium text-muted-foreground">
                              {PREDKOSC[grupa.nazwa]!.tekst}
                            </span>
                            <span aria-hidden className="mt-1.5 block h-1.5 w-full max-w-[96px] overflow-hidden rounded-full border border-ink bg-background">
                              <span
                                className="block h-full bg-akcent"
                                style={{ width: `${(PREDKOSC[grupa.nazwa]!.kmh / 280) * 100}%` }}
                              />
                            </span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="etykieta-sm block text-[10px] font-medium text-muted-foreground">
                          grupa
                        </span>
                        <span className="block text-3xl leading-none font-bold">{grupa.nazwa}</span>
                        <span className="mt-1.5 block text-[12px] leading-tight font-medium text-pretty text-tekst">
                          {grupa.podpis}
                        </span>
                      </>
                    )}
                  </th>
                ) : null}
                <th
                  scope="row"
                  className="border-t-2 border-l-2 border-ink/15 bg-background px-2.5 py-2 text-left font-mono text-sm font-medium whitespace-nowrap md:px-3"
                >
                  {wiersz.rad}
                </th>
                {wiersz.bieznik.map((mm, k) => (
                  <Komorka key={`b${k}`} wartosci={[mm]} kolor={bieznik} max={max} />
                ))}
                <Komorka wartosci={[wiersz.bark]} kolor={bark} max={max} />
                <Komorka wartosci={wiersz.bok.map(([a]) => a)} kolor={bok} max={max} />
                <Komorka wartosci={wiersz.bok.map(([, r]) => r)} kolor={bok} max={max} />
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** Sylwetka przekroju opony o danym profilu — im niższy profil, tym niższy bok. */
function SylwetkaProfilu({ profil }: { profil: string }) {
  const gorny = Number(profil.split("-")[0]) / 100;
  const h = 8 + gorny * 26;
  return (
    <svg viewBox="0 0 48 40" aria-hidden focusable="false" className="h-7 w-auto">
      <rect
        x="5"
        y={38 - h}
        width="38"
        height={h}
        rx={Math.min(10, h / 2)}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}

const PRZYKLAD = { grupa: "2", profil: "75-70" } as const;

function KluczRozmiarow({ tabela }: { tabela: TabelaNapraw }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 rounded-xl border-2 border-ink bg-piasek p-4 md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-5">
        <div className="flex flex-col items-start gap-1.5">
          <p className="etykieta-sm text-muted-foreground">rozmiar na boku opony</p>
          <p className="flex items-end gap-2 font-mono text-2xl font-bold md:text-3xl">
            <span className="flex flex-col items-center">
              <span className="rounded-md border-[3px] border-ink bg-background px-1.5">245</span>
              <span className="etykieta-sm mt-1 text-[9px] font-medium text-muted-foreground">szerokość</span>
            </span>
            <span className="pb-5">/</span>
            <span className="flex flex-col items-center">
              <span className="rounded-md border-[3px] border-ink bg-akcent px-1.5">70</span>
              <span className="etykieta-sm mt-1 text-[9px] font-medium text-muted-foreground">profil</span>
            </span>
            <span className="flex flex-col items-center">
              <span className="px-1">R19.5</span>
              <span className="etykieta-sm mt-1 text-[9px] font-medium text-muted-foreground">felga</span>
            </span>
          </p>
        </div>
        <ol className="flex flex-col gap-1.5 text-sm text-pretty text-tekst">
          <li>
            <strong>1.</strong> Profil (druga liczba) wskazuje kolumnę — 70 to kolumna{" "}
            <strong>75-70</strong>.
          </li>
          <li>
            <strong>2.</strong> W tej kolumnie szukasz przedziału, w którym mieści się
            szerokość — 245 jest w <strong>grupie 2</strong>.
          </li>
          <li>
            <strong>3.</strong> Limity naprawy odczytujesz w wierszach tej grupy niżej.
          </li>
          <li className="text-muted-foreground">
            Stare rozmiary calowe (np. 8.25, 10.00) mają profil ok. 100–90.
          </li>
        </ol>
      </div>

      <div className="overflow-x-auto rounded-xl border-[3px] border-ink">
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="sr-only">
            Klucz rozmiarów: do której grupy należy opona o danym profilu i szerokości
          </caption>
          <thead>
            <tr className="bg-ink text-background">
              <th scope="col" className="etykieta-sm sticky left-0 z-[2] w-[86px] bg-ink px-2.5 py-2.5 text-left align-bottom md:w-[132px] md:px-3">
                Grupa
              </th>
              {PROFILE.map((profil) => (
                <th
                  key={profil}
                  scope="col"
                  className="border-l-2 border-background/25 px-2 py-2.5 text-center align-bottom"
                >
                  <span className="flex flex-col items-center gap-1.5">
                    <SylwetkaProfilu profil={profil} />
                    <span className="etykieta-sm">profil {profil}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.grupy.map((grupa) => (
              <tr key={grupa.nazwa} className="border-t-[3px] border-ink">
                <th
                  scope="row"
                  className="sticky left-0 z-[1] bg-piasek px-2.5 py-2.5 text-left align-middle shadow-[3px_0_0_var(--ink)] md:px-3"
                >
                  <span className="block text-2xl leading-none font-bold">{grupa.nazwa}</span>
                  <span className="mt-1 block text-[12px] leading-tight font-medium text-pretty text-tekst">
                    {grupa.podpis}
                  </span>
                </th>
                {PROFILE.map((profil) => {
                  const rozmiary = grupa.rozmiary?.[profil] ?? [];
                  const przyklad = grupa.nazwa === PRZYKLAD.grupa && profil === PRZYKLAD.profil;
                  return (
                    <td
                      key={profil}
                      className="border-l-2 border-ink/15 px-2 py-2.5 text-center align-middle"
                      style={przyklad ? { background: tlo("var(--akcent)", 22) } : undefined}
                    >
                      {rozmiary.length ? (
                        <span className="flex flex-col items-center gap-1">
                          {rozmiary.map((r) => (
                            <span
                              key={r}
                              className={`rounded-md border-2 px-1.5 py-0.5 font-mono text-[13px] font-medium whitespace-nowrap ${
                                przyklad ? "border-ink bg-background" : "border-ink/20 bg-background"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <X aria-label="brak rozmiarów" className="mx-auto size-4 text-muted-foreground" strokeWidth={2.5} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="etykieta-sm text-muted-foreground">
        podświetlona komórka = przykład 245/70 R19.5 · „245/ – 265/" = szerokości od 245 do 265 mm
      </p>
    </div>
  );
}

/** Co znaczą litery w nagłówkach tabeli — z rysunków w tabeli producenta łatek. */
function LegendaWymiarow() {
  const pozycje = [
    {
      Schemat: SchematCO,
      litery: [
        {
          litera: "CØ",
          tekst: "Średnica okrągłej dziury przebitej na wylot — np. po gwoździu albo wkręcie w bieżniku.",
        },
      ],
    },
    {
      Schemat: SchematAR,
      litery: [
        {
          litera: "R",
          tekst: "Długość przecięcia wzdłuż nitek osnowy (pionowe kreski na rysunku): na boku — od felgi w stronę bieżnika, w bieżniku — w poprzek, od barku do barku.",
        },
        {
          litera: "A",
          tekst: "Szerokość przecięcia wzdłuż obwodu opony, czyli w kierunku toczenia. Takie cięcie przecina wiele nitek naraz, dlatego limit A jest zwykle mniejszy niż R.",
        },
      ],
    },
    {
      Schemat: SchematS,
      litery: [
        {
          litera: "S",
          tekst: "Rozmiar dziury w barku — tam, gdzie bieżnik przechodzi w bok. Bark pracuje najmocniej, więc limit jest najmniejszy, a przy oponach ZR barku w ogóle się nie naprawia.",
        },
      ],
    },
  ];

  return (
    <section aria-labelledby="legenda-wymiarow" className="flex flex-col gap-4">
      <h4 id="legenda-wymiarow" className="text-lg font-bold">
        Co znaczą litery w tabeli
      </h4>
      <div className="grid gap-4 md:grid-cols-3">
        {pozycje.map(({ Schemat, litery }) => (
          <div
            key={litery[0]!.litera}
            className="flex flex-col gap-3 rounded-xl border-2 border-ink bg-background p-4"
          >
            <div className="kropki mx-auto w-full max-w-[220px] rounded-lg bg-piasek p-2">
              <Schemat />
            </div>
            <dl className="flex flex-col gap-2.5">
              {litery.map(({ litera, tekst }) => (
                <div key={litera} className="flex items-start gap-3">
                  <dt className="grid h-7 min-w-9 shrink-0 place-items-center rounded-md border-2 border-ink bg-akcent px-1.5 font-mono text-sm font-bold">
                    {litera}
                  </dt>
                  <dd className="text-sm leading-[1.5] text-pretty text-tekst">{tekst}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="text-sm text-pretty text-muted-foreground">
        Wszystkie wymiary mierzę po oczyszczeniu i przygotowaniu miejsca naprawy,
        bo dopiero wtedy widać prawdziwą wielkość uszkodzenia.
      </p>
    </section>
  );
}

function PopupTabeli({ onClose }: { onClose: () => void }) {
  const [aktywna, setAktywna] = useState<TabelaNapraw>(TABELE_NAPRAW[0]!);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tytulId = useId();
  const tabela = aktywna;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tytulId}
      className="fixed inset-0 z-50 bg-ink/70"
      onClick={onClose}
    >
      <div
        className="presence absolute inset-x-2 inset-y-3 overflow-y-auto rounded-2xl border-[3px] border-ink bg-background md:inset-x-8 md:inset-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-[3px] border-ink bg-background px-5 py-4 md:px-8">
          <div>
            <h3 id={tytulId} className="text-xl leading-tight font-bold md:text-2xl">
              Tabela napraw opon
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-pretty text-tekst">
              Maksymalny rozmiar uszkodzenia w mm, który wolno zamknąć łatką
              radialną — według tabeli producenta łatek. Krzyżyk oznacza, że
              w tej strefie takiej naprawy nie robię.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Zamknij tabelę"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-ink transition-colors hover:bg-akcent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mx-auto flex max-w-[1040px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div role="tablist" aria-label="Rodzaj pojazdu" className="flex flex-wrap gap-3">
            {TABELE_NAPRAW.map((t) => {
              const wybrana = t.id === aktywna.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={wybrana}
                  onClick={() => setAktywna(t)}
                  className={`rounded-full border-[3px] border-ink px-5 py-2 text-[15px] font-bold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                    wybrana ? "cien-3 bg-akcent" : "bg-background hover:bg-piasek"
                  }`}
                >
                  {t.nazwa}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" aria-label={tabela.nazwa} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="etykieta-sm text-muted-foreground">{tabela.opis}</p>
              <p className="etykieta-sm flex items-center gap-2 text-muted-foreground">
                <span aria-hidden className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-ink" />
                  <span className="size-2.5 rounded-full bg-ink" />
                  <span className="size-4 rounded-full bg-ink" />
                </span>
                wielkość kółka = rozmiar dziury w skali
              </p>
            </div>
            {tabela.podzial === "rozmiar" ? (
              <>
                <h4 className="mt-2 text-lg font-bold">Krok 1 · znajdź grupę po rozmiarze opony</h4>
                <KluczRozmiarow tabela={tabela} />
                <h4 className="mt-4 text-lg font-bold">Krok 2 · odczytaj limity dla swojej grupy</h4>
              </>
            ) : null}
            <Tabela tabela={tabela} />
            <p className="text-xs text-muted-foreground md:hidden">
              Tabelę przesuniesz palcem w bok.
            </p>
          </div>

          <LegendaWymiarow />

          <dl className="grid gap-4 rounded-xl border-2 border-ink bg-piasek p-4 text-sm sm:grid-cols-2 md:p-5">
            {tabela.podzial === "indeks" ? (
              <div>
                <dt className="font-bold">Indeks prędkości</dt>
                <dd className="mt-1 text-pretty text-tekst">
                  Litera na końcu oznaczenia opony, np. 205/55 R16 91<strong>H</strong>.
                  Im szybsza opona, tym mniejsze uszkodzenie wolno naprawić.
                </dd>
              </div>
            ) : (
              <div>
                <dt className="font-bold">Dwie liczby na boku</dt>
                <dd className="mt-1 text-pretty text-tekst">
                  Łatka zamknie przecięcie jednego z dwóch kształtów A × R —
                  np. 15 × 60 albo 20 × 50 mm. Wystarczy, że mieści się w jednym.
                </dd>
              </div>
            )}
            <div>
              <dt className="font-bold">Łatka RAD</dt>
              <dd className="mt-1 text-pretty text-tekst">
                Numer łatki radialnej — większy numer to większa łatka, która
                zamyka większe uszkodzenie.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Powyżej limitu</dt>
              <dd className="mt-1 text-pretty text-tekst">
                Opona idzie do wymiany — powiem to od razu, zanim policzę
                cokolwiek.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Karta „Naprawiam według tabeli" — schemat stref + popup z pełną tabelą producenta. */
export function KartaStrefNaprawy() {
  const [otwarta, setOtwarta] = useState(false);
  const wyzwalacz = useRef<HTMLElement | null>(null);

  const otworz = (e: React.MouseEvent<HTMLElement>) => {
    wyzwalacz.current = e.currentTarget;
    setOtwarta(true);
  };
  const zamknij = useCallback(() => {
    setOtwarta(false);
    wyzwalacz.current?.focus();
  }, []);

  return (
    <>
      <Reveal className="cien-akcent-6 grid items-center gap-6 rounded-2xl border-[3px] border-ink bg-background p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <button
          type="button"
          onClick={otworz}
          aria-haspopup="dialog"
          aria-label="Otwórz pełną tabelę napraw opon"
          className="group kropki relative rounded-xl border-2 border-ink bg-piasek px-3 py-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none sm:px-6"
        >
          <SchematStrefNaprawy />
          <span className="etykieta-sm cien-3 absolute top-3 right-3 flex items-center gap-1.5 rounded-full border-2 border-ink bg-background px-2.5 py-1 transition-colors group-hover:bg-akcent">
            <Maximize2 aria-hidden className="size-3.5" strokeWidth={2.5} />
            pełna tabela
          </span>
        </button>

        <div className="flex flex-col gap-4 lg:pr-2">
          <h3 className="text-2xl leading-[1.15] font-bold text-balance">
            Naprawiam według tabeli producenta łatek
          </h3>
          <p className="text-[15px] leading-[1.55] text-pretty text-tekst">
            Da się naprawić nie tylko środek bieżnika — bark i bok też, łatą
            radialną z&nbsp;wulkanizacją. Ale tylko do rozmiaru, na który
            pozwala tabela dla Twojej opony — osobowej, dostawczej, przyczepy
            czy autobusu. Powyżej limitu opona idzie do wymiany.
          </p>
          <ul className="flex flex-col gap-2.5">
            {STREFY.map((strefa, index) => (
              <li key={strefa.nazwa} className="flex items-start gap-3">
                <Numer n={index + 1} kolor={strefa.kolor} />
                <p className="text-[15px] leading-[1.4]">
                  <span className="font-bold">{strefa.nazwa}</span>
                  <span className="text-tekst"> — {strefa.opis}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="etykieta-sm text-muted-foreground">
            limity dla indeksu H · przy V i ZR mniej, przy Q i T więcej
          </p>
          <button
            type="button"
            onClick={otworz}
            aria-haspopup="dialog"
            className="cien-mgla-5 flex w-max items-center gap-2 rounded-xl border-[3px] border-ink bg-background px-4 py-2.5 text-[15px] font-bold transition-colors hover:bg-akcent focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
          >
            <Table2 aria-hidden className="size-4.5" strokeWidth={2.5} />
            Zobacz pełną tabelę napraw
          </button>
        </div>
      </Reveal>

      {otwarta ? <PopupTabeli onClose={zamknij} /> : null}
    </>
  );
}
