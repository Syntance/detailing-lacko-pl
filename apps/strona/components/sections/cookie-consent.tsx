"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useConsent, useConsentOpenListener } from "@moduly/legal-consent";

type Mode = "hidden" | "banner" | "preferences";

/**
 * Ciastko rysowane ręcznie w języku makiety „kreskówka" (twarda kreska 3px,
 * żółte wypełnienie, ink jako okruchy) — zamiast ikony ze stocka. Nadgryzienie
 * robi maska, żeby brzeg ugryzienia miał tę samą kreskę co reszta.
 */
function Ciastko() {
  return (
    <svg
      viewBox="0 0 44 44"
      className="size-11 shrink-0 -rotate-6"
      aria-hidden
      focusable="false"
    >
      <mask id="ciastko-nadgryzienie">
        <rect width="44" height="44" fill="white" />
        <circle cx="40" cy="8" r="8" fill="black" />
      </mask>
      <g mask="url(#ciastko-nadgryzienie)">
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="var(--zolty)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
      </g>
      {/* Kreska wzdłuż nadgryzienia — domyka kontur po odjęciu koła maską. */}
      <path
        d="M 33.9 12.6 A 8 8 0 0 1 32.6 3.7"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17" r="2.6" fill="var(--ink)" />
      <circle cx="27" cy="26" r="2.2" fill="var(--ink)" />
      <circle cx="15" cy="28" r="1.8" fill="var(--ink)" />
    </svg>
  );
}

/**
 * Przycisk banera — kreskówkowy klawisz: twarda kreska, offsetowy cień i
 * podskok w hover. `glowny` tylko zmienia wypełnienie na żółte; geometria
 * wszystkich trzech jest identyczna (patrz komentarz przy grupie przycisków).
 */
