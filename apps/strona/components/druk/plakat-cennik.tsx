import type { ReactNode } from "react";
import {
  bezCeny,
  formatItemKwota,
  itemVariants,
  type CennikCategory,
  type CennikData,
  type CennikItem,
} from "@/lib/cennik";
import {
  DopisekCeny,
  DopisekPodatek,
  PozycjaCennika,
  type UkladCennika,
  type UstawieniaDopisku,
} from "@/components/sections/uslugi-cennik";

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

  const podatek: UstawieniaDopisku = {
    tekst: cennik.settings.vatSuffix.trim(),
    rozmiar: cennik.settings.vatSuffixSize,
  };
  const karty = kategorie.filter((c) => c.id !== uklad.pakiety && wKategorii(c.id).length);

  const pakietyKategoria = kategorie.find((c) => c.id === uklad.pakiety);
  const pakiety = pakietyKategoria ? wKategorii(pakietyKategoria.id) : [];

  const bloki: Blok[] = karty.map((kategoria) => {
    const pozycjeKategorii = wKategorii(kategoria.id);
    return {
      id: kategoria.id,
      wysokosc: wysokoscKarty(pozycjeKategorii),
      tresc: (
        <KartaKategorii
          kategoria={kategoria}
          pozycje={pozycjeKategorii}
          wszystkie={pozycje}
          podatek={podatek}
          filar={kategoria.id === uklad.filar}
        />
      ),
    };
  });
  // Pakiety idą na koniec jako ciemna karta — trafiają do niższej kolumny,
  // więc wypełniają miejsce pod krótszą kategorią zamiast osobnego pasa.
  if (pakietyKategoria && pakiety.length) {
    bloki.push({
      id: pakietyKategoria.id,
      wysokosc: wysokoscKarty(pakiety) + 1,
      tresc: <KartaPakietow nazwa={pakietyKategoria.name} pakiety={pakiety} podatek={podatek} />,
    });
  }

  return (
    <div className="grid grid-cols-2 items-start gap-5">
      {rozdzielNaKolumny(bloki).map((kolumna, i) => (
        <div key={i} className="flex flex-col gap-5">
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
      suma + 1.5 + Math.ceil(item.description.length / 45) + itemVariants(item).length,
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

function KartaPakietow({
  nazwa,
  pakiety,
  podatek,
}: {
  nazwa: string;
  pakiety: CennikItem[];
  podatek: UstawieniaDopisku;
}) {
  return (
    <article className="cien-akcent-6 overflow-hidden rounded-2xl border-[3px] border-ink bg-ink text-background">
      <div className="flex items-baseline justify-between gap-3 border-b-[3px] border-background/25 px-5 py-[15px]">
        <h3 className="text-xl font-bold">{nazwa}</h3>
        <p className="etykieta-sm text-akcent">taniej niż osobno</p>
      </div>
      <ul className="flex flex-col">
        {pakiety.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 border-t-2 border-dashed border-background/25 px-5 py-[13px] first:border-t-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold">{item.name}</span>
              <Cena item={item} podatek={podatek} />
            </div>
            {item.description ? (
              <span className="text-[13px] leading-[1.5] text-pretty text-noc-szary">{item.description}</span>
            ) : null}
            {item.popular ? (
              <span className="etykieta-sm text-akcent">najczęściej wybierane</span>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Cena({ item, podatek }: { item: CennikItem; podatek: UstawieniaDopisku }) {
  if (bezCeny(item)) return null;
  return (
    <span className="max-w-[155px] shrink-0 text-right text-xl font-bold text-balance text-akcent tabular-nums">
      {item.compareAtPrice > 0 ? (
        <span className="mr-1.5 text-[13px] font-medium text-noc-szary line-through">{item.compareAtPrice} zł</span>
      ) : null}
      {formatItemKwota(item)}
      <DopisekCeny item={item} rozmiar={podatek.rozmiar} ciemne />
      {item.priceHidden ? null : <DopisekPodatek podatek={podatek} ciemne />}
    </span>
  );
}

/** Karta kategorii w układzie strony: nagłówek (filar w akcencie) i te same wiersze pozycji co na stronie. */
function KartaKategorii({
  kategoria,
  pozycje,
  wszystkie,
  podatek,
  filar,
}: {
  kategoria: CennikCategory;
  pozycje: CennikItem[];
  wszystkie: CennikItem[];
  podatek: UstawieniaDopisku;
  filar: boolean;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border-[3px] border-ink bg-background ${
        filar ? "cien-akcent-6" : "cien-6"
      }`}
    >
      <div className={`border-b-[3px] border-ink px-5 py-[15px] ${filar ? "bg-akcent" : ""}`}>
        <h3 className="text-xl font-bold">{kategoria.name}</h3>
      </div>
      <ul className="flex flex-col">
        {pozycje.map((item) => (
          <PozycjaCennika key={item.id} item={item} allItems={wszystkie} podatek={podatek} />
        ))}
      </ul>
    </article>
  );
}
