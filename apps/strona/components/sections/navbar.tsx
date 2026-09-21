import type { KontaktData } from "@/lib/site";
import { LINIA_INFO, type Linia } from "@/lib/linie";
import { MarkaSwitch } from "./marka-switch";
import { PhoneLink } from "./phone-link";

/**
 * Nagłówek 1:1 z makietą „kreskówka": sticky, biały, twarda kreska 3px na
 * dole, po lewej przełącznik marek (Detailing Łącko / Wulkanizacja — dwie
 * kartki wokół ukośnika, patrz marka-switch.tsx), pigułki nawigacji
 * z obwódką 2px i telefon jako czarna pigułka z cieniem w akcencie strony.
 *
 * Bez stanu scrolla i bez IntersectionObserver (poprzedni navbar był
 * przezroczysty nad hero) — makieta ma jedno, stałe tło, więc to komponent
 * serwerowy; jedyny klient to przełącznik (potrzebuje routera do przejścia).
 * Pigułki sekcji dopiero od `lg`: dwa lockupy marek zabrały miejsce, które
 * wcześniej miały od `sm`; poniżej zostaje telefon — konwersja główna.
 */
export function Navbar({
  kontakt,
  marka = "detailing",
}: {
  kontakt: KontaktData;
  marka?: Linia;
}) {
  const pozycje = LINIA_INFO[marka].nawigacja;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-background">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 md:gap-6 md:px-6 md:py-3">
        <MarkaSwitch aktywna={marka} />

        <nav
          aria-label="Główna nawigacja"
          className="flex min-w-0 shrink-0 items-center gap-2 text-[14.5px] font-semibold md:gap-3"
        >
          <span className="hidden items-center gap-2 lg:flex">
            {pozycje.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border-2 border-ink px-4 py-2 whitespace-nowrap transition-colors hover:bg-akcent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </span>
          <PhoneLink
            phoneE164={kontakt.phoneE164}
            section="navbar"
            className="cien-akcent-3 rounded-full border-2 border-ink bg-ink px-3.5 py-2 text-[13.5px] whitespace-nowrap text-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-4 sm:text-[14.5px] md:px-[18px]"
            ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
          >
            {kontakt.phoneDisplay}
          </PhoneLink>
        </nav>
      </div>
    </header>
  );
}
