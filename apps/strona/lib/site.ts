import "server-only";

import { z } from "zod";

/**
 * Dane kontaktowe / NAP firmy — jedno źródło prawdy dla sekcji Kontakt,
 * JSON-LD LocalBusiness, metadanych i sticky CTA. Edytowalne w panelu
 * Magazyn → Dane firmy (przechowywane w `site_blobs`, klucz `kontakt`).
 */
export const kontaktSchema = z.object({
  phoneDisplay: z.string().min(1),
  phoneE164: z.string().regex(/^\+[0-9]{9,15}$/),
  messengerUrl: z.string().url().or(z.literal("")),
  email: z.string().email(),
  addressLine: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  /** Obsługiwane miejscowości — separator "·" na stronie. */
  serviceAreas: z.array(z.string().min(1)).min(1),
  hoursNote: z.string().min(1),
  /** 0 = brak dojazdu do klienta (obecnie usługa tylko stacjonarna). */
  freeTravelKm: z.number().int().min(0),
  nip: z.string(),
  googleReviewUrl: z.string().url().or(z.literal("")),
  googleMapsUrl: z.string().url().or(z.literal("")),
  latitude: z.number(),
  longitude: z.number(),
});

export type KontaktData = z.infer<typeof kontaktSchema>;

export const DEFAULT_KONTAKT: KontaktData = {
  phoneDisplay: "662 519 544",
  phoneE164: "+48662519544",
  messengerUrl: "",
  email: "kontakt@detailing-lacko.pl",
  addressLine: "Czerniec 72",
  postalCode: "33-390",
  city: "Łącko",
  serviceAreas: [
    "Łącko",
    "Czerniec",
    "Stary Sącz",
    "Podegrodzie",
    "Nowy Sącz",
    "Ochotnica",
    "Krościenko",
  ],
  hoursNote: "popołudnia i weekendy",
  freeTravelKm: 0,
  nip: "",
  googleReviewUrl: "",
  googleMapsUrl: "https://maps.google.com/?q=Czerniec+72,+33-390+Łącko",
  latitude: 49.5606,
  longitude: 20.4472,
};
