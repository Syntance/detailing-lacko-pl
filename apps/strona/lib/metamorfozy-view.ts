import type { MetamorfozyPara, MetamorfozyZdjecie } from "./metamorfozy";

/**
 * Czysta warstwa prezentacji sekcji „Efekty" — BEZ zod-a.
 *
 * Wydzielone z `lib/metamorfozy.ts` z powodu rozmiaru bundla: sekcja jest
 * komponentem „use client", a schematy `z.object(...)` wykonują się przy
 * imporcie modułu, więc bundler nie mógł ich odciąć i cały zod jechał na
 * stronę główną. `import type` wyżej znika przy kompilacji, więc runtime'owej
 * zależności od `metamorfozy.ts` (a przez nią od zod-a) tu nie ma.
 * `lib/metamorfozy.ts` re-eksportuje wszystko poniżej.
 */

/**
 * Zdjęcia grupy w jednej postaci — nowe `zdjecia` albo przepisane ze starej
 * pary przed/po. Jedyny sposób czytania zdjęć: dzięki temu strona i panel
 * działają na blob-ach zapisanych przed i po zmianie modelu, bez migracji bazy.
 */
export function paraZdjecia(para: MetamorfozyPara): MetamorfozyZdjecie[] {
  if (para.zdjecia && para.zdjecia.length > 0) return para.zdjecia;
  const stare: MetamorfozyZdjecie[] = [];
  if (para.beforeUrl)
    stare.push({
      id: `${para.id}-przed`,
      url: para.beforeUrl,
      alt: para.beforeAlt ?? "",
    });
  if (para.afterUrl)
    stare.push({
      id: `${para.id}-po`,
      url: para.afterUrl,
      alt: para.afterAlt ?? "",
    });
  return stare;
}

/**
 * Napis na plakietce zdjęcia: własny z panelu, a gdy go nie ma — automatyczne
 * „przed"/„po!" dla klasycznej pary. Null = bez plakietki.
 *
 * `akcent` (żółte tło) zostaje przy pozycji w parze, nie przy treści: własny
 * napis podmienia słowa, nie kolorystykę, więc kontrast przed/po nie znika,
 * gdy ktoś wpisze „STAN WYJŚCIOWY" i „EFEKT".
 */
export function plakietkaZdjecia(
  zdjecia: MetamorfozyZdjecie[],
  index: number,
): { tekst: string; akcent: boolean } | null {
  const zdjecie = zdjecia[index];
  if (!zdjecie) return null;
  const wlasny = zdjecie.badge?.trim();
  const paraPrzedPo = zdjecia.length === 2;
  const akcent = paraPrzedPo && index === 1;
  if (wlasny) return { tekst: wlasny, akcent };
  if (!paraPrzedPo) return null;
  return { tekst: index === 0 ? "przed" : "po!", akcent };
}

/**
 * Liczba kolumn siatki dla N zdjęć.
 *
 * 1 → całą szerokość, 2 → pół na pół, więcej → siatka. Kolumny rosną WOLNIEJ
 * niż liczba zdjęć (max 2 w kafelku, 3 w podglądzie): przy 6 zdjęciach w rzędzie
 * każde byłoby paskiem, a zdjęcia mają się zmniejszać, nie zwężać.
 */
export function siatkaKolumny(ile: number, maxKolumn: number): number {
  if (ile <= 1) return 1;
  if (ile <= 4) return Math.min(2, maxKolumn);
  return maxKolumn;
}

/** Ile wysokości ekranu wolno zająć jednej grupie w podglądzie. */
const PODGLAD_WYSOKOSC_VH = 70;

/**
 * Sufit szerokości ramki podglądu — grupa ma ZAWSZE mieścić się na wysokość
 * ekranu, niezależnie od liczby zdjęć.
 *
 * Ograniczamy szerokość, bo wysokość wynika z niej: komórki mają proporcję 3:4,
 * więc `wysokość = (szerokość / kolumny) * 4/3 * wiersze`. Po przekształceniu
 * `szerokość = kolumny * wysokość * 3 / (4 * wiersze)`.
 *
 * Wcześniej ramka miała sztywne `90vh` dobrane pod dwa zdjęcia w rzędzie —
 * przy jednym zdjęciu (jedna kolumna) dawało to 120vh i podgląd wychodził
 * poza ekran.
 */
export function podgladMaxSzerokosc(ile: number): string {
  const kolumny = siatkaKolumny(ile, 3);
  const wiersze = Math.max(1, Math.ceil(ile / kolumny));
  const vh = (kolumny * PODGLAD_WYSOKOSC_VH * 3) / (4 * wiersze);
  return `${Math.round(vh * 100) / 100}vh`;
}
