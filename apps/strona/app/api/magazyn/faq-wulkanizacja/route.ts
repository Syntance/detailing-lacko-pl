import { faqDataSchema } from "@/lib/faq";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveFaqWulkanizacja } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: faqDataSchema,
    resource: "faq-wulkanizacja",
    save: saveFaqWulkanizacja,
  });
}
