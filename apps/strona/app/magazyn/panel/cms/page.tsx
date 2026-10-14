import { liniaZParametru, PrzelacznikLinii } from "@/components/magazyn/przelacznik-linii";
import { FaqClient } from "@/components/magazyn/faq-client";
import { TrescClient } from "@/components/magazyn/tresc-client";
import { WyborLiniiClient } from "@/components/magazyn/wybor-linii-client";
import { getHomeContentRaw } from "@/lib/cms-content";
import { getDaneDynamiczne } from "@/lib/dynamiczne-dane";
import { getFaq, getFaqWulkanizacja } from "@/lib/site-data";
import { getWyborLinii } from "@/lib/wybor-linii-dane";

export const dynamic = "force-dynamic";

export default async function CmsPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  const [content, faq, dane, wybor] = await Promise.all([
    linia === "wulkanizacja" ? getHomeContentRaw("wulkanizacja") : getHomeContentRaw(),
    linia === "wulkanizacja" ? getFaqWulkanizacja() : getFaq(),
    getDaneDynamiczne(),
    getWyborLinii(),
  ]);
  return (
    <>
      <PrzelacznikLinii sciezka="/magazyn/panel/cms" aktywna={linia} />
      <TrescClient key={`tresc-${linia}`} initial={content} linia={linia} />
      {/* FAQ ma własny zapis (osobny blob) — stąd osobny pasek „Zapisz FAQ". */}
      <section id="faq" className="mt-12 scroll-mt-6 border-t border-border pt-10">
        <FaqClient key={`faq-${linia}`} initial={faq} linia={linia} dane={dane} />
      </section>
      {/* Strony wyboru są wspólne dla obu linii — ta sama sekcja niezależnie od przełącznika. */}
      <section id="strony-wyboru" className="mt-12 scroll-mt-6 border-t border-border pt-10">
        <WyborLiniiClient initial={wybor} dane={dane} />
      </section>
    </>
  );
}
