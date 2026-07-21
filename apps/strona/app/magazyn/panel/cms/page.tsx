import { TrescClient } from "@/components/magazyn/tresc-client";
import { getHomeContentRaw } from "@/lib/cms-content";

export const dynamic = "force-dynamic";

export default async function CmsPanelPage() {
  const content = await getHomeContentRaw();
  return <TrescClient initial={content} />;
}
