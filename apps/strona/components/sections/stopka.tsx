import Link from "next/link";
import { FooterCookieSettings } from "@moduly/legal-consent";
import type { KontaktData } from "@/lib/site";
import { LINIA_INFO, LINIE, type Linia } from "@/lib/linie";
import { ReviewLink } from "./review-link";

/**
 * Stopka: NAP + „Zostaw opinię" + wymagane linki prawne (EAA/RODO).
 *
 * Makieta „kreskówka" kończy stronę czarną sekcją kontaktu i stopki nie ma,
 * ale polityka prywatności, deklaracja dostępności, zgłoszenie problemu
 * z dostępnością i ustawienia cookies są obowiązkiem prawnym — stopka zostaje
 * więc jako cicha kontynuacja czarnej sekcji, w tej samej typografii.
 *
 * Kolumna „Usługi" linkuje obie linie (detailing ↔ wulkanizacja) zwykłym
 * <Link>, bez animacji kartki — to link nawigacyjny na dole strony, nie
 * przełącznik; ważny dla Google (crawl obu stron z każdej z nich).
 */
export function Stopka({
  kontakt,
  marka = "detailing",
}: {
  kontakt: KontaktData;
  marka?: Linia;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-noc text-background">
      <div className="mx-auto max-w-[1140px] border-t border-background/15 px-5 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="text-base font-bold tracking-[0.06em] uppercase">
              Detailing Łącko
              {marka === "wulkanizacja" ? (
                <>
                  {" "}
                  <span aria-hidden className="text-akcent">
                    /
                  </span>{" "}
                  Wulkanizacja
                </>
              ) : null}
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
                className="mt-3 inline-block text-sm font-semibold text-akcent underline-offset-4 hover:underline"
              />
            ) : null}
          </div>

          <nav aria-label="Usługi" className="flex flex-col gap-2 text-sm">
            <p className="etykieta text-noc-szary">Usługi</p>
            {LINIE.map((linia) => {
              const info = LINIA_INFO[linia];
              const aktywna = linia === marka;
              return (
                <Link
                  key={linia}
                  href={info.path}
                  aria-current={aktywna ? "page" : undefined}
                  className={
                    aktywna
                      ? "font-semibold text-background"
                      : "text-noc-szary hover:text-background"
                  }
                >
                  {info.nazwa}
                  <span className="text-noc-szary"> · {info.podpis}</span>
                </Link>
              );
            })}
          </nav>

          <nav aria-label="Stopka" className="flex flex-col gap-2 text-sm">
            {/* prefetch={false}: linki prawne w stopce Next prefetchował z
                automatu — pięć zapytań RSC (~22 KB) o strony, na które prawie
                nikt nie wchodzi, w trakcie ładowania strony głównej. Prefetch
                po najechaniu kursorem zostaje. */}
            <Link
              href="/polityka-prywatnosci"
              prefetch={false}
              className="text-noc-szary hover:text-background"
            >
              Polityka prywatności
            </Link>
            <Link
              href="/deklaracja-dostepnosci"
              prefetch={false}
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
        <div className="etykieta mt-10 flex flex-col gap-2 text-noc-szary sm:flex-row sm:items-center sm:justify-between">
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
