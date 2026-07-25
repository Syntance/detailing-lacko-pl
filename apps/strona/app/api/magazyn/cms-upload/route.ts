import { NextResponse } from "next/server";
import {
  formatCmsUploadError,
  isCmsR2UploadConfigured,
  uploadCmsAssetFile,
  validateCmsUploadFile,
} from "@moduly/magazyn-core";
import { requireAdminSessionForPanel } from "@/lib/auth";

// Lokalna wersja handlera z @moduly/magazyn-core/api/cms-upload: tamten
// weryfikuje sesję przez Medusę (adminFetch /admin/users/me), której ten
// projekt nie ma — każdy upload padał na auth z „Backend Medusa nie
// odpowiada", zanim dotknął R2. Tu guard idzie przez sesję Postgres.
export const runtime = "nodejs";
export const maxDuration = 120;

function filesFromFormData(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdminSessionForPanel();
  } catch {
    return NextResponse.json(
      { error: "Sesja wygasła — zaloguj się ponownie." },
      { status: 401 },
    );
  }

  if (!isCmsR2UploadConfigured()) {
    return NextResponse.json(
      { error: "Magazyn plików nie jest skonfigurowany — ustaw zmienne S3_* (R2)." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const files = filesFromFormData(formData);
    if (files.length === 0) {
      return NextResponse.json({ error: "Nie wybrano plików." }, { status: 400 });
    }

    for (const file of files) {
      const validationError = validateCmsUploadFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const urls: string[] = [];
    for (const file of files) {
      const result = await uploadCmsAssetFile(file);
      urls.push(result.url);
    }

    return NextResponse.json({ urls, error: null });
  } catch (error) {
    console.error("[cms-upload]", error);
    return NextResponse.json(
      { error: formatCmsUploadError(error) },
      { status: 500 },
    );
  }
}
