import type { FaqItem } from "@moduly/types";
import type { CennikData } from "@/lib/cennik";
import type { DostepnoscData } from "@/lib/rezerwacje";
import type { KontaktData } from "@/lib/site";

const SCHEMA_DAY: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/** Godziny otwarcia z konfiguracji dostępności (panel), zgrupowane po oknie. */
function buildOpeningHours(dostepnosc: DostepnoscData) {
  const groups = new Map<string, number[]>();
  for (const window of dostepnosc.weekly) {
    if (!window.enabled) continue;
    const key = `${window.from}|${window.to}`;
    groups.set(key, [...(groups.get(key) ?? []), window.day]);
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens, closes] = key.split("|");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days.sort((a, b) => a - b).map((day) => SCHEMA_DAY[day]),
      opens,
      closes,
    };
  });
}

/**
 * JSON-LD: LocalBusiness (AutoWash — najbliższy schema.org typ dla
 * detailingu) + FAQPage. NAP spójny z wizytówką Google (brief: SEO checklist).
 */
export function JsonLd({
  kontakt,
  cennik,
  faq,
  dostepnosc,
  siteUrl,
}: {
  kontakt: KontaktData;
  cennik: CennikData;
  faq: FaqItem[];
  dostepnosc: DostepnoscData;
  siteUrl: string;
}) {
  const prices = cennik.items
    .filter((i) => !i.disabled)
    .map((i) => i.priceFrom)
    .filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 100;
  const maxPrice = cennik.items
    .filter((i) => !i.disabled)
    .reduce((max, i) => Math.max(max, i.priceTo, i.priceFrom), 0);

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    additionalType: "https://en.wikipedia.org/wiki/Auto_detailing",
    "@id": `${siteUrl}#firma`,
    name: "Detailing Łącko",
    url: siteUrl,
    image: `${siteUrl}/og.jpg`,
    telephone: kontakt.phoneE164,
    email: kontakt.email,
    priceRange: `${minPrice}–${maxPrice} PLN`,
    address: {
      "@type": "PostalAddress",
      streetAddress: kontakt.addressLine,
      postalCode: kontakt.postalCode,
      addressLocality: kontakt.city,
      addressRegion: "małopolskie",
      addressCountry: "PL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: kontakt.latitude,
      longitude: kontakt.longitude,
    },
    areaServed: kontakt.serviceAreas.map((name) => ({
      "@type": "City",
      name,
    })),
    // Z panelu Magazyn → Rezerwacje → Dostępność (jedno źródło prawdy).
    ...(() => {
      const hours = buildOpeningHours(dostepnosc);
      return hours.length ? { openingHoursSpecification: hours } : {};
    })(),
    ...(kontakt.nip ? { taxID: kontakt.nip } : {}),
    ...(kontakt.googleMapsUrl ? { hasMap: kontakt.googleMapsUrl } : {}),
  };

  const faqPage = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      {faqPage ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      ) : null}
    </>
  );
}
