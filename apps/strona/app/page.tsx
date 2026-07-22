import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { DlaczegoJa } from "@/components/sections/dlaczego-ja";
import { Faq } from "@/components/sections/faq";
import { Galeria } from "@/components/sections/galeria";
import { Hero } from "@/components/sections/hero";
import { Kontakt } from "@/components/sections/kontakt";
import { Navbar } from "@/components/sections/navbar";
import { Proces } from "@/components/sections/proces";
import { StickyCall } from "@/components/sections/sticky-call";
import { Stopka } from "@/components/sections/stopka";
import { UslugiCennik } from "@/components/sections/uslugi-cennik";
import { getHeroImageUrl } from "@/lib/cms-content";
import { DEFAULT_FAQ } from "@/lib/content-defaults";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import { getCennik, getGaleria, getKontakt } from "@/lib/site-data";
import { getDostepnosc } from "@/lib/rezerwacje-store";

/** ISR — treść zmienia się z panelu (rewalidacja przy zapisie) albo co 10 min. */
export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

export async function generateMetadata(): Promise<Metadata> {
  const kontakt = await getKontakt();
  return {
    title:
      "Detailing Łącko — pranie tapicerki, cennik z cenami z góry | Czerniec",
    description: `Pełny cennik na stronie: komplet foteli z kanapą 300 zł, kompleksowe wnętrze 500 zł. Płacisz po obejrzeniu efektu. Czerniec, gmina Łącko. Tel. ${kontakt.phoneDisplay}`,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [heroImageUrl, cennik, galeria, kontakt, dostepnosc] = await Promise.all([
    getHeroImageUrl(),
    getCennik(),
    getGaleria(),
    getKontakt(),
    getDostepnosc(),
  ]);

  // Copy strony (w tym FAQ) żyje w kodzie — CMS trzyma tylko zasoby wymienne.
  const faq = DEFAULT_FAQ;

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
      <main>
        <Hero imageUrl={heroImageUrl} kontakt={kontakt} />
        <UslugiCennik cennik={cennik} kontakt={kontakt} />
        <Galeria galeria={galeria} />
        <Proces kontakt={kontakt} />
        <DlaczegoJa />
        <Faq items={faq} />
        <Kontakt kontakt={kontakt} />
      </main>

      <Stopka kontakt={kontakt} />
      <StickyCall
        phoneE164={kontakt.phoneE164}
        phoneDisplay={kontakt.phoneDisplay}
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
