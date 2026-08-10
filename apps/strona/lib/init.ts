import "server-only";

/**
 * Importy z podścieżek `/configure`, NIE z barreli pakietów. `initModuly()`
 * woła root layout, więc jego graf modułów jest grafem każdej strony —
 * a barrel `@moduly/magazyn-*` re-eksportuje też panele („use client"),
 * np. AnalyticsPanel z recharts. Next dokłada wtedy chunk tych paneli do
 * KAŻDEJ strony: strona główna ciągnęła 478 KB (124 KB br) samego recharts,
 * którego nigdy nie renderuje. Podścieżka `/configure` to czysty moduł
 * serwerowy z singletonem konfiguracji — ten sam plik, który barrel by
 * zaimportował, więc panel dostaje tę samą instancję.
 */
import { configureMagazynAnalytics } from "@moduly/magazyn-analytics/configure";
import { configureMagazynSettings } from "@moduly/magazyn-settings/configure";
import { configureMagazynModules } from "@moduly/magazyn-core/config";
import { configureMagazynForms } from "@moduly/magazyn-forms/configure";
import { setDataStore } from "@moduly/data-store";
import { modulyConfig } from "../moduly.config";
import { createPostgresStore } from "./db";
import { requireAdminSessionForPanel } from "./auth";

let initialized = false;

/** Jednorazowa inicjalizacja Moduly przy starcie procesu Node. */
export function initModuly(): void {
  if (initialized) return;
  initialized = true;

  configureMagazynModules(modulyConfig);

  /**
   * Build bez sekretów (instalator moduly): `next build` zbiera page-data
   * bez .env.local — twardy throw na brak DATABASE_URL wywalał build
   * świeżo utworzonego projektu. Store podłączamy tylko gdy env jest;
   * bez niego runtime dostanie czytelny błąd przy pierwszym użyciu.
   */
  // Direct (unpooled) ma pierwszeństwo — patrz resolveDatabaseUrl w db.ts.
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    setDataStore(createPostgresStore(databaseUrl));
  } else {
    console.warn(
      "[detailing-lacko] DATABASE_URL nie ustawione — DataStore nieaktywny (OK przy build; przed startem uzupełnij .env.local).",
    );
  }

  configureMagazynForms({
    basePath: `${modulyConfig.basePath}/panel`,
    contactEmail: modulyConfig.email.contactEmail,
    contactPagePath: "/#kontakt",
    privacyPagePath: "/polityka-prywatnosci",
    cookiesPagePath: "/polityka-cookies",
    accessibilityPagePath: "/deklaracja-dostepnosci",
    guardAdmin: requireAdminSessionForPanel,
  });

  configureMagazynAnalytics({
    basePath: modulyConfig.basePath,
    guardAdmin: requireAdminSessionForPanel,
  });

  configureMagazynSettings({
    basePath: modulyConfig.basePath,
    commerceBackend: "none",
    guardAdmin: requireAdminSessionForPanel,
  });
}
