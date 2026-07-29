import { NextResponse } from "next/server";
import { computeSlots, resolveUslugi } from "@/lib/rezerwacje";
import { getCennik } from "@/lib/site-data";
import { getDostepnosc, listPraceAktywne } from "@/lib/rezerwacje-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/rezerwacje/sloty?date=YYYY-MM-DD&services=id1,id2
 * → wolne godziny startu dla dnia i wybranych usług, każda z wyliczonym
 * momentem odbioru auta (praca może przelać się na kolejne dni robocze).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Nieprawidłowa data", code: "bad_date" },
      { status: 400 },
    );
  }

  const serviceIds = (params.get("services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const [config, cennik, prace] = await Promise.all([
    getDostepnosc(),
    getCennik(),
    listPraceAktywne(date),
  ]);

  // Bez usług (stary klient / ręczny URL) liczymy jak dla jednego slotu.
  let durationMinutes = 0;
  if (serviceIds.length > 0) {
    const resolved = resolveUslugi(cennik, serviceIds);
    if (!resolved) {
      return NextResponse.json(
        { error: "Nieznana usługa", code: "bad_services" },
        { status: 400 },
      );
    }
    durationMinutes = resolved.durationMinutes;
  }

  return NextResponse.json({
    enabled: config.enabled,
    durationMinutes,
    slots: computeSlots(config, date, durationMinutes, prace),
  });
}
