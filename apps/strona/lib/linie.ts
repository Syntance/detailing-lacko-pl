/**
 * Dwie linie usług pod jednym dachem: Detailing Łącko (strona główna, żółty)
 * i Wulkanizacja (/wulkanizacja, czerwień komiksowa). Jedno źródło prawdy
 * dla ścieżek, etykiet, nawigacji i kontekstu analityki — czysty moduł bez
 * zod-a, bo importują go komponenty klienckie (przełącznik marek, panel)
 * i nie może ciągnąć schematów do bundla.
 *
 * Każda linia ma osobne dane w panelu (cennik, zdjęcie hero, FAQ, SEO strony)
 * pod własnym kluczem blobu — patrz lib/site-data.ts — ale wspólny kontakt
 * i godziny pracy: to ten sam warsztat i ten sam człowiek. Rezerwacje online
 * ma tylko detailing; wulkanizację umawia się telefonicznie.
 */
import type { TrackExtraContext } from "@moduly/analytics";

export const LINIE = ["detailing", "wulkanizacja"] as const;
export type Linia = (typeof LINIE)[number];

export type LiniaInfo = {
  /** Ścieżka strony linii. */
  path: string;
  /** Nazwa marki w nagłówku i stopce. */
  nazwa: string;
  /** Podpis pod nazwą w lockupie nagłówka. */
  podpis: string;
  /** Kotwice nawigacji sekcji na tej stronie. */
  nawigacja: { href: string; label: string }[];
  /** Krótka nazwa linii w panelu, np. „Wulkanizacja". */
  etykieta: string;
  /**
   * Czy linia ma rezerwacje online (widget terminów, CTA „Zarezerwuj").
   * Bez nich główną drogą kontaktu jest telefon, a w panelu pola cennika
   * działające tylko dla rezerwacji (czas w minutach, „Zawiera") nie mają
   * wpływu na stronę.
   */
  rezerwacjaOnline: boolean;
};

export const LINIA_INFO: Record<Linia, LiniaInfo> = {
  detailing: {
    path: "/",
    nazwa: "Detailing Łącko",
    podpis: "wnętrze · lakier",
    nawigacja: [
      { href: "#cennik", label: "Cennik" },
      { href: "#efekty", label: "Efekty" },
      { href: "#faq", label: "FAQ" },
    ],
    etykieta: "Detailing",
    rezerwacjaOnline: true,
  },
  wulkanizacja: {
    path: "/wulkanizacja",
    nazwa: "Wulkanizacja",
    podpis: "opony · wyważanie",
    nawigacja: [
      { href: "#cennik", label: "Cennik" },
      { href: "#zasady", label: "Jak pracuję" },
      { href: "#faq", label: "FAQ" },
    ],
    etykieta: "Wulkanizacja",
    rezerwacjaOnline: false,
  },
};

/** Linia z ścieżki URL — wszystko poza /wulkanizacja(...) to detailing. */
export function liniaZeSciezki(pathname: string): Linia {
  return pathname === "/wulkanizacja" || pathname.startsWith("/wulkanizacja/")
    ? "wulkanizacja"
    : "detailing";
}

/**
 * Kontekst dopinany do KAŻDEGO zdarzenia analityki (page_view, section_view,
 * cta_click, contact_click, lead_submit…): `service_line` rozdziela ruch
 * i lejek obu linii w GA4 (parametr zdarzenia → wymiar niestandardowy)
 * i w PostHogu (właściwość zdarzenia → breakdown/filtr). Strony obu linii są
 * storefrontem — bez tego /wulkanizacja lądowałaby w page_type "other".
 */
export function kontekstAnalitykiDlaSciezki(pathname: string): TrackExtraContext {
  const linia = liniaZeSciezki(pathname);
  const storefront = pathname === "/" || linia === "wulkanizacja";
  return {
    service_line: linia,
    ...(storefront ? { page_type: "storefront" as const } : {}),
  };
}
