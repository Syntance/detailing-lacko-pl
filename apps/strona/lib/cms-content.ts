import "server-only";

import type { PageContent } from "@moduly/types";
import { getPostgresClient } from "./db";
import type { HomeContentInput } from "./cms-schema";

/**
 * Odczyt/zapis treści strony głównej wprost na tabeli `page_content`
 * (klient Postgres, jak blobs.ts). NIE używamy getDataStore() — jest ustawiany
 * w initModuly() z layoutu stron, a trasy /api/* przez layout nie przechodzą,
 * więc w route handlerze DataStore jest null (to powodowało 500 przy zapisie).
 * Storefront czyta tę samą tabelę, więc zmiany są widoczne od razu.
 *
 * Copy strony żyje w kodzie (decyzja 22.07.2026) — CMS trzyma tylko zdjęcie
 * hero; ewentualne stare bloki treści w page_content są ignorowane.
 */

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim());
}

const HERO_IMAGE_FALLBACK = "/images/hero.jpg";

async function readHomeContent(): Promise<PageContent> {
  if (!hasDb()) return {};
  try {
    const { sql } = getPostgresClient();
    const rows = await sql<{ content: unknown }[]>`
      select content from page_content where page_id = 'home' limit 1
    `;
    const raw = rows[0]?.content;
    if (!raw) return {};
    // jsonb wraca zwykle jako obiekt; defensywnie parsujemy też string.
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as PageContent;
  } catch (error) {
    console.error("[cms-content] Odczyt page_content 'home':", error);
    return {};
  }
}

/** Zdjęcie hero do renderu strony (z fallbackiem z repo). */
export async function getHeroImageUrl(): Promise<string> {
  const content = await readHomeContent();
  return content.hero?.desktopImageUrl ?? HERO_IMAGE_FALLBACK;
}

/** Surowa treść do edycji w panelu (z fallbackami). */
export async function getHomeContentRaw(): Promise<HomeContentInput> {
  return {
    hero: { desktopImageUrl: await getHeroImageUrl() },
  };
}

/** Zapis — scala z istniejącą treścią (nie gubi bloków spoza edytora). */
export async function saveHomeContent(input: HomeContentInput): Promise<void> {
  const existing = await readHomeContent();
  // Typ HeroContent wymaga pól tekstowych — strona ich nie czyta (copy w kodzie),
  // ale zachowujemy istniejące wartości albo dajemy puste.
  const hero = existing.hero ?? {
    headline: "",
    description: "",
    ctaLabel: "",
    ctaHref: "",
  };
  const next: PageContent = {
    ...existing,
    hero: { ...hero, desktopImageUrl: input.hero.desktopImageUrl },
  };
  const { sql } = getPostgresClient();
  const json = JSON.stringify(next);
  await sql`
    insert into page_content (page_id, content, updated_at)
    values ('home', ${json}::jsonb, now())
    on conflict (page_id) do update
      set content = excluded.content, updated_at = now()
  `;
}
