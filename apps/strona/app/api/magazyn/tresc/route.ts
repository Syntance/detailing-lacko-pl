import { homeContentSchema } from "@/lib/cms-schema";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveHomeContent } from "@/lib/cms-content";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: homeContentSchema,
    resource: "tresc-home",
    save: saveHomeContent,
  });
}
