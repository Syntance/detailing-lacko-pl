import { redirect } from "next/navigation";
import { getModulyConfig } from "@moduly/magazyn-core/config";

export const dynamic = "force-dynamic";

export default function LegacyPageSeo() {
  redirect(`${getModulyConfig().basePath}/panel/ustawienia/seo`);
}
