/**
 * Tabela napraw opon łatkami radialnymi (RAD) — przepisana z tabeli producenta
 * łatek, którą warsztat stosuje. Liczby to maksymalny rozmiar uszkodzenia
 * w mm; `null` = w tej strefie danej łatki nie wolno użyć.
 *
 * Kolejność stref jak na schemacie strony (1 bieżnik, 2 bark, 3 bok), a nie
 * jak w oryginale producenta (tam bok ma numer 1).
 *
 * Osobowe i dostawcze producent dzieli po indeksie prędkości; opony ciężkie
 * (przyczepy, autobusy) — po rozmiarze, czyli profilu i szerokości opony.
 * Opon do samochodów ciężarowych warsztat nie naprawia, ale grupy rozmiarów
 * są te same, więc zostają pod nazwami przyczep i autobusów.
 */

type Mm = number | null;

export type WierszNaprawy = {
  rad: string;
  bieznik: [c: Mm, a: Mm, r: Mm];
  bark: Mm;
  /** Na boku producent czasem dopuszcza dwa kształty uszkodzenia (A×R) dla jednej łatki. */
  bok: [a: Mm, r: Mm][];
};

export const PROFILE = ["100-90", "85-80", "75-70", "65-60", "55-45"] as const;
export type Profil = (typeof PROFILE)[number];

export type GrupaNapraw = {
  /** Indeks prędkości (np. „H") albo numer grupy rozmiarów. */
  nazwa: string;
  podpis?: string;
  /** Rozmiary opon należące do grupy, per przedział profilu (tylko podział „rozmiar"). */
  rozmiary?: Record<Profil, string[]>;
  wiersze: WierszNaprawy[];
};

export type TabelaNapraw = {
  id: string;
  nazwa: string;
  opis: string;
  podzial: "indeks" | "rozmiar";
  grupy: GrupaNapraw[];
};

const w = (
  rad: string,
  bieznik: [Mm, Mm, Mm],
  bark: Mm,
  ...bok: [Mm, Mm][]
): WierszNaprawy => ({ rad, bieznik, bark, bok });

const BRAK: [Mm, Mm] = [null, null];

