import Image from "next/image";
import { Camera, Phone } from "lucide-react";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * Hero — plan www v2: odpowiada od razu na lęk nr 1 („ile to kosztuje?")
 * i nr 3 („a jak nie wyjdzie?"). Test 5 sekund: kategoria usługi w pierwszych
 * słowach H1, cena kotwiczna (badge 300 zł), dowód przed/po i płatność po
 * efekcie — wszystko bez scrolla. Konwersja główna: wiadomość ze zdjęciem.
 * Copy w kodzie; z CMS tylko zdjęcie (Magazyn → Treść).
 */
export function Hero({
  imageUrl,
  kontakt,
}: {
  imageUrl: string;
  kontakt: KontaktData;
}) {
  const headline = "Auto jak z salonu";
  const lead = "Detailing w Łącku. Cena z góry, płacisz po efekcie.";
  const description =
    "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru i reflektorów. Czerniec 72 — terminy po 16:00 i w weekendy.";
  const photoHref = buildPhotoContactHref(kontakt);

  return (
    <section id="hero" aria-label="Detailing Łącko" className="relative">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 pt-28 pb-16 lg:grid-cols-2 lg:gap-28 lg:pt-40 lg:pb-24">
        <div className="relative order-2 flex flex-col justify-center lg:order-1">
          <h1 className="hero-enter max-w-xl font-serif text-5xl leading-[1.04] font-medium text-balance md:text-6xl lg:text-7xl">
            {headline}
          </h1>

          {/* Lead — nosi kategorię usługi, lokalizację i USP (H1 jest hookiem,
              więc fraza „Detailing w Łącku" musi wybrzmieć tutaj). */}
          <h2 className="hero-enter mt-5 max-w-lg text-xl leading-snug font-medium text-pretty md:text-2xl [animation-delay:90ms]">
            {lead}
          </h2>

          <p className="hero-enter mt-4 max-w-lg text-pretty text-muted-foreground md:text-lg [animation-delay:180ms]">
            {description}
          </p>

          <div className="hero-enter mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center [animation-delay:270ms]">
            <PhotoLink
              href={photoHref}
              section="hero"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none"
            >
              <Camera className="size-5 shrink-0" aria-hidden />
              <span className="text-left leading-snug">
                Wyślij zdjęcie plamy
                <span className="block text-xs font-medium opacity-85">
                  odpiszemy do 2 h z ceną i terminem
                </span>
              </span>
            </PhotoLink>

            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="hero"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
            >
              <Phone className="size-5" aria-hidden />
              Zadzwoń: {kontakt.phoneDisplay}
            </PhoneLink>
          </div>

          {/* Pasek zaufania — trzy dowody, bez ocen „na słowo". */}
          <p className="hero-enter mt-6 max-w-lg text-sm text-pretty text-muted-foreground [animation-delay:360ms]">
            cennik bez „od" · zdjęcia przed/po · płatność przy odbiorze
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl lg:aspect-[5/4]">
            <Image
              src={imageUrl}
              alt="Pranie tapicerki — fotel przed i po czyszczeniu"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
            {/* Cena kotwiczna w hero (badge) — cena jest bohaterem UI. */}
            <p className="absolute bottom-4 left-4 rounded-xl bg-background/95 px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur">
              Komplet foteli z kanapą —{" "}
              <span className="text-lg text-primary-strong">300 zł</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
