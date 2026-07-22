import type { MetadataRoute } from "next";
import { getSeo } from "@/lib/site-data";

/**
 * Dynamiczne, bo treść zależy od przełączników w panelu (indeksowanie,
 * roboty AI). Statyczny prerender zamroziłby stan z momentu builda —
 * odznaczenie „indeksuj" nie zadziałałoby aż do kolejnego deployu.
 */
export const dynamic = "force-dynamic";

/** Roboty AI — decyzja świadoma, przełączana w panelu Magazyn → SEO. */
const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();
  const siteUrl =
    seo.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://detailing-lacko.pl";

  // Wyłączone indeksowanie w panelu = twarde disallow dla wszystkich robotów.
  if (!seo.indexable) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/magazyn", "/api"] },
      ...(seo.allowAiBots
        ? []
        : [{ userAgent: AI_BOTS, disallow: "/" }]),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
