import Image from "next/image";
import { itemPriceRange, type CennikData } from "@/lib/cennik";
import type { HeroImages } from "@/lib/cms-content";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { HeroPicture } from "../hero-picture";
import { PhoneLink, PhotoLink } from "../phone-link";
import { IlustracjaKola } from "./ilustracja-kola";

/**
 * Hero linii Wulkanizacja — ten sam układ co hero detailingu (naklejka
 * lokalizacji → H1 → lead → kafel ceny → dwa CTA | przekrzywiona karta),
 * tylko w czerwieni (token `--akcent` przepięty na wrapperze strony) i z
 * własnymi rekwizytami: klucz krzyżakowy w narożniku zamiast lancy, nakrętki
 * zamiast bąbli piany. Karta pokazuje zdjęcie z panelu (Magazyn →
 * Wulkanizacja → CMS), a dopóki go nie ma — ilustrację koła.
 *
 * CTA inne niż w detailingu: wulkanizacja nie ma rezerwacji online, więc
 * główny przycisk dzwoni, a drugi wysyła zdjęcie opony (czy da się naprawić).
 *
 * Kafel ceny bierze kwotę z cennika (pozycja `przekladka-sezonowa`), żeby
 * hero nigdy nie obiecywał innej ceny niż sekcja 01 po edycji w panelu.
 */

/** Pozycja-kotwica cenowa hero: przekładka sezonowa 4 kół. */
const POZYCJA_KOTWICA = "przekladka-sezonowa";

function cenaKotwicy(cennik: CennikData): string | null {
  const item = cennik.items.find(
    (i) => i.id === POZYCJA_KOTWICA && !i.disabled && !i.priceHidden,
  );
  if (!item) return null;
  const { from, to } = itemPriceRange(item);
  if (from <= 0) return null;
  return to > from ? `od ${from} zł` : `${from} zł`;
}

/** Trzy nakrętki — odpowiednik bąbli piany pod kartą hero detailingu. */
function Nakretki() {
  const nakretka = (size: number, className: string) => (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M20 3 L34.7 11.5 V28.5 L20 37 L5.3 28.5 V11.5 Z"
        fill="var(--background)"
        stroke="var(--ink)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle
        cx="20"
        cy="20"
        r="7"
        fill="var(--akcent)"
        stroke="var(--ink)"
        strokeWidth="3.5"
      />
    </svg>
  );
  return (
    <div aria-hidden className="absolute -bottom-3 left-0 flex items-end">
      {nakretka(38, "rotate-[8deg]")}
      {nakretka(26, "-ml-1.5 mb-2 -rotate-[14deg]")}
      {nakretka(17, "-ml-1 mb-5 rotate-[22deg]")}
    </div>
  );
}

export function HeroWulkanizacja({
  images,
  kontakt,
  cennik,
}: {
  images: HeroImages;
  kontakt: KontaktData;
  cennik: CennikData;
}) {
  const cena = cenaKotwicy(cennik);

  return (
    <section
      id="hero"
      aria-label="Wulkanizacja Łącko"
      className="kropki overflow-hidden border-b-[3px] border-ink bg-akcent"
    >
      <div className="mx-auto grid max-w-[1140px] items-center gap-10 px-5 pt-12 pb-14 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-[72px]">
        <div className="flex flex-col gap-[22px]">
          <p className="etykieta hero-enter cien-3 w-max -rotate-2 rounded-full border-2 border-ink bg-background px-4 py-[7px]">
            {kontakt.addressLine} · {kontakt.postalCode} {kontakt.city}
          </p>

          <h1 className="hero-enter max-w-[13ch] text-[2.4rem] leading-[1.04] font-bold tracking-[-0.015em] sm:text-5xl lg:text-[60px]">
            Wulkanizacja i&nbsp;wymiana opon
          </h1>

          <p className="hero-enter max-w-[42ch] text-[17px] leading-[1.5] font-medium text-pretty [animation-delay:90ms] lg:text-[19px]">
            Sezonowa przekładka kół, wyważanie, naprawa przebitej opony
            i&nbsp;przechowywanie drugiego kompletu — na umówioną godzinę, bez
            kolejki
          </p>

          <div className="hero-enter cien-5 flex w-max max-w-full rotate-[1.2deg] flex-col gap-0.5 rounded-xl border-[3px] border-ink bg-background px-[18px] py-[13px] [animation-delay:180ms]">
            <p className="text-[15px] text-pretty lg:text-base">
              Przekładka 4 kół z wyważeniem —{" "}
              <strong className="font-bold">{cena ?? "cena w cenniku"}</strong>
            </p>
            <p className="etykieta text-muted-foreground">
              ok. 45 min · zero czekania w kolejce
            </p>
          </div>

          <div className="hero-enter flex flex-wrap items-stretch gap-4 [animation-delay:270ms]">
            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="hero"
              className="cien-mgla-5 flex flex-col gap-px rounded-xl bg-ink px-6 py-3.5 text-background focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
              ariaLabel={`Zadzwoń i umów termin: ${kontakt.phoneDisplay}`}
            >
              <span className="text-[16.5px] font-bold">
                Zadzwoń: {kontakt.phoneDisplay}
              </span>
              <span className="text-xs text-noc-jasny">
                umówisz godzinę od ręki
              </span>
            </PhoneLink>

            <PhotoLink
              href={buildPhotoContactHref(kontakt)}
              section="hero"
              className="cien-mgla-5 flex items-center rounded-xl border-[3px] border-ink bg-background px-[22px] py-3.5 text-[16.5px] font-semibold focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
            >
              Wyślij zdjęcie opony
            </PhotoLink>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="cien-7 w-[88%] rotate-2 rounded-2xl border-[3px] border-ink bg-background p-3.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[10px]">
              {images.desktop ? (
                <HeroPicture
                  images={images}
                  alt="Koło samochodowe na maszynie do wyważania w warsztacie wulkanizacyjnym"
                  imgClassName="object-cover"
                />
              ) : (
                <div className="kropki absolute inset-0 bg-piasek p-4">
                  <IlustracjaKola />
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-center">
              <p className="etykieta text-muted-foreground">
                psss... tym razem to opona
              </p>
            </div>
          </div>

          {/* Klucz krzyżakowy w narożniku karty — odpowiednik lancy z hero
              detailingu. SVG z wypaloną obwódką (w pliku), więc bez filtrów
              CSS; next/image serwuje SVG bez optymalizacji, ale `sizes`
              i lazy zostają dla spójności z resztą naklejek. */}
          <Image
            src="/brand/wulk-klucz-naklejka.svg"
            alt="Klucz krzyżakowy do kół"
            width={200}
            height={200}
            sizes="(max-width: 1023px) 30vw, 150px"
            className="absolute top-[-8%] right-[-1%] z-[2] h-auto w-[30%] sm:right-[-7%] sm:w-[27%]"
          />

          <Nakretki />
        </div>
      </div>
    </section>
  );
}
