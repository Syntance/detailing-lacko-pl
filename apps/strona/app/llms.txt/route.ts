import type { CennikData } from "@/lib/cennik";
import {
  getCennik,
  getCennikWulkanizacja,
  getKontakt,
} from "@/lib/site-data";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

/**
 * Kategorie cennika jako lista punktów — widoczne, w kolejności z panelu.
 * Czas tylko wtedy, gdy jest wpisany: cennik wulkanizacji go nie podaje,
 * a puste „()" silnik AI przepisałby dosłownie.
 */
function listaUslug(cennik: CennikData): string {
  return cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const czas = c.timeLabel.trim() ? ` (${c.timeLabel.trim()})` : "";
      return `- ${c.name}: od ${c.priceFrom} zł${czas}. ${c.description}`;
    })
    .join("\n");
}

/**
 * Informacja o podatku prosto z panelu (Cennik → Ustawienia sekcji), żeby
 * silniki AI cytowały to samo, co widzi człowiek w cenniku. W panelu tekst
 * jest pisany pod plakietkę („ceny zawierają VAT"), więc tutaj dostaje
 * wielką literę i kropkę — w pliku tekstowym stoi jako osobne zdanie.
 */
function oPodatku(cennik: CennikData): string {
  const vatNote = cennik.settings.vatNote.trim();
  return vatNote
    ? `${vatNote.charAt(0).toUpperCase()}${vatNote.slice(1)}${/[.!?]$/.test(vatNote) ? "" : "."}\n`
    : "";
}

/** GEO: mapa treści dla silników AI (ChatGPT/Perplexity/AI Overviews). */
export async function GET(): Promise<Response> {
  const [cennik, cennikWulkanizacja, kontakt] = await Promise.all([
    getCennik(),
    getCennikWulkanizacja(),
    getKontakt(),
  ]);

  const body = `# Detailing Łącko

> Detailing samochodowy i wulkanizacja w Łącku (powiat nowosądecki,
> małopolskie): pranie tapicerki, kompleksowe czyszczenie wnętrza, mycie
> detailingowe, polerowanie lakieru one step oraz sezonowa wymiana opon,
> wyważanie, naprawa przebitej opony i przechowywanie kół. Usługa
> stacjonarna${kontakt.freeTravelKm > 0 ? ` — dojazd gratis do ${kontakt.freeTravelKm} km` : ""}. Detailing: termin rezerwowany online;
> wulkanizacja: termin umawiany telefonicznie.

## Detailing — usługi i ceny
${oPodatku(cennik)}${listaUslug(cennik)}

## Wulkanizacja — usługi i ceny
${oPodatku(cennikWulkanizacja)}${listaUslug(cennikWulkanizacja)}

## Obszar działania
${kontakt.serviceAreas.join(", ")}.

## Kontakt
- Telefon: ${kontakt.phoneDisplay} (${kontakt.hoursNote})
- Adres: ${kontakt.addressLine}, ${kontakt.postalCode} ${kontakt.city}
- WWW: ${siteUrl}

## Strony
- [Detailing — cennik, efekty przed/po, FAQ, rezerwacja online](${siteUrl})
- [Wulkanizacja — cennik wymiany opon, zasady pracy, FAQ, termin telefonicznie](${siteUrl}/wulkanizacja)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
