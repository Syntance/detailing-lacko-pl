import { z } from "zod";

/**
 * Edycja plakatów do druku (treść, kolory, czcionki) — zapisywana w bazie
 * (`site_blobs`, klucz `druk-<id>`), nakładana w przeglądarce na wyrenderowane
 * kartki. Cenniki są poza edycją: ich treść idzie na żywo z panelu Cennik.
 *
 * Tekst jest nadpisywany po kluczu „kartka:indeks elementu" RAZEM z oryginałem.
 * Gdy zmieni się kod plakatu i pod kluczem stoi inny tekst, nadpisanie jest
 * pomijane — lepiej zgubić jedną poprawkę, niż wstawić ją w złe miejsce.
 */

export const PLAKATY_EDYTOWALNE = ["tabele-napraw", "momenty-kol"] as const;
export type PlakatEdytowalny = (typeof PLAKATY_EDYTOWALNE)[number];

export const jestEdytowalny = (id: string): id is PlakatEdytowalny =>
  (PLAKATY_EDYTOWALNE as readonly string[]).includes(id);

/** Tylko kroje dostępne bez pobierania z zewnątrz (CSP strony nie wpuszcza obcych fontów). */
export const CZCIONKI = [
  { id: "space", nazwa: "Space Grotesk (domyślna)", css: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif" },
  { id: "plex-mono", nazwa: "IBM Plex Mono", css: "var(--font-ibm-plex-mono), ui-monospace, monospace" },
  { id: "arial", nazwa: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "verdana", nazwa: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "trebuchet", nazwa: "Trebuchet MS", css: "'Trebuchet MS', Tahoma, sans-serif" },
  { id: "georgia", nazwa: "Georgia (szeryfowa)", css: "Georgia, 'Times New Roman', serif" },
] as const;

const idCzcionek = CZCIONKI.map((c) => c.id) as [string, ...string[]];
const kolor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const edycjaDrukuSchema = z.object({
  styl: z
    .object({
      akcent: kolor.optional(),
      tekst: kolor.optional(),
      tlo: kolor.optional(),
      fontNaglowki: z.enum(idCzcionek).optional(),
      fontTekst: z.enum(idCzcionek).optional(),
    })
    .default({}),
  teksty: z
    .record(
      z.string().regex(/^\d{1,2}:\d{1,4}$/),
      z.object({ oryginal: z.string().max(2000), tekst: z.string().max(2000) }),
    )
    .refine((t) => Object.keys(t).length <= 3000, "Za dużo zmian naraz.")
    .default({}),
});

export type EdycjaDruku = z.infer<typeof edycjaDrukuSchema>;

export const PUSTA_EDYCJA: EdycjaDruku = { styl: {}, teksty: {} };

export const kluczBlobuDruku = (id: PlakatEdytowalny) => `druk-${id}`;
