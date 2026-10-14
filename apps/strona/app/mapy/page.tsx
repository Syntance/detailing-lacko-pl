import type { Metadata } from "next";
import { WyborLinii } from "@/components/sections/wybor-linii";
import { getKontakt } from "@/lib/site-data";
import { WIZYTOWKI_GOOGLE } from "@/lib/wizytowki";

/** Treść stała, telefon i adres z panelu — odświeżane co godzinę. */
export const revalidate = 3600;

/** Strona przejściowa pod kod QR — nie konkuruje w Google z właściwymi stronami. */
export const metadata: Metadata = {
  title: { absolute: "Wizytówki Google — Detailing i Wulkanizacja Łącko" },
  description: "Opinie, zdjęcia i dojazd w Google Maps — wybierz detailing albo wulkanizację w Łącku.",
  robots: { index: false, follow: true },
};

export default async function MapyPage() {
  const kontakt = await getKontakt();
  return (
    <WyborLinii
      etykieta="Google Maps"
      tytul="Która wizytówka?"
      opis="Opinie, zdjęcia i dojazd — wybierz, której usługi szukasz."
      kontakt={kontakt}
      opcje={[
        {
          linia: "detailing",
          href: WIZYTOWKI_GOOGLE.detailing,
          opis: "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru.",
          cta: "Otwórz wizytówkę detailingu",
        },
        {
          linia: "wulkanizacja",
          href: WIZYTOWKI_GOOGLE.wulkanizacja,
          opis: "Wymiana i naprawa opon, wyważanie kół, przechowywanie.",
          cta: "Otwórz wizytówkę wulkanizacji",
        },
      ]}
    />
  );
}
