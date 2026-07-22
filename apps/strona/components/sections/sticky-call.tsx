"use client";

import { useEffect, useState } from "react";
import { Camera, Phone } from "lucide-react";
import { trackPhoneClick, trackPhotoClick } from "@/lib/track";

/**
 * Sticky pasek na mobile — przez całą stronę (plan www v2, UX): dwa CTA,
 * zdjęcie pierwsze, telefon drugi. Pojawia się po przescrollowaniu hero
 * (tam te same CTA są już na ekranie).
 */
export function StickyCall({
  phoneE164,
  phoneDisplay,
  photoHref,
}: {
  phoneE164: string;
  phoneDisplay: string;
  photoHref: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setVisible(!(entry?.isIntersecting ?? false)),
      { threshold: 0.2 },
    );
    heroObserver.observe(hero);
    return () => heroObserver.disconnect();
  }, []);

  const photoExternal = photoHref.startsWith("http");

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      } transition-[transform,opacity] duration-300 motion-reduce:transition-none`}
    >
      <a
        href={photoHref}
        onClick={() => trackPhotoClick("sticky")}
        {...(photoExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-black/40"
      >
        <Camera className="size-5" aria-hidden />
        Wyślij zdjęcie
      </a>
      <a
        href={`tel:${phoneE164}`}
        onClick={() => trackPhoneClick("sticky")}
        aria-label={`Zadzwoń: ${phoneDisplay}`}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3.5 text-base font-semibold shadow-lg shadow-black/40"
      >
        <Phone className="size-5" aria-hidden />
        Zadzwoń
      </a>
    </div>
  );
}
