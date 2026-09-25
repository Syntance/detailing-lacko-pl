"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useConsent } from "@moduly/legal-consent";

/**
 * Podgląd mapy Google z pinezką w karcie hero. Osadzenie Google Maps ustawia
 * ciasteczka podmiotu trzeciego, więc ładuje się samo dopiero po zgodzie na
 * marketing; bez niej jest placeholder z przyciskiem (świadome kliknięcie).
 */
export function HeroMapa({
  adres,
  mapsUrl,
}: {
  adres: string;
  mapsUrl: string;
}) {
  const { consent } = useConsent();
  const [klikniete, setKlikniete] = useState(false);
  const zaladuj = Boolean(consent?.marketing) || klikniete;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-piasek">
      {zaladuj ? (
        <iframe
          title={`Mapa: ${adres}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(adres)}&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="kropki absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <MapPin
            aria-hidden
            className="size-12 fill-akcent stroke-ink"
            strokeWidth={2.5}
          />
          <p className="text-[15px] font-semibold">{adres}</p>
          <button
            type="button"
            onClick={() => setKlikniete(true)}
            className="rounded-xl border-[3px] border-ink bg-background px-4 py-2 text-sm font-semibold focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
          >
            Pokaż mapę Google
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="etykieta text-muted-foreground underline underline-offset-2"
          >
            albo otwórz w Mapach
          </a>
        </div>
      )}
    </div>
  );
}
