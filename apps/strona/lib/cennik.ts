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
});

export const cennikDataSchema = z.object({
  settings: cennikSettingsSchema,
  categories: z.array(cennikCategorySchema),
  items: z.array(cennikItemSchema),
});

export type CennikCategory = z.infer<typeof cennikCategorySchema>;
export type CennikItem = z.infer<typeof cennikItemSchema>;
export type CennikSettings = z.infer<typeof cennikSettingsSchema>;
export type CennikData = z.infer<typeof cennikDataSchema>;

/** Etykieta pozycji z ukrytą kwotą. */
export const HIDDEN_PRICE_LABEL = "Zapytaj o cenę";

/** Format ceny pozycji: „250–350 zł", „600 zł", „80 zł za parę", „od 1200 zł", „+150 zł". */
export function formatItemPrice(item: CennikItem): string {
  // Ukryta cena: własny dopisek ma pierwszeństwo nad domyślną etykietą.
  if (item.priceHidden) return item.unit.trim() || HIDDEN_PRICE_LABEL;
  const range =
    item.priceTo > item.priceFrom
      ? `${item.priceFrom}–${item.priceTo} zł`
      : `${item.priceFrom} zł`;
  const withPrefix = item.pricePrefix ? `${item.pricePrefix}${range}` : range;
  return item.unit ? `${withPrefix} ${item.unit}` : withPrefix;
}

/** Format czasu realizacji: „30 min", „1,5 h", „4 h", „9,5 h". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = Math.round(hours * 2) / 2;
  return `${String(rounded).replace(".", ",")} h`;
}

/* ------------------- Zawieranie się pozycji (pakiety) ------------------- */

/**
 * Minimum, jakiego potrzebuje liczenie blokad. Typowane strukturalnie, bo tę
 * samą logikę uruchamia panel (na `CennikItem`), widget rezerwacji (na
 * odchudzonym `RezerwacjaPozycja`) i walidacja w API — jedno źródło prawdy
 * zamiast trzech kopii, które rozjadą się przy pierwszej zmianie reguł.
 */
export type PozycjaZeSkladowymi = {
  id: string;
  name: string;
  includedItemIds?: string[];
};

/** Składowe pozycji, odporne na brak pola w starych blob-ach z bazy. */
export function itemIncludes(item: PozycjaZeSkladowymi): string[] {
  return item.includedItemIds ?? [];
}

/**
 * Mapa: id zablokowanej pozycji → pozycja, która ją zawiera. Pozycja jest
 * zablokowana, gdy któraś z WYBRANYCH już ją obejmuje w cenie.
 *
 * Przechodnie: pakiet zawierający „Mycie + dekontaminacja + wosk" blokuje też
 * składowe tego mycia. `seen` pilnuje cykli — panel pozwala zaznaczyć dowolne
 * pozycje, więc ktoś może omyłkowo zapętlić A→B→A; bez tej straży byłaby
 * nieskończona rekurencja i zawieszona strona.
 */
export function blockedItemIds<T extends PozycjaZeSkladowymi>(
  items: T[],
  selectedIds: string[],
): Map<string, T> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const blocked = new Map<string, T>();

  const walk = (owner: T, current: T, seen: Set<string>) => {
    for (const childId of itemIncludes(current)) {
      if (seen.has(childId)) continue;
      seen.add(childId);
      if (!blocked.has(childId)) blocked.set(childId, owner);
      const child = byId.get(childId);
      if (child) walk(owner, child, seen);
    }
  };

  for (const id of selectedIds) {
    const item = byId.get(id);
    if (item) walk(item, item, new Set([id]));
  }
  return blocked;
}

/** Skutek kliknięcia w pozycję: nowy wybór + co z niego wypadło i dlaczego. */
export type SelectionChange<T> = {
  selected: string[];
  /** Zdjęte z wyboru, bo świeżo wybrana pozycja już je zawiera. */
  removed: T[];
  /** Ustawione, gdy kliknięto pozycję zawartą w już wybranym pakiecie. */
  blockedBy: T | null;
};

