import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { SeoClient } from "@/components/magazyn/seo-client";
import { opisSeoZCennika } from "@/lib/seo-wulkanizacja";
import { getCennikWulkanizacja, getSeo, getSeoWulkanizacja } from "@/lib/site-data";

export const dynamic = "force-dynamic";

/**
 * Wulkanizacja: edytor dostaje pola strony /wulkanizacja nałożone na główne
 * SEO (z którego bierze tylko adres witryny do podglądu Google). Zapis i tak
 * odcina wszystko poza polami strony — patrz API seo-wulkanizacja.
 */
export default async function SeoPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  const seo = await getSeo();

  if (linia === "wulkanizacja") {
    const [strona, cennik] = await Promise.all([getSeoWulkanizacja(), getCennikWulkanizacja()]);
    return (
      <>
        <PrzelacznikLinii sciezka="/magazyn/panel/seo" aktywna={linia} />
        <SeoClient
          key={linia}
          initial={{ ...seo, ...strona }}
          strona="wulkanizacja"
          opisAuto={opisSeoZCennika(cennik)}
        />
      </>
    );
  }

  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/seo" aktywna={linia} />
      <SeoClient key={linia} initial={seo} />
    </>
  );
}
