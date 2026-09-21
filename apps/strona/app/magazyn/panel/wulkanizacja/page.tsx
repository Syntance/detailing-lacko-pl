import { redirect } from "next/navigation";

/** Wejście w sekcję = pierwsza zakładka (cennik). */
export default function WulkanizacjaPanelPage() {
  redirect("/magazyn/panel/wulkanizacja/cennik");
}
