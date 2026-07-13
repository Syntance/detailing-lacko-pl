import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSessionForPanel } from "@/lib/auth";
import { REZERWACJA_STATUSY } from "@/lib/rezerwacje";
import {
  deleteRezerwacja,
  listRezerwacje,
  updateRezerwacjaStatus,
} from "@/lib/rezerwacje-store";

export const dynamic = "force-dynamic";

async function guard(): Promise<boolean> {
  try {
    await requireAdminSessionForPanel();
    return true;
  } catch {
    return false;
  }
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });

/** GET — lista wszystkich rezerwacji (panel). */
export async function GET() {
  if (!(await guard())) return unauthorized();
  return NextResponse.json({ reservations: await listRezerwacje() });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(REZERWACJA_STATUSY),
});

/** PATCH — zmiana statusu rezerwacji. */
export async function PATCH(request: Request) {
  if (!(await guard())) return unauthorized();
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nieprawidłowe dane", code: "validation_error" },
      { status: 400 },
    );
  }
  await updateRezerwacjaStatus(parsed.data.id, parsed.data.status);
  return NextResponse.json({ ok: true });
}

/** DELETE ?id=… — trwałe usunięcie rezerwacji. */
export async function DELETE(request: Request) {
  if (!(await guard())) return unauthorized();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: "Brak/nieprawidłowe id", code: "bad_id" },
      { status: 400 },
    );
  }
  await deleteRezerwacja(id);
  return NextResponse.json({ ok: true });
}
