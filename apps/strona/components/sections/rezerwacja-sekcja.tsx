import { Phone } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import type { DostepnoscData } from "@/lib/rezerwacje";
import { Reveal } from "@/components/motion/reveal";
import { Rezerwacja } from "./rezerwacja";
import { PhoneLink } from "./phone-link";

/** Osobna sekcja „Umów termin" z rezerwacją online (przed sekcją Kontakt). */
export function RezerwacjaSekcja({
  dostepnosc,
  kontakt,
}: {
  dostepnosc: DostepnoscData;
  kontakt: KontaktData;
}) {
  return (
    <section
      id="rezerwacja"
      aria-labelledby="rezerwacja-heading"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="rezerwacja-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            Umów termin
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Zarezerwuj termin online w kilka sekund — wybierz dzień i godzinę,
            potwierdzę telefonicznie.
          </p>
        </Reveal>

        <Reveal className="mt-8">
          {dostepnosc.enabled ? (
            <Rezerwacja config={dostepnosc} />
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-pretty">
                Rezerwacje online są chwilowo niedostępne — zadzwoń, umówimy termin od ręki.
              </p>
              <PhoneLink
                phoneE164={kontakt.phoneE164}
                section="rezerwacja"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
              >
                <Phone className="size-4" aria-hidden />
                Zadzwoń: {kontakt.phoneDisplay}
              </PhoneLink>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
