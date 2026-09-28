import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { ADRES_LINII, OSOBNE_DOMENY, czyHostWulkanizacji } from "@/lib/linie";

/**
 * Każda domena ma własną mapę: wulkanizacja-lacko.pl tylko swoją stronę
 * główną, detailing-lacko.pl swoją (oraz /wulkanizacja, dopóki osobne domeny
 * są wyłączone).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const host = (await headers()).get("host");

  if (czyHostWulkanizacji(host)) {
    return [
      { url: `${ADRES_LINII.wulkanizacja}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    ];
  }

  return [
    { url: ADRES_LINII.detailing, lastModified, changeFrequency: "monthly", priority: 1 },
    ...(OSOBNE_DOMENY
      ? []
      : [
          {
            url: `${ADRES_LINII.detailing}/wulkanizacja`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.9,
          },
        ]),
  ];
}
