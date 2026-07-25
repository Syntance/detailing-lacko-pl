import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCmsPresignedUpload,
  formatCmsUploadError,
  isCmsR2UploadConfigured,
} from "@moduly/magazyn-core";
import { requireAdminSessionForPanel } from "@/lib/auth";

// Lokalna wersja handlera z @moduly/magazyn-core/api/cms-upload/presign —
// jak w ../route.ts: auth przez sesję Postgres zamiast Medusy.
export const runtime = "nodejs";

const presignBodySchema = z.object({
  filename: z.string().trim().min(1),
  contentType: z.string().trim().optional().default(""),
  size: z.number().int().positive(),
});

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = presignBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Brak nazwy pliku lub rozmiaru." },
      { status: 400 },
    );
  }

  try {
    const result = await createCmsPresignedUpload(parsed.data);
    return NextResponse.json({ ...result, error: null });
  } catch (error) {
    console.error("[cms-upload/presign]", error);
    return NextResponse.json(
      { error: formatCmsUploadError(error) },
      { status: 500 },
    );
  }
}
