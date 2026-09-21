import { CennikClient } from "@/components/magazyn/cennik-client";
import { getCennikWulkanizacja } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function WulkanizacjaCennikPage() {
  const cennik = await getCennikWulkanizacja();
  return <CennikClient initial={cennik} linia="wulkanizacja" />;
}
