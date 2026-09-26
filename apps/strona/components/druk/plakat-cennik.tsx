import type { ReactNode } from "react";
import {
  formatItemPrice,
  formatVariantPrice,
  itemVariants,
  type CennikCategory,
  type CennikData,
  type CennikItem,
} from "@/lib/cennik";
import type { UkladCennika } from "@/components/sections/uslugi-cennik";

/**
 * Cennik na A4 — te same dane i ta sama kolejność kategorii co sekcja
 * „Usługi i ceny" na stronie (UkladCennika), tylko gęściej: dwie kolumny kart,
 * warianty jako siatka rozmiar → cena, pakiety w ciemnym pasie na dole.
 */
export function PlakatCennik({ cennik, uklad }: { cennik: CennikData; uklad: UkladCennika }) {
  const kategorie = cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order);
  const pozycje = cennik.items.filter((i) => !i.disabled).sort((a, b) => a.order - b.order);
  const wKategorii = (id: string) => pozycje.filter((i) => i.categoryId === id);

  const karty = [
    ...uklad.kartyKategorii
      .map((id) => kategorie.find((c) => c.id === id))
      .filter((c): c is CennikCategory => Boolean(c)),
    ...kategorie.filter((c) => c.id !== uklad.pakiety && !uklad.kartyKategorii.includes(c.id)),
  ].filter((c) => wKategorii(c.id).length);

  const pakietyKategoria = kategorie.find((c) => c.id === uklad.pakiety);
  const pakiety = pakietyKategoria ? wKategorii(pakietyKategoria.id) : [];

  const bloki: Blok[] = karty.map((kategoria) => {
    const pozycjeKategorii = wKategorii(kategoria.id);
    return {
      id: kategoria.id,
      wysokosc: wysokoscKarty(pozycjeKategorii),
      tresc: <KartaKategorii kategoria={kategoria} pozycje={pozycjeKategorii} />,
    };
  });
  // Pakiety idą na koniec jako ciemna karta — trafiają do niższej kolumny,
  // więc wypełniają miejsce pod krótszą kategorią zamiast osobnego pasa.
  if (pakietyKategoria && pakiety.length) {
    bloki.push({
      id: pakietyKategoria.id,
      wysokosc: wysokoscKarty(pakiety) + 1,
      tresc: <KartaPakietow nazwa={pakietyKategoria.name} pakiety={pakiety} />,
    });
  }

  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {rozdzielNaKolumny(bloki).map((kolumna, i) => (
        <div key={i} className="flex flex-col gap-4">
          {kolumna.map((blok) => (
            <div key={blok.id}>{blok.tresc}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

type Blok = { id: string; wysokosc: number; tresc: ReactNode };

/** Szacunek wysokości karty w „wierszach": nazwa, zawinięty opis i jeden wiersz na parę wariantów. */
function wysokoscKarty(pozycje: CennikItem[]): number {
  const wiersze = pozycje.reduce(
    (suma, item) =>
      suma + 1 + Math.ceil(item.description.length / 55) + Math.ceil(itemVariants(item).length / 2),
    0,
  );
  return 2 + wiersze;
}

/**
 * Dwie kolumny bez łamania kart: każdy blok ląduje w całości w tej kolumnie,
 * która jest aktualnie niższa (kolejność bloków zostaje).
 */
function rozdzielNaKolumny(bloki: Blok[]): Blok[][] {
  const kolumny: Blok[][] = [[], []];
  const wysokosci = [0, 0];
  for (const blok of bloki) {
    const cel = wysokosci[0]! <= wysokosci[1]! ? 0 : 1;
    kolumny[cel]!.push(blok);
    wysokosci[cel]! += blok.wysokosc;
  }
  return kolumny;
}

function KartaPakietow({ nazwa, pakiety }: { nazwa: string; pakiety: CennikItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[2.5px] border-ink bg-ink text-background">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-background/25 px-3 py-1.5">
        <p className="text-[14px] font-bold">{nazwa}</p>
        <p className="etykieta-sm text-[8.5px] text-akcent">taniej niż osobno</p>
      </div>
      <ul>
        {pakiety.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 border-t border-dashed border-background/25 px-3 py-2 first:border-t-0"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11.5px] leading-tight font-bold">{item.name}</p>
              <Cena item={item} naCiemnym />
            </div>
            {item.description ? (
              <p className="text-[9.5px] leading-snug text-pretty text-noc-jasny">{item.description}</p>
            ) : null}
            {item.popular ? (
              <p className="etykieta-sm text-[8px] text-akcent">najczęściej wybierane</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KartaKategorii({ kategoria, pozycje }: { kategoria: CennikCategory; pozycje: CennikItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-[2.5px] border-ink">
      <div className="border-b-[2.5px] border-ink bg-akcent px-3 py-1.5">
        <p className="text-[14px] font-bold">{kategoria.name}</p>
      </div>
      <ul>
        {pozycje.map((item) => (
          <Pozycja key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function Pozycja({ item }: { item: CennikItem }) {
  const warianty = itemVariants(item);
  return (
    <li className="flex flex-col gap-1 border-t border-dashed border-kreska px-3 py-1.5 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] leading-tight font-bold">
            {item.name}
            {item.popular ? (
              <span className="etykieta-sm ml-1.5 rounded-full bg-akcent px-1.5 py-px align-middle text-[7.5px]">
                hit
              </span>
            ) : null}
          </p>
          {item.description ? (
            <p className="mt-0.5 text-[9.5px] leading-snug text-pretty text-tekst">{item.description}</p>
          ) : null}
        </div>
        {warianty.length ? null : <Cena item={item} />}
      </div>
      {warianty.length ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-md bg-piasek px-2 py-1">
          {warianty.map((w) => (
            <div key={w.id} className="flex items-baseline justify-between gap-2">
              <dt className="text-[9.5px] text-tekst">{w.label}</dt>
              <dd className="text-[10.5px] font-bold whitespace-nowrap tabular-nums">
                {formatVariantPrice(item, w)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function Cena({ item, naCiemnym = false }: { item: CennikItem; naCiemnym?: boolean }) {
  return (
    <p className="shrink-0 text-right text-[12px] leading-tight font-bold whitespace-nowrap tabular-nums">
      {item.compareAtPrice > 0 ? (
        <span
          className={`mr-1.5 text-[10px] font-medium line-through ${naCiemnym ? "text-noc-szary" : "text-muted-foreground"}`}
        >
          {item.compareAtPrice} zł
        </span>
      ) : null}
      {formatItemPrice(item)}
    </p>
  );
}
