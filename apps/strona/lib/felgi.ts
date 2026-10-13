import { FELGI, type WpisFelg } from "./felgi-dane";

/**
 * Tabela doboru felg do druku — dane z normy ETRTO (lib/felgi-dane.ts).
 * W normie szerokość felgi zależy tylko od szerokości i profilu opony, więc
 * jeden wiersz = para szerokość/profil, a średnice zwijamy w zakresy.
 *
 * Plakat pokazuje ZAKRES PRAKTYCZNY: od felgi pomiarowej ETRTO do +0,5″
 * (o ile norma ją dopuszcza). Norma dopuszcza też węższe i szersze felgi,
 * ale na skrajach montaż bywa niemożliwy w praktyce — np. 245/45 R18
 * nie dał się założyć na dopuszczone 7,5J, dopiero na 8–8,5J.
 */

export type { WpisFelg };

export type ZakresPraktyczny = { od: number; do: number | null };

export function zakresPraktyczny(w: WpisFelg): ZakresPraktyczny {
  const wyzej = w.pomiarowa + 0.5;
  return { od: w.pomiarowa, do: w.felgi.includes(wyzej) ? wyzej : null };
}

/** Cale z przecinkiem: 6.5 → „6,5". */
export const cal = (n: number) => String(n).replace(".", ",");

/** Średnice zwinięte do zakresów: [13,14,15,17] → „13–15, 17". */
export function zakresySrednic(srednice: number[]): string {
  const czesci: string[] = [];
  let start = srednice[0];
  let poprzednia = start;
  for (const d of [...srednice.slice(1), Number.NaN]) {
    if (start === undefined || poprzednia === undefined) break;
    if (d === poprzednia + 1) {
      poprzednia = d;
      continue;
    }
    czesci.push(start === poprzednia ? `${start}` : `${start}–${poprzednia}`);
    start = d;
    poprzednia = d;
  }
  return czesci.join(", ");
}

/** Liczba rozmiarów opon na plakacie (norma + średnice spoza normy). */
export const LICZBA_ROZMIAROW = FELGI.reduce((s, w) => s + w.srednice.length + w.spozaNormy.length, 0);

/** Blok jednej szerokości w kolumnie; `ciagDalszy` = przeniesiony z poprzedniej kolumny. */
export type BlokFelg = { szerokosc: number; wiersze: WpisFelg[]; ciagDalszy: boolean };

export const KARTKI_FELG = 2;
export const KOLUMNY_FELG = 3;

/**
 * Kartki → kolumny → bloki. Wiersze dzielone po równo (najpierw na kartki,
 * potem na kolumny); szerokość może przejść do następnej kolumny z „cd.",
 * ale na nową kartkę przechodzi zawsze w całości.
 */
function zbudujUklad(): BlokFelg[][][] {
  const szerokosci = [...new Set(FELGI.map((w) => w.szerokosc))];
  const bloki = szerokosci.map((s) => FELGI.filter((w) => w.szerokosc === s));

  // Kartki: całe szerokości, zachłannie do średniej liczby wierszy.
  const kartki: WpisFelg[][] = [];
  let reszta = bloki;
  for (let i = KARTKI_FELG; i > 1; i--) {
    const cel = reszta.reduce((s, b) => s + b.length, 0) / i;
    const kartka: WpisFelg[] = [];
    while (reszta.length > i - 1) {
      const nastepny = reszta[0];
      if (!nastepny) break;
      if (kartka.length && Math.abs(kartka.length + nastepny.length - cel) > Math.abs(kartka.length - cel)) break;
      kartka.push(...nastepny);
      reszta = reszta.slice(1);
    }
    kartki.push(kartka);
  }
  kartki.push(reszta.flat());

  return kartki.map((wiersze) => {
    const naKolumne = Math.ceil(wiersze.length / KOLUMNY_FELG);
    return Array.from({ length: KOLUMNY_FELG }, (_, k) => {
      const kolumna = wiersze.slice(k * naKolumne, (k + 1) * naKolumne);
      const poprzedni = wiersze[k * naKolumne - 1];
      const wynik: BlokFelg[] = [];
      for (const w of kolumna) {
        const ostatni = wynik[wynik.length - 1];
        if (ostatni?.szerokosc === w.szerokosc) ostatni.wiersze.push(w);
        else
          wynik.push({
            szerokosc: w.szerokosc,
            wiersze: [w],
            ciagDalszy: wynik.length === 0 && poprzedni?.szerokosc === w.szerokosc,
          });
      }
      return wynik;
    });
  });
}

export const UKLAD_FELG: BlokFelg[][][] = zbudujUklad();

export function zakresKartki(kartka: BlokFelg[][]): string {
  const bloki = kartka.flat();
  return `${bloki[0]?.szerokosc ?? ""}–${bloki[bloki.length - 1]?.szerokosc ?? ""}`;
}
