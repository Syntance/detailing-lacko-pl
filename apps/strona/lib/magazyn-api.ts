import "server-only";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { requireAdminSessionForPanel } from "./auth";
import { getPostgresClient } from "./db";

/**
 * Wspólna obsługa PUT dla edytorów panelu (cennik / galeria / kontakt):
 * guard sesji admina → walidacja Zod → zapis → audit log → rewalidacja "/".
 */
export async function handleMagazynPut<T>(
  request: Request,
  options: {
    schema: z.ZodType<T>;
    resource: string;
    save: (data: T) => Promise<void>;
  },
): Promise<NextResponse> {
  try {
    await requireAdminSessionForPanel();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized", code: "unauthorized" },
      { status: 401 },
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

  const parsed = options.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Walidacja nie powiodła się",
        code: "validation_error",
        issues: parsed.error.issues.slice(0, 10),
      },
      { status: 400 },
    );
  }

  await options.save(parsed.data);

  try {
    const { sql } = getPostgresClient();
    await sql`
      insert into audit_log (action, actor_email, resource_type, resource_id)
      values ('update', 'panel', ${options.resource}, 'default')
    `;
  } catch (error) {
    console.error(`[audit] Zapis audytu ${options.resource}:`, error);
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
