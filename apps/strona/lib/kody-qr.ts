import { z } from "zod";

/**
 * Kody QR z panelu. Każdy kod koduje stały adres `/qr/<slug>` na domenie
 * detailingu, a ten przekierowuje pod `cel` — zmiana linku w panelu działa
 * od razu na wszystkich wydrukowanych już kodach. Slug nadawany raz, przy
 * tworzeniu, i potem się nie zmienia (inaczej wydruki przestałyby działać).
 */

// Kolejność = kolejność kafelków w edytorze. Pierwsze identyfikatory
// (kwadrat, plynne, kropki, drobne / kwadrat, zaokraglone, kolo) są w już
// zapisanych kodach — nie zmieniać ich nazw.
export const KSZTALTY_MODULOW = [
  "kwadrat",
  "odstepy",
  "zaokraglone",
  "drobne",
  "kropki",
  "male-kropki",
  "plynne",
  "metro",
  "pionowe",
  "poziome",
  "lisc",
  "romby",
  "osmiokaty",
  "plusy",
  "krzyzyki",
  "gwiazdki",
  "iskry",
  "serca",
] as const;
export const KSZTALTY_OCZEK = [
  "kwadrat",
  "zaokraglone",
  "kolo",
  "miekkie",
  "lisc",
  "kropla",
  "osmiokat",
  "kropki",
] as const;
export const KSZTALTY_SRODKOW = [
  "kwadrat",
  "zaokraglony",
  "kolo",
  "osmiokat",
  "lisc",
  "kropla",
  "plus",
  "romb",
  "kropki",
  "poziome",
  "pionowe",
] as const;
export const RODZAJE_GRADIENTU = ["brak", "liniowy", "radialny"] as const;
export const POZIOMY_KOREKCJI = ["L", "M", "Q", "H"] as const;

const kolor = z.string().regex(/^#[0-9a-f]{6}$/i, "Kolor w formacie #RRGGBB");

/** Logo trzymamy jako PNG w data-URL (zmniejszone w przeglądarce) — bez SVG (XSS). */
const LOGO_MAX = 400_000;
const logo = z
  .string()
  .max(LOGO_MAX, "Logo jest za duże")
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, "Nieprawidłowy obraz logo");

export const wygladSchema = z.object({
  kolor: kolor.default("#1f2a24"),
  kolorOczek: kolor.default("#1f2a24"),
  tlo: kolor.default("#ffffff"),
  przezroczysteTlo: z.boolean().default(false),
  ksztaltModulow: z.enum(KSZTALTY_MODULOW).default("kwadrat"),
  /** Gradient modułów: drugi kolor + rodzaj (liniowy po przekątnej / od środka). */
  gradient: z.enum(RODZAJE_GRADIENTU).default("brak"),
  kolor2: kolor.default("#3f7a5c"),
  /** Ramka oczka (7×7). */
  ksztaltOczek: z.enum(KSZTALTY_OCZEK).default("kwadrat"),
  /** Środek oczka (3×3). Brak w starszych zapisach → dobierany do ramki. */
  ksztaltSrodka: z.enum(KSZTALTY_SRODKOW).optional(),
  korekcja: z.enum(POZIOMY_KOREKCJI).default("M"),
  /** Margines (quiet zone) w modułach. Standard to 4, czytniki radzą sobie od 2. */
  margines: z.number().int().min(0).max(8).default(4),
  logo: logo.optional(),
  /** Bok logo jako ułamek boku kodu — powyżej ~0,3 kod przestaje się skanować. */
  rozmiarLogo: z.number().min(0.1).max(0.3).default(0.22),
  /** Podkład pod logo (wycina moduły), żeby logo nie zlewało się z kodem. */
  tloLogo: z.boolean().default(true),
  /**
   * Kształt logo. Nic z poniższych nie zwiększa powierzchni wyciętej z kodu:
   * podkład razem z obrotem i proporcjami mieści się w kwadracie wyznaczonym
   * przez `rozmiarLogo` (większe logo jest skalowane w dół — patrz zbudujGeometrie).
   */
  /** Zaokrąglenie wszystkich rogów logo naraz: 0 = ostre, 1 = pełne (koło przy kwadracie). Starszy zapis — `logoRogi` ma pierwszeństwo. */
  logoZaokraglenie: z.number().min(0).max(1).default(0),
  /**
   * Zaokrąglenie każdego rogu LOGO osobno: lewy górny, prawy górny, prawy dolny,
   * lewy dolny (0–1, ułamek połowy krótszego boku). Brak = wszystkie jak `logoZaokraglenie`.
   */
  logoRogi: z
    .tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)])
    .optional(),
  /** Szerokość / wysokość logo. Brak = kwadrat z oryginalnymi proporcjami obrazu. */
  logoProporcje: z.number().min(0.4).max(2.5).optional(),
  /** Szerokość / wysokość wgranego pliku — punkt startowy suwaka proporcji. */
  logoOryginalne: z.number().min(0.1).max(10).optional(),
  /** Obrót logo w stopniach (podkład obraca się razem z nim). */
  logoObrot: z.number().int().min(-180).max(180).default(0),
  /** Kolor podkładu pod logo. Brak = kolor tła kodu. */
  kolorTlaLogo: kolor.optional(),
  /**
   * Zaokrąglenie każdego rogu podkładu osobno: lewy górny, prawy górny, prawy dolny,
   * lewy dolny (0 = ostry, 1 = połowa krótszego boku). Rogi obracają się z logo.
   * Brak = podkład zaokrągla się tak jak logo (każdy róg jak odpowiedni róg logo).
   */
  podkladRogi: z
    .tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)])
    .optional(),
});

