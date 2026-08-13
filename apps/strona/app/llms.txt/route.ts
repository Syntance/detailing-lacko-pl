import { getCennik, getKontakt } from "@/lib/site-data";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

/** GEO: mapa treści dla silników AI (ChatGPT/Perplexity/AI Overviews). */
export async function GET(): Promise<Response> {
  const [cennik, kontakt] = await Promise.all([getCennik(), getKontakt()]);

  const uslugi = cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order)
    .map((c) => `- ${c.name}: od ${c.priceFrom} zł (${c.timeLabel}). ${c.description}`)
    .join("\n");

  // Informacja o podatku prosto z panelu (Cennik → Ustawienia sekcji), żeby
  // silniki AI cytowały to samo, co widzi człowiek w cenniku. W panelu tekst
  // jest pisany pod plakietkę („ceny zawierają VAT"), więc tutaj dostaje
  // wielką literę i kropkę — w pliku tekstowym stoi jako osobne zdanie.
  const vatNote = cennik.settings.vatNote.trim();
  const oPodatku = vatNote
    ? `${vatNote.charAt(0).toUpperCase()}${vatNote.slice(1)}${/[.!?]$/.test(vatNote) ? "" : "."}\n`
    : "";

  const body = `# Detailing Łącko

> Detailing samochodowy w Łącku (powiat nowosądecki, małopolskie): pranie
> tapicerki, kompleksowe czyszczenie wnętrza, mycie detailingowe,
> polerowanie lakieru one step. Usługa stacjonarna${kontakt.freeTravelKm > 0 ? ` — dojazd gratis do ${kontakt.freeTravelKm} km` : ""}.

## Usługi i ceny
${oPodatku}${uslugi}

## Obszar działania
${kontakt.serviceAreas.join(", ")}.

## Kontakt
- Telefon: ${kontakt.phoneDisplay} (${kontakt.hoursNote})
- Adres: ${kontakt.addressLine}, ${kontakt.postalCode} ${kontakt.city}
- WWW: ${siteUrl}

## Strony
- [Strona główna — cennik, galeria realizacji, FAQ](${siteUrl})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
