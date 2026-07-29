import type { KontaktData } from "@/lib/site";
import type { CennikData } from "@/lib/cennik";
import { buildRezerwacjaCennik, type DostepnoscData } from "@/lib/rezerwacje";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import { Reveal } from "@/components/motion/reveal";
import { Rezerwacja } from "./rezerwacja";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * Sekcja „04 · rezerwacja" — cel wszystkich CTA na stronie. Plakietka
 * i typografia jak w pozostałych sekcjach makiety „kreskówka"; tło piasek
 * (jak Efekty), bo siedzi między białą sekcją współpracy a żółtym FAQ.
 *
 * Usługi do wyboru budujemy tu, po stronie serwera, z cennika (panel Magazyn
 * → Cennik) — do klienta idzie odchudzona lista bez opisów.
 *
 * Gdy rezerwacje są w panelu wyłączone, sekcja nie udaje działającego
 * formularza — pokazuje telefon jako jedyną realną drogę.
 */
export function RezerwacjaSekcja({
  dostepnosc,
  cennik,
  kontakt,
}: {
  dostepnosc: DostepnoscData;
  cennik: CennikData;
  kontakt: KontaktData;
}) {
  const photoHref = buildPhotoContactHref(kontakt);
  const kategorie = buildRezerwacjaCennik(cennik);

  return (
    <section
      id="rezerwacja"
      aria-labelledby="rezerwacja-heading"
      className="scroll-mt-24 border-y-[3px] border-ink bg-piasek"
    >
      <div className="mx-auto flex max-w-[900px] flex-col gap-[30px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-col gap-2.5">
          <p className="etykieta w-max rotate-[1.2deg] rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5">
            04 · rezerwacja
          </p>
          <h2
            id="rezerwacja-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            Wybierz termin i masz to z głowy
          </h2>
        </Reveal>

        <Reveal>
          {dostepnosc.enabled ? (
            <Rezerwacja config={dostepnosc} kategorie={kategorie} />
          ) : (
            <div className="cien-6 flex flex-col items-start gap-4 rounded-2xl border-[3px] border-ink bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] font-medium text-pretty">
                Rezerwacje online są chwilowo wyłączone — zadzwoń, umówimy
                termin od ręki.
              </p>
              <PhoneLink
                phoneE164={kontakt.phoneE164}
                section="rezerwacja"
                className="cien-zolty-3 inline-flex min-h-12 shrink-0 items-center rounded-full border-2 border-ink bg-ink px-5 py-3 text-[15px] font-bold whitespace-nowrap text-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
              >
                Zadzwoń: {kontakt.phoneDisplay}
              </PhoneLink>
            </div>
          )}
        </Reveal>

        {/* Wycena ze zdjęcia zostaje jako droga poboczna: przy „nie wiem, co
            wybrać" to ona zdejmuje barierę, a rezerwacja terminu jej nie
            zastępuje (formularz nie przyjmuje zdjęć). */}
        <Reveal className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-sm font-medium">
          <span className="text-tekst">Nie wiesz, która usługa?</span>
          <PhotoLink
            href={photoHref}
            section="rezerwacja"
            className="font-bold underline underline-offset-4 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Wyślij zdjęcie — dostaniesz cenę
          </PhotoLink>
        </Reveal>
      </div>
    </section>
  );
}
