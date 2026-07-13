import { cennikDataSchema } from "@/lib/cennik";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveCennik } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: cennikDataSchema,
    resource: "cennik",
    save: saveCennik,
  });
}
