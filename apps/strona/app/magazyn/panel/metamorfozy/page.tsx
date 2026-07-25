import { MetamorfozyClient } from "@/components/magazyn/metamorfozy-client";
import { getMetamorfozy } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function MetamorfozyPanelPage() {
  const metamorfozy = await getMetamorfozy();
  return <MetamorfozyClient initial={metamorfozy} />;
}
