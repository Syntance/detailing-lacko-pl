import { GaleriaClient } from "@/components/magazyn/galeria-client";
import { getGaleria } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function GaleriaPanelPage() {
  const galeria = await getGaleria();
  return <GaleriaClient initial={galeria} />;
}
