import { ContactForm } from "@moduly/magazyn-forms";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
import { MessengerLink, PhoneLink } from "./phone-link";

/** Sekcja „Kontakt" — telefon/adres + formularz wiadomości (po sekcji Rezerwacja). */
export function Kontakt({ kontakt }: { kontakt: KontaktData }) {
  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-heading"
      className="scroll-mt-20 border-y border-border bg-card/40"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="kontakt-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            Kontakt
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Wolisz zadzwonić albo napisać? Odezwij się — odpowiem z ceną i wolnym terminem.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="space-y-6">
            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="kontakt"
              className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 transition-colors hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Phone className="size-6 shrink-0 text-primary-strong" aria-hidden />
              <span>
                <span className="block text-xl font-semibold">
                  {kontakt.phoneDisplay}
                </span>
                <span className="text-sm text-muted-foreground">
                  {kontakt.hoursNote}
                </span>
              </span>
            </PhoneLink>

            {kontakt.messengerUrl ? (
              <MessengerLink
                url={kontakt.messengerUrl}
                section="kontakt"
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <MessageCircle
                  className="size-6 shrink-0 text-primary-strong"
                  aria-hidden
                />
                <span>
                  <span className="block font-medium">Messenger</span>
                  <span className="text-sm text-muted-foreground">
                    odpisuję zwykle w kilka godzin
                  </span>
                </span>
              </MessengerLink>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
                <span>
                  <span className="block font-medium">
                    {kontakt.addressLine}, {kontakt.postalCode} {kontakt.city}
                  </span>
                  {kontakt.googleMapsUrl ? (
                    <a
                      href={kontakt.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-primary-strong underline-offset-4 hover:underline"
                    >
                      Wyznacz trasę w Google Maps
                    </a>
                  ) : null}
                </span>
              </p>
              <p className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
                <span>
                  {kontakt.freeTravelKm > 0
                    ? `Dojazd gratis do ${kontakt.freeTravelKm} km. `
                    : "Usługa stacjonarna — "}
                  Zapraszam klientów z: {kontakt.serviceAreas.join(" · ")}
                </span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-lg font-medium">
                Napisz wiadomość — opisz auto i problem
              </h3>
              <p className="mt-1 mb-5 text-sm text-muted-foreground">
                Odpowiem z ceną i wolnym terminem.
              </p>
              <ContactForm
                variant="page"
                topicPreset="kontakt"
                privacyPolicyHref="/polityka-prywatnosci"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
