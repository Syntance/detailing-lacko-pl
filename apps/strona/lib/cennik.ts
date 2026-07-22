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
  /** Czas trwania pozycji, np. „1,5 h", „6–7 h (1 dzień)". */
  timeLabel: z.string(),
  priceFrom: z.number().int().min(0),
  /** 0 = cena stała (bez widełek). */
  priceTo: z.number().int().min(0),
  /** Przedrostek ceny — np. "od " ("od 1200 zł") albo "+" ("+150 zł" dopłata). Puste = brak. */
  pricePrefix: z.string(),
  /** Dopisek za ceną, np. „za parę". */
  unit: z.string(),
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

/** Format ceny pozycji: „250–350 zł", „600 zł", „80 zł za parę", „od 1200 zł", „+150 zł". */
export function formatItemPrice(item: CennikItem): string {
  const range =
    item.priceTo > item.priceFrom
      ? `${item.priceFrom}–${item.priceTo} zł`
      : `${item.priceFrom} zł`;
  const withPrefix = item.pricePrefix ? `${item.pricePrefix}${range}` : range;
  return item.unit ? `${withPrefix} ${item.unit}` : withPrefix;
}

/** Domyślny cennik — 1:1 z Notion „Cennik i zakres usług". */
export const DEFAULT_CENNIK: CennikData = {
  settings: {
    heading: "Cennik — ceny z góry, bez wyceny indywidualnej",
    subheading:
      "Jako jedyni w okolicy publikujemy pełny cennik i rozliczamy dokładnie według niego. Widełki tylko tam, gdzie cena zależy od rozmiaru auta.",
    noteTitle: "Sprzedajesz auto?",
    noteText:
      "Kupujący zbije cenę o brudne wnętrze mocniej, niż kosztuje jego wyczyszczenie. Handlarze i komisy od 2 aut miesięcznie — stała stawka ok. 400 zł/auto, ten sam standard i termin za każdym razem.",
    noteCtaLabel: "Wyślij zdjęcie",
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
      name: "Zewnątrz",
      description: "Mycie detailingowe, dekontaminacja, wosk i dodatki chroniące lakier.",
      priceFrom: 150,
      timeLabel: "30 min – 2,5 h",
      highlight: "Najczęściej wybierane: Mycie + dekontaminacja + wosk syntetyczny — 250 zł",
      order: 1,
      disabled: false,
    },
    {
      id: "wnetrze",
      name: "Wnętrze",
      description: "Sprzątanie, pranie tapicerki, skóra i usuwanie zapachów.",
      priceFrom: 150,
      timeLabel: "30 min – 5 h",
      highlight: "Najczęściej wybierane: Kompleksowe czyszczenie wnętrza — 500 zł",
      order: 2,
      disabled: false,
    },
    {
      id: "polerowanie-korekta",
      name: "Polerowanie i korekta lakieru",
      description: "Polerowanie jednoetapowe (one step) i reflektory.",
      priceFrom: 250,
      timeLabel: "1,5 h – 1 dzień",
      highlight: "One step: 600 / 750 / 900 zł wg rozmiaru auta — usuwa 50–70% rys",
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
      priceFrom: 650,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
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
      priceFrom: 250,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
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
      description: "Papierosy, zwierzęta, stęchlizna + odświeżenie układu klimatyzacji.",
      timeLabel: "30 min",
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
      priceFrom: 650,
      priceTo: 0,
      pricePrefix: "",
      unit: "",
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
