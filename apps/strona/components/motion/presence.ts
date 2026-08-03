"use client";

import { useEffect, useState } from "react";

/**
 * Odpowiednik `<AnimatePresence>` dla pojedynczego elementu: trzyma go w DOM
 * przez czas animacji wyjścia i dopiero potem odmontowuje.
 *
 * Zwraca `mounted` (czy renderować) i `state` (do `data-state`, na którym
 * opierają się klasy `.presence` w globals.css). `state` jest liczony wprost
 * z `open`, bez pośredniego stanu — animacja wejścia to `@keyframes`, a nie
 * `transition`, więc odpala się już przy zamontowaniu elementu i nie
 * potrzebuje klatki na „stan przed".
 *
 * @param open   czy element ma być widoczny
 * @param exitMs długość animacji wyjścia — MUSI zgadzać się z `presence-out`
 *               w globals.css, inaczej element zniknie w połowie animacji
 *               albo zostanie w DOM dłużej, niż widać.
 */
export function usePresence(
  open: boolean,
  exitMs: number,
): { mounted: boolean; state: "in" | "out" } {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, state: open ? "in" : "out" };
}
