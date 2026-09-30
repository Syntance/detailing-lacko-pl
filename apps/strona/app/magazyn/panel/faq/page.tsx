import { redirect } from "next/navigation";
import { liniaZParametru } from "@/components/magazyn/przelacznik-linii";

/** FAQ edytujemy w CMS (pod zdjęciami strony) — stary adres przekierowuje. */
export default async function FaqPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ linia?: string }>;
}) {
  const linia = liniaZParametru((await searchParams).linia);
  redirect(`/magazyn/panel/cms${linia === "wulkanizacja" ? "?linia=wulkanizacja" : ""}#faq`);
}
