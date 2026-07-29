import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * „Umów termin" 1:1 z makietą „kreskówka": czarna sekcja zamykająca, znak
 * marki w wersji mono, dwa CTA (wiadomość ze zdjęciem + telefon) i NAP.
 * Świadomie bez formularza — tak jak w makiecie.
 */
export function Kontakt({ kontakt }: { kontakt: KontaktData }) {
  const photoHref = buildPhotoContactHref(kontakt);
  // Makieta pisze „na WhatsApp", bo linkuje do wa.me. Gdy panel nie ma
  // ustawionego messengerUrl, CTA spada na SMS — wtedy etykieta nie może
  // obiecywać WhatsAppa.
  const whatsapp = /wa\.me|whatsapp/i.test(photoHref);

  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-heading"
      className="scroll-mt-24 border-t-[3px] border-ink bg-noc text-background"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col items-center gap-[30px] px-5 pt-16 pb-14 text-center md:px-6 md:pt-[72px] md:pb-14">
        {/* SVG marki przez <img> — optymalizator Next nie przetwarza SVG. */}
        <img
          src="/brand/lw-mono-czern.svg"
          alt=""
          width={1888}
          height={659}
          className="block w-[190px]"
        />

        <Reveal className="flex flex-col items-center gap-[30px]">
          <h2
            id="kontakt-heading"
            className="text-[2rem] leading-[1.05] font-bold tracking-[-0.02em] md:text-[42px]"
          >
            Umów termin
          </h2>

          <div className="flex flex-wrap items-stretch justify-center gap-4">
            <PhotoLink
              href={photoHref}
              section="kontakt"
              className="cien-zolty-mgla-5 rounded-xl border-[3px] border-zolty bg-zolty px-[26px] py-3.5 text-[16.5px] font-bold text-ink focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
            >
              {whatsapp
                ? "Wyślij zdjęcie na WhatsApp"
                : "Wyślij zdjęcie — dostaniesz cenę"}
            </PhotoLink>

            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="kontakt"
              className="flex items-center rounded-xl border-[3px] border-background px-[26px] py-3.5 text-[16.5px] font-semibold transition-colors hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
              ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
            >
              {kontakt.phoneDisplay}
            </PhoneLink>
          </div>

          <p className="text-[15px] text-noc-jasny">
            {kontakt.addressLine}, {kontakt.postalCode} {kontakt.city} ·{" "}
            {kontakt.hoursNote}
          </p>

          <p className="max-w-[70ch] font-mono text-[10px] leading-[1.9] tracking-[0.16em] text-muted-foreground uppercase">
            {kontakt.serviceAreas.join(" · ")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
