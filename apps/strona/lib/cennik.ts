import { z } from "zod";

/**
 * Model cennika Detailing Łącko — edytowany w panelu Magazyn → Cennik
 * (wzorzec edytora: syntance-web /magazyn/cennik), przechowywany w
 * `site_blobs` pod kluczem `cennik`, czytany przez sekcję „Usługi i ceny".
 * Treść i struktura 1:1 z Notion „Cennik i zakres usług".
 */

export const cennikCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Opis na karcie, np. „Pranie tapicerki, kompleksowe czyszczenie…". */
  description: z.string(),
  /** Cena „od X zł" na karcie. */
  priceFrom: z.number().int().min(0),
  /** Czas trwania na karcie, np. „3–5 godzin". */
  timeLabel: z.string(),
  /** Wyróżnik pod kartą, np. „Najczęściej wybierane: … — 400–500 zł". */
  highlight: z.string(),
  order: z.number().int(),
  disabled: z.boolean(),
});

/**
 * Wariant pozycji — ten sam zakres pracy w kilku rozmiarach/odmianach, gdzie
 * różni się wyłącznie cena i czas (one step: hatchback / sedan / SUV).
 *
 * Bez wariantów każdy rozmiar był OSOBNĄ pozycją cennika: trzy wiersze z tym
 * samym opisem zajmowały pół kolumny, a w rezerwacji trzy kafelki, z których
 * dwa zawsze były pomyłką. Wariant zwija to do jednej opcji ze wspólnym
 * opisem, a cena i czas idą z wybranego wariantu.
 */
export const cennikVariantSchema = z.object({
  id: z.string().min(1),
  /** Etykieta wariantu, np. „hatchback / małe". */
  label: z.string().min(1),
  priceFrom: z.number().int().min(0),
  /** 0 = cena stała (bez widełek) — jak w pozycji. */
  priceTo: z.number().int().min(0),
  /**
   * Cena „gdyby osobno" tego wariantu — przekreślona przed jego kwotą, na tej
   * samej zasadzie co `compareAtPrice` pozycji. Osobne pole, bo pakiet
   * w trzech rozmiarach auta ma trzy różne ceny „przed" i jedna liczba na
   * pozycji byłaby prawdziwa najwyżej dla jednego z nich. 0 = brak.
   */
  compareAtPrice: z.number().int().min(0).default(0),
  /** Czas realizacji wariantu w minutach — źródło prawdy dla harmonogramu. */
  durationMinutes: z.number().int().min(0).max(10_080).default(0),
  /** Opisowy czas wariantu, np. „6–7 h (1 dzień)". Puste = bierzemy z pozycji. */
  timeLabel: z.string().default(""),
});

export const cennikItemSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  /** Czas trwania pozycji dla człowieka, np. „1,5 h", „6–7 h (1 dzień)". */
  timeLabel: z.string(),
  /**
   * Czas realizacji w MINUTACH — źródło prawdy dla rezerwacji (harmonogram,
   * dzienny limit, godzina odbioru). `timeLabel` jest opisowy i nie da się go
   * wiarygodnie sparsować („5 h (+ schnięcie 4–8 h)", „1,5–2 dni"), więc
   * kalendarz liczy wyłącznie na tym polu.
   *
   * `.default(0)` — stare blob-y w bazie nie mają tego pola i muszą się dalej
   * parsować; 0 znaczy „nie wliczam do czasu" (widget pokaże pozycję, ale nie
   * doda minut). Realne wartości ustawia panel albo seed.
   */
  durationMinutes: z.number().int().min(0).max(10_080).default(0),
  priceFrom: z.number().int().min(0),
  /** 0 = cena stała (bez widełek). */
  priceTo: z.number().int().min(0),
  /** Przedrostek ceny — np. "od " ("od 1200 zł") albo "+" ("+150 zł" dopłata). Puste = brak. */
  pricePrefix: z.string(),
  /** Dopisek za ceną, np. „za parę". */
  unit: z.string(),
  /**
   * Cena „gdyby osobno" — kwota przekreślona na czerwono PRZED właściwą ceną
   * („~~800 zł~~ 650 zł"). Pakiet jest tańszy od sumy składowych, ale klient
   * musiałby to sam policzyć z trzech pozycji z innej kolumny; przekreślenie
   * pokazuje oszczędność w miejscu, w którym zapada decyzja.
   *
   * 0 = brak przekreślenia (domyślnie). `.default(0)` jak przy
   * `durationMinutes` — blob-y zapisane wcześniej nie mają tego pola i muszą
   * się dalej parsować.
   */
  compareAtPrice: z.number().int().min(0).default(0),
  /** Ukrycie kwoty — zamiast ceny pokazujemy „Zapytaj o cenę". */
  priceHidden: z.boolean().optional(),
  /**
   * Id pozycji, które ta pozycja ZAWIERA w cenie (pakiet → jego składowe).
   * W rezerwacji wybór tej pozycji blokuje i zdejmuje zaznaczone składowe —
   * inaczej klient płaci dwa razy za mycie, które pakiet już obejmuje, a
   * harmonogram rezerwuje podwójny czas pracy.
   *
   * Relacja jest JEDNOKIERUNKOWA i przechodnia: pakiet może zawierać pozycję,
   * która sama zawiera kolejne (patrz `zablokowanePozycje`).
   *
   * `.optional()` (a nie `.default([])`) tak jak `priceHidden` — stare blob-y
   * w bazie nie mają tego pola, a domyślka wymusiłaby dopisanie go do każdej
   * pozycji. Czytamy przez `?? []`.
   */
  includedItemIds: z.array(z.string()).optional(),
  /**
   * Id pozycji, które trzeba doselekcjonować RAZEM z tą (np. wosk wymaga
   * dekontaminacji). W rezerwacji zaznaczenie tej pozycji automatycznie
   * dokłada brakujące wymagane dodatki i pokazuje o tym komunikat — inaczej
   * niż `includedItemIds`, dodatek NIE jest darmowy, liczy się osobno w cenie
   * i czasie.
   *
   * Przechodnie jak `includedItemIds` (patrz `resolveRequiredAdditions`).
   * `.optional()` z tego samego powodu co `includedItemIds` — stare blob-y
   * w bazie nie mają tego pola. Czytamy przez `itemRequires()`.
   */
  requiredItemIds: z.array(z.string()).optional(),
  /**
   * Warianty rozmiarowe/cenowe. Gdy lista jest NIEPUSTA, cena i czas pozycji
   * (`priceFrom`/`priceTo`/`durationMinutes`) przestają się liczyć — wygrywają
   * wartości wariantu, a strona pokazuje widełki od najtańszego do najdroższego.
   *
   * `.optional()` jak `includedItemIds`: stare blob-y w bazie nie mają tego
   * pola i muszą się dalej parsować. Czytamy przez `itemVariants()`.
   */
  variants: z.array(cennikVariantSchema).optional(),
  popular: z.boolean(),
  order: z.number().int(),
  disabled: z.boolean(),
});

