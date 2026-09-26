import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { TrescClient } from "@/components/magazyn/tresc-client";
import { getHomeContentRaw } from "@/lib/cms-content";

export const dynamic = "force-dynamic";

export default async function CmsPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  const content = linia === "wulkanizacja" ? await getHomeContentRaw("wulkanizacja") : await getHomeContentRaw();
  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/cms" aktywna={linia} />
      <TrescClient key={linia} initial={content} linia={linia} />
    </>
  );
}
