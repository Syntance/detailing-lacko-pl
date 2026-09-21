import { z } from "zod";

/**
 * Edytowalny podzbiór treści strony, zapisywany do `page_content`
 * (wiersze `home` i `wulkanizacja` — patrz lib/cms-content.ts).
 * Decyzja (22.07.2026): copy strony żyje w kodzie — w CMS zostają tylko
 * zasoby wymienne bez udziału developera: zdjęcia, SEO, cennik, dane
 * kontaktowe. Tu: wyłącznie zdjęcie hero.
 */

export const heroContentSchema = z.object({
  /**
   * Puste = strona użyje domyślki z kodu (detailing: kadr z repo, wulkanizacja:
   * ilustracja koła zamiast zdjęcia). Wcześniej pole było wymagane, ale linia
   * bez własnego zdjęcia nie miałaby wtedy jak zapisać samego kadru mobilnego.
   */
  desktopImageUrl: z.string(),
  /** Osobny kadr pod telefony (pion). Puste = strona użyje desktopowego. */
  mobileImageUrl: z.string(),
});

export const homeContentSchema = z.object({
  hero: heroContentSchema,
});

export type HeroContentInput = z.infer<typeof heroContentSchema>;
export type HomeContentInput = z.infer<typeof homeContentSchema>;
