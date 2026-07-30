import type { KontaktData } from "@/lib/site";
import { PhoneLink } from "./phone-link";

/**
 * Nagłówek 1:1 z makietą „kreskówka": sticky, biały, twarda kreska 3px na
 * dole, pionowy lockup marki, pigułki nawigacji z obwódką 2px i telefon
 * jako czarna pigułka z żółtym cieniem.
 *
 * Bez stanu scrolla i bez IntersectionObserver (poprzedni navbar był
 * przezroczysty nad hero) — makieta ma jedno, stałe tło, więc to komponent
 * serwerowy. Poniżej sm pigułki sekcji przewijają się poziomo, żeby wszystkie
 * cztery pozycje makiety zostały dostępne bez hamburgera.
 */

const NAV_ITEMS = [
  { href: "#cennik", label: "Cennik" },
  { href: "#efekty", label: "Efekty" },
  { href: "#faq", label: "FAQ" },
] as const;

export function Navbar({ kontakt }: { kontakt: KontaktData }) {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-background">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-5 py-3 md:gap-6 md:px-6">
        <a
          href="#hero"
          className="flex shrink-0 items-center rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Detailing Łącko — początek strony"
        >
          {/* Pionowy lockup z brandingu niesie już znak, nazwę i tagline, więc
              teksty obok znikają — inaczej „Detailing Łącko" stałoby dwa razy
              obok siebie. SVG przez <img>: Next nie optymalizuje SVG, a wektor
              i tak skaluje się bez straty. Nazwa dostępna jest na <a> wyżej,
              stąd alt="" (grafika byłaby powtórzeniem tej samej treści). */}
          <img
            src="/brand/logo-pionowe.svg"
            alt=""
            width={1866}
            height={1080}
            className="block h-12 w-auto md:h-16"
          />
        </a>

        <nav
          aria-label="Główna nawigacja"
          className="flex min-w-0 items-center gap-2 text-[14.5px] font-semibold md:gap-3"
        >
          <span className="hidden items-center gap-2 sm:flex md:gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border-2 border-ink px-4 py-2 transition-colors hover:bg-zolty focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </span>
          <PhoneLink
            phoneE164={kontakt.phoneE164}
            section="navbar"
            className="cien-zolty-3 rounded-full border-2 border-ink bg-ink px-4 py-2 whitespace-nowrap text-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:px-[18px]"
            ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
          >
            {kontakt.phoneDisplay}
          </PhoneLink>
        </nav>
      </div>
    </header>
  );
}
