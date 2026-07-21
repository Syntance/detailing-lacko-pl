import { redirect } from "next/navigation";
import { getModulyConfig } from "@moduly/magazyn-core/config";

export const dynamic = "force-dynamic";

/** Jedna podstrona ("home") — edytor jest bezpośrednio pod /panel/cms. */
export default function LegacyPageCms() {
  redirect(`${getModulyConfig().basePath}/panel/cms`);
}
