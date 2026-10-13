import { z } from "zod";

/**
 * Kody QR z panelu. Każdy kod koduje stały adres `/qr/<slug>` na domenie
 * detailingu, a ten przekierowuje pod `cel` — zmiana linku w panelu działa
 * od razu na wszystkich wydrukowanych już kodach. Slug nadawany raz, przy
 * tworzeniu, i potem się nie zmienia (inaczej wydruki przestałyby działać).
 */

export const KSZTALTY_MODULOW = ["kwadrat", "plynne", "kropki", "drobne"] as const;
export const KSZTALTY_OCZEK = ["kwadrat", "zaokraglone", "kolo"] as const;
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
  ksztaltOczek: z.enum(KSZTALTY_OCZEK).default("kwadrat"),
  korekcja: z.enum(POZIOMY_KOREKCJI).default("M"),
  /** Margines (quiet zone) w modułach. Standard to 4, czytniki radzą sobie od 2. */
  margines: z.number().int().min(0).max(8).default(4),
  logo: logo.optional(),
  /** Bok logo jako ułamek boku kodu — powyżej ~0,3 kod przestaje się skanować. */
  rozmiarLogo: z.number().min(0.1).max(0.3).default(0.22),
  /** Białe pole pod logo (wycina moduły), żeby logo nie zlewało się z kodem. */
  tloLogo: z.boolean().default(true),
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

export const kodQrSchema = z.object({
  id: z.string().min(1).max(60),
  nazwa: z.string().trim().min(1, "Nadaj kodowi nazwę").max(120),
  slug: z.string().regex(SLUG_REGEX),
  cel: celSchema,
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