export const cennikSettingsSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string(),
  /** Blok pod kartami — pakiet „przygotowanie do sprzedaży". */
  noteTitle: z.string(),
  noteText: z.string(),
  noteCtaLabel: z.string(),
  expandLabel: z.string(),
  collapseLabel: z.string(),
  /**
   * Plakietka o podatku obok badge'a sekcji („ceny zawierają VAT"). Puste =
   * brak plakietki.
   *
   * `.default()` (nie zwykły `z.string()`) — blob-y zapisane przed dodaniem
   * tych pól nie mają ich w bazie, a bez domyślki CAŁY cennik nie przeszedłby
   * walidacji i odczyt cennika skończyłby się błędem, gubiąc wszystko, co
   * właściciel wyklikał w panelu (`readBlob` loguje błąd i zwraca fallback).
   * Domyślki są równe temu, co było wcześniej zapisane na sztywno w kodzie,
   * więc stare blob-y wyglądają dokładnie tak jak przed zmianą.
   */
  vatNote: z.string().default("ceny zawierają VAT"),
  /**
   * Dopisek pod każdą kwotą w cenniku („z VAT", „netto", „brutto"). Puste =
   * same kwoty, bez dopisków. Idzie też do sumy w widgecie rezerwacji, bo ta
   * liczy się z tych samych pozycji.
   */
  vatSuffix: z.string().default("z VAT"),
  /**
   * Stopień pisma dopisku w px. Domyślne 11 = `etykieta-sm`, czyli to samo, co
   * reszta meta w kartach (czas realizacji, plakietki). Zakres 8–20 pilnuje
   * dwóch rzeczy: poniżej 8 px dopisek jest nieczytelny, a powyżej 20 px
   * przestaje być dopiskiem i zaczyna konkurować z samą kwotą (18 px bold) —
   * przy okazji szeroki napis rozpycha kolumnę z ceną i zabiera szerokość
   * kolumnie z nazwą i opisem.
   */
  vatSuffixSize: z.number().int().min(8).max(20).default(11),
});

export const cennikDataSchema = z.object({
  settings: cennikSettingsSchema,
  categories: z.array(cennikCategorySchema),
  items: z.array(cennikItemSchema),
});

export type CennikCategory = z.infer<typeof cennikCategorySchema>;
export type CennikItem = z.infer<typeof cennikItemSchema>;
export type CennikVariant = z.infer<typeof cennikVariantSchema>;
export type CennikSettings = z.infer<typeof cennikSettingsSchema>;
export type CennikData = z.infer<typeof cennikDataSchema>;

/** Etykieta pozycji z ukrytą kwotą. */
export const HIDDEN_PRICE_LABEL = "Zapytaj o cenę";

