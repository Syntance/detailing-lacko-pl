import { z } from "zod";

/**
 * SEO całej strony — edytowalne w panelu Magazyn → SEO, przechowywane
 * w `site_blobs` pod kluczem `seo`. Czytane przez `generateMetadata`
 * w `app/page.tsx`, `app/layout.tsx` oraz `app/robots.ts`.
 *
 * Strona jest one-page, więc SEO jest globalne — nie ma osobnych wpisów
 * per podstrona. Podstrony prawne mają własne metadane w kodzie.
 */
export const seoDataSchema = z.object({
  /** <title> — do ~60 znaków, żeby Google nie ucinał. */
  title: z.string().min(1, "Tytuł jest wymagany"),
  /** <meta name="description"> — do ~155 znaków. */
  description: z.string().min(1, "Opis jest wymagany"),
  /** Fraza kluczowa — używana tylko jako podpowiedź w panelu, nie w <meta>. */
  focusKeyword: z.string(),
  /** Obraz Open Graph 1200×630 (udostępnianie w social media). */
  ogImageUrl: z.string(),
  /** Tytuł OG — puste = użyj `title`. */
  ogTitle: z.string(),
  /** Opis OG — puste = użyj `description`. */
  ogDescription: z.string(),
  /** false = noindex, nofollow (np. na czas przygotowywania strony). */
  indexable: z.boolean(),
  /** Kanoniczny adres strony (bez ukośnika na końcu). */
  siteUrl: z.string(),
  /** Zgoda na roboty AI (GPTBot, ClaudeBot, PerplexityBot) w robots.txt. */
  allowAiBots: z.boolean(),
});

export type SeoData = z.infer<typeof seoDataSchema>;

/** Limity zgodne z tym, co realnie wyświetla Google. */
export const SEO_LIMITS = {
  titleMax: 60,
  descriptionMax: 155,
} as const;

export const DEFAULT_SEO: SeoData = {
  title: "Detailing Łącko — pranie tapicerki, polerowanie | ceny z góry",
  description:
    "Pranie tapicerki od 300 zł, kompleksowe wnętrze 500 zł — pełny cennik na stronie, płacisz po obejrzeniu efektu. Czerniec 72, gmina Łącko.",
  focusKeyword: "pranie tapicerki Łącko",
  ogImageUrl: "/og.jpg",
  ogTitle: "",
  ogDescription: "",
  indexable: true,
  siteUrl: "https://detailing-lacko.pl",
  allowAiBots: true,
};
