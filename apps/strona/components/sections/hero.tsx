import { getImageProps } from "next/image";
import { Camera, Phone } from "lucide-react";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { HeroImages } from "@/lib/cms-content";
import type { KontaktData } from "@/lib/site";
import { PhoneLink, PhotoLink } from "./phone-link";

/**
 * Hero — plan www v2: odpowiada od razu na lęk nr 1 („ile to kosztuje?")
 * i nr 3 („a jak nie wyjdzie?"). Konwersja główna: wiadomość ze zdjęciem.
 * Copy w kodzie; z CMS zdjęcia (Magazyn → Treść, osobno desktop i mobile).
 *
 * DWA OSOBNE PROJEKTY, nie jeden responsywny układ:
 * - Mobile (< lg): pierwszy ekran zaprojektowany pod telefon — pełnoekranowe
 *   zdjęcie pionowe, na dole obietnica + CENA jako bohater + jeden CTA.
 *   Drugi CTA (telefon) i skok do cennika żyją w stałym dolnym pasku akcji
 *   (BottomBar), więc hero ich nie dubluje.
 * - Desktop (lg+): układ bez zmian — stage 120rem, panel zdjęcia z maską,
 *   copy po lewej, cena przed CTA.
 */

/**
 * Zdjęcie hero z art direction: telefon dostaje kadr mobilny, desktop
 * desktopowy — przez <picture> + media query, więc przeglądarka pobiera
 * TYLKO jeden plik. Oba warianty sekcji renderują identyczny <picture>;
 * na danym urządzeniu oba rozwiązują się do tego samego URL-a, więc mimo
 * dwóch elementów w DOM jest jedno żądanie (cache HTTP je skleja).
 * Brak `priority` celowo: <link rel=preload> nie umie media query i
 * preloadowałby oba pliki; eager+fetchpriority na <img> w initial HTML
 * daje LCP bez podwójnego pobierania.
 */
function HeroPicture({
  images,
  imgClassName,
}: {
  images: HeroImages;
  imgClassName: string;
}) {
  const common = {
    alt: "",
    fill: true as const,
    // Zdjęcie leży pod scrimem, więc detal i tak nie pracuje — q70 mieści
    // LCP w budżecie 120 KB bez widocznej straty.
    quality: 70,
    sizes: "100vw",
  };
  const mobile = getImageProps({ ...common, src: images.mobile });
  const desktop = getImageProps({ ...common, src: images.desktop });
  const { srcSet: desktopSrcSet, ...imgProps } = desktop.props;

  return (
    <picture>
      <source
        media="(max-width: 1023.5px)"
        srcSet={mobile.props.srcSet ?? mobile.props.src}
      />
      <img
        {...imgProps}
        srcSet={desktopSrcSet}
        loading="eager"
        fetchPriority="high"
        className={imgClassName}
      />
    </picture>
  );
}

