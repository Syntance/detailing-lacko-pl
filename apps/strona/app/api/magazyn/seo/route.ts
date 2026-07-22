import { handleMagazynPut } from "@/lib/magazyn-api";
import { seoDataSchema } from "@/lib/seo";
import { saveSeo } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: seoDataSchema,
    resource: "seo",
    save: saveSeo,
  });
}
