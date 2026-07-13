import type { FaqItem } from "@moduly/types";
import type { CennikData } from "@/lib/cennik";
import type { KontaktData } from "@/lib/site";

/**
 * JSON-LD: LocalBusiness (AutoWash — najbliższy schema.org typ dla
 * detailingu) + FAQPage. NAP spójny z wizytówką Google (brief: SEO checklist).
 */
export function JsonLd({
  kontakt,
  cennik,
  faq,
  siteUrl,
}: {
  kontakt: KontaktData;
  cennik: CennikData;
  faq: FaqItem[];
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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "16:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
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
