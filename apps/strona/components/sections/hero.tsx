import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * Hero 1:1 z makietą „kreskówka": żółte tło w kropkowaną siatkę, twarda
 * kreska pod sekcją, po lewej naklejka lokalizacji → H1 → lead → kafel ceny
 * → dwa CTA, po prawej przekrzywiona biała karta ze znakiem marki, naklejka
 * „100% ręcznie!" i trzy bąble piany.
 *
 * Makieta jest jednym układem desktopowym (grid 1.05fr/.95fr) — poniżej lg
 * kolumny schodzą pod siebie w kolejności z DOM: najpierw copy i CTA, potem
 * karta ze znakiem. Zdjęcie auta z panelu (Magazyn → Treść) nie występuje
 * w makiecie, więc hero go nie renderuje; edytor w panelu zostaje nietknięty.
 */
export function Hero({ kontakt }: { kontakt: KontaktData }) {
  const photoHref = buildPhotoContactHref(kontakt);

  return (
    <section
      id="hero"
      aria-label="Detailing Łącko"
      className="kropki overflow-hidden border-b-[3px] border-ink bg-zolty"
    >
      <div className="mx-auto grid max-w-[1140px] items-center gap-10 px-5 pt-12 pb-14 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-[72px]">
        <div className="flex flex-col gap-[22px]">
          <p className="hero-enter cien-3 w-max -rotate-2 rounded-full border-2 border-ink bg-background px-4 py-[7px] font-mono text-[10.5px] tracking-[0.2em] uppercase">
            {kontakt.addressLine} · gmina {kontakt.city}
          </p>

          <h1 className="hero-enter max-w-[12ch] text-[2.4rem] leading-[1.04] font-bold tracking-[-0.015em] sm:text-5xl lg:text-[60px]">
            Detailing samochodowy
          </h1>

          <p className="hero-enter max-w-[40ch] text-[17px] leading-[1.5] font-medium text-pretty [animation-delay:90ms] lg:text-[19px]">
            Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru
            i reflektorów
          </p>

          <div className="hero-enter cien-5 flex w-max max-w-full rotate-[1.2deg] flex-col gap-0.5 rounded-xl border-[3px] border-ink bg-background px-[18px] py-[13px] [animation-delay:180ms]">
            <p className="text-[15px] text-pretty lg:text-base">
              Komplet foteli z kanapą — <strong className="font-bold">300 zł</strong>
            </p>
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              1 dzień · płatność po efekcie
            </p>
          </div>

          <div className="hero-enter flex flex-wrap items-stretch gap-4 [animation-delay:270ms]">
            <PhotoLink
              href={photoHref}
              section="hero"
              className="cien-mgla-5 flex flex-col gap-px rounded-xl bg-ink px-6 py-3.5 text-background focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
            >
              <span className="text-[16.5px] font-bold">
                Wyślij zdjęcie — dostaniesz cenę
              </span>
              <span className="text-xs text-noc-jasny">odpisujemy do 2 h</span>
            </PhotoLink>

            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="hero"
              className="cien-mgla-5 flex items-center rounded-xl border-[3px] border-ink bg-background px-[22px] py-3.5 text-[16.5px] font-semibold focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
              ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
            >
              Zadzwoń: {kontakt.phoneDisplay}
            </PhoneLink>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="cien-7 w-[88%] rotate-2 rounded-2xl border-[3px] border-ink bg-background px-[22px] py-[26px]">
            {/* SVG marki: świadomie <img>, nie next/image — optymalizator
                Next nie przetwarza SVG (brak dangerouslyAllowSVG), a wektor
                i tak skaluje się bez straty. */}
            <img
              src="/brand/lw-kolor.svg"
              alt="Lanca z pianą — znak Detailing Łącko"
              width={1866}
              height={637}
              className="block w-full"
            />
            <p className="mt-3 text-center font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              psss... piana robi robotę
            </p>
          </div>

          <p
            aria-hidden
            className="cien-4 absolute -top-3.5 right-[2%] rotate-[7deg] rounded-full border-[3px] border-ink bg-background px-4 py-2.5 text-sm font-bold"
          >
            100% ręcznie!
          </p>

          <div aria-hidden className="absolute -bottom-2.5 left-0 flex">
            <span className="size-[34px] rounded-full border-[3px] border-ink bg-background" />
            <span className="mt-3.5 -ml-2 size-[22px] rounded-full border-[3px] border-ink bg-background" />
            <span className="mt-[26px] -ml-1 size-[13px] rounded-full border-[3px] border-ink bg-background" />
          </div>
        </div>
      </div>
    </section>
  );
}
