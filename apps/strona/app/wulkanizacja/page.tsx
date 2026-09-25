import type { Metadata } from "next";
import { TrafficTracker } from "@moduly/analytics";
import { JsonLd } from "@/components/json-ld";
import { Faq } from "@/components/sections/faq";
import { Kontakt } from "@/components/sections/kontakt";
import { Navbar } from "@/components/sections/navbar";
import { Stopka } from "@/components/sections/stopka";
import {
  UKLAD_CENNIKA_WULKANIZACJA,
  UslugiCennik,
} from "@/components/sections/uslugi-cennik";
import { Granice } from "@/components/sections/wulkanizacja/granice";
import { HeroWulkanizacja } from "@/components/sections/wulkanizacja/hero-wulkanizacja";
import { Zasady } from "@/components/sections/wulkanizacja/zasady";
import { opisSeoZCennika } from "@/lib/seo-wulkanizacja";
import {
  getCennikWulkanizacja,
  getFaqWulkanizacja,
  getKontakt,
  getSeo,
  getSeoWulkanizacja,
} from "@/lib/site-data";
import { getDostepnosc } from "@/lib/rezerwacje-store";

/** ISR — treść zmienia się z panelu (rewalidacja przy zapisie) albo co 10 min. */
export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

/**
 * Metadane z panelu Magazyn → Wulkanizacja → SEO (blob `seo-wulkanizacja`).
 * Pusty opis = opis złożony z aktualnych cen w cenniku, żeby kwoty w Google
 * nie rozjechały się z cennikiem. Przełącznik indeksowania jest wspólny dla
 * całej witryny (główne SEO).
 */
export async function generateMetadata(): Promise<Metadata> {
  const [seo, strona, cennik] = await Promise.all([
    getSeo(),
    getSeoWulkanizacja(),
    getCennikWulkanizacja(),
  ]);
  const description = strona.description.trim() || opisSeoZCennika(cennik);
  return {
    title: { absolute: strona.title },
    description,
    alternates: { canonical: "/wulkanizacja" },
    robots: seo.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: strona.ogTitle || strona.title,
      description: strona.ogDescription || description,
      url: "/wulkanizacja",
      ...(strona.ogImageUrl
        ? { images: [{ url: strona.ogImageUrl, width: 1200, height: 630 }] }
        : {}),
    },
  };
}

export default async function WulkanizacjaPage() {
  // Dostępność = godziny pracy warsztatu (wspólne z detailingiem) — tu
  // wyłącznie do JSON-LD; rezerwacji online wulkanizacja nie ma.
  const [cennik, kontakt, dostepnosc, faqData] = await Promise.all([
    getCennikWulkanizacja(),
    getKontakt(),
    getDostepnosc(),
    getFaqWulkanizacja(),
  ]);

  const faq = faqData.items;

  return (
    // `data-marka` przepina tokeny akcentu na czerwień (globals.css) — cała
    // makieta detailingu renderuje się w barwach linii bez własnych wariantów.
    // `data-kartka-strona` = root treści do sklonowania przy przekładaniu
    // kartki (components/marka/kartka.tsx).
    <div data-marka="wulkanizacja" data-kartka-strona>
      <a
        href="#cennik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <Navbar kontakt={kontakt} marka="wulkanizacja" />

      {/* Kolejność jak na stronie detailingu: hero → cennik (01) → jak
          pracuję (02) → co nie kwalifikuje się do naprawy (03) → FAQ → kontakt.
          Zamiast Efektów przed/po (przy oponach nie ma czego pokazać) idą
          zasady pracy — główne wyróżniki warsztatu. Bez sekcji
          rezerwacji: wulkanizację umawia się telefonicznie, więc wszystkie
          CTA prowadzą do telefonu (i do zdjęcia opony jako drogi pobocznej). */}
      <main>
        <HeroWulkanizacja kontakt={kontakt} cennik={cennik} />
        <UslugiCennik
          cennik={cennik}
          uklad={UKLAD_CENNIKA_WULKANIZACJA}
          kontaktCta={kontakt}
        />
        <Zasady />
        <Granice />
        <Faq items={faq} />
        <Kontakt kontakt={kontakt} marka="wulkanizacja" />
      </main>

      <Stopka kontakt={kontakt} marka="wulkanizacja" />
      {/* Te same zdarzenia co na stronie głównej; rozdziela je `service_line`
          z kontekstu analityki (lib/linie.ts). */}
      <TrafficTracker
        sections={[
          { id: "hero", name: "Hero" },
          { id: "cennik", name: "Usługi i cennik" },
          { id: "zasady", name: "Jak pracuję" },
          { id: "granice", name: "Co nie kwalifikuje się do naprawy" },
          { id: "faq", name: "FAQ" },
          { id: "kontakt", name: "Kontakt" },
        ]}
      />
      <JsonLd
        kontakt={kontakt}
        cennik={cennik}
        faq={faq}
        dostepnosc={dostepnosc}
        siteUrl={siteUrl}
        marka="wulkanizacja"
      />
    </div>
  );
}
