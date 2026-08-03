import { z } from "zod";

/**
 * „Efekty — zobacz różnicę" (metamorfozy) — kafelki par przed/po z podglądem.
 * Edycja: panel Magazyn → Metamorfozy. Storage: `site_blobs`, klucz
 * `metamorfozy`. Zdjęcia: URL z uploadu CMS (R2) albo /images/metamorfozy/*.
 *
 * Model: temat (kafelek) → grupy zdjęć. Grupa to DOWOLNA liczba zdjęć —
 * jedno zajmuje całą szerokość, dwa dzielą ją na pół (i dostają plakietki
 * „przed"/„po!"), więcej układa się w siatkę. PIERWSZA grupa tematu (po
 * przeciągnięciu na górę) jest okładką kafelka; wszystkie lądują
 * w pełnoekranowym podglądzie w kolejności ustawionej w panelu.
 *
 * Pole nazywa się dalej `pary` (a typ `MetamorfozyPara`), bo tak leżą dane
 * w bazie — zmiana nazwy wymagałaby migracji blob-ów bez zysku dla działania.
 */
export const metamorfozyZdjecieSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string(),
});

export const metamorfozyParaSchema = z.object({
  id: z.string().min(1),
  /**
   * Dowolna liczba zdjęć w grupie. Czytaj ZAWSZE przez `paraZdjecia()` —
   * blob-y zapisane przed tą zmianą mają zamiast tego `beforeUrl`/`afterUrl`.
   */
  zdjecia: z.array(metamorfozyZdjecieSchema).optional(),
  /**
   * Stary model: dokładnie dwa zdjęcia (przed/po). Pola zostają opcjonalne,
   * żeby dane z bazy dalej się parsowały — panel zapisuje już `zdjecia`.
   */
  beforeUrl: z.string().optional(),
  beforeAlt: z.string().optional(),
  afterUrl: z.string().optional(),
  afterAlt: z.string().optional(),
  /** Podpis pod grupą w podglądzie (opcjonalny). */
  podpis: z.string(),
  order: z.number().int(),
});

export const metamorfozyTematSchema = z.object({
  id: z.string().min(1),
  /** Nagłówek kafelka, np. „FDekontaminacja". */
  title: z.string(),
  /** 1–2 zdania: co było i co zrobiliśmy (język korzyści, nie procedury). */
  text: z.string(),
  order: z.number().int(),
  disabled: z.boolean(),
  pary: z.array(metamorfozyParaSchema),
});

export const metamorfozyDataSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string(),
  tematy: z.array(metamorfozyTematSchema),
});

export type MetamorfozyZdjecie = z.infer<typeof metamorfozyZdjecieSchema>;
export type MetamorfozyPara = z.infer<typeof metamorfozyParaSchema>;
export type MetamorfozyTemat = z.infer<typeof metamorfozyTematSchema>;
export type MetamorfozyData = z.infer<typeof metamorfozyDataSchema>;

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

export const DEFAULT_METAMORFOZY: MetamorfozyData = {
  // Nagłówek 1:1 z makietą „kreskówka"; podtytułu makieta nie ma.
  heading: "Przed i po — zobacz różnicę",
  subheading: "",
  tematy: [
    {
      id: "felgi",
      title: "Dekontaminacja",
      text: "Brązowy nalot to wtopione opiłki z klocków hamulcowych — samo mycie ich nie rusza. Schodzą dopiero po chemicznej dekontaminacji.",
      order: 0,
      disabled: false,
      pary: [
        {
          id: "felgi-1",
          beforeUrl: "/images/metamorfozy/felgi-przed.jpg",
          beforeAlt:
            "Felga przed czyszczeniem — brązowy nalot z opiłków hamulcowych na ramionach i wewnętrznej beczce",
          afterUrl: "/images/metamorfozy/felgi-po.jpg",
          afterAlt:
            "Ta sama felga po dekontaminacji — czyste srebrne ramiona bez nalotu",
          podpis: "Ramiona i wewnętrzna beczka",
          order: 0,
        },
        {
          id: "felgi-2",
          beforeUrl: "/images/metamorfozy/felgi-2-przed.jpg",
          beforeAlt:
            "Zbliżenie ramion felgi przed czyszczeniem — ciemny nalot w załamaniach",
          afterUrl: "/images/metamorfozy/felgi-2-po.jpg",
          afterAlt:
            "Te same ramiona po dekontaminacji — czysty metaliczny lakier",
          podpis: "Załamania ramion — tam nalot siedzi najgłębiej",
          order: 1,
        },
        {
          id: "felgi-3",
          beforeUrl: "/images/metamorfozy/felgi-3-przed.jpg",
          beforeAlt:
            "Wewnętrzna beczka felgi przed czyszczeniem — rdzawy osad na całej powierzchni",
          afterUrl: "/images/metamorfozy/felgi-3-po.jpg",
          afterAlt: "Ta sama beczka po dekontaminacji — jednolite srebro",
          podpis:
            "Wewnętrzna beczka — niewidoczna na co dzień, ale to z niej sypie się brud na ramiona",
          order: 2,
        },
      ],
    },
    {
      id: "lakier",
      title: "Polerowanie lakieru",
      text: "Po zdjęciu naklejek zostały duchy i siatka rys. Korekta lakieru przywraca głębię koloru — bez lakierowania.",
      order: 1,
      disabled: false,
      pary: [
        {
          id: "lakier-1",
          beforeUrl: "/images/metamorfozy/lakier-przed.jpg",
          beforeAlt:
            "Granatowy lakier przed korektą — widoczne zarysowania i ślady po usuniętych naklejkach",
          afterUrl: "/images/metamorfozy/lakier-po.jpg",
          afterAlt:
            "Ten sam lakier po polerowaniu — jednolita, głęboka granatowa tafla",
          podpis: "Bok busa po zdjęciu oklejenia reklamowego",
          order: 0,
        },
      ],
    },
  ],
};
