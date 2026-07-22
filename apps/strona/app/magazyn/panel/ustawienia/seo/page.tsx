import { redirect } from "next/navigation";
import { getModulyConfig } from "@moduly/magazyn-core/config";

export const dynamic = "force-dynamic";

/**
 * SEO ma własną pozycję w menu (`/panel/seo`) — pod „Ustawieniami" sidebar
 * przełączałby się na pod-nawigację ustawień i gubił główne menu.
 * Ten wpis zostaje, bo prowadzi do niego link z listy ustawień.
 */
export default function SeoSettingsRedirect() {
  redirect(`${getModulyConfig().basePath}/panel/seo`);
}
