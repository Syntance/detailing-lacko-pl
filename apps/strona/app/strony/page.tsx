import type { Metadata } from "next";
import { WyborLinii } from "@/components/sections/wybor-linii";
import { ADRES_LINII } from "@/lib/linie";
import { getKontakt } from "@/lib/site-data";

/** Treść stała, telefon i adres z panelu — odświeżane co godzinę. */
export const revalidate = 3600;

/** Strona przejściowa pod kod QR — nie konkuruje w Google z właściwymi stronami. */
export const metadata: Metadata = {
  title: { absolute: "Detailing i Wulkanizacja Łącko — wybierz stronę" },
  description: "Detailing samochodowy i wulkanizacja w Łącku — wybierz stronę z cennikiem i kontaktem.",
  robots: { index: false, follow: true },
};

export default async function StronyPage() {
  const kontakt = await getKontakt();
  return (
    <WyborLinii
      etykieta="Czerniec 72 · Łącko"
      tytul="Na którą stronę?"
      opis="Dwie usługi pod jednym adresem — wybierz, czego potrzebujesz."
      kontakt={kontakt}
      opcje={[
        {
          linia: "detailing",
          href: ADRES_LINII.detailing,
          opis: "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru. Ceny z góry, rezerwacja online.",
          cta: "Przejdź do detailingu",
        },
        {
          linia: "wulkanizacja",
          href: ADRES_LINII.wulkanizacja,
          opis: "Wymiana i naprawa opon, wyważanie kół, przechowywanie. Ceny z góry.",
          cta: "Przejdź do wulkanizacji",
        },
      ]}
    />
  );
}
