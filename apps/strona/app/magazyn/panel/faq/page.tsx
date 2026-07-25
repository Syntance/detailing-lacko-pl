import { FaqClient } from "@/components/magazyn/faq-client";
import { getFaq } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function FaqPanelPage() {
  const faq = await getFaq();
  return <FaqClient initial={faq} />;
}
