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
   * pozycji w DEFAULT_CENNIK. Czytamy przez `?? []`.
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
   * walidacji i strona zjechałaby na `DEFAULT_CENNIK`, gubiąc wszystko, co
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
function priceLabel(item: CennikItem, from: number, to: number): string {
  // Ukryta cena: własny dopisek ma pierwszeństwo nad domyślną etykietą.
  if (item.priceHidden) return item.unit.trim() || HIDDEN_PRICE_LABEL;
  const range = to > from ? `${from}–${to} zł` : `${from} zł`;
  const withPrefix = item.pricePrefix ? `${item.pricePrefix}${range}` : range;
  return item.unit ? `${withPrefix} ${item.unit}` : withPrefix;
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

/** Domyślny cennik — 1:1 z Notion „Cennik i zakres usług". */
export const DEFAULT_CENNIK: CennikData = {
  settings: {
    heading: "Zobacz, ile to kosztuje",
    subheading:
      "Czas realizacji otrzymasz po wybraniu usług, które Cię interesują",
    noteTitle: "Sprzedajesz auto?",
    noteText: "",
    noteCtaLabel: "Zarezerwuj termin →",
    expandLabel: "Rozwiń pełny cennik",
    collapseLabel: "Zwiń cennik",
    vatNote: "ceny zawierają VAT",
    vatSuffix: "z VAT",
    vatSuffixSize: 11,
  },
  categories: [
    {
      id: "pakiety",
      name: "Pakiety",
      description:
        "Całe auto w jednej wizycie oraz przygotowanie pod sprzedaż, ze zdjęciami do ogłoszenia.",
      priceFrom: 200,
      timeLabel: "3 h – 2 dni",
      highlight:
        "Detailing kompletny IN+OUT — 650 zł, czyli 100 zł taniej niż suma składowych",
      order: 0,
      disabled: false,
    },
    {
      id: "zewnatrz",
      // Nazwa kolumny 1:1 z makietą „kreskówka".
      name: "Mycie i wosk",
      description:
        "Mycie detailingowe, dekontaminacja, wosk i dodatki chroniące lakier.",
      priceFrom: 150,
      timeLabel: "30 min – 2,5 h",
      highlight:
        "Najczęściej wybierane: Mycie + dekontaminacja + wosk syntetyczny — 250 zł",
      order: 1,
      disabled: false,
    },
    {
      id: "wnetrze",
      name: "Wnętrze",
      description: "Sprzątanie, pranie tapicerki, skóra i usuwanie zapachów.",
      priceFrom: 150,
      timeLabel: "30 min – 5 h",
      highlight:
        "Najczęściej wybierane: Kompleksowe czyszczenie wnętrza — 500 zł",
      order: 2,
      disabled: false,
    },
    {
      id: "polerowanie-korekta",
      name: "Polerowanie",
      description: "Polerowanie jednoetapowe (one step) i reflektory.",
      priceFrom: 250,
      timeLabel: "1,5 h – 1 dzień",
      highlight:
        "One step: 600 / 750 / 900 zł wg rozmiaru auta — usuwa 50–70% rys",
      order: 3,
      disabled: false,
    },
  ],
  items: [
    // --- Pakiety (całe auto IN+OUT + przygotowanie do sprzedaży) ---
    {
      id: "odswiezenie-in-out",
      categoryId: "pakiety",
      name: "Odświeżenie IN+OUT",
      description:
        "Mycie z zewnątrz + wnętrze express: odkurzanie, kokpit, szyby, dywaniki. Bez dressingu opon i prania tapicerki.",
      timeLabel: "3 h",
      durationMinutes: 180,
      priceFrom: 200,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "detailing-kompletny-in-out",
      categoryId: "pakiety",
      name: "Detailing kompletny IN+OUT",
      description:
        "Mycie z dekontaminacją + wosk syntetyczny + kompleksowe czyszczenie wnętrza. 100 zł taniej niż suma składowych.",
      timeLabel: "1 dzień",
      durationMinutes: 480,
      priceFrom: 650,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      // Wprost z opisu pakietu. Mycie/dekontaminacja/wosk lecą przez zestaw
      // „Mycie + dekontaminacja + wosk", który sam je zawiera — blokady liczą
      // się przechodnio, więc nie trzeba ich tu powtarzać.
      includedItemIds: [
        "mycie-dekontaminacja-wosk",
        "kompleksowe-czyszczenie-wnetrza",
      ],
      popular: true,
      order: 1,
      disabled: false,
    },

    // --- Zewnątrz ---
    {
      id: "mycie-detailingowe-baza",
      categoryId: "zewnatrz",
      name: "Mycie detailingowe (baza)",
      description:
        "Piana aktywna, szampon kwaśny lub neutralny wg stanu lakieru, dwa wiadra, felgi + deironizer, osuszenie mikrofibrą, dressing opon.",
      timeLabel: "1,5 h",
      durationMinutes: 90,
      priceFrom: 150,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "dekontaminacja-lakieru",
      categoryId: "zewnatrz",
      name: "• Dekontaminacja lakieru",
      description:
        "Bug remover, tar remover, deironizer, water spot remover — usuwa naloty, smołę, opiłki i osady twardej wody.",
      timeLabel: "30 min",
      durationMinutes: 30,
      priceFrom: 50,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "wosk-syntetyczny-adbl-ssw",
      categoryId: "zewnatrz",
      name: "• Wosk syntetyczny ADBL SSW",
      description: "Ochrona i połysk, trwałość 2–3 miesiące.",
      timeLabel: "30 min",
      durationMinutes: 30,
      priceFrom: 50,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      id: "wosk-twardy-premium",
      categoryId: "zewnatrz",
      name: "• Wosk twardy premium (Soft99 Fusso Coat)",
      description:
        "Najmocniejsza ochrona przed ceramiką — trwałość ok. 12 miesięcy, głęboki połysk, wymaga odtłuszczenia lakieru (IPA).",
      timeLabel: "1 h",
      durationMinutes: 60,
      priceFrom: 200,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 3,
      disabled: false,
    },
    {
      id: "wycieraczka-szyba-czolowa",
      categoryId: "zewnatrz",
      name: "• Niewidzialna wycieraczka — szyba czołowa (Soft99 Ultra Glaco)",
      description:
        "W cenie polerowanie szyby (Glass Compound) przed aplikacją. Woda spływa przy ~60 km/h, trwałość ok. 6–12 miesięcy.",
      timeLabel: "30 min",
      durationMinutes: 30,
      priceFrom: 80,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 4,
      disabled: false,
    },
    {
      id: "wycieraczka-komplet-szyb",
      categoryId: "zewnatrz",
      name: "• Niewidzialna wycieraczka — komplet szyb (czoło + boki + tył)",
      description:
        "Czoło z polerowaniem Glass Compound, pozostałe szyby aplikacja powłoki. Trwałość ok. 6–12 miesięcy.",
      timeLabel: "90 min",
      durationMinutes: 90,
      priceFrom: 200,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 5,
      disabled: false,
    },
    {
      id: "mycie-dekontaminacja-wosk",
      categoryId: "zewnatrz",
      name: "Mycie + dekontaminacja + wosk syntetyczny",
      description:
        "Pełne przygotowanie lakieru bez polerowania + dressing plastików zewnętrznych (Blackouter).",
      timeLabel: "2,5 h",
      durationMinutes: 150,
      priceFrom: 250,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      // Zestaw = suma trzech pozycji z tej samej kategorii, wprost z nazwy.
      includedItemIds: [
        "mycie-detailingowe-baza",
        "dekontaminacja-lakieru",
        "wosk-syntetyczny-adbl-ssw",
      ],
      popular: true,
      order: 6,
      disabled: false,
    },

    // --- Wnętrze ---
    {
      id: "sprzatanie-wnetrza-podstawowe",
      categoryId: "wnetrze",
      name: "Sprzątanie wnętrza podstawowe",
      description: "Odkurzanie, plastiki, szyby od wewnątrz, dywaniki.",
      timeLabel: "1,5 h",
      durationMinutes: 90,
      priceFrom: 150,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "pranie-tapicerki-komplet",
      categoryId: "wnetrze",
      name: "Pranie tapicerki (komplet)",
      description: "Fotele + kanapa + boczki drzwi.",
      timeLabel: "3 h (+ schnięcie 4–8 h)",
      durationMinutes: 180,
      priceFrom: 300,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "kompleksowe-czyszczenie-wnetrza",
      categoryId: "wnetrze",
      name: "Kompleksowe czyszczenie wnętrza",
      description:
        "Pranie tapicerki + podłoga, bagażnik, boczki, plastiki, podsufitka, szyby, odkurzanie, czyszczenie parą nawiewów i zakamarków.",
      timeLabel: "5 h (+ schnięcie 4–8 h)",
      durationMinutes: 300,
      priceFrom: 500,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: true,
      order: 2,
      disabled: false,
    },
    {
      id: "czyszczenie-impregnacja-skory",
      categoryId: "wnetrze",
      name: "Czyszczenie + impregnacja skóry",
      description: "Cleaner + balsam, w cenie sprzątanie wnętrza.",
      timeLabel: "3 h",
      durationMinutes: 180,
      priceFrom: 400,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 3,
      disabled: false,
    },
    {
      id: "ozonowanie",
      categoryId: "wnetrze",
      name: "• Ozonowanie / usuwanie zapachów",
      description:
        "Papierosy, zwierzęta, stęchlizna + odświeżenie układu klimatyzacji.",
      timeLabel: "30 min",
      durationMinutes: 30,
      priceFrom: 80,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 4,
      disabled: false,
    },
    {
      id: "siersc-zwierzat",
      categoryId: "wnetrze",
      name: "• Sierść zwierząt",
      description: "Dodatek przy dużej ilości sierści.",
      timeLabel: "+30–60 min",
      durationMinutes: 45,
      priceFrom: 80,
      priceTo: 0,
      pricePrefix: "+",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 5,
      disabled: false,
    },

    // --- Polerowanie i korekta lakieru ---
    {
      id: "polerowanie-reflektorow",
      categoryId: "polerowanie-korekta",
      name: "Polerowanie reflektorów (para)",
      description: "Matowanie, polerka maszynowa, zabezpieczenie.",
      timeLabel: "1,5 h",
      durationMinutes: 90,
      priceFrom: 250,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      // Jedna pozycja zamiast trzech („one-step-hatchback/-sedan-kombi/-suv-van"):
      // zakres pracy i opis są identyczne, różni się wyłącznie rozmiar auta,
      // więc rozmiar jest wariantem, nie osobną usługą.
      id: "one-step",
      categoryId: "polerowanie-korekta",
      name: "One step",
      description:
        "Mycie z dekontaminacją + glinkowanie + polerka jednoetapowa (usuwa 50–70% rys) + panel wipe + wosk SSW.",
      timeLabel: "6–9 h (1 dzień)",
      durationMinutes: 390,
      priceFrom: 600,
      priceTo: 900,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      variants: [
        {
          id: "hatchback",
          label: "hatchback / małe",
          priceFrom: 600,
          priceTo: 0,
          durationMinutes: 390,
          timeLabel: "6–7 h (1 dzień)",
        },
        {
          id: "sedan-kombi",
          label: "sedan / kombi",
          priceFrom: 750,
          priceTo: 0,
          durationMinutes: 450,
          timeLabel: "7–8 h (1 dzień)",
        },
        {
          id: "suv-van",
          label: "SUV / van",
          priceFrom: 900,
          priceTo: 0,
          durationMinutes: 510,
          timeLabel: "8–9 h (1 dzień)",
        },
      ],
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "one-step-wosk-twardy",
      categoryId: "polerowanie-korekta",
      name: "• One step + wosk twardy (Soft99 Fusso Coat)",
      description:
        "Zamiast SSW twardy wosk na świeżo wypolerowany i odtłuszczony lakier, ochrona ok. 12 miesięcy. Dopłata do dowolnego one step.",
      timeLabel: "+1 h",
      durationMinutes: 60,
      priceFrom: 150,
      priceTo: 0,
      pricePrefix: "+",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      // Poza ofertą standardową (Notion „Zasady") — nie renderujemy na stronie.
      id: "korekta-dwuetapowa",
      categoryId: "polerowanie-korekta",
      name: "Korekta dwuetapowa",
      description: "Wycena po oględzinach.",
      timeLabel: "2 dni",
      durationMinutes: 960,
      priceFrom: 1200,
      priceTo: 0,
      pricePrefix: "od ",
      unit: "",
      compareAtPrice: 0,
      popular: false,
      order: 3,
      disabled: true,
    },

    {
      id: "przygotowanie-do-sprzedazy",
      categoryId: "pakiety",
      name: "Przygotowanie auta do sprzedaży",
      description: "Detailing kompletny IN+OUT + zdjęcia do ogłoszenia.",
      timeLabel: "1 dzień",
      durationMinutes: 480,
      priceFrom: 650,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      compareAtPrice: 0,
      // Zawiera cały pakiet IN+OUT, a przez niego — przechodnio — wszystkie
      // jego składowe. Wystarczy jedno id.
      includedItemIds: ["detailing-kompletny-in-out"],
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      id: "przygotowanie-do-sprzedazy-pro",
      categoryId: "pakiety",
      name: "Przygotowanie do sprzedaży PRO",
      description:
        "Kompleksowe wnętrze + dekontaminacja + one step + wosk + zdjęcia do ogłoszenia. Hatchback 1000 / sedan-kombi 1150 / SUV-van 1300.",
      timeLabel: "1,5–2 dni",
      durationMinutes: 720,
      priceFrom: 1000,
      priceTo: 1300,
      pricePrefix: "",
      unit: "wg rozmiaru auta",
      compareAtPrice: 0,
      popular: false,
      order: 3,
      disabled: false,
    },
  ],
};
