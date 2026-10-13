import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { SeoClient } from "@/components/magazyn/seo-client";
import { opisSeoZCennika } from "@/lib/seo-wulkanizacja";
import { getDaneDynamiczne } from "@/lib/dynamiczne-dane";
import { getSeo, getSeoWulkanizacja } from "@/lib/site-data";

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
  const [seo, dane] = await Promise.all([getSeo(), getDaneDynamiczne()]);

  if (linia === "wulkanizacja") {
    const strona = await getSeoWulkanizacja();
    const cennik = dane.cenniki.wulkanizacja;
    return (
      <>
        <PrzelacznikLinii sciezka="/magazyn/panel/seo" aktywna={linia} />
        <SeoClient
          key={linia}
          initial={{ ...seo, ...strona }}
          strona="wulkanizacja"
          opisAuto={opisSeoZCennika(cennik)}
          dane={dane}
        />
      </>
    );
  }

  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/seo" aktywna={linia} />
      <SeoClient key={linia} initial={seo} dane={dane} />
    </>
  );
}
