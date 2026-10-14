import { z } from "zod";

/**
 * Teksty mini-stron wyboru /mapy (wizytówki Google) i /strony (strona
 * detailingu albo wulkanizacji) — edytowane w Magazyn → CMS, blob
 * `wybor-linii`. Linki kart są w kodzie (lib/wizytowki.ts, ADRES_LINII);
 * z panelu zmienia się tylko treść. Pola przyjmują dynamiczne elementy
 * ({telefon}, {cena:…}), rozwijane przy renderze strony.
 */

const tekstKarty = z.object({
  opis: z.string().trim().min(1, "Opis karty jest wymagany").max(200),
});

export const stronaWyboruSchema = z.object({
  tytul: z.string().trim().min(1, "Nagłówek jest wymagany").max(80),
  opis: z.string().trim().max(240),
  karty: z.object({ detailing: tekstKarty, wulkanizacja: tekstKarty }),
});

export const wyborLiniiSchema = z.object({
  mapy: stronaWyboruSchema,
  strony: stronaWyboruSchema,
});

export type StronaWyboru = z.infer<typeof stronaWyboruSchema>;
export type WyborLiniiData = z.infer<typeof wyborLiniiSchema>;
export type StronaWyboruId = keyof WyborLiniiData;

/** Domyślne teksty = to, co strony pokazywały, zanim trafiły do CMS. */
export const DEFAULT_WYBOR_LINII: WyborLiniiData = {
  mapy: {
    tytul: "Która wizytówka?",
    opis: "Opinie, zdjęcia i dojazd — wybierz, której usługi szukasz.",
    karty: {
      detailing: { opis: "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru." },
      wulkanizacja: { opis: "Wymiana i naprawa opon, wyważanie kół, przechowywanie." },
    },
  },
  strony: {
    tytul: "Na którą stronę?",
    opis: "Dwie usługi pod jednym adresem — wybierz, czego potrzebujesz.",
    karty: {
      detailing: {
        opis: "Pranie tapicerki, czyszczenie wnętrza, polerowanie lakieru. Ceny z góry, rezerwacja online.",
      },
      wulkanizacja: { opis: "Wymiana i naprawa opon, wyważanie kół, przechowywanie. Ceny z góry." },
    },
  },
};

/** Ścieżki stron — do rewalidacji po zapisie i odsyłaczy „Podgląd" w panelu. */
export const SCIEZKI_WYBORU: Record<StronaWyboruId, string> = {
  mapy: "/mapy",
  strony: "/strony",
};
