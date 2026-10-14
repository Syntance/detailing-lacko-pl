import type { Metadata } from "next";
import { WyborLinii } from "@/components/sections/wybor-linii";
import { rozwijacz } from "@/lib/dynamiczne-dane";
import { getKontakt } from "@/lib/site-data";
import { getWyborLinii } from "@/lib/wybor-linii-dane";
import { WIZYTOWKI_GOOGLE } from "@/lib/wizytowki";

/** Teksty z CMS (rewalidacja przy zapisie), telefon i adres z panelu — w razie czego co godzinę. */
export const revalidate = 3600;

/** Strona przejściowa pod kod QR — nie konkuruje w Google z właściwymi stronami. */
export const metadata: Metadata = {
  title: { absolute: "Wizytówki Google — Detailing i Wulkanizacja Łącko" },
  description: "Opinie, zdjęcia i dojazd w Google Maps — wybierz detailing albo wulkanizację w Łącku.",
  robots: { index: false, follow: true },
};

export default async function MapyPage() {
  const [kontakt, { mapy }] = await Promise.all([getKontakt(), getWyborLinii()]);
  const r = await rozwijacz(mapy.tytul, mapy.opis, mapy.karty.detailing.opis, mapy.karty.wulkanizacja.opis);
  return (
    <WyborLinii
      etykieta="Google Maps"
      tytul={r(mapy.tytul)}
      opis={r(mapy.opis)}
      kontakt={kontakt}
      opcje={[
        {
          linia: "detailing",
          href: WIZYTOWKI_GOOGLE.detailing,
          opis: r(mapy.karty.detailing.opis),
          cta: "Otwórz wizytówkę detailingu",
        },
        {
          linia: "wulkanizacja",
          href: WIZYTOWKI_GOOGLE.wulkanizacja,
          opis: r(mapy.karty.wulkanizacja.opis),
          cta: "Otwórz wizytówkę wulkanizacji",
        },
      ]}
    />
  );
}
