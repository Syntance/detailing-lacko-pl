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
 * Opis do wyników wyszukiwania złożony z realnych kwot cennika (kotwice:
 * przekładka, naprawa przebicia, hotel oponiarski). Kotwica może łączyć kilka
 * pozycji — naprawa to kołek za 50 zł i grzybek od 90 zł — i wtedy bierze
 * najniższą kwotę z „od", jeśli któraś pozycja kosztuje więcej. Pozycje
 * ukryte, bez kwoty albo z ukrytej kategorii (jej nie ma na stronie) się nie
 * liczą; gdy nie zostanie żadna — samo zdanie bez kwot. Trzymany w ~150
 * znakach, bo Google ucina opis po ~155.
 */
export function opisSeoZCennika(cennik: CennikData): string {
  const widoczneKategorie = new Set(
    cennik.categories.filter((c) => !c.disabled).map((c) => c.id),
  );
  const kwota = (ids: readonly string[], etykieta: string): string | null => {
    const zakresy = cennik.items
      .filter(
        (i) =>
          ids.includes(i.id) &&
          !i.disabled &&
          !i.priceHidden &&
          widoczneKategorie.has(i.categoryId),
      )
      .map((i) => itemPriceRange(i))
      .filter((z) => z.from > 0);
    if (!zakresy.length) return null;
    const from = Math.min(...zakresy.map((z) => z.from));
    const to = Math.max(...zakresy.map((z) => z.to));
    return `${etykieta} ${to > from ? "od " : ""}${from} zł`;
  };
  const kotwice = [
    kwota(["przekladka-sezonowa"], "Przekładka kół z wyważeniem"),
    kwota(["naprawa-przebicia-kolek", "naprawa-przebicia"], "naprawa przebicia"),
    kwota(
      ["hotel-opony", "przechowywanie-kol", "hotel-duze-kola"],
      "hotel oponiarski",
    ),
  ].filter((k): k is string => Boolean(k));
  const ceny = kotwice.length
    ? `${kotwice.join(", ")} — ceny z góry`
    : "Przekładka i wymiana opon, naprawa przebić, hotel oponiarski — ceny z góry";
  return `${ceny}, bez kolejki. Czerniec 72, gmina Łącko.`;
}
