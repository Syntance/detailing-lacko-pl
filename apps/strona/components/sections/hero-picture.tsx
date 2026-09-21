import ReactDOM from "react-dom";
import { getImageProps } from "next/image";
import type { HeroImages } from "@/lib/cms-content";

/**
 * Zdjęcie hero z art direction — wspólne dla obu linii (hero.tsx i
 * wulkanizacja/hero-wulkanizacja.tsx): telefon dostaje kadr mobilny, desktop
 * desktopowy — przez <picture> + media query, więc przeglądarka pobiera
 * TYLKO jeden plik. Brak `priority`: `next/image` wystawiłby preload bez
 * media query i ściągnął oba kadry. Preload robimy więc sami, niżej.
 */

/** Podział art direction — dopełniające się warunki, bez luki i zakładki. */
const MOBILE_MEDIA = "(max-width: 1023.5px)";
const DESKTOP_MEDIA = "not all and (max-width: 1023.5px)";

/**
 * `<link rel=preload>` wypisany jako JSX ląduje tam, gdzie stoi w drzewie —
 * czyli w <body>, tuż nad samym <img>, więc nic nie przyspiesza. ReactDOM
 * .preload() wynosi go do <head>, przed cały markup strony.
 */
function preloadHero(
  props: { srcSet?: string; sizes?: string; src?: string },
  media?: string,
): void {
  if (!props.srcSet || !props.src) return;
  ReactDOM.preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "high",
    ...(media ? { media } : {}),
  });
}

export function HeroPicture({
  images,
  alt,
  imgClassName,
}: {
  images: HeroImages;
  alt: string;
  imgClassName: string;
}) {
  const common = {
    alt,
    fill: true as const,
    quality: 70,
    // Karta zajmuje 88% prawej kolumny (~460 px), ale kadr jest powiększony
    // 1,55×, więc prosimy o plik pod ~720 px, żeby zoom nie zmiękł.
    sizes: "(max-width: 1024px) 88vw, 720px",
  };
  const mobile = getImageProps({ ...common, src: images.mobile });
  const desktop = getImageProps({ ...common, src: images.desktop });
  const { srcSet: desktopSrcSet, ...imgProps } = desktop.props;

  // Preload LCP-a. Bez niego przeglądarka odkrywa <img> dopiero przy parsowaniu
  // <body> — a w <head> stoi nad nim komplet preloadowanych fontów, stąd ~410 ms
  // „opóźnienia ładowania zasobu" w PSI. <link rel=preload> UMIE media query
  // (wbrew temu, co zakładał poprzedni komentarz w tym pliku), więc telefon
  // pobiera wyłącznie kadr mobilny, a desktop desktopowy — dokładnie jak
  // <source> niżej. Gdy panel nie wgrał osobnego kadru pod telefon, oba warianty
  // to ten sam plik: wtedy jeden preload bez media query (React i tak scaliłby
  // dwa linki o tym samym imageSrcSet, gubiąc przy tym warunek).
  preloadHero(desktop.props, images.hasMobile ? DESKTOP_MEDIA : undefined);
  if (images.hasMobile) preloadHero(mobile.props, MOBILE_MEDIA);

  return (
    <picture>
      {/* `sizes` MUSI stać przy <source>: gdy warunek media pasuje, przeglądarka
          czyta sizes z <source>, a nie z <img>. Bez niego przyjmowała domyślne
          100vw i na telefonie brała kadr 750 px zamiast 640 px — a od czasu
          preloadu (który liczy sizes poprawnie) pobierała OBA. */}
      <source
        media={MOBILE_MEDIA}
        srcSet={mobile.props.srcSet ?? mobile.props.src}
        sizes={mobile.props.sizes}
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
