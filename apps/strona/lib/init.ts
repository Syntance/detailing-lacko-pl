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
import { LINIA_INFO, LINIE } from "./linie";

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
    // Podział ruchu i lejka po linii usług: PostHog po właściwości
    // `service_line` (dopinanej do każdego zdarzenia — lib/linie.ts), GA4 po
    // ścieżce strony linii. Lejek usługowy zamiast sklepowego.
    //
    // Wulkanizacja nie ma rezerwacji online — jej konwersją jest telefon.
    // Stąd osobny krok „Klik w telefon", a ostatni krok (od niego panel
    // liczy kolumnę „Konwersja") sumuje telefon i wysłane rezerwacje, żeby
    // obie linie dało się porównać jedną liczbą. Kroki rezerwacji dla
    // wulkanizacji zostają na zerze — i to jest prawdziwa informacja.
    segments: {
      property: "service_line",
      label: "Linie usług: Detailing vs Wulkanizacja",
      values: LINIE.map((linia) => ({
        key: linia,
        label: LINIA_INFO[linia].etykieta,
        pagePaths: [LINIA_INFO[linia].path],
      })),
    },
    funnel: [
      { event: "$pageview", label: "Odsłona strony" },
      {
        event: "contact_click",
        label: "Klik w telefon",
        where: "toString(properties.channel) = 'phone'",
      },
      {
        event: "cta_click",
        label: "Klik „Zarezerwuj termin”",
        where: "toString(properties.cta_id) = 'booking_start'",
      },
      { event: "lead_submit", label: "Wysłana rezerwacja" },
      {
        event: "telefon_lub_rezerwacja",
        label: "Telefon lub rezerwacja",
        match:
          "(event = 'contact_click' AND toString(properties.channel) = 'phone') OR event = 'lead_submit'",
      },
    ],
  });

  configureMagazynSettings({
    basePath: modulyConfig.basePath,
    commerceBackend: "none",
    guardAdmin: requireAdminSessionForPanel,
  });
}
