import type { CennikData, CennikItem, CennikVariant } from "./cennik";

/**
 * Domyślny cennik linii Wulkanizacja — ten sam model co cennik detailingu
 * (`cennikDataSchema`), osobny blob `cennik-wulkanizacja` (panel Magazyn →
 * Wulkanizacja → Cennik). Sekcja „01 · cennik" na /wulkanizacja renderuje go
 * tym samym komponentem `UslugiCennik`, w układzie
 * `UKLAD_CENNIKA_WULKANIZACJA` (sześć kart w kolejności sekcji cennika).
 *
 * Sekcje i kwoty 1:1 z cennika właściciela (21.09.2026), ceny brutto z 23%
 * VAT. Rozmiar felgi jest wariantem pozycji, a nie osobną pozycją: opis pada
 * raz, a klient i tak widzi cenę dla swojego koła. Dopóki panel nic nie
 * zapisze, strona i panel czytają ten obiekt — pierwszy zapis przenosi
 * cennik do bazy i od tej chwili liczy się tylko baza.
 *
 * Czasy (`durationMinutes`, `timeLabel`) zostają puste: cennik ich nie podaje,
 * wulkanizacja nie ma rezerwacji online, a karty na stronie ich nie pokazują.
 */

/** Rozmiar felgi (albo inna odmiana tej samej usługi) — różni się tylko ceną. */
function rozmiar(
  id: string,
  label: string,
  priceFrom: number,
  priceTo = 0,
): CennikVariant {
  return {
    id,
    label,
    priceFrom,
    priceTo,
    compareAtPrice: 0,
    durationMinutes: 0,
    timeLabel: "",
  };
}

/**
 * Pozycja z domyślnymi wartościami pól, których ten cennik nie używa (czas,
 * cena „gdyby osobno", składowe pakietów) — dzięki temu jeden wiersz cennika
 * właściciela to jedno krótkie wywołanie i da się je porównać z oryginałem.
 */
function pozycja(
  p: Pick<CennikItem, "id" | "categoryId" | "name" | "priceFrom" | "order"> &
    Partial<CennikItem>,
): CennikItem {
  return {
    description: "",
    timeLabel: "",
    durationMinutes: 0,
    priceTo: 0,
    pricePrefix: "",
    unit: "",
    compareAtPrice: 0,
    popular: false,
    disabled: false,
    ...p,
  };
}

