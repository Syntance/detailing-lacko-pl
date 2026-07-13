"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { trackPhoneClick } from "@/lib/track";

/**
 * Sticky „Zadzwoń" na mobile — przez całą stronę (brief). Pojawia się po
 * przescrollowaniu hero (tam CTA już jest), znika przy sekcji kontakt.
 */
export function StickyCall({
  phoneE164,
  phoneDisplay,
}: {
  phoneE164: string;
  phoneDisplay: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const kontakt = document.getElementById("kontakt");
    if (!hero) return;

    let heroInView = true;
    let kontaktInView = false;

    const update = () => setVisible(!heroInView && !kontaktInView);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroInView = entry?.isIntersecting ?? false;
        update();
      },
      { threshold: 0.2 },
    );
    heroObserver.observe(hero);

    let kontaktObserver: IntersectionObserver | undefined;
    if (kontakt) {
      kontaktObserver = new IntersectionObserver(
        ([entry]) => {
          kontaktInView = entry?.isIntersecting ?? false;
          update();
        },
        { threshold: 0.25 },
      );
      kontaktObserver.observe(kontakt);
    }

    return () => {
      heroObserver.disconnect();
      kontaktObserver?.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      } transition-[transform,opacity] duration-300 motion-reduce:transition-none`}
    >
      <a
        href={`tel:${phoneE164}`}
        onClick={() => trackPhoneClick("sticky")}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-black/40"
      >
        <Phone className="size-5" aria-hidden />
        Zadzwoń: {phoneDisplay}
      </a>
    </div>
  );
}
