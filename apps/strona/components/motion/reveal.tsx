"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Sygnaturowy reveal projektu: miękkie uniesienie + fade przy wejściu
 * w viewport (raz). Animujemy wyłącznie transform/opacity.
 *
 * Cała animacja siedzi w CSS (`.reveal`/`.reveal-item` w globals.css) — tutaj
 * zostaje wyłącznie IntersectionObserver, który przełącza `data-reveal`.
 * Wcześniej robił to `motion`: ~120 KB JS w bundlu homepage'a na przesunięcie
 * elementu o 28 px. Krzywa CSS jest wizualnym odpowiednikiem tamtego springa
 * i tą samą, której używa już `.hero-enter`, więc ruch na stronie się ujednolica.
 *
 * `prefers-reduced-motion` obsługuje media query w CSS, nie gałąź w JS —
 * dzięki temu reaguje na zmianę ustawienia bez ponownego renderu.
 */
function useRevealOnView<T extends HTMLElement>(rootMargin: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Brak IntersectionObserver (bardzo stare przeglądarki): pokazujemy od
    // razu. Lepiej bez animacji niż z treścią, która nigdy się nie pojawi.
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.reveal = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.dataset.reveal = "in";
          // Odpowiednik `viewport: { once: true }` — element nie chowa się
          // przy wyjściu z ekranu i nie animuje drugi raz.
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRevealOnView<HTMLDivElement>("-80px");

  return (
    <div ref={ref} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </div>
  );
}

/**
 * Kontener stagger dla kart — dzieci pojawiają się kolejno.
 *
 * Obserwowany jest sam kontener, a opóźnienia dzieci liczy CSS z `nth-child`.
 * Dzięki temu `RevealItem` nie musi znać swojego indeksu ani mieć własnego
 * observera — jeden na całą siatkę zamiast jednego na kartę.
 */
export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRevealOnView<HTMLDivElement>("-60px");

  return (
    <div
      ref={ref}
      className={className ? `reveal-stagger ${className}` : "reveal-stagger"}
    >
      {children}
    </div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `reveal-item ${className}` : "reveal-item"}>
      {children}
    </div>
  );
}
