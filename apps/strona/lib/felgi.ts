import { FELGI_ZRODLO } from "./felgi-dane";

/**
 * Tabela doboru felg w wersji do druku. Źródło ma 606 wierszy „rozmiar →
 * min / OK / maks", ale szerokość felgi zależy praktycznie tylko od
 * szerokości i profilu opony — średnica prawie nigdy jej nie zmienia.
 * Grupujemy więc szerokość/profil i zwijamy średnice do zakresów („R13–18"),
 * co daje ~170 wierszy zamiast 606, bez utraty żadnej informacji:
 * - średnica, dla której źródło podaje inne wartości, dostaje osobny,
 *   wyróżniony wiersz (`wyjatek`),
 * - drugi, inny wpis dla tego samego rozmiaru (165/65R15) też zostaje,
 * - identyczne duplikaty (285/35R22, 295/25R26) znikają — nic nie wnoszą.
 */

export type WartosciFelgi = { min: number; ok: number; max: number };

export type WierszFelgi = {
  profil: number;
  srednice: number[];
  felga: WartosciFelgi;
  /** Inne wartości niż główny wiersz tej szerokości/profilu. */
  wyjatek: boolean;
  uwagi: string[];
};

export type BlokFelg = { szerokosc: number; wiersze: WierszFelgi[] };

type Wpis = { szerokosc: number; profil: number; srednica: number; felga: WartosciFelgi };

const liczbaZ = (t: string) => Number(t.replace(",", "."));

function wczytaj(): Wpis[] {
  const widziane = new Set<string>();
  const wpisy: Wpis[] = [];
  for (const linia of FELGI_ZRODLO) {
    if (widziane.has(linia)) continue; // identyczny duplikat
    widziane.add(linia);
    const [opona = "", min = "", ok = "", max = ""] = linia.split(" ");
    const m = /^(\d+)\/(\d+)R(\d+)$/.exec(opona);
    if (!m) throw new Error(`Nieprawidłowy wpis tabeli felg: ${linia}`);
    wpisy.push({
      szerokosc: Number(m[1]),
      profil: Number(m[2]),
      srednica: Number(m[3]),
      felga: { min: liczbaZ(min), ok: liczbaZ(ok), max: liczbaZ(max) },
    });
  }
  return wpisy;
}

const klucz = (f: WartosciFelgi) => `${f.min}/${f.ok}/${f.max}`;

function zbuduj(): BlokFelg[] {
  const wpisy = wczytaj();
  const szerokosci = [...new Set(wpisy.map((w) => w.szerokosc))].sort((a, b) => a - b);
  return szerokosci.map((szerokosc) => {
    const profile = [...new Set(wpisy.filter((w) => w.szerokosc === szerokosc).map((w) => w.profil))].sort(
      (a, b) => a - b,
    );
    const wiersze = profile.flatMap((profil) => {
      const grupa = wpisy.filter((w) => w.szerokosc === szerokosc && w.profil === profil);
      const podgrupy = new Map<string, Wpis[]>();
      for (const w of grupa) podgrupy.set(klucz(w.felga), [...(podgrupy.get(klucz(w.felga)) ?? []), w]);
      // Główny wiersz = wartości dla największej liczby średnic.
      const posortowane = [...podgrupy.values()].sort(
        (a, b) => b.length - a.length || Math.min(...a.map((w) => w.srednica)) - Math.min(...b.map((w) => w.srednica)),
      );
      return posortowane.map((lista, i): WierszFelgi => {
        const felga = lista[0]?.felga ?? { min: 0, ok: 0, max: 0 };
        const srednice = lista.map((w) => w.srednica).sort((a, b) => a - b);
        const uwagi: string[] = [];
        if (felga.min > felga.ok) uwagi.push("min większe od OK — tak podaje źródło");
        const podwojne = srednice.filter((d) => posortowane.some((inna, j) => j !== i && inna.some((w) => w.srednica === d)));
        if (podwojne.length) uwagi.push(`dla R${podwojne.join(", R")} źródło podaje dwa różne wpisy`);
        return { profil, srednice, felga, wyjatek: i > 0, uwagi };
      });
    });
    return { szerokosc, wiersze };
  });
}

