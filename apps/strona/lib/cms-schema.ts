import { z } from "zod";

/**
 * Edytowalny podzbiór treści strony głównej, zapisywany do `page_content`.
 * Decyzja (22.07.2026): copy strony żyje w kodzie — w CMS zostają tylko
 * zasoby wymienne bez udziału developera: zdjęcia, SEO, cennik, dane
 * kontaktowe. Tu: wyłącznie zdjęcie hero.
 */

export const heroContentSchema = z.object({
  desktopImageUrl: z.string().min(1, "Ścieżka zdjęcia jest wymagana"),
});

export const homeContentSchema = z.object({
  hero: heroContentSchema,
});

export type HeroContentInput = z.infer<typeof heroContentSchema>;
export type HomeContentInput = z.infer<typeof homeContentSchema>;
