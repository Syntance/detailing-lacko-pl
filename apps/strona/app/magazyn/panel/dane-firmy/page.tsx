import { KontaktClient } from "@/components/magazyn/kontakt-client";
import { getKontakt } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function DaneFirmyPanelPage() {
  const kontakt = await getKontakt();
  return <KontaktClient initial={kontakt} />;
}
