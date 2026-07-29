import { getImageProps } from "next/image";
import type { HeroImages } from "@/lib/cms-content";
import type { KontaktData } from "@/lib/site";
import { BookingLink, PhoneLink } from "./phone-link";

/**
 * Hero 1:1 z makietą „kreskówka": żółte tło w kropkowaną siatkę, twarda
 * kreska pod sekcją, po lewej naklejka lokalizacji → H1 → lead → kafel ceny
 * → dwa CTA, po prawej przekrzywiona biała karta ze zdjęciem auta w pianie,
 * lanca wystająca z prawego górnego narożnika i trzy bąble piany.
 *
 * Makieta jest jednym układem desktopowym (grid 1.05fr/.95fr) — poniżej lg
 * kolumny schodzą pod siebie w kolejności z DOM: najpierw copy i CTA, potem
 * karta ze zdjęciem. Zdjęcie w karcie pochodzi z panelu (Magazyn → Treść).
 */

/**
 * Zdjęcie hero z art direction: telefon dostaje kadr mobilny, desktop
 * desktopowy — przez <picture> + media query, więc przeglądarka pobiera
 * TYLKO jeden plik. Brak `priority` celowo: <link rel=preload> nie umie media
 * query i preloadowałby oba pliki; eager+fetchpriority na <img> w initial HTML
 * daje LCP bez podwójnego pobierania.
 */
function HeroPicture({
  images,
  imgClassName,
}: {
  images: HeroImages;
  imgClassName: string;
}) {
  const common = {
    alt: "Auto pokryte pianą aktywną podczas mycia detailingowego",
    fill: true as const,
    quality: 70,
    // Karta zajmuje 88% prawej kolumny (~460 px), ale kadr jest powiększony
    // 1,55×, więc prosimy o plik pod ~720 px, żeby zoom nie zmiękł.
    sizes: "(max-width: 1024px) 88vw, 720px",
  };
  const mobile = getImageProps({ ...common, src: images.mobile });
  const desktop = getImageProps({ ...common, src: images.desktop });
  const { srcSet: desktopSrcSet, ...imgProps } = desktop.props;

  return (
    <picture>
      <source
        media="(max-width: 1023.5px)"
        srcSet={mobile.props.srcSet ?? mobile.props.src}
      />
      <img
        {...imgProps}
        srcSet={desktopSrcSet}
        loading="eager"
        fetchPriority="high"
        className={imgClassName}
      />
    </picture>
  );
}

export function Hero({
  images,
  kontakt,
}: {
  images: HeroImages;
  kontakt: KontaktData;
}) {
  return (
    <section
      id="hero"
      aria-label="Detailing Łącko"
      className="kropki overflow-hidden border-b-[3px] border-ink bg-zolty"
    >
      <div className="mx-auto grid max-w-[1140px] items-center gap-10 px-5 pt-12 pb-14 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-[72px]">
        <div className="flex flex-col gap-[22px]">
          <p className="etykieta hero-enter cien-3 w-max -rotate-2 rounded-full border-2 border-ink bg-background px-4 py-[7px]">
            {kontakt.addressLine} · gmina {kontakt.city}
          </p>

          <h1 className="hero-enter max-w-[12ch] text-[2.4rem] leading-[1.04] font-bold tracking-[-0.015em] sm:text-5xl lg:text-[60px]">
            Detailing samochodowy
          </h1>

          <p className="hero-enter max-w-[40ch] text-[17px] leading-[1.5] font-medium text-pretty [animation-delay:90ms] lg:text-[19px]">
            Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru i
            reflektorów
          </p>

          <div className="hero-enter cien-5 flex w-max max-w-full rotate-[1.2deg] flex-col gap-0.5 rounded-xl border-[3px] border-ink bg-background px-[18px] py-[13px] [animation-delay:180ms]">
            <p className="text-[15px] text-pretty lg:text-base">
              Komplet foteli z kanapą —{" "}
              <strong className="font-bold">300 zł</strong>
            </p>
            <p className="etykieta text-muted-foreground">
              1 dzień · płatność po efekcie
            </p>
          </div>

          <div className="hero-enter flex flex-wrap items-stretch gap-4 [animation-delay:270ms]">
            <BookingLink
              section="hero"
              className="cien-mgla-5 flex flex-col gap-px rounded-xl bg-ink px-6 py-3.5 text-background focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
            >
              <span className="text-[16.5px] font-bold">Zarezerwuj termin</span>
              <span className="text-xs text-noc-jasny">
                online, bez dzwonienia
              </span>
            </BookingLink>

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
          <div className="cien-7 w-[88%] rotate-2 rounded-2xl border-[3px] border-ink bg-background p-3.5">
            {/* Kadr 4:3 z powiększeniem 1,55× i osią 50%/38% — wartości
                z makiety, wchodzą na przód auta zamiast pokazywać cały warsztat. */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[10px]">
              <HeroPicture
                images={images}
                imgClassName="scale-[1.55] object-cover origin-[50%_38%]"
              />
            </div>
            <div className="mt-3 flex justify-center">
              <p className="etykieta text-muted-foreground">
                psss... piana robi robotę
              </p>
            </div>
          </div>

          {/* Lanca wystaje z narożnika karty i „pryska" na auto. Wariant
              z brandingu z białą obwódką („czarne tło") — obwódka odcina znak
              od zdjęcia pod nim, więc żaden cień CSS nie jest potrzebny.
              Bez obrotu: grafika leży poziomo tak, jak w pliku.
              Wymiary = viewBox pliku (obwódka dodaje po 11 px do 1866×637).
              Na wąskich ekranach mniejszy zwis, żeby sekcja (overflow-hidden)
              nie ucięła pistoletu. SVG przez <img> — Next nie optymalizuje SVG. */}
          <img
            src="/brand/lw-kolor.svg"
            alt="Lanca z pianą"
            width={1888}
            height={659}
            className="absolute top-[-3%] right-[-2%] z-[2] w-[46%] sm:right-[-10%] sm:w-[42%]"
          />

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
