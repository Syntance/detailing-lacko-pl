import { NextResponse } from "next/server";
import {
  computeSlots,
  resolveUslugi,
  rezerwacjaInputSchema,
} from "@/lib/rezerwacje";
import { enforceRateLimit, requestIp } from "@/lib/rate-limit";
import {
  createCalendarEvent,
  getBusyFromCalendar,
} from "@/lib/google-calendar";
import { findSelectionConflict, formatDuration } from "@/lib/cennik";
import { sendRezerwacjaNotification } from "@/lib/rezerwacja-mail";
import { getCennik } from "@/lib/site-data";
import {
  createRezerwacja,
  getDostepnosc,
  listPraceAktywne,
  setCalendarEventId,
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
      {
        error: "Wybrana usługa nie istnieje. Odśwież stronę.",
        code: "bad_services",
      },
      { status: 400 },
    );
  }

  // Pakiet razem ze swoją składową = podwójna płatność za tę samą robotę
  // i podwójny czas w kalendarzu. Widget na to nie pozwala, ale payload
  // przychodzi od klienta, więc reguła musi obowiązywać też tutaj.
  const conflict = findSelectionConflict(cennik.items, input.serviceIds);
  if (conflict) {
    return NextResponse.json(
      {
        error: `„${conflict.included.name}" jest już w cenie „${conflict.owner.name}". Odśwież stronę i wybierz ponownie.`,
        code: "services_conflict",
      },
      { status: 400 },
    );
  }

  // Slot musi być realnie dostępny wg konfiguracji, zajętości i czasu usług
  // (nie tylko „niezajęty") — stąd pełne przeliczenie propozycji dla dnia.
  const [prace, kalendarz] = await Promise.all([
    listPraceAktywne(input.date),
    getBusyFromCalendar(input.date, input.date),
  ]);
  const available = computeSlots(config, input.date, resolved.durationMinutes, [
    ...prace,
    ...kalendarz,
  ]);
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

  // Powiadomienie do właściciela — nie blokuje odpowiedzi dla klienta.
  await sendRezerwacjaNotification({
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

  // Wydarzenie „auto w warsztacie" w Kalendarzu Google: od przyjęcia do
  // odbioru. Fail-soft — gdy Google nie odpowie, rezerwacja i tak jest przyjęta
  // (widać ją w panelu), a kalendarz zsynchronizuje się przy kolejnej zmianie.
  if (result.id) {
    const eventId = await createCalendarEvent({
      reservationId: result.id,
      summary: `Rezerwacja: ${resolved.services.map((s) => s.name).join(", ")}`,
      description: [
        `${input.name} · ${input.phone}${input.email ? ` · ${input.email}` : ""}`,
        `Usługi: ${resolved.services.map((s) => `${s.name} (${s.priceLabel})`).join(", ")}`,
        `Czas pracy: ok. ${formatDuration(resolved.durationMinutes)}`,
        `Odbiór: ${slot.pickupDate} ${slot.pickupTime}`,
        input.note ? `Uwagi: ${input.note}` : "",
        "",
        "Wstępna rezerwacja ze strony — do potwierdzenia telefonicznie.",
      ]
        .filter(Boolean)
        .join("\n"),
      startDate: input.date,
      startTime: input.time,
      endDate: slot.pickupDate,
      endTime: slot.pickupTime,
    });
    if (eventId) {
      try {
        await setCalendarEventId(result.id, eventId);
      } catch (error) {
        console.error("[rezerwacje] Zapis id wydarzenia:", error);
      }
    }
  }

  return NextResponse.json(
    { ok: true, pickupDate: slot.pickupDate, pickupTime: slot.pickupTime },
    { status: 201 },
  );
}
