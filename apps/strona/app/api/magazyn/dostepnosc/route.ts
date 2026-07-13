import { dostepnoscSchema } from "@/lib/rezerwacje";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveDostepnosc } from "@/lib/rezerwacje-store";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: dostepnoscSchema,
    resource: "dostepnosc",
    save: saveDostepnosc,
  });
}
