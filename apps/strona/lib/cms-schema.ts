import { z } from "zod";

/**
 * Edytowalny podzbiór treści strony głównej (hero + FAQ), zapisywany do
 * `page_content` przez DataStore. Storefront czyta to samo źródło
 * (`@moduly/cms` getPageContent). Zastępuje edytor `@moduly/magazyn-content`,
 * który jest podpięty pod Medusę (a ten projekt jej nie ma).
 */

export const heroContentSchema = z.object({
  headline: z.string().min(1, "Nagłówek jest wymagany"),
  subtitle: z.string(),
  description: z.string().min(1, "Opis jest wymagany"),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
  desktopImageUrl: z.string(),
});

export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, "Pytanie jest wymagane"),
  answer: z.string().min(1, "Odpowiedź jest wymagana"),
  order: z.number().int(),
});

export const homeContentSchema = z.object({
  hero: heroContentSchema,
  faq: z.array(faqItemSchema),
});

export type HeroContentInput = z.infer<typeof heroContentSchema>;
export type FaqItemInput = z.infer<typeof faqItemSchema>;
export type HomeContentInput = z.infer<typeof homeContentSchema>;
