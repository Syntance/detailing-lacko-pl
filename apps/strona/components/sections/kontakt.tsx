import type { KontaktData } from "@/lib/site";
import { LINIA_INFO, type Linia } from "@/lib/linie";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import { Reveal } from "@/components/motion/reveal";
import { BookingLink, PhoneLink, PhotoLink } from "./phone-link";

/**
 * „Umów termin" 1:1 z makietą „kreskówka": czarna sekcja zamykająca, znak
 * marki w wersji mono, dwa CTA i NAP. Świadomie bez formularza — tak jak
 * w makiecie. Znak mono i CTA zależą od linii: detailing = rezerwacja online
 * + telefon, wulkanizacja (bez rezerwacji) = telefon + zdjęcie opony.
 *
 * Wulkanizacja nie ma osobnego pliku mono — to ten sam plik co sygnet
 * nagłówka (realne logo klienta), zdjęty do białego konturu filtrem CSS
 * (`brightness-0 invert`). Oryginał ma zbyt wiele wewnętrznych odcieni
 * (opona/felga/cień), żeby ręcznie odtworzyć osobną wersję liniową bez
 * zgubienia wierności — filtr trzyma się źródłowej grafiki 1:1.
 */
const ZNAK_MONO: Record<
  Linia,
  { src: string; width: number; height: number; className: string }
> = {
  detailing: {
    src: "/brand/lw-mono-czern.svg",
    width: 1888,
    height: 659,
    className: "block w-[190px]",
  },
  wulkanizacja: {
    src: "/brand/wulk-sygnet.svg",
    width: 372,
    height: 383,
    className: "block w-[104px] brightness-0 invert",
  },
};

export function Kontakt({
  kontakt,
  marka = "detailing",
}: {
  kontakt: KontaktData;
  marka?: Linia;
}) {
  const znak = ZNAK_MONO[marka];
  // Linia bez rezerwacji online (wulkanizacja): główne CTA to telefon,
  // a drugie — zdjęcie opony (wycena „da się naprawić czy nie" bez wizyty).
  const rezerwacjaOnline = LINIA_INFO[marka].rezerwacjaOnline;

  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-heading"
      className="scroll-mt-24 border-t-[3px] border-ink bg-noc text-background"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col items-center gap-[30px] px-5 pt-16 pb-14 text-center md:px-6 md:pt-[72px] md:pb-14">
        {/* SVG marki przez <img> — optymalizator Next nie przetwarza SVG.
            `loading="lazy"` nie jest kosmetyką: React 19 sam wystawia
            <link rel=preload as=image> dla każdego niezleniwionego <img>
            w SSR, więc ten znak (29 KB br) startował z priorytetem head
            i zabierał pasmo zdjęciu hero — a leży na samym dole strony. */}
        <img
          src={znak.src}
          alt=""
          width={znak.width}
          height={znak.height}
          loading="lazy"
          decoding="async"
          className={znak.className}
        />

        <Reveal className="flex flex-col items-center gap-[30px]">
          <h2
            id="kontakt-heading"
            className="text-[2rem] leading-[1.05] font-bold tracking-[-0.02em] md:text-[42px]"
          >
            Umów termin
          </h2>

          {rezerwacjaOnline ? (
            <div className="flex flex-wrap items-stretch justify-center gap-4">
              <BookingLink
                section="kontakt"
                className="cien-akcent-mgla-5 rounded-xl border-[3px] border-akcent bg-akcent px-[26px] py-3.5 text-[16.5px] font-bold text-ink focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
              >
                Zarezerwuj termin
              </BookingLink>

              <PhoneLink
                phoneE164={kontakt.phoneE164}
                section="kontakt"
                className="flex items-center rounded-xl border-[3px] border-background px-[26px] py-3.5 text-[16.5px] font-semibold transition-colors hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
                ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
              >
                {kontakt.phoneDisplay}
              </PhoneLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-stretch justify-center gap-4">
              <PhoneLink
                phoneE164={kontakt.phoneE164}
                section="kontakt"
                className="cien-akcent-mgla-5 rounded-xl border-[3px] border-akcent bg-akcent px-[26px] py-3.5 text-[16.5px] font-bold text-ink focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
                ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
              >
                Zadzwoń: {kontakt.phoneDisplay}
              </PhoneLink>

              <PhotoLink
                href={buildPhotoContactHref(kontakt)}
                section="kontakt"
                className="flex items-center rounded-xl border-[3px] border-background px-[26px] py-3.5 text-[16.5px] font-semibold transition-colors hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
              >
                Wyślij zdjęcie opony
              </PhotoLink>
            </div>
          )}

          <p className="text-[15px] text-noc-jasny">
            {kontakt.addressLine}, {kontakt.postalCode} {kontakt.city} ·{" "}
            {kontakt.hoursNote}
          </p>

          {/* Makieta ma tu #6B7075, ale na czystej czerni to 4,2:1 — poniżej
              WCAG AA (EAA to wymóg prawny). Jaśniejszy szary z tej samej
              palety (#A9ACAF, ten sam co notka czarnego pasa) daje 9,2:1. */}
          <p className="etykieta max-w-[70ch] leading-[1.9] text-noc-szary">
            {kontakt.serviceAreas.join(" · ")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
