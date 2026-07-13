import { kontaktSchema } from "@/lib/site";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveKontakt } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: kontaktSchema,
    resource: "kontakt",
    save: saveKontakt,
  });
}