export const TABELE_NAPRAW: TabelaNapraw[] = [
  {
    id: "osobowe",
    nazwa: "Osobowe",
    opis: "Opony samochodów osobowych, SUV i 4x4 — oraz lekkich przyczep na takich oponach.",
    podzial: "indeks",
    grupy: [
      {
        nazwa: "Q",
        wiersze: [
          w("110", [10, 10, 10], 8, [10, 15]),
          w("115", [20, 20, 20], 8, [20, 30]),
          w("116", [20, 20, 20], 8, [20, 35]),
        ],
      },
      {
        nazwa: "T",
        wiersze: [
          w("110", [8, 8, 8], 6, [6, 12]),
          w("115 / 116", [12, 12, 12], 6, [15, 30]),
        ],
      },
      {
        nazwa: "H",
        wiersze: [
          w("110", [6, 6, 6], 3, [6, 6]),
          w("115", [10, 10, 10], 6, [10, 10]),
        ],
      },
      {
        nazwa: "V",
        wiersze: [
          w("110", [6, 6, 6], 3, [3, 3]),
          w("115", [8, 8, 8], null, BRAK),
        ],
      },
      {
        nazwa: "ZR",
        wiersze: [
          w("110", [3, 3, 3], null, BRAK),
          w("115", [6, 6, 6], null, BRAK),
        ],
      },
    ],
  },
  {
    id: "dostawcze",
    nazwa: "Dostawcze i busy",
    opis: "Opony C (6–8 PR), indeks nośności do 121 — busy, dostawczaki i przyczepy na oponach C.",
    podzial: "indeks",
    grupy: [
      {
        nazwa: "T",
        wiersze: [
          w("115", [10, 10, 10], null, BRAK),
          w("116", [12, 12, 12], 3, [8, 8]),
          w("120", [15, 15, 15], 8, [15, 30]),
        ],
      },
      {
        nazwa: "H",
        wiersze: [
          w("115", [6, 6, 6], null, BRAK),
          w("116", [10, 10, 10], null, [6, 6]),
          w("120", [12, 12, 12], 3, [15, 20]),
        ],
      },
    ],
  },
  {
    id: "ciezkie",
    nazwa: "Przyczepy i autobusy",
    opis: "Opony ciężkie: przyczepy, naczepy i autobusy od indeksu nośności 122. Grupę wybierasz po rozmiarze opony, nie po indeksie prędkości.",
    podzial: "rozmiar",
    grupy: [
      {
        nazwa: "1",
        podpis: "przyczepy, nośność od 122",
        rozmiary: {
          "100-90": ["6.00 – 7.50"],
          "85-80": ["9R – 10R", "245/ – 265/"],
          "75-70": ["205/ – 235/"],
          "65-60": ["245/ – 265/"],
          "55-45": [],
        },
        wiersze: [
          w("120", [15, 15, 20], 8, [10, 15]),
          w("122", [15, 15, 25], 10, [15, 60], [20, 50]),
          w("140", [25, 25, 40], 15, [10, 80], [25, 60]),
          w("115", [12, 12, 15], null, BRAK),
        ],
      },
      {
        nazwa: "2",
        podpis: "autobusy",
        rozmiary: {
          "100-90": ["8.25 – 10.00", "225/ – 245/"],
          "85-80": ["9R – 10R", "245/ – 265/"],
          "75-70": ["245/ – 265/"],
          "65-60": ["275/ – 315/"],
          "55-45": [],
        },
        wiersze: [
          w("124", [null, null, null], null, [4, 80], [8, 60]),
          w("120", [12, 12, 20], 8, [6, 10]),
          w("140", [20, 20, 40], 15, [10, 80], [20, 60]),
          w("142", [30, 30, 50], 20, [10, 110], [25, 80]),
          w("144", [40, 40, 70], 25, [20, 135], [40, 80]),
          w("115", [10, 10, 12], null, BRAK),
          w("125", [20, 20, 35], null, BRAK),
          w("135", [40, 40, 60], null, BRAK),
        ],
      },
      {
        nazwa: "3",
        podpis: "duże przyczepy, naczepy i autobusy",
        rozmiary: {
          "100-90": ["12.5R – 14.75R", "11.00 – 13.00"],
          "85-80": ["11R – 13R", "12/ – 14/14.75", "275/ – 385/"],
          "75-70": ["11/ – 13/", "275/ – 375/"],
          "65-60": ["325/ – 385/"],
          "55-45": ["355/ – 385/"],
        },
        wiersze: [
          w("120", [12, 12, 20], 6, [6, 6]),
          w("140", [20, 20, 30], 10, [10, 60], [15, 35]),
          w("142", [25, 25, 50], 20, [10, 100], [25, 80]),
          w("144", [40, 40, 70], 25, [20, 130], [40, 80]),
          w("115", [10, 10, 12], null, BRAK),
          w("125", [20, 20, 25], null, BRAK),
          w("135", [40, 40, 60], null, BRAK),
        ],
      },
      {
        nazwa: "4",
        podpis: "naczepy niskopodwoziowe, nośność do 177",
        rozmiary: {
          "100-90": ["14.00 – 16.00", "375/ – 445/"],
          "85-80": ["15R – 24R", "15.5", "395/ – 475/"],
          "75-70": ["445/ – 605/"],
          "65-60": ["395/ – 525/"],
          "55-45": ["425/ – 495/"],
        },
        wiersze: [
          w("140", [15, 15, 25], 10, [12, 30]),
          w("142", [20, 20, 30], 20, [10, 100], [20, 60]),
          w("144", [30, 30, 50], 25, [20, 130], [30, 60]),
          w("146", [40, 40, 70], 30, [30, 140], [45, 100]),
          w("120", [10, 10, 15], null, BRAK),
          w("125", [15, 15, 25], null, BRAK),
          w("135", [35, 35, 50], null, BRAK),
        ],
      },
    ],
  },
];
