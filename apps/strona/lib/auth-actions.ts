"use server";

import { getModulyConfig } from "@moduly/magazyn-core/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPostgresAuth, nextCookieAdapter } from "./auth";
import { enforceRateLimit } from "./rate-limit";

export type LoginState = { error: string | null };

export async function loginEmailAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Podaj email i hasło." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip")?.trim() ??
    "unknown";

  // Realny limiter (stub z auth-core jest fail-open): 5 prób / 15 min per IP i e-mail.
  const [ipLimit, emailLimit] = await Promise.all([
    enforceRateLimit({ key: `login:ip:${ip}`, limit: 5, windowSeconds: 900 }),
    enforceRateLimit({
      key: `login:email:${email.toLowerCase()}`,
      limit: 5,
      windowSeconds: 900,
    }),
  ]);
  if (!ipLimit.success || !emailLimit.success) {
    return {
      error: "Za dużo prób logowania. Odczekaj kwadrans i spróbuj ponownie.",
    };
  }

  try {
    const auth = getPostgresAuth();
    await auth.loginWithCookie(email, password, await nextCookieAdapter());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udało się zalogować.";
    return { error: message };
  }

  redirect(`${getModulyConfig().basePath}/panel`);
}

export async function logoutAction(): Promise<void> {
  const auth = getPostgresAuth();
  await auth.logoutCookie(await nextCookieAdapter());
  redirect(getModulyConfig().basePath);
}
