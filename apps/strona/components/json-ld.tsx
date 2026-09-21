import type { FaqItem } from "@moduly/types";
import { itemPriceRange, type CennikData } from "@/lib/cennik";
import type { Linia } from "@/lib/linie";
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
 * Typ schema.org per linia: AutoWash to najbliższy typ dla detailingu,
 * AutoRepair (+ TireShop jako additionalType) dla wulkanizacji. Obie linie
 * mają wspólny NAP, ale osobne `@id`/`url`, żeby Google nie sklejał ich
 * w jedną stronę o dwóch nazwach.
 */
const SCHEMA_LINII: Record<
  Linia,
  {
    typ: string;
    additionalType: string;
    nazwa: string;
    idFragment: string;
    sciezka: string;
    obraz: string;
  }
> = {
  detailing: {
    typ: "AutoWash",
    additionalType: "https://en.wikipedia.org/wiki/Auto_detailing",
    nazwa: "Detailing Łącko",
    idFragment: "#firma",
    sciezka: "",
    obraz: "/og.jpg",
  },
  wulkanizacja: {
    typ: "AutoRepair",
    additionalType: "https://schema.org/TireShop",
    nazwa: "Wulkanizacja Łącko — Detailing Łącko",
    idFragment: "#wulkanizacja",
    sciezka: "/wulkanizacja",
    obraz: "/og-wulkanizacja.jpg",
  },
};

/**
 * JSON-LD: LocalBusiness (typ wg linii) + FAQPage. NAP spójny z wizytówką
 * Google (brief: SEO checklist).
 */
export function JsonLd({
  kontakt,
  cennik,
  faq,
  dostepnosc,
  siteUrl,
  marka = "detailing",
}: {
  kontakt: KontaktData;
  cennik: CennikData;
  faq: FaqItem[];
  dostepnosc: DostepnoscData;
  siteUrl: string;
  marka?: Linia;
}) {
  const schema = SCHEMA_LINII[marka];

  // Widełki przez `itemPriceRange`, bo pozycja z wariantami ma własne
  // `priceFrom`/`priceTo` tylko poglądowo — realne kwoty siedzą w wariantach.
  //
  // Liczone z tego, co realnie widać w cenniku: ukryta kategoria zabiera ze
  // strony wszystkie swoje pozycje (patrz `UslugiCennik`), więc jej kwoty nie
  // mogą wyznaczać `priceRange` — inaczej Google dostaje widełki do 1300 zł,
  // których na stronie nie ma ani jednej.
  const widoczneKategorie = new Set(
    cennik.categories.filter((c) => !c.disabled).map((c) => c.id),
  );
  const zakresy = cennik.items
    .filter(
      (i) => !i.disabled && !i.priceHidden && widoczneKategorie.has(i.categoryId),
    )
    .map((i) => itemPriceRange(i));
  const prices = zakresy.map((z) => z.from).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 100;
  const maxPrice = zakresy.reduce((max, z) => Math.max(max, z.to, z.from), 0);

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": schema.typ,
    additionalType: schema.additionalType,
    "@id": `${siteUrl}${schema.idFragment}`,
    name: schema.nazwa,
    url: `${siteUrl}${schema.sciezka}`,
    image: `${siteUrl}${schema.obraz}`,
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
    // Linia wulkanizacji jest częścią tej samej firmy — spinamy encje.
    ...(marka === "wulkanizacja"
      ? { parentOrganization: { "@id": `${siteUrl}#firma` } }
      : {}),
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
