import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { DlaczegoJa } from "@/components/sections/dlaczego-ja";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Kontakt } from "@/components/sections/kontakt";
import { Metamorfozy } from "@/components/sections/metamorfozy";
import { Navbar } from "@/components/sections/navbar";
import { Proces } from "@/components/sections/proces";
import { BottomBar } from "@/components/sections/bottom-bar";
import { Stopka } from "@/components/sections/stopka";
import { UslugiCennik } from "@/components/sections/uslugi-cennik";
import { getHeroImages } from "@/lib/cms-content";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import {
  getCennik,
  getFaq,
  getKontakt,
  getMetamorfozy,
  getSeo,
} from "@/lib/site-data";
import { getDostepnosc } from "@/lib/rezerwacje-store";

/** ISR — treść zmienia się z panelu (rewalidacja przy zapisie) albo co 10 min. */
export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

/** Metadane z panelu Magazyn → SEO (blob `seo`), z fallbackiem z kodu. */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/" },
    robots: seo.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      ...(seo.ogImageUrl
        ? { images: [{ url: seo.ogImageUrl, width: 1200, height: 630 }] }
        : {}),
    },
  };
}

export default async function HomePage() {
  const [heroImages, cennik, kontakt, dostepnosc, faqData, metamorfozy] =
    await Promise.all([
      getHeroImages(),
      getCennik(),
      getKontakt(),
      getDostepnosc(),
      getFaq(),
      getMetamorfozy(),
    ]);

  const faq = faqData.items;

  return (
    <>
      <a
        href="#cennik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <Navbar kontakt={kontakt} />

      {/* Kolejność sekcji = kolejność lęków klienta (plan www v2):
          cena → efekt → logistyka → zaufanie → FAQ → kontakt. */}
      {/* pb kompensuje stały dolny pasek akcji na mobile (BottomBar). */}
      <main className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Hero images={heroImages} kontakt={kontakt} />
        <UslugiCennik cennik={cennik} kontakt={kontakt} />
        {/* Sekcja Efekty = kuratorowane pary przed/po (panel → Metamorfozy).
            CMS-owa Galeria z suwakami czeka w components/sections/galeria.tsx —
            wraca, gdy panel dostanie prawdziwe zdjęcia zamiast placeholderów. */}
        <Metamorfozy data={metamorfozy} />
        <Proces />
        <DlaczegoJa />
        <Faq items={faq} />
        <Kontakt kontakt={kontakt} />
      </main>

      <Stopka kontakt={kontakt} />
      <BottomBar
        phoneE164={kontakt.phoneE164}
        photoHref={buildPhotoContactHref(kontakt)}
      />
      <JsonLd
        kontakt={kontakt}
        cennik={cennik}
        faq={faq}
        dostepnosc={dostepnosc}
        siteUrl={siteUrl}
      />
    </>
  );
}