/**
 * Jedyne miejsce, które zmienia wybór usług w rezerwacji — dzięki temu panel,
 * widget i walidacja serwera liczą to samo.
 *
 * Odznaczenie zawsze przechodzi. Zaznaczenie pozycji zawartej w wybranym
 * pakiecie NIE przechodzi (zwracamy `blockedBy`, wybór bez zmian). Zaznaczenie
 * pakietu przechodzi i zdejmuje jego składowe.
 */
export function toggleServiceSelection<T extends PozycjaZeSkladowymi>(
  items: T[],
  selectedIds: string[],
  id: string,
): SelectionChange<T> {
  const byId = new Map(items.map((i) => [i.id, i]));

  if (selectedIds.includes(id)) {
    return {
      selected: selectedIds.filter((x) => x !== id),
      removed: [],
      blockedBy: null,
    };
  }

  const blockedBy = blockedItemIds(items, selectedIds).get(id) ?? null;
  if (blockedBy) return { selected: selectedIds, removed: [], blockedBy };

  const zawarte = blockedItemIds(items, [id]);
  const removed = selectedIds
    .filter((x) => zawarte.has(x))
    .map((x) => byId.get(x))
    .filter((x): x is T => Boolean(x));

  return {
    selected: [...selectedIds.filter((x) => !zawarte.has(x)), id],
    removed,
    blockedBy: null,
  };
}

/**
 * Kolizja w gotowym zamówieniu: pakiet i jego składowa naraz. UI na to nie
 * pozwala, ale payload przychodzi od klienta — bez tej kontroli dałoby się
 * zamówić pakiet + mycie i zapłacić podwójnie za tę samą robotę, a harmonogram
 * zarezerwowałby podwójny czas. Zwraca pierwszą kolizję albo null.
 */
export function findSelectionConflict<T extends PozycjaZeSkladowymi>(
  items: T[],
  ids: string[],
): { owner: T; included: T } | null {
  const byId = new Map(items.map((i) => [i.id, i]));
  const blocked = blockedItemIds(items, ids);
  for (const id of ids) {
    const owner = blocked.get(id);
    const included = byId.get(id);
    if (owner && included && owner.id !== id) return { owner, included };
  }
  return null;
}

/** Domyślny cennik — 1:1 z Notion „Cennik i zakres usług". */
export const DEFAULT_CENNIK: CennikData = {
  settings: {
    heading: "Zobacz, ile to kosztuje",
    subheading:
      "Czas realizacji otrzymasz po wybraniu usług, które Cię interesują",
    noteTitle: "Sprzedajesz auto?",
    // Podpis w czarnym pasie pakietu (makieta „kreskówka").
    noteText:
      "100 zł taniej niż suma składowych · pakiet pod sprzedaż auta też 650 zł, ze zdjęciami do ogłoszenia",
    noteCtaLabel: "Zarezerwuj termin →",
    expandLabel: "Rozwiń pełny cennik",
    collapseLabel: "Zwiń cennik",
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
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "one-step-hatchback",
      categoryId: "polerowanie-korekta",
      name: "One step — hatchback / małe",
      description:
        "Mycie z dekontaminacją + glinkowanie + polerka jednoetapowa (usuwa 50–70% rys) + panel wipe + wosk SSW.",
      timeLabel: "6–7 h (1 dzień)",
      durationMinutes: 390,
      priceFrom: 600,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "one-step-sedan-kombi",
      categoryId: "polerowanie-korekta",
      name: "One step — sedan / kombi",
      description:
        "Mycie z dekontaminacją + glinkowanie + polerka jednoetapowa (usuwa 50–70% rys) + panel wipe + wosk SSW.",
      timeLabel: "7–8 h (1 dzień)",
      durationMinutes: 450,
      priceFrom: 750,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      id: "one-step-suv-van",
      categoryId: "polerowanie-korekta",
      name: "One step — SUV / van",
      description:
        "Mycie z dekontaminacją + glinkowanie + polerka jednoetapowa (usuwa 50–70% rys) + panel wipe + wosk SSW.",
      timeLabel: "8–9 h (1 dzień)",
      durationMinutes: 510,
      priceFrom: 900,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
      popular: false,
      order: 3,
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
      popular: false,
      order: 4,
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
      popular: false,
      order: 5,
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
      popular: false,
      order: 3,
      disabled: false,
    },
  ],
};
