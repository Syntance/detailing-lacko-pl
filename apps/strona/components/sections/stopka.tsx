import Link from "next/link";
import { FooterCookieSettings } from "@moduly/legal-consent";
import type { KontaktData } from "@/lib/site";
import { ReviewLink } from "./review-link";

/**
 * Stopka: NAP + „Zostaw opinię" + wymagane linki prawne (EAA/RODO).
 *
 * Makieta „kreskówka" kończy stronę czarną sekcją kontaktu i stopki nie ma,
 * ale polityka prywatności, deklaracja dostępności, zgłoszenie problemu
 * z dostępnością i ustawienia cookies są obowiązkiem prawnym — stopka zostaje
 * więc jako cicha kontynuacja czarnej sekcji, w tej samej typografii.
 */
export function Stopka({ kontakt }: { kontakt: KontaktData }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-noc text-background">
      <div className="mx-auto max-w-[1140px] border-t border-background/15 px-5 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="text-base font-bold tracking-[0.06em] uppercase">
              Detailing Łącko
            </p>
            <p className="mt-1.5 text-sm text-noc-szary">
              {kontakt.addressLine}, {kontakt.postalCode} {kontakt.city}
              {kontakt.nip ? ` · NIP ${kontakt.nip}` : ""}
            </p>
            <p className="mt-1 text-sm text-noc-szary">
              tel. {kontakt.phoneDisplay} ·{" "}
              <a
                href={`mailto:${kontakt.email}`}
                className="underline-offset-4 hover:text-background hover:underline"
              >
                {kontakt.email}
              </a>
            </p>
            {kontakt.googleReviewUrl ? (
              <ReviewLink
                url={kontakt.googleReviewUrl}
                className="mt-3 inline-block text-sm font-semibold text-zolty underline-offset-4 hover:underline"
              />
            ) : null}
          </div>

          <nav aria-label="Stopka" className="flex flex-col gap-2 text-sm">
            <Link
              href="/polityka-prywatnosci"
              className="text-noc-szary hover:text-background"
            >
              Polityka prywatności
            </Link>
            <Link
              href="/deklaracja-dostepnosci"
              className="text-noc-szary hover:text-background"
            >
              Deklaracja dostępności
            </Link>
            <a
              href={`mailto:${kontakt.email}?subject=Problem%20z%20dost%C4%99pno%C5%9Bci%C4%85%20strony`}
              className="text-noc-szary hover:text-background"
            >
              Zgłoś problem z dostępnością
            </a>
            <FooterCookieSettings className="text-left text-noc-szary hover:text-background" />
          </nav>
        </div>

        {/* Szary na czerni: #A9ACAF, nie #6B7075 z makiety — patrz komentarz
            w kontakt.tsx (kontrast WCAG AA). */}
        <div className="mt-10 flex flex-col gap-2 font-mono text-[10px] tracking-[0.16em] text-noc-szary uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Detailing Łącko</p>
          <p className="sm:text-right">
            Projekt i wdrożenie:{" "}
            <a
              href="https://syntance.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-background hover:underline"
            >
              Syntance
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
