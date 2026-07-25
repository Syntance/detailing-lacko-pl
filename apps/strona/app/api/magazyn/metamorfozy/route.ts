import { metamorfozyDataSchema } from "@/lib/metamorfozy";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveMetamorfozy } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: metamorfozyDataSchema,
    resource: "metamorfozy",
    save: saveMetamorfozy,
  });
}
