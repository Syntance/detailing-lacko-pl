import { create } from "qrcode";
import type { WygladQr } from "./kody-qr";

/**
 * Geometria kodu QR jako ścieżki SVG — czysty TS (bez Reacta i DOM), żeby
 * ten sam kod rysował podgląd w panelu, eksport i test odczytu w Node.
 * Wszystkie kształty rysowane ZGODNIE z ruchem wskazówek zegara: moduły
 * łączone (metro, plusy) nakładają się w jednej ścieżce z fill-rule nonzero
 * i przeciwny kierunek wyciąłby w nich dziury.
 */

export type KsztaltModulu = WygladQr["ksztaltModulow"];
export type KsztaltOczka = WygladQr["ksztaltOczek"];
export type KsztaltSrodka = NonNullable<WygladQr["ksztaltSrodka"]>;

export type Rogi = [number, number, number, number];
type Sasiedzi = { g: boolean; d: boolean; l: boolean; p: boolean };

const f = (n: number) => Math.round(n * 1000) / 1000;

/** Prostokąt z osobnym promieniem każdego rogu (TL, TR, BR, BL). */
export function prostokat(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Rogi): string {
  return [
    `M${f(x + tl)} ${f(y)}`,
    `H${f(x + w - tr)}`,
    tr ? `A${tr} ${tr} 0 0 1 ${f(x + w)} ${f(y + tr)}` : "",
    `V${f(y + h - br)}`,
    br ? `A${br} ${br} 0 0 1 ${f(x + w - br)} ${f(y + h)}` : "",
    `H${f(x + bl)}`,
    bl ? `A${bl} ${bl} 0 0 1 ${f(x)} ${f(y + h - bl)}` : "",
    `V${f(y + tl)}`,
    tl ? `A${tl} ${tl} 0 0 1 ${f(x + tl)} ${f(y)}` : "",
    "Z",
  ].join("");
}

const r4 = (r: number): Rogi => [r, r, r, r];

