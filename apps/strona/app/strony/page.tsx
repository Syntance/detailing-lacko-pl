import type { Metadata } from "next";
import { WyborLinii } from "@/components/sections/wybor-linii";
import { rozwijacz } from "@/lib/dynamiczne-dane";
import { ADRES_LINII } from "@/lib/linie";
import { getKontakt } from "@/lib/site-data";
import { getWyborLinii } from "@/lib/wybor-linii-dane";

/** Teksty z CMS (rewalidacja przy zapisie), telefon i adres z panelu — w razie czego co godzinę. */
export const revalidate = 3600;

/** Strona przejściowa pod kod QR — nie konkuruje w Google z właściwymi stronami. */
export const metadata: Metadata = {
  title: { absolute: "Detailing i Wulkanizacja Łącko — wybierz stronę" },
  description: "Detailing samochodowy i wulkanizacja w Łącku — wybierz stronę z cennikiem i kontaktem.",
  robots: { index: false, follow: true },
};

export default async function StronyPage() {
  const [kontakt, { strony }] = await Promise.all([getKontakt(), getWyborLinii()]);
  const r = await rozwijacz(strony.tytul, strony.opis, strony.karty.detailing.opis, strony.karty.wulkanizacja.opis);
  return (
    <WyborLinii
      etykieta="Czerniec 72 · Łącko"
      tytul={r(strony.tytul)}
      opis={r(strony.opis)}
      kontakt={kontakt}
      opcje={[
        {
          linia: "detailing",
          href: ADRES_LINII.detailing,
          opis: r(strony.karty.detailing.opis),
          cta: "Przejdź do detailingu",
        },
        {
          linia: "wulkanizacja",
          href: ADRES_LINII.wulkanizacja,
          opis: r(strony.karty.wulkanizacja.opis),
          cta: "Przejdź do wulkanizacji",
        },
      ]}
    />
  );
}
