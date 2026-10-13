import { NextResponse } from "next/server";
import { SLUG_REGEX } from "@/lib/kody-qr";
import { getKodyQr } from "@/lib/kody-qr-dane";

export const dynamic = "force-dynamic";

/**
 * Przekierowanie z wydrukowanego kodu QR. 307 + no-store, żeby telefon nie
 * zapamiętał starego celu — link zmieniony w panelu działa od razu.
 * Nieznany lub wyłączony kod prowadzi na stronę główną zamiast na 404.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const kod = SLUG_REGEX.test(slug)
    ? (await getKodyQr()).kody.find((k) => k.slug === slug && k.aktywny)
    : undefined;

  const cel = kod ? kod.cel : new URL("/", request.url).toString();
  const response = NextResponse.redirect(cel, 307);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