function Klawisz({
  onClick,
  glowny,
  children,
}: {
  onClick: () => void;
  glowny?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cien-3 inline-flex min-h-11 items-center justify-center rounded-xl border-[3px] border-ink px-4 py-2.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none active:translate-y-0 motion-reduce:transition-none ${
        glowny ? "bg-zolty" : "bg-background"
      }`}
    >
      {children}
    </button>
  );
}

/** Checkbox kategorii zgody — kwadrat z twardą kreską, żółty po zaznaczeniu. */
function ConsentCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      // `before:-inset-2.5` powiększa pole kliknięcia do ~44px bez zmiany
      // wyglądu kwadratu — sam kwadrat ma 24px, czyli minimum WCAG 2.2, a to
      // za mało na wygodne trafienie kciukiem.
      className={`relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border-[3px] border-ink transition-colors before:absolute before:-inset-2.5 before:content-[''] focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none ${
        checked ? "bg-zolty" : "bg-background hover:bg-piasek"
      }`}
    >
      {checked ? (
        <Check className="size-3.5 text-ink" strokeWidth={4} aria-hidden />
      ) : null}
    </button>
  );
}

/** Wiersz kategorii w ustawieniach — przerywana kreska jak w kartach cennika. */
function KategoriaWiersz({
  nazwa,
  opis,
  kontrolka,
}: {
  nazwa: string;
  opis: string;
  kontrolka: React.ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-4 border-t-2 border-dashed border-kreska p-4 first:border-t-0">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold">{nazwa}</p>
        <p className="text-[13px] leading-[1.5] text-pretty text-tekst">
          {opis}
        </p>
      </div>
      {kontrolka}
    </li>
  );
}

/**
 * Baner cookies w języku makiety „kreskówka": naklejka z twardą kreską 3px,
 * żółtym offsetowym cieniem i lekkim przekrzywieniem, ręcznie rysowanym
 * ciastkiem zamiast ikony ze stocka. Logika/storage bez zmian — ten sam hook
 * useConsent() z @moduly/legal-consent.
 *
 * Trzy równorzędne przyciski (zgoda / odmowa / ustawienia) o identycznej
 * geometrii to wymóg, nie decyzja estetyczna: prawo telekomunikacyjne art. 173
 * i DSA zakazują dark patternów, a „Ustawienia" jako drobny link pod spodem
 * (tak było wcześniej) demotuje wybór inny niż zgoda.
 *
 * Panel jest w scrollowalnym kontenerze (nie sztywnym `fixed bottom-0`), żeby
 * na niskich viewportach nigdy nie obcinał przycisków poza ekran, i nie blokuje
 * przewijania strony (`pointer-events` tylko na samej naklejce).
 */
export function CookieConsent() {
  const { consent, hasDecision, acceptAll, rejectAll, saveSelection, config } =
    useConsent();

  const [mode, setMode] = useState<Mode>("hidden");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [canShow, setCanShow] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const delayTimer = setTimeout(() => setCanShow(true), 2000);
    return () => clearTimeout(delayTimer);
  }, []);

  useEffect(() => {
    if (!canShow) return;
    if (!hasDecision) {
      setMode("banner");
    } else if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [canShow, consent, hasDecision]);

  const openPreferences = useCallback(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
    setMode("preferences");
  }, [consent]);

  useConsentOpenListener(openPreferences);

  const persist = useCallback(
    (next: { analytics: boolean; marketing: boolean }) => {
      saveSelection(next);
      setMode("hidden");
    },
    [saveSelection],
  );

  const handleAcceptAll = useCallback(() => {
    acceptAll();
    setMode("hidden");
  }, [acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll();
    setMode("hidden");
  }, [rejectAll]);

  const open = canShow && mode !== "hidden";

  return (
    <AnimatePresence>
      {open ? (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:p-6">
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            initial={reduced ? undefined : { opacity: 0, y: 28 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 28 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            // p-5 to zapas na obwódkę (7px) + żółty cień, który schodzi o kolejne
            // 7px w dół i w prawo, plus na to, co przekrzywienie wypycha poza
            // obrys — kontener scrolluje, więc `overflow` przyciąłby resztę.
            className="pointer-events-auto max-h-full w-full max-w-3xl overflow-y-auto p-5"
          >
            {/* Przekrzywienie tylko dla banera: naklejka. Ustawienia to dłuższy
                formularz — tam karta siada prosto, żeby nie utrudniać czytania.
                Transform siedzi tu, a nie w motion, więc przetrwa reduced-motion. */}
            <div
              className={`cien-naklejka rounded-2xl border-[3px] border-ink bg-background p-5 sm:p-6 ${
                mode === "banner" ? "-rotate-[0.5deg]" : ""
              }`}
            >
              {mode === "banner" ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-7">
                  <div className="flex max-w-xl gap-4">
                    <Ciastko />
                    <div className="flex flex-col gap-1.5">
                      <h2
                        id="cookie-consent-title"
                        className="text-xl leading-[1.15] font-bold"
                      >
                        Ciasteczka w {config.siteName}
                      </h2>
                      <p className="text-sm leading-[1.5] text-pretty text-tekst">
                        Używamy plików cookie, żeby strona działała poprawnie, a
                        za Twoją zgodą — także do analizy ruchu. Możesz
                        zaakceptować wszystkie albo wybrać tylko te, których
                        potrzebujesz.{" "}
                        <Link
                          href={config.privacyPolicyHref}
                          className="font-semibold text-ink underline decoration-zolty decoration-[3px] underline-offset-2 hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none"
                        >
                          Polityka prywatności
                        </Link>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Trzy klawisze o identycznej geometrii — patrz komentarz
                      nad komponentem (art. 173 prawa telekom. + DSA). */}
                  <div className="flex flex-col gap-2.5 sm:w-56 sm:shrink-0">
                    <Klawisz onClick={handleAcceptAll} glowny>
                      Akceptuję wszystkie
                    </Klawisz>
                    <Klawisz onClick={handleRejectAll}>Tylko niezbędne</Klawisz>
                    <Klawisz onClick={() => setMode("preferences")}>
                      Ustawienia
                    </Klawisz>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <Ciastko />
                    <div className="flex flex-col gap-1.5">
                      <h2
                        id="cookie-consent-title"
                        className="text-xl leading-[1.15] font-bold"
                      >
                        Ustawienia cookies
                      </h2>
                      <p className="text-sm leading-[1.5] text-tekst">
                        Wybierz kategorie, na które wyrażasz zgodę.
                      </p>
                    </div>
                  </div>

                  <ul className="flex flex-col rounded-xl border-[3px] border-ink">
                    <KategoriaWiersz
                      nazwa="Niezbędne"
                      opis="Wymagane do działania strony i bezpieczeństwa. Nie można wyłączyć."
                      kontrolka={
                        <span className="etykieta-sm mt-1 rounded-full bg-ink px-2.5 py-[5px] whitespace-nowrap text-zolty">
                          zawsze aktywne
                        </span>
                      }
                    />
                    <KategoriaWiersz
                      nazwa="Analityka"
                      opis={config.analyticsDescription}
                      kontrolka={
                        <ConsentCheckbox
                          checked={analytics}
                          onCheckedChange={setAnalytics}
                          ariaLabel="Zgoda na analitykę"
                        />
                      }
                    />
                    <KategoriaWiersz
                      nazwa="Marketing"
                      opis={config.marketingDescription}
                      kontrolka={
                        <ConsentCheckbox
                          checked={marketing}
                          onCheckedChange={setMarketing}
                          ariaLabel="Zgoda na marketing"
                        />
                      }
                    />
                  </ul>

                  <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <Klawisz onClick={handleRejectAll}>Odrzuć wszystko</Klawisz>
                    <Klawisz onClick={() => persist({ analytics, marketing })}>
                      Zapisz wybór
                    </Klawisz>
                    <Klawisz onClick={handleAcceptAll} glowny>
                      Akceptuję wszystkie
                    </Klawisz>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
