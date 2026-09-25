import { itemPriceRange, type CennikData } from "@/lib/cennik";
import type { KontaktData } from "@/lib/site";
import { PhoneLink } from "../phone-link";
import { HeroMapa } from "./hero-mapa";

/**
 * Hero linii Wulkanizacja — ten sam układ co hero detailingu (naklejka
 * lokalizacji → H1 → lead → kafel ceny → CTA | przekrzywiona karta), tylko
 * w czerwieni (token `--akcent` przepięty na wrapperze strony). Karta pokazuje
 * mapę Google z pinezką warsztatu.
 *
 * CTA inne niż w detailingu: wulkanizacja nie ma rezerwacji online, więc
 * jedyny przycisk dzwoni.
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

export function HeroWulkanizacja({
  kontakt,
  cennik,
}: {
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
            Wymiana opon i&nbsp;całych kół, wyważanie i&nbsp;naprawa opon —
            od&nbsp;ręki
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
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="cien-7 w-[88%] rotate-2 rounded-2xl border-[3px] border-ink bg-background p-3.5">
            <HeroMapa
              adres={`${kontakt.addressLine}, ${kontakt.postalCode} ${kontakt.city}`}
              mapsUrl={kontakt.googleMapsUrl}
            />
            <div className="mt-3 flex justify-center">
              <p className="etykieta text-muted-foreground">
                {kontakt.addressLine} · {kontakt.city}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