function kolo(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)}Z`;
}

/** Wielokąt z punktów w jednostkach pola (0–1), przeskalowany do `bok`. */
function wielokat(x: number, y: number, bok: number, punkty: [number, number][]): string {
  return `${punkty.map(([px, py], i) => `${i ? "L" : "M"}${f(x + px * bok)} ${f(y + py * bok)}`).join("")}Z`;
}

const OSMIOKAT: [number, number][] = [
  [0.29, 0], [0.71, 0], [1, 0.29], [1, 0.71], [0.71, 1], [0.29, 1], [0, 0.71], [0, 0.29],
];
const ROMB: [number, number][] = [
  [0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5],
];
const PLUS = (a: number, b: number): [number, number][] => [
  [a, 0], [b, 0], [b, a], [1, a], [1, b], [b, b], [b, 1], [a, 1], [a, b], [0, b], [0, a], [a, a],
];
const KRZYZYK: [number, number][] = [
  [0, 0.17], [0.17, 0], [0.5, 0.33], [0.83, 0], [1, 0.17], [0.67, 0.5],
  [1, 0.83], [0.83, 1], [0.5, 0.67], [0.17, 1], [0, 0.83], [0.33, 0.5],
];
const GWIAZDA: [number, number][] = Array.from({ length: 10 }, (_, i) => {
  const kat = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 === 0 ? 0.56 : 0.25;
  return [0.5 + r * Math.cos(kat), 0.54 + r * Math.sin(kat)];
});

function iskra(x: number, y: number): string {
  // Czteroramienna gwiazdka o wklęsłych bokach (krzywe kwadratowe).
  return `M${f(x + 0.5)} ${f(y)}Q${f(x + 0.62)} ${f(y + 0.38)} ${f(x + 1)} ${f(y + 0.5)}Q${f(x + 0.62)} ${f(y + 0.62)} ${f(x + 0.5)} ${f(y + 1)}Q${f(x + 0.38)} ${f(y + 0.62)} ${f(x)} ${f(y + 0.5)}Q${f(x + 0.38)} ${f(y + 0.38)} ${f(x + 0.5)} ${f(y)}Z`;
}

function serce(x: number, y: number): string {
  const p = (px: number, py: number) => `${f(x + px)} ${f(y + py)}`;
  return `M${p(0.5, 0.95)}C${p(0.12, 0.66)} ${p(0, 0.48)} ${p(0, 0.31)}C${p(0, 0.12)} ${p(0.16, 0.02)} ${p(0.3, 0.02)}C${p(0.4, 0.02)} ${p(0.47, 0.08)} ${p(0.5, 0.16)}C${p(0.53, 0.08)} ${p(0.6, 0.02)} ${p(0.7, 0.02)}C${p(0.84, 0.02)} ${p(1, 0.12)} ${p(1, 0.31)}C${p(1, 0.48)} ${p(0.88, 0.66)} ${p(0.5, 0.95)}Z`;
}

/** Jeden moduł w polu (x, y) o boku 1. `kwadrat` obsługuje osobno sciezkaModulow. */
function modul(k: KsztaltModulu, x: number, y: number, s: Sasiedzi): string {
  const z = 0.02; // zakładka między połączonymi modułami — bez szwów przy antyaliasingu
  switch (k) {
    case "odstepy":
      return prostokat(x + 0.09, y + 0.09, 0.82, 0.82, r4(0));
    case "zaokraglone":
      return prostokat(x + 0.05, y + 0.05, 0.9, 0.9, r4(0.28));
    case "drobne":
      return prostokat(x + 0.1, y + 0.1, 0.8, 0.8, r4(0.15));
    case "kropki":
      // Pełna średnica modułu: mniejsze kropki dekodery gubiły (test odczytu).
      return kolo(x + 0.5, y + 0.5, 0.5);
    case "male-kropki":
      return kolo(x + 0.5, y + 0.5, 0.42);
    case "plynne": {
      // Róg zaokrąglony tylko tam, gdzie oba sąsiednie boki są puste.
      const r = 0.5;
      return prostokat(x, y, 1, 1, [
        !s.g && !s.l ? r : 0,
        !s.g && !s.p ? r : 0,
        !s.d && !s.p ? r : 0,
        !s.d && !s.l ? r : 0,
      ]);
    }
    case "metro":
      return (
        kolo(x + 0.5, y + 0.5, 0.42) +
        (s.p ? prostokat(x + 0.5, y + 0.32, 1, 0.36, r4(0)) : "") +
        (s.d ? prostokat(x + 0.32, y + 0.5, 0.36, 1, r4(0)) : "")
      );
    case "pionowe": {
      const g = s.g ? -z : 0.05;
      const d = s.d ? 1 + z : 0.95;
      return prostokat(x + 0.1, y + g, 0.8, d - g, [s.g ? 0 : 0.4, s.g ? 0 : 0.4, s.d ? 0 : 0.4, s.d ? 0 : 0.4]);
    }
    case "poziome": {
      const l = s.l ? -z : 0.05;
      const p = s.p ? 1 + z : 0.95;
      return prostokat(x + l, y + 0.1, p - l, 0.8, [s.l ? 0 : 0.4, s.p ? 0 : 0.4, s.p ? 0 : 0.4, s.l ? 0 : 0.4]);
    }
    case "lisc":
      return prostokat(x, y, 1, 1, [0.5, 0, 0.5, 0]);
    case "romby":
      return wielokat(x, y, 1, ROMB);
    case "osmiokaty":
      return wielokat(x, y, 1, OSMIOKAT);
    case "plusy":
      return wielokat(x, y, 1, PLUS(0.3, 0.7));
    case "krzyzyki":
      return wielokat(x, y, 1, KRZYZYK);
    case "gwiazdki":
      return wielokat(x, y, 1, GWIAZDA);
    case "iskry":
      return iskra(x, y);
    case "serca":
      return serce(x, y);
    default:
      return prostokat(x, y, 1, 1, r4(0));
  }
}

/** Ścieżka wszystkich modułów dla funkcji `widoczny(x, y)` na siatce n×n. */
export function sciezkaModulow(
  widoczny: (x: number, y: number) => boolean,
  n: number,
  przesuniecie: number,
  k: KsztaltModulu,
): string {
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!widoczny(x, y)) continue;
      const px = x + przesuniecie;
      const py = y + przesuniecie;
      if (k === "kwadrat") {
        // Kwadraty łączone w poziome odcinki — mniej węzłów w ścieżce.
        let dl = 1;
        while (widoczny(x + dl, y)) dl++;
        d += `M${px} ${py}h${dl}v1h${-dl}Z`;
        x += dl - 1;
        continue;
      }
      d += modul(k, px, py, {
        g: widoczny(x, y - 1),
        d: widoczny(x, y + 1),
        l: widoczny(x - 1, y),
        p: widoczny(x + 1, y),
      });
    }
  }
  return d;
}

/**
 * Orientacja oczka: lewy górny (0), prawy górny (1), lewy dolny (2).
 * Kształty asymetryczne (liść, kropla) definiujemy dla lewego górnego
 * i odbijamy — „ostry" róg zawsze patrzy do środka kodu.
 */
type Orientacja = 0 | 1 | 2;
function obroc([tl, tr, br, bl]: Rogi, o: Orientacja): Rogi {
  if (o === 1) return [tr, tl, bl, br];
  if (o === 2) return [bl, br, tr, tl];
  return [tl, tr, br, bl];
}

const ROGI_RAMKI: Partial<Record<KsztaltOczka, [Rogi, Rogi]>> = {
  kwadrat: [r4(0), r4(0)],
  zaokraglone: [r4(2.2), r4(1.4)],
  miekkie: [r4(0.6), r4(1.6)],
  lisc: [[3, 0, 3, 0], [2, 0, 2, 0]],
  kropla: [[3, 3, 0, 3], [2, 2, 0, 2]],
};

/** Ramka oczka 7×7 (z otworem 5×5) — rysować z fill-rule evenodd. */
export function ramkaOczka(ex: number, ey: number, k: KsztaltOczka, o: Orientacja): string {
  switch (k) {
    case "kolo":
      return kolo(ex + 3.5, ey + 3.5, 3.5) + kolo(ex + 3.5, ey + 3.5, 2.5);
    case "osmiokat":
      return wielokat(ex, ey, 7, OSMIOKAT) + wielokat(ex + 1, ey + 1, 5, OSMIOKAT);
    case "kropki": {
      let d = "";
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6) d += kolo(ex + i + 0.5, ey + j + 0.5, 0.5);
        }
      }
      return d;
    }
    default: {
      const [zew, otw] = ROGI_RAMKI[k] ?? [r4(0), r4(0)];
      return prostokat(ex, ey, 7, 7, obroc(zew, o)) + prostokat(ex + 1, ey + 1, 5, 5, obroc(otw, o));
    }
  }
}

/** Środek oczka 3×3 zaczynający się w (sx, sy). */
export function srodekOczka(sx: number, sy: number, k: KsztaltSrodka, o: Orientacja): string {
  switch (k) {
    case "zaokraglony":
      return prostokat(sx, sy, 3, 3, r4(0.9));
    case "kolo":
      return kolo(sx + 1.5, sy + 1.5, 1.5);
    case "osmiokat":
      return wielokat(sx, sy, 3, OSMIOKAT);
    case "lisc":
      return prostokat(sx, sy, 3, 3, obroc([1.5, 0, 1.5, 0], o));
    case "kropla":
      return prostokat(sx, sy, 3, 3, obroc([1.5, 1.5, 0, 1.5], o));
    case "plus":
      return wielokat(sx, sy, 3, PLUS(0.28, 0.72));
    case "romb":
      return wielokat(sx - 0.25, sy - 0.25, 3.5, ROMB);
    case "kropki": {
      let d = "";
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) d += kolo(sx + i + 0.5, sy + j + 0.5, 0.5);
      return d;
    }
    // Paski stykają się (bez szczelin) — szczelina rozbijała wzorzec 1:1:3:1:1
    // i czytniki nie znajdowały oczka (test odczytu).
    case "poziome":
      return [0, 1, 2].map((i) => prostokat(sx, sy + i - 0.01, 3, 1.02, r4(0.5))).join("");
    case "pionowe":
      return [0, 1, 2].map((i) => prostokat(sx + i - 0.01, sy, 1.02, 3, r4(0.5))).join("");
    default:
      return prostokat(sx, sy, 3, 3, r4(0));
  }
}

/** Środek oczka dla zapisów sprzed wyboru środka — dopasowany do ramki. */
export function srodekEfektywny(w: WygladQr): KsztaltSrodka {
  if (w.ksztaltSrodka) return w.ksztaltSrodka;
  if (w.ksztaltOczek === "zaokraglone") return "zaokraglony";
  if (w.ksztaltOczek === "kolo") return "kolo";
  return "kwadrat";
}

/** Poziom korekcji faktycznie użyty — logo zasłania moduły, więc wymusza H. */
export function korekcjaEfektywna(w: WygladQr): WygladQr["korekcja"] {
  return w.logo ? "H" : w.korekcja;
}

/** Logo w układzie SVG (jednostka = moduł kodu, już z marginesem). */
export type LogoGeometria = {
  cx: number;
  cy: number;
  /** Wymiary obrazu przed obrotem. */
  w: number;
  h: number;
  /** Promienie rogów obrazu: lewy górny, prawy górny, prawy dolny, lewy dolny. */
  rogi: Rogi;
  /** Obrót w stopniach wokół środka. */
  obrot: number;
  /** Proporcje ustawione ręcznie → obraz wypełnia cały prostokąt; inaczej mieści się w kwadracie. */
  rozciagnij: boolean;
  /** Podkład (null = bez podkładu, moduły nie są wycinane); `rogi` = promienie TL, TR, BR, BL. */
  podklad: { w: number; h: number; rogi: Rogi } | null;
};

export type GeometriaQr = {
  bok: number;
  moduly: string;
  ramki: string;
  srodki: string;
  logo: LogoGeometria | null;
};

/**
 * Wymiary logo i podkładu z ustawień. Gwarancja czytelności: obwiednia
 * podkładu (po obrocie i zmianie proporcji) NIGDY nie przekracza kwadratu
 * o boku `bok + 1` modułów — tyle, ile zajmował podkład przed dodaniem tych
 * opcji i ile sprawdziliśmy testem odczytu. Gdy kształt się nie mieści,
 * całość jest skalowana w dół, a nie powiększa dziury w kodzie.
 */
function wymiaryLogo(n: number, w: WygladQr) {
  const bok = Math.round(n * w.rozmiarLogo);
  const p = w.logoProporcje ?? 1;
  let lw = p >= 1 ? bok : bok * p;
  let lh = p >= 1 ? bok / p : bok;
  const kat = (w.logoObrot * Math.PI) / 180;
  const c = Math.abs(Math.cos(kat));
  const s = Math.abs(Math.sin(kat));
  const luz = 1; // pół modułu podkładu z każdej strony
  let pw = lw + luz;
  let ph = lh + luz;
  let bw = pw * c + ph * s;
  let bh = pw * s + ph * c;
  const skala = Math.min(1, (bok + luz) / Math.max(bw, bh));
  lw *= skala;
  lh *= skala;
  pw *= skala;
  ph *= skala;
  bw *= skala;
  bh *= skala;
  return { lw, lh, pw, ph, bw, bh };
}

// Zaokrąglenie do tysięcznych — inaczej w ścieżce SVG lądują liczby w rodzaju 0.7000000000000001.
const zaokr = (r: number) => Math.round(r * 1000) / 1000;

/** Ustawienia rogów logo (0–1): własne albo wszystkie jak `logoZaokraglenie`. */
export function ustawieniaRogowLogo(w: WygladQr): Rogi {
  return w.logoRogi ?? [w.logoZaokraglenie, w.logoZaokraglenie, w.logoZaokraglenie, w.logoZaokraglenie];
}

/**
 * Promienie rogów logo. Ustawienie rogu (0–1) to ułamek połowy krótszego boku —
 * więc nawet 100% na wszystkich czterech rogach nie wymaga przycinania
 * (sąsiednie promienie nigdy nie sumują się do więcej niż bok).
 */
function rogiLogo(w: WygladQr, lw: number, lh: number): Rogi {
  const polowa = Math.min(lw, lh) / 2;
  const [tl, tr, br, bl] = ustawieniaRogowLogo(w);
  return [zaokr(tl * polowa), zaokr(tr * polowa), zaokr(br * polowa), zaokr(bl * polowa)];
}

/**
 * Promienie rogów podkładu — jak wyżej. Bez własnego ustawienia każdy róg
 * podkładu zaokrągla się jak odpowiedni róg logo, z minimum 0,6 modułu jak dotąd.
 */
function rogiPodkladu(w: WygladQr, pw: number, ph: number): Rogi {
  const polowa = Math.min(pw, ph) / 2;
  if (w.podkladRogi) {
    const [tl, tr, br, bl] = w.podkladRogi;
    return [zaokr(tl * polowa), zaokr(tr * polowa), zaokr(br * polowa), zaokr(bl * polowa)];
  }
  const jakLogo = (v: number) => zaokr(Math.min(Math.max(0.6, v * polowa), polowa));
  const [tl, tr, br, bl] = ustawieniaRogowLogo(w);
  return [jakLogo(tl), jakLogo(tr), jakLogo(br), jakLogo(bl)];
}

export function zbudujGeometrie(tekst: string, w: WygladQr): GeometriaQr {
  const qr = create(tekst, { errorCorrectionLevel: korekcjaEfektywna(w) });
  const n = qr.modules.size;
  const m = w.margines;
  const ciemny = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < n && y < n && qr.modules.get(y, x) === 1;

  const oczka: [number, number, Orientacja][] = [
    [0, 0, 0],
    [n - 7, 0, 1],
    [0, n - 7, 2],
  ];
  const wOczku = (x: number, y: number) =>
    oczka.some(([ex, ey]) => x >= ex && x < ex + 7 && y >= ey && y < ey + 7);

  // Logo: wymiary po obrocie/proporcjach; moduły pod podkładem są wycinane
  // (każdy moduł dotykający obwiedni podkładu znika w całości).
  const wym = w.logo ? wymiaryLogo(n, w) : null;
  const wycinaj = Boolean(wym && w.tloLogo);
  const lewo = wym ? (n - wym.bw) / 2 : 0;
  const gora = wym ? (n - wym.bh) / 2 : 0;
  const wPolu = (x: number, y: number) =>
    wycinaj && wym !== null && x + 1 > lewo && x < lewo + wym.bw && y + 1 > gora && y < gora + wym.bh;

  const widoczny = (x: number, y: number) => ciemny(x, y) && !wOczku(x, y) && !wPolu(x, y);
  const srodek = srodekEfektywny(w);

  let ramki = "";
  let srodki = "";
  for (const [ex, ey, o] of oczka) {
    ramki += ramkaOczka(ex + m, ey + m, w.ksztaltOczek, o);
    srodki += srodekOczka(ex + m + 2, ey + m + 2, srodek, o);
  }

  return {
    bok: n + 2 * m,
    moduly: sciezkaModulow(widoczny, n, m, w.ksztaltModulow),
    ramki,
    srodki,
    logo: wym
      ? {
          cx: n / 2 + m,
          cy: n / 2 + m,
          w: wym.lw,
          h: wym.lh,
          rogi: rogiLogo(w, wym.lw, wym.lh),
          obrot: w.logoObrot,
          rozciagnij: w.logoProporcje !== undefined,
          podklad: w.tloLogo ? { w: wym.pw, h: wym.ph, rogi: rogiPodkladu(w, wym.pw, wym.ph) } : null,
        }
      : null,
  };
}

/** Próbka 5×5 do kafelków wyboru kształtu modułów. */
const PROBKA = ["11011", "10110", "01101", "11001", "10111"];
export function probkaModulow(k: KsztaltModulu): string {
  return sciezkaModulow((x, y) => PROBKA[y]?.[x] === "1", 5, 0, k);
}
