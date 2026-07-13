import type { Metadata } from "next";
import { getPageContent } from "@moduly/cms";
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
import { DEFAULT_FAQ } from "@/lib/content-defaults";
import { getCennik, getGaleria, getKontakt } from "@/lib/site-data";

/** ISR — treść zmienia się z panelu (rewalidacja przy zapisie) albo co 10 min. */
export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

export async function generateMetadata(): Promise<Metadata> {
  const kontakt = await getKontakt();
  return {
    title:
      "Detailing Łącko — pranie tapicerki, polerowanie lakieru | Nowy Sącz i okolice",
    description: `Pranie tapicerki od 250 zł, polerowanie lakieru od 600 zł. Detailing w ${kontakt.city}, zapraszamy z okolicy: Stary Sącz, Nowy Sącz. Zadzwoń: ${kontakt.phoneDisplay}.`,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [content, cennik, galeria, kontakt] = await Promise.all([
    getPageContent("home"),
    getCennik(),
    getGaleria(),
    getKontakt(),
  ]);

  const faq = content.faq?.length ? content.faq : DEFAULT_FAQ;

  return (
    <>
      <a
        href="#cennik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <Navbar kontakt={kontakt} />

      <main>
        <Hero hero={content.hero} kontakt={kontakt} />
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
      />
      <JsonLd kontakt={kontakt} cennik={cennik} faq={faq} siteUrl={siteUrl} />
    </>
  );
}