/** Warianty pozycji, odporne na brak pola w starych blob-ach z bazy. */
export function itemVariants(item: CennikItem): CennikVariant[] {
  return item.variants ?? [];
}

/** Czy pozycja jest wybierana przez wariant (a nie jedną ceną). */
export function hasVariants(item: CennikItem): boolean {
  return itemVariants(item).length > 0;
}

/**
 * Widełki pozycji: własne kwoty, a przy wariantach — od najtańszego do
 * najdroższego. `to === from` znaczy „cena stała" (bez widełek).
 */
export function itemPriceRange(item: CennikItem): { from: number; to: number } {
  const variants = itemVariants(item);
  if (!variants.length) {
    return { from: item.priceFrom, to: item.priceTo || item.priceFrom };
  }
  return {
    from: Math.min(...variants.map((v) => v.priceFrom)),
    to: Math.max(...variants.map((v) => v.priceTo || v.priceFrom)),
  };
}

/** Kwota + prefiks + dopisek wg reguł pozycji — wspólne dla pozycji i wariantu. */
function priceLabel(item: CennikItem, from: number, to: number, zDopiskiem = true): string {
  // Ukryta cena: własny dopisek ma pierwszeństwo nad domyślną etykietą.
  if (item.priceHidden) return item.unit.trim() || HIDDEN_PRICE_LABEL;
  const range = to > from ? `${from}–${to} zł` : `${from} zł`;
  const withPrefix = item.pricePrefix ? `${item.pricePrefix}${range}` : range;
  return zDopiskiem && item.unit ? `${withPrefix} ${item.unit}` : withPrefix;
}

/**
 * Sama kwota pozycji, bez dopisku z panelu — cennik (strona i wydruk) stawia
 * dopisek („za szt.", „za 4 szt.") pod kwotą małym pismem, patrz `dopisekCeny`.
 */
export function formatItemKwota(item: CennikItem): string {
  const { from, to } = itemPriceRange(item);
  return priceLabel(item, from, to, false);
}

/** Dopisek pod kwotą. Przy cenie ukrytej dopisek JEST ceną („Wycena indywidualna"), więc tu pusto. */
export function dopisekCeny(item: CennikItem): string {
  return item.priceHidden ? "" : item.unit.trim();
}

/**
 * Pozycja bez własnej kwoty: w panelu cena „od" i „do" = 0 (i nie jest to cena
 * ukryta z tekstem, np. „Wycena indywidualna"). Cennik nie pokazuje wtedy nic
 * po prawej, a nazwa i opis zajmują całą szerokość — kwoty stoją w wariantach.
 */
export function bezCeny(item: CennikItem): boolean {
  return !item.priceHidden && item.priceFrom === 0 && (item.priceTo || 0) === 0;
}

/** Format ceny pozycji: „250–350 zł", „600 zł", „80 zł za parę", „od 1200 zł", „+150 zł". */
export function formatItemPrice(item: CennikItem): string {
  const { from, to } = itemPriceRange(item);
  return priceLabel(item, from, to);
}

/** Cena jednego wariantu — prefiks i dopisek dziedziczy po pozycji. */
export function formatVariantPrice(
  item: CennikItem,
  variant: CennikVariant,
): string {
  return priceLabel(item, variant.priceFrom, variant.priceTo || variant.priceFrom);
}

/** Czas realizacji wariantu w minutach (0 = nie wlicza się do rezerwacji). */
export function variantDuration(
  item: CennikItem,
  variant: CennikVariant,
): number {
  return variant.durationMinutes || item.durationMinutes;
}

/**
 * Logika wyboru usług i format czasu — implementacja w `cennik-selection.ts`,
 * bez zod-a, żeby widget rezerwacji nie ciągnął go na stronę główną. Tutaj
 * re-eksport, więc reszta kodu importuje dalej z `@/lib/cennik`.
 */
export {
  formatDuration,
  wymien,
  itemIncludes,
  itemRequires,
  blockedItemIds,
  resolveRequiredAdditions,
  toggleServiceSelection,
  findSelectionConflict,
  variantKey,
  parseVariantKey,
  VARIANT_SEP,
  type PozycjaZeSkladowymi,
  type SelectionChange,
} from "./cennik-selection";

/**
 * Cennik bez pozycji — tylko na wypadek, gdy w bazie nie ma jeszcze wiersza
 * (świeża instalacja). Treść cennika pochodzi WYŁĄCZNIE z panelu; w kodzie nie
 * ma żadnych cen, żeby strona nigdy nie pokazała nieaktualnego cennika.
 */
export const PUSTY_CENNIK: CennikData = {
  settings: cennikSettingsSchema.parse({
    heading: "Cennik",
    subheading: "",
    noteTitle: "",
    noteText: "",
    noteCtaLabel: "",
    expandLabel: "",
    collapseLabel: "",
  }),
  categories: [],
  items: [],
};
