import { FaqClient } from "@/components/magazyn/faq-client";
import { getFaqWulkanizacja } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function WulkanizacjaFaqPage() {
  const faq = await getFaqWulkanizacja();
  return <FaqClient initial={faq} linia="wulkanizacja" />;
}
