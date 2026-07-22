import { SeoClient } from "@/components/magazyn/seo-client";
import { getSeo } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function SeoPanelPage() {
  const seo = await getSeo();
  return <SeoClient initial={seo} />;
}
