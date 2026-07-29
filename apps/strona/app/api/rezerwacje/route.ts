import { NextResponse } from "next/server";
import { computeSlots, resolveUslugi, rezerwacjaInputSchema } from "@/lib/rezerwacje";
import { enforceRateLimit, requestIp } from "@/lib/rate-limit";
import { getCennik } from "@/lib/site-data";
import {
  createRezerwacja,
  getDostepnosc,
  listPraceAktywne,
} from "@/lib/rezerwacje-store";

export const dynamic = "force-dynamic";

/** POST /api/rezerwacje — publiczne. Rate limit + walidacja slotu + anty-dubel. */
export async function POST(request: Request) {
  // Bez limitu bot zapełniłby cały kalendarz fałszywymi rezerwacjami.
  const limit = await enforceRateLimit({
    key: `rezerwacje:ip:${requestIp(request)}`,
    limit: 5,
    windowSeconds: 3_600,
  });
  if (!limit.success) {
    return NextResponse.json(
      {
        error: "Za dużo prób z tego adresu. Spróbuj za godzinę albo zadzwoń.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON", code: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = rezerwacjaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Uzupełnij poprawnie formularz.",
        code: "validation_error",
        issues: parsed.error.issues.slice(0, 8),
      },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const config = await getDostepnosc();
  if (!config.enabled) {
    return NextResponse.json(
      { error: "Rezerwacje online są chwilowo wyłączone.", code: "disabled" },
      { status: 409 },
    );
  }

  // Czas i ceny liczymy z cennika po stronie serwera — nigdy z payloadu.
  const cennik = await getCennik();
  const resolved = resolveUslugi(cennik, input.serviceIds);
  if (!resolved) {
    return NextResponse.json(
      { error: "Wybrana usługa nie istnieje. Odśwież stronę.", code: "bad_services" },
      { status: 400 },
    );
  }

  // Slot musi być realnie dostępny wg konfiguracji, zajętości i czasu usług
  // (nie tylko „niezajęty") — stąd pełne przeliczenie propozycji dla dnia.
  const prace = await listPraceAktywne(input.date);
  const available = computeSlots(config, input.date, resolved.durationMinutes, prace);
  const slot = available.find((s) => s.time === input.time);
  if (!slot) {
    return NextResponse.json(
      {
        error: "Ten termin jest już niedostępny. Wybierz inny.",
        code: "slot_unavailable",
      },
      { status: 409 },
    );
  }

  const result = await createRezerwacja({
    date: input.date,
    time: input.time,
    name: input.name,
    phone: input.phone,
    email: input.email,
    note: input.note,
    services: resolved.services,
    durationMinutes: resolved.durationMinutes,
    pickupDate: slot.pickupDate,
    pickupTime: slot.pickupTime,
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Ten termin właśnie ktoś zarezerwował. Wybierz inny.",
        code: "slot_taken",
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { ok: true, pickupDate: slot.pickupDate, pickupTime: slot.pickupTime },
    { status: 201 },
  );
}
