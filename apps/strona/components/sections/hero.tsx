import Image from "next/image";
import { Camera, Phone } from "lucide-react";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * Hero — plan www v2: odpowiada od razu na lęk nr 1 („ile to kosztuje?")
 * i nr 3 („a jak nie wyjdzie?"). Test 5 sekund: kategoria usługi w pierwszych
 * słowach H1, cena kotwiczna (300 zł), dowód przed/po i płatność po
 * efekcie — wszystko bez scrolla. Konwersja główna: wiadomość ze zdjęciem.
 * Copy w kodzie; z CMS tylko zdjęcie (Magazyn → Treść).
 *
 * Układ: full-bleed — zdjęcie na całą szerokość, copy na ciemnym scrimie.
 * Zdjęcie pełni rolę tekstury/atmosfery, nie dowodu konkretnej usługi (stąd
 * `alt=""`): sprzedaje copy, więc podmiana kadru w panelu nie może zmienić
 * ani przekazu, ani poprawności alt-tekstu. Kolejność: obietnica → zakres →
 * CENA → akcja; cena stoi przed CTA, bo to lęk nr 1.
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
    <section
      id="hero"
      aria-label="Detailing Łącko"
      className="relative isolate flex min-h-[42rem] items-end overflow-hidden bg-hero-scrim lg:max-h-[46rem] lg:min-h-[67.8svh] lg:items-center"
    >
      {/* Kontener zdjęcia. Mobile: pełny bleed (docelowo osobne zdjęcie).
          Desktop: przypięty do prawej, wysokość = wysokość hero. Szerokość =
          proporcja kadru (3:2) powiększona o 30% (→ 39:20), więc panel rośnie
          w stronę tekstu zamiast się przycinać. Maska siedzi TU, a nie na
          <Image>, więc 30% (opacity) liczy się od szerokości TEGO panelu i
          wygaszanie trzyma się jego krawędzi niezależnie od proporcji okna. */}
      <div className="absolute inset-0 -z-10 lg:left-auto lg:aspect-[351/200] lg:h-full lg:w-auto lg:translate-x-[20%] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_30%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_30%)]">
        {/* LCP strony — priority + fetchPriority, bez lazy. Ciemne tło sekcji
            trzyma kontrast copy także zanim zdjęcie się dociągnie (zero CLS). */}
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 1024px) 75vw, 100vw"
          // Zdjęcie leży pod scrimem, więc detal i tak nie pracuje — q70 mieści
          // LCP w budżecie 120 KB bez widocznej straty.
          quality={70}
          className="object-cover object-[62%_center] lg:object-center"
        />
      </div>
      {/* Scrim: na mobile ciemnieje ku dołowi (copy przy dole), na desktopie
          ku lewej (copy w lewej kolumnie) — zdjęcie zostaje odsłonięte tam,
          gdzie nie ma tekstu.
          Punkty gradientu są dobrane pod KONTRAST, nie pod estetykę: zdjęcie
          jest podmienialne z panelu, więc scrim musi udźwignąć też kadr jasny
          (białe auto). Przy ~88–100% krycia w strefie copy biel trzyma 4.5:1
          nawet nad prawie białym pikselem; górne 55% zostawia zdjęcie widoczne
          tam, gdzie tekstu nie ma. Zmieniasz stopnie → przemierz kontrast. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-hero-scrim from-30% via-hero-scrim/88 via-75% to-hero-scrim/55 lg:bg-gradient-to-r lg:from-hero-scrim lg:from-0% lg:via-hero-scrim/80 lg:via-50% lg:to-hero-scrim/25"
      />

      {/* Na desktopie copy nie jest wyśrodkowane w kontenerze, tylko dociągnięte
          do lewej krawędzi — im dalej od jasnego auta, tym większy zapas
          kontrastu. clamp trzyma sensowny margines też na szerokich ekranach. */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-14 lg:mx-0 lg:max-w-none lg:py-16 lg:pr-6 lg:pl-[clamp(3rem,5vw,8rem)]">
        <div className="flex max-w-2xl flex-col lg:translate-x-[5%]">
          <h1 className="hero-enter font-serif text-5xl leading-[1.04] font-medium text-balance text-hero-foreground md:text-6xl lg:text-7xl">
            {headline}
          </h1>

          {/* Lead — nosi kategorię usługi, lokalizację i USP (H1 jest hookiem,
              więc fraza „Detailing w Łącku" musi wybrzmieć tutaj). */}
          <h2 className="hero-enter mt-5 max-w-lg text-xl leading-snug font-medium text-pretty text-hero-foreground md:text-2xl [animation-delay:90ms]">
            {lead}
          </h2>

          <p className="hero-enter mt-4 max-w-lg text-pretty text-hero-muted md:text-lg [animation-delay:180ms]">
            {description}
          </p>

          {/* Cena kotwiczna — jasny kafel na ciemnym tle, celowo przed CTA. */}
          <p className="hero-enter mt-7 inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 self-start rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg [animation-delay:270ms]">
            Komplet foteli z kanapą —{" "}
            <span className="text-lg text-primary-strong">300 zł</span>
          </p>

          <div className="hero-enter mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center [animation-delay:360ms]">
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
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-hero-foreground/35 bg-hero-foreground/10 px-6 py-3.5 text-base font-medium text-hero-foreground backdrop-blur-sm transition-colors hover:border-hero-foreground/70 hover:bg-hero-foreground/20 focus-visible:ring-3 focus-visible:ring-hero-foreground/60 focus-visible:outline-none"
              ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
            >
              <Phone className="size-5" aria-hidden />
              Zadzwoń: {kontakt.phoneDisplay}
            </PhoneLink>
          </div>

          {/* Pasek zaufania — trzy dowody, bez ocen „na słowo". */}
          <p className="hero-enter mt-6 max-w-lg text-sm text-pretty text-hero-muted [animation-delay:450ms]">
            cennik bez „od" · zdjęcia przed/po · płatność przy odbiorze
          </p>
        </div>
      </div>
    </section>
  );
}
