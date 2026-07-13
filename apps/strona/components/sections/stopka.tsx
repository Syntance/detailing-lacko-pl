import Link from "next/link";
import { FooterCookieSettings } from "@moduly/legal-consent";
import type { KontaktData } from "@/lib/site";
import { ReviewLink } from "./review-link";

/** Stopka: NAP + „Zostaw opinię" + wymagane linki prawne (EAA/RODO). */
export function Stopka({ kontakt }: { kontakt: KontaktData }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="font-serif text-lg">Detailing Łącko</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {kontakt.addressLine}, {kontakt.postalCode} {kontakt.city}
              {kontakt.nip ? ` · NIP ${kontakt.nip}` : ""}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              tel. {kontakt.phoneDisplay} ·{" "}
              <a
                href={`mailto:${kontakt.email}`}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {kontakt.email}
              </a>
            </p>
            {kontakt.googleReviewUrl ? (
              <ReviewLink
                url={kontakt.googleReviewUrl}
                className="mt-3 inline-block text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
              />
            ) : null}
          </div>

          <nav aria-label="Stopka" className="flex flex-col gap-2 text-sm">
            <Link
              href="/polityka-prywatnosci"
              className="text-muted-foreground hover:text-foreground"
            >
              Polityka prywatności
            </Link>
            <Link
              href="/deklaracja-dostepnosci"
              className="text-muted-foreground hover:text-foreground"
            >
              Deklaracja dostępności
            </Link>
            <a
              href={`mailto:${kontakt.email}?subject=Problem%20z%20dost%C4%99pno%C5%9Bci%C4%85%20strony`}
              className="text-muted-foreground hover:text-foreground"
            >
              Zgłoś problem z dostępnością
            </a>
            <FooterCookieSettings className="text-left text-muted-foreground hover:text-foreground" />
          </nav>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {year} Detailing Łącko. Wszystkie prawa zastrzeżone.
        </p>
      </div>
    </footer>
  );
}
