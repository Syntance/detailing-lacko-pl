import { z } from "zod";
import { itemPriceRange, type CennikData } from "./cennik";
import { seoDataSchema } from "./seo";

/**
 * SEO strony /wulkanizacja — edytowane w panelu Magazyn → Wulkanizacja → SEO,
 * przechowywane w `site_blobs` pod kluczem `seo-wulkanizacja`.
 *
 * Tylko pola STRONY (tytuł, opis, fraza, obrazek i teksty udostępniania).
 * Ustawienia całej witryny — indeksowanie, roboty AI, adres kanoniczny — są
 * jedne dla obu linii i zostają w głównym SEO (Magazyn → SEO): robots.txt
 * i tak nie rozróżnia podstron, a dwa niezależne przełączniki „indeksuj"
 * pozwoliłyby ukryć przed Google połowę serwisu przez przypadek.
 *
 * Różnica wobec SEO detailingu: pusty opis jest dozwolony i znaczy „złóż opis
 * z aktualnych cen w cenniku" — dzięki temu kwoty w wynikach Google nie
 * rozjeżdżają się z cennikiem po każdej zmianie cen w panelu.
 */
export const seoStronySchema = seoDataSchema
  .pick({
    title: true,
    focusKeyword: true,
    ogImageUrl: true,
    ogTitle: true,
    ogDescription: true,
  })
  .extend({
    description: z.string(),
  });

export type SeoStrony = z.infer<typeof seoStronySchema>;

export const DEFAULT_SEO_WULKANIZACJA: SeoStrony = {
  title: "Wulkanizacja Łącko — wymiana opon, wyważanie | ceny z góry",
  // Pusty = opis z cennika (patrz `opisSeoZCennika`).
  description: "",
  focusKeyword: "wulkanizacja Łącko",
  ogImageUrl: "/og-wulkanizacja.jpg",
  ogTitle: "",
  ogDescription: "",
};

/**
 * Opis do wyników wyszukiwania złożony z realnych kwot cennika (pozycje-
 * kotwice: przekładka, naprawa przebicia, przechowywanie). Gdy żadnej z nich
 * nie ma albo mają ukrytą cenę — samo zdanie bez kwot. Trzymany w ~140
 * znakach, bo Google ucina opis po ~155.
 */
export function opisSeoZCennika(cennik: CennikData): string {
  const kwota = (id: string, etykieta: string): string | null => {
    const item = cennik.items.find(
      (i) => i.id === id && !i.disabled && !i.priceHidden,
    );
    if (!item) return null;
    const { from, to } = itemPriceRange(item);
    if (from <= 0) return null;
    return `${etykieta} ${to > from ? "od " : ""}${from} zł`;
  };
  const kotwice = [
    kwota("przekladka-sezonowa", "Przekładka kół z wyważeniem"),
    kwota("naprawa-przebicia", "naprawa przebicia"),
    kwota("przechowywanie-kol", "przechowywanie kół"),
  ].filter((k): k is string => Boolean(k));
  const ceny = kotwice.length
    ? `${kotwice.join(", ")} — ceny z góry`
    : "Wymiana i wyważanie opon, naprawa przebić, przechowywanie kół — ceny z góry";
  return `${ceny}, bez kolejki. Czerniec 72, gmina Łącko.`;
}
