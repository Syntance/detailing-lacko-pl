import type { ReactNode } from "react";
import { WulkanizacjaZakladki } from "@/components/magazyn/wulkanizacja-zakladki";

/**
 * Sekcja „Wulkanizacja" panelu — wszystko, co edytuje się dla strony
 * /wulkanizacja, w jednym miejscu: cennik, zdjęcia (CMS), FAQ i SEO.
 * Kontakt i dane firmy są wspólne z detailingiem (Magazyn → Dane firmy).
 */
export default function WulkanizacjaPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
          Wulkanizacja · strona /wulkanizacja
        </p>
        <WulkanizacjaZakladki />
      </div>
      {children}
    </div>
  );
}
