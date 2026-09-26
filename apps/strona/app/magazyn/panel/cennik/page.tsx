import { CennikClient } from "@/components/magazyn/cennik-client";
import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { getCennik, getCennikWulkanizacja } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function CennikPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  const cennik = linia === "wulkanizacja" ? await getCennikWulkanizacja() : await getCennik();
  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/cennik" aktywna={linia} />
      {/* key: przełączenie linii zaczyna edytor od zera (osobna historia cofania). */}
      <CennikClient key={linia} initial={cennik} linia={linia} />
    </>
  );
}
