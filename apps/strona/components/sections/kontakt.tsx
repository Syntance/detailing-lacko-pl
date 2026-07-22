import { Camera, Clock, MapPin, Phone } from "lucide-react";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * „Umów termin" — sekcja konwersji (plan www v2 §7). Jedna strona, dwa
 * działania: wiadomość ze zdjęciem albo telefon. Świadomie bez formularza
 * (zero formularzy wieloetapowych) i bez fraz spoza doliny Dunajca.
 */
export function Kontakt({ kontakt }: { kontakt: KontaktData }) {
  const photoHref = buildPhotoContactHref(kontakt);

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
            Umów termin
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Wyślij zdjęcie albo zadzwoń — do 2 h dostaniesz cenę i najbliższy
            wolny termin. Płacisz przy odbiorze, po obejrzeniu efektu.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Reveal className="space-y-5">
            <PhotoLink
              href={photoHref}
              section="kontakt"
              className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground transition-transform hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
            >
              <Camera className="size-6 shrink-0" aria-hidden />
              <span>
                <span className="block text-lg font-semibold">
                  Wyślij zdjęcie plamy lub wnętrza
                </span>
                <span className="text-sm opacity-85">
                  odpiszemy do 2 h z ceną i terminem
                </span>
              </span>
            </PhotoLink>

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
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-border bg-card p-5">
              <p className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 size-5 shrink-0 text-primary-strong"
                  aria-hidden
                />
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
                <Clock
                  className="mt-0.5 size-5 shrink-0 text-primary-strong"
                  aria-hidden
                />
                <span>
                  Usługa stacjonarna — obsługujemy dolinę Dunajca:{" "}
                  {kontakt.serviceAreas.join(" · ")}
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
