"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import { PhoneLink } from "./phone-link";

const NAV_ITEMS = [
  { href: "#cennik", id: "cennik", label: "Cennik" },
  { href: "#metamorfozy", id: "metamorfozy", label: "Efekty" },
  { href: "#proces", id: "proces", label: "Jak pracujemy" },
  { href: "#faq", id: "faq", label: "FAQ" },
  { href: "#kontakt", id: "kontakt", label: "Kontakt" },
] as const;

/**
 * Sticky navbar one-page: przezroczysty nad hero, po scrollu biały z blur.
 * Kotwice do sekcji z podświetleniem aktywnej (IntersectionObserver) i CTA
 * telefon (główna konwersja) — TYLKO na desktopie. Na mobile (< md) navbar
 * to samo logo: nawigacją telefonu jest stały dolny pasek akcji (BottomBar),
 * hamburger celowo nie istnieje.
 */
export function Navbar({ kontakt }: { kontakt: KontaktData }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) =>
      document.getElementById(item.id),
    ).filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Przezroczysty navbar leży na full-bleed hero, który ma ciemny scrim —
  // wtedy tekst musi być jasny. Po scrollu tło robi się jasne, więc wraca
  // ciemna typografia. Jeden warunek steruje obiema warstwami.
  const solid = scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 motion-reduce:transition-none ${
        solid
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* Ta sama klatka co hero (stage 120rem + --hero-inset), więc logo stoi
          dokładnie nad H1. Poniżej lg hero ma układ mobilny z px-5 — navbar
          schodzi na tę samą oś. */}
      <div className="mx-auto flex h-16 max-w-[120rem] items-center justify-between gap-4 px-5 lg:px-[var(--hero-inset)]">
        <a
          href="#hero"
          className={`flex items-center rounded-lg focus-visible:ring-3 focus-visible:outline-none ${
            solid ? "focus-visible:ring-ring/50" : "focus-visible:ring-hero-foreground/60"
          }`}
          aria-label="Detailing Łącko — początek strony"
        >
          <span
            className={`font-serif text-lg leading-none font-medium ${
              solid ? "text-foreground" : "text-hero-foreground"
            }`}
          >
            Detailing Łącko
          </span>
        </a>

        <nav
          aria-label="Główna nawigacja"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none ${
                  solid
                    ? `focus-visible:ring-ring/50 ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    : `focus-visible:ring-hero-foreground/60 ${
                        isActive
                          ? "text-hero-foreground"
                          : "text-hero-muted hover:text-hero-foreground"
                      }`
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <PhoneLink
            phoneE164={kontakt.phoneE164}
            section="navbar"
            className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none sm:inline-flex"
            ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
          >
            <Phone className="size-4" aria-hidden />
            {kontakt.phoneDisplay}
          </PhoneLink>

        </div>
      </div>
    </header>
  );
}
