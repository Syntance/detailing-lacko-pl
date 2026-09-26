import { FaqClient } from "@/components/magazyn/faq-client";
import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { getFaq, getFaqWulkanizacja } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function FaqPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  const faq = linia === "wulkanizacja" ? await getFaqWulkanizacja() : await getFaq();
  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/faq" aktywna={linia} />
      <FaqClient key={linia} initial={faq} linia={linia} />
    </>
  );
}
