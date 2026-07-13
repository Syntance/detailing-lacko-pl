import { NextResponse } from "next/server";
import { computeSlots } from "@/lib/rezerwacje";
import { getDostepnosc, getTakenSlots } from "@/lib/rezerwacje-store";

export const dynamic = "force-dynamic";

/** GET /api/rezerwacje/sloty?date=YYYY-MM-DD → wolne godziny dla dnia. */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Nieprawidłowa data", code: "bad_date" },
      { status: 400 },
    );
  }

  const [config, taken] = await Promise.all([
    getDostepnosc(),
    getTakenSlots(date),
  ]);

  return NextResponse.json({
    enabled: config.enabled,
    slots: computeSlots(config, date, taken),
  });
}