export const BLOKI_FELG: BlokFelg[] = zbuduj();

/** Liczba wpisów źródła po usunięciu identycznych duplikatów. */
export const LICZBA_ROZMIAROW = BLOKI_FELG.reduce(
  (s, b) => s + b.wiersze.reduce((t, w) => t + w.srednice.length, 0),
  0,
);

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

/**
 * Podział bloków (całych szerokości — nigdy nie dzielimy jednej szerokości)
 * na `n` części o możliwie równej liczbie wierszy. Zachłannie po kolei:
 * część zamyka się, gdy dołożenie bloku oddaliłoby ją od średniej bardziej
 * niż jej pozostawienie.
 */
export function podziel(bloki: BlokFelg[], n: number): BlokFelg[][] {
  const wiersze = (b: BlokFelg[]) => b.reduce((s, x) => s + x.wiersze.length, 0);
  const czesci: BlokFelg[][] = [];
  let reszta = [...bloki];
  for (let i = n; i > 1; i--) {
    const cel = wiersze(reszta) / i;
    const czesc: BlokFelg[] = [];
    while (reszta.length > i - 1) {
      const nastepny = reszta[0];
      if (!nastepny) break;
      const teraz = wiersze(czesc);
      const po = teraz + nastepny.wiersze.length;
      if (czesc.length && Math.abs(po - cel) > Math.abs(teraz - cel)) break;
      czesc.push(nastepny);
      reszta = reszta.slice(1);
    }
    czesci.push(czesc);
  }
  czesci.push(reszta);
  return czesci;
}

export const KARTKI_FELG = 3;

/** Blok w kolumnie — `ciagDalszy` = druga część szerokości przeniesionej z poprzedniej kolumny. */
export type BlokKolumny = BlokFelg & { ciagDalszy: boolean };

/**
 * Dwie kolumny o równej liczbie wierszy. Szerokość może przejść do drugiej
 * kolumny (z dopiskiem „cd."), ale nigdy nie rozdzielamy profilu od jego
 * wierszy-wyjątków, żeby wyjątek nie wylądował bez kontekstu.
 */
function naKolumny(kartka: BlokFelg[]): BlokKolumny[][] {
  const wiersze = kartka.flatMap((b) => b.wiersze.map((w) => ({ szerokosc: b.szerokosc, w })));
  let ciecie = Math.ceil(wiersze.length / 2);
  while (ciecie < wiersze.length && wiersze[ciecie]?.w.wyjatek) ciecie++;
  const kolumny = [wiersze.slice(0, ciecie), wiersze.slice(ciecie)];
  return kolumny.map((lista, k) => {
    const bloki: BlokKolumny[] = [];
    for (const { szerokosc, w } of lista) {
      const ostatni = bloki[bloki.length - 1];
      if (ostatni?.szerokosc === szerokosc) ostatni.wiersze.push(w);
      else
        bloki.push({
          szerokosc,
          wiersze: [w],
          ciagDalszy: k === 1 && bloki.length === 0 && kolumny[0]?.[kolumny[0].length - 1]?.szerokosc === szerokosc,
        });
    }
    return bloki;
  });
}

/** Kartki → kolumny (2 na kartkę) → bloki szerokości. */
export const UKLAD_FELG: BlokKolumny[][][] = podziel(BLOKI_FELG, KARTKI_FELG).map(naKolumny);

export function zakresKartki(kartka: BlokFelg[][]): string {
  const bloki = kartka.flat();
  return `${bloki[0]?.szerokosc ?? ""}–${bloki[bloki.length - 1]?.szerokosc ?? ""}`;
}
