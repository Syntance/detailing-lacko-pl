"use client";

import { Camera, CircleDollarSign, Phone } from "lucide-react";
import { trackPhoneClick, trackPhotoClick } from "@/lib/track";

/**
 * Mobilna nawigacja akcji — stały dolny pasek (< lg) zamiast hamburgera:
 * trzy rzeczy, które klient chce zrobić na telefonie, zawsze pod kciukiem.
 * Środkowy przycisk (Wyślij zdjęcie) jest głównym CTA całej strony, więc
 * dostaje kolor primary i największą szerokość. Desktop nie ma paska —
 * tam CTA żyją w hero i sekcjach.
 *
 * Sekcje spoza paska (FAQ, kontakt) są osiągalne scrollem — to one-page.
 * Wysokość paska kompensuje padding-bottom w page.tsx (spacer), a treść
 * hero ma własny odstęp — pasek niczego nie zasłania na stałe.
 */
export function BottomBar({
  phoneE164,
  photoHref,
}: {
  phoneE164: string;
  photoHref: string;
}) {
  const photoExternal = photoHref.startsWith("http");

  return (
    <nav
      aria-label="Szybkie akcje"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-hero-scrim/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-2">
        <a
          href={`tel:${phoneE164}`}
          onClick={() => trackPhoneClick("bottombar")}
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-hero-foreground transition-colors active:bg-white/10"
        >
          <Phone className="size-5" aria-hidden />
          <span className="text-[11px] font-medium">Zadzwoń</span>
        </a>

        <a
          href={photoHref}
          onClick={() => trackPhotoClick("bottombar")}
          {...(photoExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="flex min-h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/30 active:scale-[0.98]"
        >
          <Camera className="size-5" aria-hidden />
          Wyślij zdjęcie
        </a>

        <a
          href="#cennik"
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-hero-foreground transition-colors active:bg-white/10"
        >
          <CircleDollarSign className="size-5" aria-hidden />
          <span className="text-[11px] font-medium">Cennik</span>
        </a>
      </div>
    </nav>
  );
}
