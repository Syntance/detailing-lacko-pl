import { NextResponse } from "next/server";
import { edycjaDrukuSchema, jestEdytowalny } from "@/lib/druk-edycja";
import { handleMagazynPut } from "@/lib/magazyn-api";
import { saveEdycjaDruku } from "@/lib/site-data";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ plakat: string }> },
) {
  const { plakat } = await params;
  if (!jestEdytowalny(plakat)) {
    return NextResponse.json({ error: "Ten plakat nie jest edytowalny", code: "not_found" }, { status: 404 });
  }
  return handleMagazynPut(request, {
    schema: edycjaDrukuSchema,
    resource: `druk-${plakat}`,
    save: (data) => saveEdycjaDruku(plakat, data),
  });
}
