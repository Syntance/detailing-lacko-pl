import { z } from "zod";

/**
 * Galeria realizacji — pojedyncze zdjęcia w siatce (lightbox po kliknięciu).
 * Edycja: panel Magazyn → Galeria. Storage: `site_blobs`, klucz `galeria`.
 * Zdjęcia: URL z uploadu CMS (R2) albo /images/galeria/* z repo.
 */
export const galeriaPhotoSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  /**
   * Zdjęcie „przed" — gdy ustawione, kafelek renderuje suwak porównawczy
   * przed/po (plan www v2 §3). Puste = zwykłe zdjęcie z lightboxem.
   */
  beforeUrl: z.string().optional(),
  /**
   * Podpis wg formuły: problem + wieś + cena + czas, np.
   * „Kanapa po psie — Zabrzeż, 300 zł, 3 h pracy" (dowód efektu i lokalności).
   */
  caption: z.string(),
  alt: z.string(),
  order: z.number().int(),
  disabled: z.boolean(),
});

export const galeriaDataSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string(),
  photos: z.array(galeriaPhotoSchema),
});

export type GaleriaPhoto = z.infer<typeof galeriaPhotoSchema>;
export type GaleriaData = z.infer<typeof galeriaDataSchema>;

export const DEFAULT_GALERIA: GaleriaData = {
  heading: "Efekty — zobacz różnicę",
  subheading:
    "Auta naszych klientów, bez retuszu. Każda realizacja dostaje zdjęcia przed i po.",
  photos: [
    {
      id: "kanapa",
      url: "/images/galeria/kanapa.jpg",
      caption: "Kanapa po kompleksowym czyszczeniu wnętrza",
      alt: "pranie tapicerki Łącko — kanapa po czyszczeniu",
      order: 0,
      disabled: false,
    },
    {
      id: "fotel",
      url: "/images/galeria/fotel.jpg",
      caption: "Fotel kierowcy po praniu tapicerki",
      alt: "pranie tapicerki Łącko — fotel po czyszczeniu",
      order: 1,
      disabled: false,
    },
    {
      id: "lakier",
      url: "/images/galeria/lakier.jpg",
      caption: "Maska po polerowaniu one step",
      alt: "polerowanie lakieru Łącko — maska po polerowaniu",
      order: 2,
      disabled: false,
    },
    {
      id: "reflektor",
      url: "/images/galeria/reflektor.jpg",
      caption: "Reflektory po polerowaniu",
      alt: "polerowanie reflektorów Łącko — po renowacji",
      order: 3,
      disabled: false,
    },
    {
      id: "dywanik",
      url: "/images/galeria/dywanik.jpg",
      caption: "Wykładzina i dywaniki po praniu",
      alt: "czyszczenie wnętrza auta Łącko — wykładzina po praniu",
      order: 4,
      disabled: false,
    },
    {
      id: "felga",
      url: "/images/galeria/felga.jpg",
      caption: "Felgi po dekontaminacji i myciu",
      alt: "mycie detailingowe Łącko — felga po czyszczeniu",
      order: 5,
      disabled: false,
    },
  ],
};
