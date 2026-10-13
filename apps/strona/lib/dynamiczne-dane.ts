import "server-only";

import { cache } from "react";
import { czyMaZnaczniki, wstawDynamiczne, type DaneDynamiczne } from "./dynamiczne";
import { getCennik, getCennikWulkanizacja, getKontakt } from "./site-data";

/**
 * Dane do rozwijania znaczników — cache() na czas jednego renderu, żeby
 * generateMetadata i strona nie czytały cenników dwa razy.
 */
export const getDaneDynamiczne = cache(async (): Promise<DaneDynamiczne> => {
  const [detailing, wulkanizacja, kontakt] = await Promise.all([
    getCennik(),
    getCennikWulkanizacja(),
    getKontakt(),
  ]);
  return { cenniki: { detailing, wulkanizacja }, kontakt };
});

/**
 * Funkcja rozwijająca znaczniki dla podanych tekstów. Gdy żaden tekst nie ma
 * znaczników, zwraca tożsamość i NIE czyta bazy — strona ze zwykłym tekstem
 * nie zależy wtedy od odczytu cenników.
 */
export async function rozwijacz(...teksty: string[]): Promise<(tekst: string) => string> {
  if (!teksty.some(czyMaZnaczniki)) return (tekst) => tekst;
  const dane = await getDaneDynamiczne();
  return (tekst) => wstawDynamiczne(tekst, dane);
}

/** FAQ z rozwiniętymi znacznikami — ta sama treść idzie do sekcji i do FAQPage w JSON-LD. */
export async function rozwinFaq<T extends { question: string; answer: string }>(items: T[]): Promise<T[]> {
  const r = await rozwijacz(...items.flatMap((i) => [i.question, i.answer]));
  return items.map((i) => ({ ...i, question: r(i.question), answer: r(i.answer) }));
}
