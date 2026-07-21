import "server-only";

import type { PageContent } from "@moduly/types";
import { getPostgresClient } from "./db";
import { DEFAULT_FAQ } from "./content-defaults";
import type { HomeContentInput } from "./cms-schema";

/**
 * Odczyt/zapis treści strony głównej wprost na tabeli `page_content`
 * (klient Postgres, jak blobs.ts). NIE używamy getDataStore() — jest ustawiany
 * w initModuly() z layoutu stron, a trasy /api/* przez layout nie przechodzą,
 * więc w route handlerze DataStore jest null (to powodowało 500 przy zapisie).
 * Storefront czyta tę samą tabelę, więc zmiany są widoczne od razu.
 */

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim());
}

const HERO_FALLBACK = {
  headline: "Detailing Łącko — pranie tapicerki i polerowanie lakieru",
  subtitle: "",
  description:
    "Fotele jak nowe od 250 zł. Lakier bez rys od 600 zł. Przyjmuję na miejscu w Łącku — zapraszam z okolicy: Stary Sącz, Podegrodzie, Nowy Sącz.",
  ctaLabel: "Zadzwoń",
  ctaHref: "#kontakt",
  desktopImageUrl: "/images/hero.jpg",
};

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

/** Surowa treść strony głównej do edycji w panelu (z fallbackami). */
export async function getHomeContentRaw(): Promise<HomeContentInput> {
  const content = await readHomeContent();
  const hero = content.hero;
  return {
    hero: {
      headline: hero?.headline ?? HERO_FALLBACK.headline,
      subtitle: hero?.subtitle ?? "",
      description: hero?.description ?? HERO_FALLBACK.description,
      ctaLabel: hero?.ctaLabel ?? HERO_FALLBACK.ctaLabel,
      ctaHref: hero?.ctaHref ?? HERO_FALLBACK.ctaHref,
      desktopImageUrl: hero?.desktopImageUrl ?? HERO_FALLBACK.desktopImageUrl,
    },
    faq: content.faq?.length ? content.faq : DEFAULT_FAQ,
  };
}

/** Zapis treści — scala z istniejącą (nie gubi bloków spoza edytora). */
export async function saveHomeContent(input: HomeContentInput): Promise<void> {
  const existing = await readHomeContent();
  const next: PageContent = {
    ...existing,
    hero: { ...existing.hero, ...input.hero },
    faq: input.faq,
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
