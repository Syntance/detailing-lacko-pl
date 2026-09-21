/**
 * Polska odmiana przez liczbę: 1 karta / 2 karty / 5 kart (12–14 → „kart").
 * Czysta funkcja bez zależności — używają jej ekrany panelu po obu stronach.
 */
export function odmiana(
  n: number,
  jeden: string,
  kilka: string,
  wiele: string,
): string {
  if (n === 1) return jeden;
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  if (jednosci >= 2 && jednosci <= 4 && (dziesiatki < 12 || dziesiatki > 14)) {
    return kilka;
  }
  return wiele;
}
