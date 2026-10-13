import { kodyQrDataSchema } from "@/lib/kody-qr";
import { saveKodyQr } from "@/lib/kody-qr-dane";
import { handleMagazynPut } from "@/lib/magazyn-api";

export async function PUT(request: Request) {
  return handleMagazynPut(request, {
    schema: kodyQrDataSchema,
    resource: "kody-qr",
    save: saveKodyQr,
  });
}