export function Hero({
  images,
  kontakt,
}: {
  images: HeroImages;
  kontakt: KontaktData;
}) {
  // H1 mówi WPROST, co to za miejsce (kategoria + lokalizacja, zero metafory
  // i zero listy usług — to rola linii pod spodem). Lead to rzeczowa lista:
  // co robimy, w tej kolejności co w cenniku (wnętrze jako pierwsze, bo to
  // filar przychodu). Uczciwości nie deklarujemy („jesteśmy uczciwi") —
  // demonstrujemy ją treścią (pasek zaufania, kafel ceny, CTA).
  const headline = "Detailing samochodowy";
  const lead =
    "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru i reflektorów";
  const photoHref = buildPhotoContactHref(kontakt);

  return (
    <section id="hero" aria-label="Detailing Łącko" className="relative isolate">
      {/* ============ MOBILE (< lg) — projekt pod telefon ============ */}
      <div className="relative flex min-h-svh flex-col overflow-hidden bg-hero-scrim lg:hidden">
        {/* Zdjęcie DOPASOWANE DO SZEROKOŚCI (aspect-ratio), nie rozciągnięte
            na całą wysokość ekranu. Plik źródłowy ma proporcję 3:4 (1200×1600);
            pełna wysokość min-h-svh (wcześniejszy układ) zmuszała object-cover
            do przycinania BOKÓW (wąski, mocno przybliżony pionowy pasek —
            stąd „rozciągnięte"/zoomed zdjęcie). 16:9 przycina górę/dół zamiast
            boków — dla auta (podmiot szerszy niż wyższy) to naturalniejszy
            kadr — i mieści się z resztą treści bez scrolla na jednym ekranie
            (zmierzone: 390×844 → margines ~100 px, patrz commit). */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden">
          <HeroPicture images={images} imgClassName="object-cover object-center" />
          {/* Scrim TYLKO w obrębie zdjęcia — gaśnie do dokładnie tego samego
              koloru co tło sekcji (bg-hero-scrim), więc przejście zdjęcie →
              jednolite tło pod treścią jest bezszwowe. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-hero-scrim from-0% to-hero-scrim/0 to-55%"
          />
        </div>

        {/* Treść przy dole, nad dolnym paskiem akcji (pb pod jego wysokość).
            Bez zdjęcia pod spodem — siedzi na jednolitym bg-hero-scrim, więc
            duży pt sprzed tej zmiany (kompensował overlay na pełnoekranowym
            zdjęciu) był zbędny; zredukowany do minimalnego oddechu. */}
        <div className="relative mt-auto flex flex-col px-5 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <h1 className="hero-enter font-serif text-[2.6rem] leading-[1.05] font-medium text-balance text-hero-foreground">
            {headline}
          </h1>
          <p className="hero-enter mt-3 text-base text-pretty text-hero-muted [animation-delay:90ms]">
            {lead}
          </p>

          {/* Cena kotwiczna PO obietnicy efektu, nie przed nią: przy głównej
              alternatywie klienta („umyję sam na myjni za 30 zł") goła kwota
              odpycha, dopóki nie ma powodu jej chcieć. Dopisek o braku ryzyka
              siedzi w tym samym kaflu, bo to on neutralizuje cenę. */}
          <div className="hero-enter mt-6 rounded-2xl bg-background px-5 py-4 shadow-xl [animation-delay:180ms]">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">
                Komplet foteli z kanapą
              </span>
              <span className="font-serif text-3xl font-medium text-primary-strong">
                300 zł
              </span>
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Nie wyszło — nie płacisz. Oglądasz efekt, potem płacisz.
            </p>
          </div>

          {/* Jeden CTA — telefon i cennik są w stałym dolnym pasku. */}
          <PhotoLink
            href={photoHref}
            section="hero"
            className="hero-enter mt-3 inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-xl [animation-delay:270ms] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Camera className="size-5 shrink-0" aria-hidden />
            <span className="text-left leading-snug">
              Wyślij zdjęcie — dostaniesz cenę
              <span className="block text-xs font-medium opacity-85">
                odpisujemy do 2 h
              </span>
            </span>
          </PhotoLink>

          <p className="hero-enter mt-5 text-xs text-pretty text-hero-muted [animation-delay:360ms]">
            cennik bez „od" · ocena plamy przed przyjazdem · nie wyszło = nie
            płacisz
          </p>
        </div>
      </div>

      {/* ============ DESKTOP (lg+) — układ bez zmian ============ */}
      <div className="relative hidden max-h-[46rem] min-h-[67.8svh] overflow-hidden bg-hero-scrim lg:flex">
        {/* Stage — wspólna klatka dla zdjęcia I tekstu. Do 120rem szerokości
            jest po prostu całą sekcją. Powyżej: ogranicza CAŁĄ zawartość do
            120rem i centruje — bez tego na ultraszerokim monitorze tekst
            ucieka do lewej krawędzi, zdjęcie do prawej i pośrodku rośnie
            pusta dziura. Stage zostaje W FLOW (nie absolute), żeby sekcja
            rosła od treści. */}
        <div className="relative mx-auto flex w-full max-w-[120rem] flex-col justify-center">
          {/* Panel zdjęcia przypięty do prawej; wysokość = wysokość stage.
              Maska SYMETRYCZNA: 0→30% wygasza lewą krawędź (pod tekstem),
              70→100% prawą — na typowych ekranach prawy fade ląduje poza
              viewportem, ujawnia się na szerokich. */}
          <div className="absolute inset-y-0 right-0 aspect-[351/200] h-full w-auto translate-x-[25%] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_30%,black_70%,transparent_100%)] [mask-image:linear-gradient(to_right,transparent_0%,black_30%,black_70%,transparent_100%)]">
            <HeroPicture images={images} imgClassName="object-cover object-center" />
            {/* Jednolite przyciemnienie WEWNĄTRZ panelu — panel wystaje poza
                stage (translate-x), warstwa na sekcji nie pokrywałaby całości. */}
            <div aria-hidden className="absolute inset-0 bg-hero-scrim/50" />
          </div>

          <div className="w-full py-16 pr-6 pl-[clamp(3rem,5vw,8rem)]">
            <div className="flex max-w-2xl translate-x-[5%] flex-col">
              <h1 className="hero-enter font-serif text-7xl leading-[1.04] font-medium text-balance text-hero-foreground">
                {headline}
              </h1>

              {/* Lead — nosi kategorię usługi, lokalizację i USP (H1 jest
                  hookiem, więc „Detailing w Łącku" musi wybrzmieć tutaj). */}
              <h2 className="hero-enter mt-5 max-w-lg text-2xl leading-snug font-medium text-pretty text-hero-foreground [animation-delay:90ms]">
                {lead}
              </h2>

              {/* Cena kotwiczna — jasny kafel na ciemnym tle, celowo przed CTA. */}
              <div className="hero-enter mt-7 self-start rounded-xl bg-background px-4 py-2.5 shadow-lg [animation-delay:270ms]">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                  Komplet foteli z kanapą —{" "}
                  <span className="text-lg text-primary-strong">300 zł</span>
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  1 dzień
                </p>
              </div>

              <div className="hero-enter mt-6 flex flex-row flex-wrap items-center gap-3 [animation-delay:360ms]">
                <PhotoLink
                  href={photoHref}
                  section="hero"
                  className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none"
                >
                  <Camera className="size-5 shrink-0" aria-hidden />
                  <span className="text-left leading-snug">
                    Wyślij zdjęcie — dostaniesz cenę
                    <span className="block text-xs font-medium opacity-85">
                      odpisujemy do 2 h
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