export const DEFAULT_CENNIK_WULKANIZACJA: CennikData = {
  settings: {
    heading: "Ceny z góry, bez „to zależy”",
    subheading:
      "Przekładka i wymiana: cena za komplet 4 kół z wyważeniem, wg rozmiaru felgi. Dopłaty są w cenniku — znasz je przed wymianą",
    // Blok pakietów (czarny pas) — cennik wulkanizacji nie ma pakietów, więc
    // tytuł i opis zostają puste. Przycisk dzwoni (brak rezerwacji online).
    noteTitle: "",
    noteText: "",
    noteCtaLabel: "Zadzwoń i umów termin →",
    expandLabel: "Rozwiń pełny cennik",
    collapseLabel: "Zwiń cennik",
    vatNote: "ceny zawierają VAT",
    vatSuffix: "z VAT",
    vatSuffixSize: 11,
  },
  categories: [
    {
      id: "przekladka",
      name: "Przekładka kół",
      description:
        "Komplet 4 kół gotowych na felgach — zdjęcie, założenie i wyważenie. Cena wg rozmiaru felgi.",
      priceFrom: 120,
      timeLabel: "",
      highlight: "",
      order: 0,
      disabled: false,
    },
    {
      id: "wymiana",
      name: "Wymiana opon na felgach",
      description:
        "Komplet 4 opon z wyważeniem — zdjęcie starych z felg i montaż nowych. Cena wg rozmiaru i rodzaju felgi.",
      priceFrom: 160,
      timeLabel: "",
      highlight: "",
      order: 1,
      disabled: false,
    },
    {
      id: "naprawa",
      name: "Naprawa i usługi pojedyncze",
      description:
        "Naprawa przebitej opony (kołek albo grzybek od środka), wyważanie, zawory i odkręcanie kół.",
      priceFrom: 10,
      timeLabel: "",
      highlight: "",
      order: 2,
      disabled: false,
    },
    {
      id: "tpms",
      name: "Serwis TPMS",
      description:
        "Czujniki ciśnienia w oponach: diagnoza, programowanie i czujniki uniwersalne z montażem. Tester Autel MaxiTPMS TS900, czujniki MX-Sensor.",
      priceFrom: 30,
      timeLabel: "",
      highlight: "",
      order: 3,
      disabled: false,
    },
    {
      id: "hotel",
      name: "Hotel oponiarski",
      description:
        "Przechowanie opon albo kół na felgach przez sezon (ok. 6 miesięcy).",
      priceFrom: 120,
      timeLabel: "",
      highlight: "",
      order: 4,
      disabled: false,
    },
    {
      id: "dodatki",
      name: "Usługi dodatkowe i dopłaty",
      description:
        "Mycie kół, azot, utylizacja opon, dopłaty za nietypowe koła, termin ekspresowy i dojazd mobilny.",
      priceFrom: 12,
      timeLabel: "",
      highlight: "",
      order: 5,
      disabled: false,
    },
  ],
  items: [
    // --- 1. Przekładka kół z wyważeniem (komplet 4 kół gotowych na felgach) ---
    pozycja({
      // Id bez zmian od pierwszej wersji — czytają go kafel ceny w hero
      // i opis SEO (`opisSeoZCennika`).
      id: "przekladka-sezonowa",
      categoryId: "przekladka",
      name: "Przekładka kół z wyważeniem",
      description:
        "Komplet 4 kół gotowych na felgach — zdjęcie, założenie i wyważenie każdego koła.",
      priceFrom: 120,
      priceTo: 200,
      variants: [
        rozmiar("do-15", 'do 15"', 120),
        rozmiar("16", '16"', 130),
        rozmiar("17", '17"', 140),
        rozmiar("18", '18"', 150),
        rozmiar("19", '19"', 160),
        rozmiar("20", '20"', 180),
        rozmiar("21-plus", '21" i więcej', 200),
      ],
      popular: true,
      order: 0,
    }),

    // --- 2. Wymiana opon na felgach z wyważeniem (komplet 4 opon) ---
    pozycja({
      id: "wymiana-opon-stal",
      categoryId: "wymiana",
      name: "Felgi stalowe",
      description: "Komplet 4 opon z wyważeniem.",
      priceFrom: 160,
      priceTo: 200,
      variants: [
        rozmiar("do-16", 'do 16"', 160),
        rozmiar("17", '17"', 190),
        rozmiar("18", '18"', 200),
      ],
      order: 0,
    }),
    pozycja({
      id: "wymiana-opon-alu",
      categoryId: "wymiana",
      name: "Felgi aluminiowe",
      description: "Komplet 4 opon z wyważeniem.",
      priceFrom: 180,
      priceTo: 360,
      variants: [
        rozmiar("do-16", 'do 16"', 180),
        rozmiar("17", '17"', 200),
        rozmiar("18", '18"', 220),
        rozmiar("19", '19"', 250),
        rozmiar("20", '20"', 280),
        rozmiar("21", '21"', 320),
        rozmiar("22", '22"', 360),
      ],
      order: 1,
    }),

    // --- 3. Naprawa i usługi pojedyncze ---
    pozycja({
      id: "naprawa-przebicia-kolek",
      categoryId: "naprawa",
      name: "Naprawa przebicia – kołek/sznur",
      description: "Bez demontażu opony z felgi.",
      priceFrom: 50,
      order: 0,
    }),
    pozycja({
      // „jw." z cennika właściciela (19"+, niski profil, run-flat) to ta sama
      // naprawa na większym kole — wariant, nie osobna pozycja.
      id: "naprawa-przebicia",
      categoryId: "naprawa",
      name: "Naprawa przebicia – grzybek/łata od wewnątrz",
      description: "Z demontażem, montażem i wyważeniem.",
      priceFrom: 90,
      priceTo: 150,
      variants: [
        rozmiar("do-18", 'do 18"', 90),
        rozmiar("19-plus", '19"+ / niskoprofilowe / run-flat', 120, 150),
      ],
      order: 1,
    }),
    pozycja({
      id: "wywazenie-kola",
      categoryId: "naprawa",
      name: "Wyważenie 1 koła",
      priceFrom: 30,
      order: 2,
    }),
    pozycja({
      id: "wywazenie-kompletu",
      categoryId: "naprawa",
      name: "Wyważenie kompletu",
      priceFrom: 90,
      order: 3,
    }),
    pozycja({
      id: "zawor-gumowy",
      categoryId: "naprawa",
      name: "Wymiana zaworu gumowego (przy wymianie)",
      priceFrom: 10,
      unit: "za szt.",
      order: 4,
    }),
    pozycja({
      id: "zawor-metalowy",
      categoryId: "naprawa",
      name: "Wymiana zaworu metalowego",
      priceFrom: 25,
      unit: "za szt.",
      order: 5,
    }),
    pozycja({
      id: "odkrecenie-kola",
      categoryId: "naprawa",
      name: "Odkręcenie/dokręcenie koła",
      priceFrom: 15,
      unit: "za szt.",
      order: 6,
    }),

    // --- 4. Serwis TPMS (Autel MaxiTPMS TS900 + MX-Sensor) ---
    pozycja({
      id: "tpms-diagnoza",
      categoryId: "tpms",
      name: "Diagnoza/odczyt TPMS",
      description: "Tester Autel MaxiTPMS TS900.",
      priceFrom: 30,
      order: 0,
    }),
    pozycja({
      id: "tpms-programowanie",
      categoryId: "tpms",
      name: "Programowanie/relearn kompletu",
      priceFrom: 120,
      order: 1,
    }),
    pozycja({
      id: "tpms-czujnik",
      categoryId: "tpms",
      name: "Czujnik uniwersalny MX-Sensor z montażem i programowaniem",
      priceFrom: 170,
      unit: "za szt.",
      order: 2,
    }),
    pozycja({
      id: "tpms-doplata",
      categoryId: "tpms",
      name: "Dopłata do obsługi kół z TPMS przy wymianie",
      priceFrom: 40,
      pricePrefix: "+",
      unit: "za komplet",
      order: 3,
    }),

    // --- 5. Hotel oponiarski (za sezon, ok. 6 mies.) ---
    pozycja({
      id: "hotel-opony",
      categoryId: "hotel",
      name: "Komplet opon bez felg",
      description: "Sezon to ok. 6 miesięcy.",
      priceFrom: 120,
      unit: "za sezon",
      order: 0,
    }),
    pozycja({
      // Id z pierwszej wersji — kotwica „hotelu" w opisie SEO.
      id: "przechowywanie-kol",
      categoryId: "hotel",
      name: "Komplet kół na felgach",
      priceFrom: 150,
      unit: "za sezon",
      order: 1,
    }),
    pozycja({
      id: "hotel-duze-kola",
      categoryId: "hotel",
      name: 'Duże koła 19"+ / SUV',
      priceFrom: 180,
      unit: "za sezon",
      order: 2,
    }),

    // --- 6. Usługi dodatkowe i dopłaty ---
    pozycja({
      id: "mycie-kol",
      categoryId: "dodatki",
      name: "Mycie kół (komplet)",
      priceFrom: 40,
      order: 0,
    }),
    pozycja({
      id: "azot",
      categoryId: "dodatki",
      name: "Pompowanie azotem (komplet)",
      priceFrom: 25,
      order: 1,
    }),
    pozycja({
      id: "utylizacja-osobowa",
      categoryId: "dodatki",
      name: "Utylizacja opony osobowej",
      priceFrom: 12,
      unit: "za szt.",
      order: 2,
    }),
    pozycja({
      id: "utylizacja-suv",
      categoryId: "dodatki",
      name: "Utylizacja opony SUV/dostawczej",
      priceFrom: 18,
      unit: "za szt.",
      order: 3,
    }),
    pozycja({
      id: "doplata-runflat",
      categoryId: "dodatki",
      name: "Dopłata run-flat",
      priceFrom: 50,
      pricePrefix: "+",
      unit: "za komplet",
      order: 4,
    }),
    pozycja({
      id: "doplata-niski-profil",
      categoryId: "dodatki",
      name: "Dopłata niski profil (≤45)",
      priceFrom: 30,
      pricePrefix: "+",
      unit: "za komplet",
      order: 5,
    }),
    pozycja({
      id: "doplata-suv",
      categoryId: "dodatki",
      name: "Dopłata SUV/4x4",
      priceFrom: 30,
      pricePrefix: "+",
      unit: "za komplet",
      order: 6,
    }),
    pozycja({
      id: "doplata-dostawcze",
      categoryId: "dodatki",
      name: "Dopłata dostawcze/bus (opony C)",
      priceFrom: 60,
      pricePrefix: "+",
      unit: "za komplet",
      order: 7,
    }),
    pozycja({
      id: "zapieczona-sruba",
      categoryId: "dodatki",
      name: "Odkręcenie zapieczonej/zerwanej śruby",
      priceFrom: 30,
      pricePrefix: "od ",
      unit: "za szt.",
      order: 8,
    }),
    pozycja({
      // Bez kwoty: `priceHidden` + własny tekst w `unit` staje zamiast ceny
      // (patrz `formatItemPrice`).
      id: "brak-klucza",
      categoryId: "dodatki",
      name: "Brak klucza do śrub zabezpieczających",
      priceFrom: 0,
      priceHidden: true,
      unit: "wg czasu pracy",
      order: 9,
    }),
    pozycja({
      // Procent nie mieści się w modelu kwot — tekst zamiast ceny, jak wyżej.
      id: "termin-ekspresowy",
      categoryId: "dodatki",
      name: "Termin ekspresowy / poza godzinami",
      description: "Doliczane do ceny usługi.",
      priceFrom: 0,
      priceHidden: true,
      unit: "+50%",
      order: 10,
    }),
    pozycja({
      id: "dojazd-mobilny",
      categoryId: "dodatki",
      name: "Dojazd mobilny (dolina Dunajca)",
      priceFrom: 50,
      pricePrefix: "od ",
      unit: "+ 2–3 zł/km",
      order: 11,
    }),
  ],
};
