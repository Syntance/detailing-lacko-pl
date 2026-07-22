"use client";

import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import { PhoneLink } from "./phone-link";

const NAV_ITEMS = [
  { href: "#cennik", id: "cennik", label: "Cennik" },
  { href: "#galeria", id: "galeria", label: "Efekty" },
  { href: "#proces", id: "proces", label: "Jak pracujemy" },
  { href: "#faq", id: "faq", label: "FAQ" },
  { href: "#kontakt", id: "kontakt", label: "Kontakt" },
] as const;

/**
 * Sticky navbar one-page: przezroczysty nad hero, po scrollu biały z blur.
 * Kotwice do sekcji z podświetleniem aktywnej (IntersectionObserver),
 * CTA telefon (główna konwersja) i menu mobilne (hamburger).
 */
export function Navbar({ kontakt }: { kontakt: KontaktData }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 motion-reduce:transition-none ${
        scrolled || open
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <a
          href="#hero"
          onClick={() => setOpen(false)}
          className="flex items-center rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Detailing Łącko — początek strony"
        >
          <span className="font-serif text-lg leading-none font-medium">
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
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      >
        <nav
          aria-label="Nawigacja mobilna"
          className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-4"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active === item.id ? "true" : undefined}
              className={`rounded-lg px-3 py-3 text-base font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                active === item.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </a>
          ))}
          <PhoneLink
            phoneE164={kontakt.phoneE164}
            section="navbar-mobile"
            className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            ariaLabel={`Zadzwoń: ${kontakt.phoneDisplay}`}
          >
            <Phone className="size-5" aria-hidden />
            Zadzwoń: {kontakt.phoneDisplay}
          </PhoneLink>
        </nav>
      </div>
    </header>
  );
}
