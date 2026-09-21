import { SeoClient } from "@/components/magazyn/seo-client";
import { opisSeoZCennika } from "@/lib/seo-wulkanizacja";
import {
  getCennikWulkanizacja,
  getSeo,
  getSeoWulkanizacja,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

/**
 * Edytor dostaje pełny obiekt SEO: pola strony /wulkanizacja nałożone na
 * główne SEO (z którego bierze tylko adres witryny do podglądu Google).
 * Zapis i tak odcina wszystko poza polami strony — patrz API seo-wulkanizacja.
 */
export default async function WulkanizacjaSeoPage() {
  const [seo, strona, cennik] = await Promise.all([
    getSeo(),
    getSeoWulkanizacja(),
    getCennikWulkanizacja(),
  ]);
  return (
    <SeoClient
      initial={{ ...seo, ...strona }}
      strona="wulkanizacja"
      opisAuto={opisSeoZCennika(cennik)}
    />
  );
}
