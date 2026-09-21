import "server-only";

import type { PageContent } from "@moduly/types";
import { getPostgresClient } from "./db";
import type { HomeContentInput } from "./cms-schema";

/**
 * Odczyt/zapis treści stron wprost na tabeli `page_content` (klient Postgres,
 * jak blobs.ts). NIE używamy getDataStore() — jest ustawiany w initModuly()
 * z layoutu stron, a trasy /api/* przez layout nie przechodzą, więc w route
 * handlerze DataStore jest null (to powodowało 500 przy zapisie).
 * Storefront czyta tę samą tabelę, więc zmiany są widoczne od razu.
 *
 * Copy strony żyje w kodzie (decyzja 22.07.2026) — CMS trzyma tylko zdjęcie
 * hero; ewentualne stare bloki treści w page_content są ignorowane.
 *
 * Dwie strony, dwa wiersze: `home` (detailing) i `wulkanizacja` — każda linia
 * ma własne zdjęcie hero, edytowane w panelu Magazyn → Treść → zakładka linii.
 */

export const STRONY_TRESCI = ["home", "wulkanizacja"] as const;
export type StronaTresci = (typeof STRONY_TRESCI)[number];

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim());
}

/**
 * Domyślne zdjęcie hero, gdy panel nic nie wgrał. Detailing ma kadr z repo;
 * wulkanizacja startuje BEZ zdjęcia (pusty string) — sekcja hero pokazuje
 * wtedy ilustrację koła w języku makiety, a prawdziwe zdjęcie właściciel
 * wgrywa z panelu, kiedy je zrobi.
 */
const HERO_IMAGE_FALLBACK: Record<StronaTresci, string> = {
  home: "/images/hero.jpg",
  wulkanizacja: "",
};

async function readPageContent(pageId: StronaTresci): Promise<PageContent> {
  if (!hasDb()) return {};
  try {
    const { sql } = getPostgresClient();
    const rows = await sql<{ content: unknown }[]>`
      select content from page_content where page_id = ${pageId} limit 1
    `;
    const raw = rows[0]?.content;
    if (!raw) return {};
    // jsonb wraca zwykle jako obiekt; defensywnie parsujemy też string.
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as PageContent;
  } catch (error) {
    console.error(`[cms-content] Odczyt page_content '${pageId}':`, error);
    return {};
  }
}

export type HeroImages = {
  /** Kadr desktopowy (poziomy). Pusty = strona bez zdjęcia (ilustracja). */
  desktop: string;
  /** Kadr mobilny; gdy panel go nie ustawił — desktopowy. */
  mobile: string;
  /** Czy mobile ma własny plik (do pola w panelu, nie do renderu). */
  hasMobile: boolean;
};

/**
 * Zdjęcia hero do renderu strony (z fallbackiem z repo).
 *
 * Bez osobnej domyślki pionowej: repo miało `hero-mobile.jpg` (inny, pionowy
 * kadr tego samego auta), ale auto tonęło tam w pustej posadzce i suficie,
 * a rozmycie było na logo zamiast na tablicy. Domyślnie mobile dostaje więc
 * ten sam, poprawny kadr poziomy; własny kadr pod telefon wgrywa się z panelu.
 */
export async function getHeroImages(
  pageId: StronaTresci = "home",
): Promise<HeroImages> {
  const content = await readPageContent(pageId);
  const desktop =
    content.hero?.desktopImageUrl || HERO_IMAGE_FALLBACK[pageId];
  const mobileCms = content.hero?.mobileImageUrl;
  return { desktop, mobile: mobileCms || desktop, hasMobile: Boolean(mobileCms) };
}

/** Surowa treść do edycji w panelu (z fallbackami). */
export async function getHomeContentRaw(
  pageId: StronaTresci = "home",
): Promise<HomeContentInput> {
  const images = await getHeroImages(pageId);
  return {
    hero: {
      desktopImageUrl: images.desktop,
      // W panelu puste pole = „dziedziczy z desktopu" — nie pokazujemy fallbacku.
      mobileImageUrl: images.hasMobile ? images.mobile : "",
    },
  };
}

/** Zapis — scala z istniejącą treścią (nie gubi bloków spoza edytora). */
export async function saveHomeContent(
  input: HomeContentInput,
  pageId: StronaTresci = "home",
): Promise<void> {
  const existing = await readPageContent(pageId);
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
    hero: {
      ...hero,
      desktopImageUrl: input.hero.desktopImageUrl,
      mobileImageUrl: input.hero.mobileImageUrl || undefined,
    },
  };
  const { sql } = getPostgresClient();
  const json = JSON.stringify(next);
  // ::text::jsonb, nie samo ::jsonb — inaczej postgres.js sam serializuje
  // parametr i w bazie ląduje jsonb typu "string" (szczegóły w lib/blobs.ts).
  await sql`
    insert into page_content (page_id, content, updated_at)
    values (${pageId}, ${json}::text::jsonb, now())
    on conflict (page_id) do update
      set content = excluded.content, updated_at = now()
  `;
}
