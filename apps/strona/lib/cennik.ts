import { z } from "zod";

/**
 * Model cennika Detailing Łącko — edytowany w panelu Magazyn → Cennik
 * (wzorzec edytora: syntance-web /magazyn/cennik), przechowywany w
 * `site_blobs` pod kluczem `cennik`, czytany przez sekcję „Usługi i ceny".
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
  priceFrom: z.number().int().min(0),
  /** 0 = cena stała (bez widełek). */
  priceTo: z.number().int().min(0),
  /** Dopisek za ceną, np. „za parę", „za 1 km ponad limit". */
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

/** Format ceny pozycji: „250–350 zł", „600 zł", „150–200 zł za parę". */
export function formatItemPrice(item: CennikItem): string {
  const range =
    item.priceTo > item.priceFrom
      ? `${item.priceFrom}–${item.priceTo} zł`
      : `${item.priceFrom} zł`;
  return item.unit ? `${range} ${item.unit}` : range;
}

/** Domyślny cennik — copy z briefu (Notion: Strona www — plan i copy). */
export const DEFAULT_CENNIK: CennikData = {
  settings: {
    heading: "Usługi i ceny — bez wyceny po rozmowie, ceny z góry",
    subheading:
      "Mówię ile zapłacisz, zanim zacznę. Ceny zależą od rozmiaru auta i stanu — widełki obejmują oba przypadki.",
    noteTitle: "Przygotowanie auta do sprzedaży — pakiety 500–1200 zł",
    noteText:
      "Sprzedajesz auto? Czyste, wypolerowane auto sprzedaje się szybciej i drożej.",
    noteCtaLabel: "Zadzwoń, powiem ile dla twojego auta",
    expandLabel: "Rozwiń pełny cennik",
    collapseLabel: "Zwiń cennik",
  },
  categories: [
    {
      id: "wnetrze",
      name: "Wnętrze",
      description:
        "Pranie tapicerki, kompleksowe czyszczenie, skóra, ozonowanie.",
      priceFrom: 250,
      timeLabel: "3–5 godzin",
      highlight: "Najczęściej wybierane: kompleksowe czyszczenie wnętrza — 400–500 zł",
      order: 0,
      disabled: false,
    },
    {
      id: "mycie-wosk",
      name: "Mycie i wosk",
      description:
        "Mycie detailingowe, dekontaminacja lakieru, wosk syntetyczny.",
      priceFrom: 100,
      timeLabel: "1–3 godziny",
      highlight: "Najczęściej wybierane: mycie z dekontaminacją i woskiem — 250–350 zł",
      order: 1,
      disabled: false,
    },
    {
      id: "polerowanie",
      name: "Polerowanie lakieru",
      description:
        "One step: usuwa 50–70% rys, przywraca połysk. W cenie mycie, glinkowanie i wosk.",
      priceFrom: 600,
      timeLabel: "1 dzień",
      highlight: "Reflektory: 150–200 zł za parę",
      order: 2,
      disabled: false,
    },
  ],
  items: [
    {
      id: "pranie-tapicerki",
      categoryId: "wnetrze",
      name: "Pranie tapicerki",
      description: "Fotele, kanapa, boczki drzwi — ekstraktor + chemia ADBL.",
      priceFrom: 250,
      priceTo: 350,
      unit: "",
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "kompleks-wnetrza",
      categoryId: "wnetrze",
      name: "Kompleksowe czyszczenie wnętrza",
      description:
        "Pranie tapicerki + podsufitka, plastiki, szyby od środka, odkurzanie.",
      priceFrom: 400,
      priceTo: 500,
      unit: "",
      popular: true,
      order: 1,
      disabled: false,
    },
    {
      id: "skora",
      categoryId: "wnetrze",
      name: "Czyszczenie i zabezpieczenie skóry",
      description: "Delikatna chemia do skór + impregnat.",
      priceFrom: 200,
      priceTo: 300,
      unit: "",
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      id: "ozonowanie",
      categoryId: "wnetrze",
      name: "Ozonowanie",
      description: "Usuwa zapachy (papierosy, zwierzęta, stęchlizna).",
      priceFrom: 80,
      priceTo: 120,
      unit: "",
      popular: false,
      order: 3,
      disabled: false,
    },
    {
      id: "kompleks-suv",
      categoryId: "wnetrze",
      name: "Kompleks wnętrza — SUV / VAN / 7 os.",
      description: "Większa kubatura i więcej tapicerki.",
      priceFrom: 500,
      priceTo: 650,
      unit: "",
      popular: false,
      order: 4,
      disabled: false,
    },
    {
      id: "mycie-detailingowe",
      categoryId: "mycie-wosk",
      name: "Mycie detailingowe",
      description: "Piana aktywna, dwa wiadra, osuszanie mikrofibrą.",
      priceFrom: 100,
      priceTo: 150,
      unit: "",
      popular: false,
      order: 0,
      disabled: false,
    },
    {
      id: "dekontaminacja",
      categoryId: "mycie-wosk",
      name: "Dekontaminacja lakieru",
      description: "Glinka + chemia — usuwa naloty, smołę, opiłki.",
      priceFrom: 100,
      priceTo: 150,
      unit: "",
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "wosk",
      categoryId: "mycie-wosk",
      name: "Wosk syntetyczny",
      description: "Ochrona i połysk na ok. 6 miesięcy.",
      priceFrom: 100,
      priceTo: 150,
      unit: "",
      popular: false,
      order: 2,
      disabled: false,
    },
    {
      id: "mycie-dekontaminacja-wosk",
      categoryId: "mycie-wosk",
      name: "Mycie + dekontaminacja + wosk",
      description: "Pełne przygotowanie lakieru bez polerowania.",
      priceFrom: 250,
      priceTo: 350,
      unit: "",
      popular: true,
      order: 3,
      disabled: false,
    },
    {
      id: "polerowanie-one-step",
      categoryId: "polerowanie",
      name: "Polerowanie one step",
      description:
        "Usuwa 50–70% rys, przywraca połysk. W cenie mycie, glinkowanie i wosk.",
      priceFrom: 600,
      priceTo: 700,
      unit: "",
      popular: true,
      order: 0,
      disabled: false,
    },
    {
      id: "polerowanie-suv",
      categoryId: "polerowanie",
      name: "Polerowanie one step — SUV / VAN",
      description: "Większa powierzchnia lakieru.",
      priceFrom: 700,
      priceTo: 900,
      unit: "",
      popular: false,
      order: 1,
      disabled: false,
    },
    {
      id: "reflektory",
      categoryId: "polerowanie",
      name: "Polerowanie reflektorów",
      description: "Zmatowiałe klosze — powrót przejrzystości.",
      priceFrom: 150,
      priceTo: 200,
      unit: "za parę",
      popular: false,
      order: 2,
      disabled: false,
    },
  ],
};
