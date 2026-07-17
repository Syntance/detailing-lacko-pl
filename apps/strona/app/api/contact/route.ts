import { submitContact } from "@moduly/magazyn-forms";
import { NextResponse } from "next/server";
import { enforceRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request): Promise<NextResponse> {
  const limit = await enforceRateLimit({
    key: `kontakt:ip:${requestIp(request)}`,
    limit: 10,
    windowSeconds: 3_600,
  });
  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Za dużo wiadomości z tego adresu. Spróbuj później.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  try {
    const formData = await request.formData();
    const result = await submitContact({ status: "idle" }, formData);

    if (result.status === "success") {
      return NextResponse.json({
        ok: true,
        caseNumber: result.caseNumber,
        topic: result.topic,
        topicOther: result.topicOther,
      });
    }

    if (result.status === "error") {
      return NextResponse.json(
        {
          ok: false,
          errors: result.errors,
          message: result.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: false, message: "Nie udało się wysłać formularza." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Nie udało się wysłać formularza. Spróbuj ponownie." },
      { status: 500 },
    );
  }
}
