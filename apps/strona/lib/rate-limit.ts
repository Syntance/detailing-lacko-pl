import "server-only";

/**
 * Realny rate limiter (stub w @moduly/auth-core jest fail-open nawet z Upstash).
 *
 * - Z UPSTASH_REDIS_REST_URL/TOKEN: fixed window na Upstash REST (INCR+EXPIRE
 *   w pipeline), wspólny dla wszystkich instancji serverless.
 * - Bez Upstash: fallback in-memory per instancję — słaby na Vercelu (reset przy
 *   cold start, osobny licznik na lambdę), dlatego na produkcji loguje głośny
 *   błąd konfiguracji. Awaria Upstash = fail-open + błąd w logach (nie blokujemy
 *   klientów przez padnięty Redis).
 */

export type LimitVerdict = { success: boolean; retryAfterSeconds: number };

type LimitOptions = {
  /** Klucz limitu, np. `rezerwacje:ip:1.2.3.4`. */
  key: string;
  /** Maks. żądań w oknie. */
  limit: number;
  /** Okno w sekundach. */
  windowSeconds: number;
};

const memoryHits = new Map<string, { count: number; resetAt: number }>();
let warnedFallback = false;

async function upstashCount(
  key: string,
  windowSeconds: number,
): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSeconds), "NX"],
    ]),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

  const rows = (await res.json()) as { result?: number | string }[];
  const count = Number(rows?.[0]?.result);
  return Number.isFinite(count) ? count : null;
}

export async function enforceRateLimit(
  options: LimitOptions,
): Promise<LimitVerdict> {
  try {
    const count = await upstashCount(options.key, options.windowSeconds);
    if (count !== null) {
      return count <= options.limit
        ? { success: true, retryAfterSeconds: 0 }
        : { success: false, retryAfterSeconds: options.windowSeconds };
    }
  } catch (error) {
    console.error("[rate-limit] Upstash niedostępny — fail-open:", error);
    return { success: true, retryAfterSeconds: 0 };
  }

  if (!warnedFallback && process.env.NODE_ENV === "production") {
    warnedFallback = true;
    console.error(
      "[rate-limit] Brak UPSTASH_REDIS_REST_URL/TOKEN — działa tylko limiter " +
        "in-memory per instancję. Na produkcji ustaw Upstash (incydent konfiguracji).",
    );
  }

  const now = Date.now();
  const entry = memoryHits.get(options.key);
  if (!entry || entry.resetAt <= now) {
    if (memoryHits.size > 5_000) {
      for (const [key, value] of memoryHits) {
        if (value.resetAt <= now) memoryHits.delete(key);
      }
    }
    memoryHits.set(options.key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1_000,
    });
    return { success: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count <= options.limit) {
    return { success: true, retryAfterSeconds: 0 };
  }
  return {
    success: false,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
  };
}

/** IP klienta z nagłówków proxy (na Vercelu x-forwarded-for ustawia platforma). */
export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
