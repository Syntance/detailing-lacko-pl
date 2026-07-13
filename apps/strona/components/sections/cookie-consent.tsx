"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Switch } from "@moduly/ui";
import { Cookie, Settings2 } from "lucide-react";
import {
  useConsent,
  useConsentOpenListener,
} from "@moduly/legal-consent";

type Mode = "hidden" | "banner" | "preferences";

/**
 * Baner cookies przemalowany pod markę Detailing Łącko — ten sam hook
 * useConsent() z @moduly/legal-consent (logika/storage bez zmian), ale
 * własny markup: żółty akcent, karty spójne z resztą strony.
 *
 * Panel jest w scrollowalnym kontenerze (nie sztywnym `fixed bottom-0`),
 * żeby na niskich viewportach (małe okno, telefon poziomo) nigdy nie obcinał
 * przycisków poza ekran — w oryginalnym komponencie to się zdarzało.
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
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:p-6"
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            initial={reduced ? undefined : { opacity: 0, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="pointer-events-auto max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10 sm:p-6"
          >
            {mode === "banner" ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex max-w-xl gap-3.5">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-strong">
                    <Cookie className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h2
                      id="cookie-consent-title"
                      className="font-serif text-lg font-medium"
                    >
                      Ciasteczka w {config.siteName}
                    </h2>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      Używamy plików cookie, żeby strona działała poprawnie,
                      a za Twoją zgodą — także do analizy ruchu. Możesz
                      zaakceptować wszystkie albo wybrać tylko te, których
                      potrzebujesz.{" "}
                      <Link
                        href={config.privacyPolicyHref}
                        className="text-primary-strong underline-offset-2 hover:underline"
                      >
                        Polityka prywatności
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:w-52 sm:shrink-0">
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
                  >
                    Akceptuję wszystkie
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    Tylko niezbędne
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("preferences")}
                    className="inline-flex items-center justify-center gap-1.5 py-1 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase underline-offset-4 hover:text-foreground hover:underline"
                  >
                    <Settings2 className="size-3.5" aria-hidden />
                    Ustawienia
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2
                  id="cookie-consent-title"
                  className="font-serif text-lg font-medium"
                >
                  Ustawienia cookies
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wybierz kategorie, na które wyrażasz zgodę.
                </p>

                <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
                  <li className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-semibold">Niezbędne</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Wymagane do działania strony i bezpieczeństwa. Nie
                        można wyłączyć.
                      </p>
                    </div>
                    <span className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      zawsze aktywne
                    </span>
                  </li>

                  <li className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-semibold">Analityka</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {config.analyticsDescription}
                      </p>
                    </div>
                    <Switch
                      checked={analytics}
                      onCheckedChange={setAnalytics}
                      aria-label="Zgoda na analitykę"
                      className="mt-1"
                    />
                  </li>

                  <li className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-semibold">Marketing</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {config.marketingDescription}
                      </p>
                    </div>
                    <Switch
                      checked={marketing}
                      onCheckedChange={setMarketing}
                      aria-label="Zgoda na marketing"
                      className="mt-1"
                    />
                  </li>
                </ul>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    Odrzuć wszystko
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ analytics, marketing })}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    Zapisz wybór
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
                  >
                    Akceptuję wszystkie
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
