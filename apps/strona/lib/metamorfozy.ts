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
  /**
   * Własny napis na plakietce w rogu zdjęcia, np. „PRZED", „PO!", „ZBLIŻENIE".
   * Puste = plakietki nie ma, chyba że grupa ma dokładnie dwa zdjęcia — wtedy
   * wchodzą automatyczne „przed"/„po!" (patrz `Plakietka` w sekcji).
   */
  badge: z.string().optional(),
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
 * Prezentacja (zdjęcia grupy, plakietki, siatka) — implementacja w
 * `metamorfozy-view.ts`, bez zod-a, żeby sekcja „Efekty" („use client") nie
 * ciągnęła go na stronę główną. Tutaj re-eksport, więc reszta kodu importuje
 * dalej z `@/lib/metamorfozy`.
 */
export {
  paraZdjecia,
  plakietkaZdjecia,
  siatkaKolumny,
  podgladMaxSzerokosc,
} from "./metamorfozy-view";

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
