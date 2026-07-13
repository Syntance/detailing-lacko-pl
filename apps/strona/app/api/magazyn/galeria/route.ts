import { galeriaDataSchema } from "@/lib/galeria";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveGaleria } from "@/lib/site-data";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: galeriaDataSchema,
    resource: "galeria",
    save: saveGaleria,
  });
}
