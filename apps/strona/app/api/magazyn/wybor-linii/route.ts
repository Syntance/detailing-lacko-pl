import { revalidatePath } from "next/cache";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { SCIEZKI_WYBORU, wyborLiniiSchema } from "@/lib/wybor-linii";
import { saveWyborLinii } from "@/lib/wybor-linii-dane";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: wyborLiniiSchema,
    resource: "wybor-linii",
    save: async (data) => {
      await saveWyborLinii(data);
      // handleMagazynPut odświeża tylko strony linii — /mapy i /strony trzeba osobno.
      for (const sciezka of Object.values(SCIEZKI_WYBORU)) revalidatePath(sciezka);
    },
  });
}
