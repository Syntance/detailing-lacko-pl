import { PRZYPADKI_DO_WYMIANY } from "@/components/sections/wulkanizacja/granice";
import {
  KOLOR_STREFY,
  SchematStrefNaprawy,
} from "@/components/sections/wulkanizacja/schematy-opon";
import {
  KluczRozmiarow,
  LegendaWymiarow,
  Numer,
  Tabela,
} from "@/components/sections/wulkanizacja/strefy-naprawy";
import { TABELE_NAPRAW, type TabelaNapraw } from "@/lib/tabela-napraw";

const tabela = (id: string): TabelaNapraw => {
  const t = TABELE_NAPRAW.find((x) => x.id === id);
  if (!t) throw new Error(`Brak tabeli napraw: ${id}`);
  return t;
};

/** Limity dla indeksu H — ta sama ściągawka co na stronie, pod schematem stref. */
const STREFY_H = [
  { nazwa: "Środek bieżnika", opis: "grzybek albo łata, do 6–10 mm", kolor: KOLOR_STREFY.bieznik },
  { nazwa: "Bark", opis: "łata radialna, do 3–6 mm", kolor: KOLOR_STREFY.bark },
  { nazwa: "Bok", opis: "łata radialna, do 6–10 mm", kolor: KOLOR_STREFY.bok },
];

function Naglowek({ children, opis }: { children: string; opis?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-[19px] leading-tight font-bold">{children}</h2>
      {opis ? <p className="etykieta-sm text-right text-muted-foreground">{opis}</p> : null}
    </div>
  );
}

function StrefyZeSchematem() {
  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] items-center gap-5 rounded-xl border-[2.5px] border-ink p-3">
      <div className="kropki rounded-lg border-2 border-ink bg-piasek px-3 py-3">
        <SchematStrefNaprawy />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[13px] leading-snug text-pretty text-tekst">
          Naprawa wg tabeli producenta łatek. Bark i bok też można naprawiać
          łatą radialną z wulkanizacją — ale tylko do rozmiaru, na który
          pozwala tabela dla danej opony.
        </p>
        <ul className="flex flex-col gap-2">
          {STREFY_H.map((s, i) => (
            <li key={s.nazwa} className="flex items-start gap-2.5">
              <Numer n={i + 1} kolor={s.kolor} />
              <p className="text-[13px] leading-snug">
                <span className="font-bold">{s.nazwa}</span>
                <span className="text-tekst"> — {s.opis}</span>
              </p>
            </li>
          ))}
        </ul>
        <p className="etykieta-sm text-muted-foreground">
          limity dla indeksu H · przy V i ZR mniej, przy Q i T więcej
        </p>
      </div>
    </div>
  );
}

/** Ściąga dla warsztatu: gdzie wolno łatać i co od razu kwalifikuje oponę do wymiany. */
export function PlakatCoNaprawie() {
  return (
    <>
      <StrefyZeSchematem />
      <Naglowek opis="opona do wymiany">Co nie kwalifikuje się do naprawy</Naglowek>
      <div className="grid grid-cols-3 gap-3">
        {PRZYPADKI_DO_WYMIANY.map(({ Schemat, tytul, opis }) => (
          <div key={tytul} className="flex flex-col gap-2 rounded-xl border-[2.5px] border-ink p-2.5">
            <div className="kropki rounded-lg border-2 border-ink bg-piasek px-1.5 py-2">
              <Schemat />
            </div>
            <p className="text-[13px] leading-tight font-bold">{tytul}</p>
            <p className="text-[10.5px] leading-snug text-pretty text-tekst">{opis}</p>
          </div>
        ))}
      </div>
      <div className="border-l-4 border-akcent pl-3">
        <p className="text-[13px] leading-snug font-bold">Przed każdą naprawą</p>
        <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-[12px] leading-snug text-tekst">
          <li>Obejrzyj całą oponę od wewnątrz i z zewnątrz — szukaj dalszych, ukrytych uszkodzeń.</li>
          <li>Limity dotyczą uszkodzenia po oczyszczeniu i przygotowaniu miejsca naprawy i nie wolno ich przekroczyć.</li>
          <li>Tabela nie uwzględnia lokalnych przepisów ani warunków użytkowania — ocena należy do wykonującego naprawę.</li>
        </ul>
      </div>
    </>
  );
}

/** Wspólna kartka z legendą — oznaczenia dotyczą wszystkich tabel, więc nie powtarzają się przy każdej. */
export function PlakatLegenda() {
  const definicje = [
    {
      nazwa: "Indeks prędkości",
      tekst: "Litera na końcu oznaczenia opony, np. 205/55 R16 91H. Im szybsza opona, tym mniejsze uszkodzenie wolno naprawić.",
    },
    {
      nazwa: "Łatka RAD",
      tekst: "Numer łatki radialnej — większy numer to większa łatka, która zamyka większe uszkodzenie.",
    },
    {
      nazwa: "Dwie wartości na boku („lub”)",
      tekst: "Łatka zamknie przecięcie jednego z dwóch kształtów A × R, np. 15 × 60 albo 20 × 50 mm. Wystarczy, że mieści się w jednym.",
    },
    {
      nazwa: "Kółka i krzyżyk",
      tekst: "Wielkość kółka pokazuje rozmiar dopuszczalnego uszkodzenia w skali danej tabeli. Krzyżyk = naprawa w tej strefie niedozwolona.",
    },
  ];
  return (
    <>
      <LegendaWymiarow />
      <dl className="grid grid-cols-2 gap-3">
        {definicje.map((d) => (
          <div key={d.nazwa} className="rounded-xl border-2 border-ink bg-piasek p-3">
            <dt className="text-[13px] font-bold">{d.nazwa}</dt>
            <dd className="mt-1 text-[11.5px] leading-snug text-pretty text-tekst">{d.tekst}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/** Osobowe i dostawcze na jednej kartce — legenda jest na osobnej, wspólnej stronie. */
export function PlakatNaprawyOsoboweDostawcze() {
  const osobowe = tabela("osobowe");
  const dostawcze = tabela("dostawcze");
  return (
    <>
      <Naglowek opis={osobowe.opis}>Osobowe · po indeksie prędkości</Naglowek>
      <Tabela tabela={osobowe} kompakt />
      <Naglowek opis={dostawcze.opis}>Dostawcze i busy · opony C</Naglowek>
      <Tabela tabela={dostawcze} kompakt />
    </>
  );
}

/** Ile grup limitów ląduje na pierwszej kartce (pod kluczem rozmiarów); reszta na drugiej. */
const PODZIAL = 1;

/** Opony ciężkie na dwóch kartkach: klucz rozmiarów + limity pierwszych grup, potem pozostałe grupy. */
export function PlakatNaprawyCiezkieStrona({ strona }: { strona: 1 | 2 }) {
  const ciezkie = tabela("ciezkie");
  const grupy = strona === 1 ? ciezkie.grupy.slice(0, PODZIAL) : ciezkie.grupy.slice(PODZIAL);
  return (
    <>
      {strona === 1 ? (
        <>
          <Naglowek opis="zamiast indeksu prędkości">Krok 1 · znajdź grupę po rozmiarze opony</Naglowek>
          <KluczRozmiarow tabela={ciezkie} kompakt />
        </>
      ) : null}
      <Naglowek opis="wymiary w mm">
        {strona === 1 ? `Krok 2 · limity dla grup 1–${PODZIAL}` : `Krok 2 · limity dla grup ${PODZIAL + 1}–${ciezkie.grupy.length}`}
      </Naglowek>
      <Tabela tabela={{ ...ciezkie, grupy }} kompakt />
    </>
  );
}
