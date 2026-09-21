import { handleMagazynPut } from "@/lib/magazyn-api";
import { seoStronySchema } from "@/lib/seo-wulkanizacja";
import { saveSeoWulkanizacja } from "@/lib/site-data";

/**
 * Zapis SEO strony /wulkanizacja. Edytor wysyła pełny obiekt SEO (razem
 * z ustawieniami całej witryny, które tylko wyświetla), a `seoStronySchema`
 * odcina wszystko poza polami strony — przełączniki indeksowania i robotów AI
 * zmienia wyłącznie główne SEO.
 */
export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: seoStronySchema,
    resource: "seo-wulkanizacja",
    save: saveSeoWulkanizacja,
  });
}