export type WygladQr = z.infer<typeof wygladSchema>;

export const SLUG_REGEX = /^[a-z0-9-]{3,40}$/;

export const celSchema = z
  .string()
  .trim()
  .min(1, "Podaj adres docelowy")
  .max(2000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Adres musi zaczynać się od https:// (albo http://)");

/**
 * dynamiczny — kod zawiera stały adres /qr/<slug>, który przekierowuje pod
 *   `cel`; link zmienisz po wydrukowaniu, kosztem jednego przekierowania.
 * statyczny — kod zawiera bezpośrednio `cel`; telefon otwiera go od razu,
 *   ale po wydrukowaniu linku już się nie zmieni.
 */
export const TRYBY_KODU = ["dynamiczny", "statyczny"] as const;
export type TrybKodu = (typeof TRYBY_KODU)[number];

export const kodQrSchema = z.object({
  id: z.string().min(1).max(60),
  nazwa: z.string().trim().min(1, "Nadaj kodowi nazwę").max(120),
  slug: z.string().regex(SLUG_REGEX),
  cel: celSchema,
  // Kody zapisane przed dodaniem trybu były dynamiczne — domyślka zachowuje je bez zmian.
  tryb: z.enum(TRYBY_KODU).default("dynamiczny"),
  aktywny: z.boolean().default(true),
  wyglad: wygladSchema,
  utworzono: z.string().max(40),
});

export type KodQr = z.infer<typeof kodQrSchema>;

export const kodyQrDataSchema = z
  .object({ kody: z.array(kodQrSchema).max(200) })
  .superRefine((data, ctx) => {
    const sl = new Set<string>();
    data.kody.forEach((kod, i) => {
      if (sl.has(kod.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["kody", i, "slug"],
          message: `Adres /qr/${kod.slug} jest już zajęty`,
        });
      }
      sl.add(kod.slug);
    });
  });

export type KodyQrData = z.infer<typeof kodyQrDataSchema>;

export const DEFAULT_KODY_QR: KodyQrData = { kody: [] };

export const DOMYSLNY_WYGLAD: WygladQr = wygladSchema.parse({});

/** Ścieżka zakodowana w QR — krótka, żeby kod był rzadszy i łatwiej się skanował. */
export function sciezkaKodu(slug: string): string {
  return `/qr/${slug}`;
}

/**
 * Tekst zapisany w kodzie QR. Statyczny = sam link docelowy (null, gdy link
 * jest niepoprawny — wtedy nie ma czego zakodować), dynamiczny = adres
 * przekierowania na domenie detailingu.
 */
export function tekstKodu(kod: Pick<KodQr, "tryb" | "slug" | "cel">, adresBazowy: string): string | null {
  if (kod.tryb === "statyczny") {
    const cel = celSchema.safeParse(kod.cel);
    return cel.success ? cel.data : null;
  }
  return `${adresBazowy}${sciezkaKodu(kod.slug)}`;
}
