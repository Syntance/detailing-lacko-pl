import { CennikClient } from "@/components/magazyn/cennik-client";
import { getCennik } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function CennikPanelPage() {
  const cennik = await getCennik();
  return <CennikClient initial={cennik} />;
}
