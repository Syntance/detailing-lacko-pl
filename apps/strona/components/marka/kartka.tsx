"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Przekładanie kartki między liniami usług (/ ↔ /wulkanizacja) — zagięcie
 * papieru jak w komiksie (wzorzec StPageFlip), nie obrót sztywnej płyty.
 *
 * Scena: przy kliknięciu do <body> wchodzi `.kartka-scena` z nieruchomym
 * KLONEM DOM-u strony — pixel w pixel to, co widać (ten sam scroll przez
 * `scrollTop` warstwy, animacje wejścia w klonie wyłączone). Ekran jest
 * „zamrożony", a pod spodem App Router ładuje drugą stronę. Gdy nowa strona
 * jest w DOM (useLayoutEffect na `usePathname`), rusza zaginanie:
 *   „dalej"  — klon starej strony zagina się i schodzi nad ŻYWĄ nową,
 *   „wstecz" — klon nowej rozprostowuje się z lewej nad klonem starej.
 *
 * Geometria (klasyczny model „ciągniętego rogu", ten sam co w turn.js):
 * wolny róg kartki C (prawy górny) jest ciągnięty do punktu P; linia zagięcia
 * to symetralna odcinka C→P, a zagięty kawałek arkusza to jego odbicie
 * względem tej symetralnej. Stąd co klatkę:
 *   1. `.kartka-warstwa[data-rola="arkusz"]` dostaje `clip-path` = część
 *      leżąca płasko (prostokąt strony przycięty półpłaszczyzną),
 *   2. `.kartka-rewers` dostaje `clip-path` = część zagięta ORAZ `transform`
 *      = macierz odbicia (clip liczy się przed transformem, więc krawędzie
 *      stykają się co do piksela) i gradient papieru prostopadły do zagięcia.
 * Przy P = (−W, 0) symetralną jest sam grzbiet (x = 0), więc cała kartka
 * znika za lewą krawędzią — koniec przekładania.
 *
 * Bez JS-owego liczenia się nie obejdzie (CSS nie policzy przecięć wielokąta
 * z ruchomą prostą), więc klatki pcha rAF; `prefers-reduced-motion` i drugi
 * klik w trakcie → zwykły `router.push`, bez sceny.
 */
export type KierunekKartki = "dalej" | "wstecz";

type KartkaApi = {
  przeloz: (href: string, kierunek: KierunekKartki) => void;
};

const KartkaContext = createContext<KartkaApi | null>(null);

/** Bezpiecznik na nawigację, która nie domknęła się w rozsądnym czasie. */
const LIMIT_MS = 3500;

/** Zapas na sprzątnięcie sceny, gdy rAF nie dowiezie ostatniej klatki. */
const ZAPAS_MS = 900;

/**
 * Czas samego zaginania — z `--kartka-czas` (globals.css), żeby tempo ruchu
 * stało przy jego stylu. Scena żyje dłużej: najpierw czeka na nawigację.
 */
function czasZaginania(): number {
  const zapis = getComputedStyle(document.documentElement)
    .getPropertyValue("--kartka-czas")
    .trim();
  const liczba = Number.parseFloat(zapis);
  if (!Number.isFinite(liczba) || liczba <= 0) return 1250;
  return zapis.endsWith("ms") ? liczba : liczba * 1000;
}

/** Kontener treści strony — obie strony linii oznaczają nim swój root. */
const SELEKTOR_STRONY = "[data-kartka-strona]";

type Punkt = { x: number; y: number };

/** Wolny narożnik kartki: prawy górny (grzbiet = lewa krawędź). */
function rogStartowy(W: number): Punkt {
  return { x: W, y: 0 };
}

/**
 * Dokąd dociągnięty jest róg przy postępie `p` (0 = kartka leży płasko,
 * 1 = leży po drugiej stronie grzbietu). Lekkie opadnięcie w połowie drogi
 * (`sin`) przechyla linię zagięcia na ukos — bez tego fałda byłaby pionowa
 * i kartka wyglądałaby jak przesuwana roleta.
 */
function rogCiagniety(W: number, H: number, p: number): Punkt {
  return { x: W - 2 * W * p, y: Math.sin(Math.PI * p) * H * 0.3 };
}

/** Wygładzenie startu i lądowania (smootherstep) — papier nie szarpie. */
function wygladz(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Przycięcie wielokąta półpłaszczyzną (X − M)·d ≥ 0 — Sutherland–Hodgman.
 * Dla drugiej połowy wystarczy podać `d` ze zmienionym znakiem.
 */
function przytnij(wielokat: Punkt[], M: Punkt, d: Punkt): Punkt[] {
  const strona = (X: Punkt) => (X.x - M.x) * d.x + (X.y - M.y) * d.y;
  const wynik: Punkt[] = [];
  for (let i = 0; i < wielokat.length; i++) {
    const a = wielokat[i]!;
    const b = wielokat[(i + 1) % wielokat.length]!;
    const sa = strona(a);
    const sb = strona(b);
    if (sa >= 0) wynik.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      wynik.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return wynik;
}

/** Wielokąt → `clip-path`. Mniej niż 3 punkty = nic nie widać. */
function clipPath(punkty: Punkt[]): string {
  if (punkty.length < 3) return "polygon(0 0, 0 0, 0 0)";
  const wierzcholki = punkty
    .map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`)
    .join(", ");
  return `polygon(${wierzcholki})`;
}

/**
 * Gradient rewersu: jasność jako funkcja ODLEGŁOŚCI OD ZAGIĘCIA, więc
 * cieniowanie przeżywa odbicie (odbicie zachowuje tę odległość).
 * `linear-gradient(kąt, …)` mierzy pozycje wzdłuż prostej przechodzącej przez
 * środek elementu, stąd przeliczenie: rzut linii zagięcia na tę prostą daje
 * punkt zerowy, a `glebokosc` (odległość ciągniętego rogu od zagięcia) —
 * skalę. Warstwa ma rozmiar okna, więc środek to (W/2, H/2).
 */
function gradientPapieru(
  W: number,
  H: number,
  M: Punkt,
  u: Punkt,
  glebokosc: number,
): string {
  // CSS: 0deg = „do góry", kąt rośnie zgodnie z ruchem wskazówek.
  const kat = Math.atan2(u.x, -u.y);
  const dlugosc = Math.abs(W * Math.sin(kat)) + Math.abs(H * Math.cos(kat));
  const zero = (M.x - W / 2) * u.x + (M.y - H / 2) * u.y + dlugosc / 2;
  const stop = (o: number) => `${Math.max(0, zero + o).toFixed(1)}px`;
  return [
    `linear-gradient(${((kat * 180) / Math.PI).toFixed(1)}deg`,
    `rgb(14 15 17 / 0.34) ${stop(0)}`,
    `#c9c6c0 ${stop(2)}`,
    `#efedea ${stop(glebokosc * 0.16)}`,
    `#ffffff ${stop(glebokosc * 0.55)}`,
    `#e7e4de ${stop(glebokosc)})`,
  ].join(", ");
}

/** Jedna klatka zaginania: przycięcia arkusza i rewersu + odbicie i cień. */
function rysujKlatke(
  arkusz: HTMLElement,
  rewers: HTMLElement,
  W: number,
  H: number,
  p: number,
): void {
  const C = rogStartowy(W);
  const P = rogCiagniety(W, H, p);
  const d = { x: P.x - C.x, y: P.y - C.y };
  const dystans = Math.hypot(d.x, d.y);
  if (dystans < 1) {
    // Róg jeszcze nie ruszył: cała kartka leży płasko, rewersu nie widać.
    arkusz.style.clipPath = "none";
    rewers.style.clipPath = "polygon(0 0, 0 0, 0 0)";
    return;
  }

  const M = { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 };
  const strona: Punkt[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];

  // Płaska reszta arkusza leży po stronie P, zagięty kawałek po stronie C.
  arkusz.style.clipPath = clipPath(przytnij(strona, M, d));
  rewers.style.clipPath = clipPath(
    przytnij(strona, M, { x: -d.x, y: -d.y }),
  );

  // Odbicie względem linii zagięcia: X' = X − 2((X−M)·n)n, n = d/|d|.
  const nx = d.x / dystans;
  const ny = d.y / dystans;
  const a = 1 - 2 * nx * nx;
  const b = -2 * nx * ny;
  const c = b;
  const e = 1 - 2 * ny * ny;
  rewers.style.transform = `matrix(${a.toFixed(5)}, ${b.toFixed(5)}, ${c.toFixed(5)}, ${e.toFixed(5)}, ${(M.x - (a * M.x + c * M.y)).toFixed(2)}, ${(M.y - (b * M.x + e * M.y)).toFixed(2)})`;

  // Papier jaśnieje w głąb zagiętego narożnika, czyli w stronę rogu C.
  rewers.style.background = gradientPapieru(
    W,
    H,
    M,
    { x: -nx, y: -ny },
    dystans / 2,
  );
}

/**
 * Warstwa sceny z klonem strony. Warstwa ma `overflow: hidden`, więc jest
 * kontenerem przewijania — `scrollTop` (ustawiany PO wpięciu do DOM)
 * odtwarza pozycję scrolla, a sticky nagłówek w klonie zachowuje się jak
 * w żywej stronie. Klon traci znacznik strony, żeby `querySelector` dalej
 * trafiał w żywą stronę, a nie w kopię.
 */
function warstwaZKlonem(strona: HTMLElement, rola: string): HTMLDivElement {
  const warstwa = document.createElement("div");
  warstwa.className = "kartka-warstwa";
  warstwa.dataset.rola = rola;
  const klon = strona.cloneNode(true) as HTMLElement;
  klon.removeAttribute("data-kartka-strona");
  warstwa.append(klon);
  return warstwa;
}

export function KartkaProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const domknij = useRef<(() => void) | null>(null);

  // Nowa strona zacommitowana → domykamy obietnicę czekającą na jej DOM.
  // useLayoutEffect, nie useEffect: chcemy klonować nową stronę PRZED jej
  // pierwszym paintem, żeby scena nie migała.
  useLayoutEffect(() => {
    domknij.current?.();
    domknij.current = null;
  }, [pathname]);

  const przeloz = useCallback(
    (href: string, kierunek: KierunekKartki) => {
      const stara = document.querySelector<HTMLElement>(SELEKTOR_STRONY);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!stara || reducedMotion || document.querySelector(".kartka-scena")) {
        router.push(href);
        return;
      }

      // 1. Scena z nieruchomym klonem starej strony — zamraża ekran.
      const scena = document.createElement("div");
      scena.className = "kartka-scena";
      scena.setAttribute("aria-hidden", "true");
      scena.inert = true;
      const staraWarstwa = warstwaZKlonem(stara, "arkusz");
      scena.append(staraWarstwa);
      document.body.append(scena);
      staraWarstwa.scrollTop = window.scrollY;

      let klatka = 0;
      let sprzatnieto = false;
      const sprzatnij = () => {
        if (sprzatnieto) return;
        sprzatnieto = true;
        if (klatka) cancelAnimationFrame(klatka);
        scena.remove();
      };

      // 2. Nawigacja; kartka zagina się dopiero, gdy druga strona jest w DOM.
      const gotowe = new Promise<void>((resolve) => {
        const limit = window.setTimeout(() => {
          domknij.current = null;
          resolve();
        }, LIMIT_MS);
        domknij.current = () => {
          window.clearTimeout(limit);
          resolve();
        };
      });
      startTransition(() => router.push(href));

      void gotowe.then(() => {
        if (!scena.isConnected) return;
        let arkusz: HTMLDivElement;
        if (kierunek === "dalej") {
          // Zagina się klon starej strony, a spod niego wychodzi żywa nowa.
          arkusz = staraWarstwa;
        } else {
          // Stara zostaje pod spodem, a klon nowej rozprostowuje się z lewej.
          // Gdy nawigacja padła (limit), „nowa" to dalej stara — kartka i tak
          // ląduje na tym, co jest żywe pod spodem.
          const nowa = document.querySelector<HTMLElement>(SELEKTOR_STRONY);
          staraWarstwa.dataset.rola = "spod";
          arkusz = warstwaZKlonem(nowa ?? stara, "arkusz");
          scena.append(arkusz);
          arkusz.scrollTop = 0;
        }

        const rewers = document.createElement("div");
        rewers.className = "kartka-rewers";
        // Macierz odbicia jest liczona w układzie strony (0,0 = lewy górny róg
        // okna), więc origin MUSI tam stać — przy domyślnym `50% 50%` CSS
        // dokłada przesunięcie o wektor środka i rewers ląduje po złej stronie
        // zagięcia. Inline, nie tylko w arkuszu: geometria trzyma się kupy
        // razem z `transform` ustawianym niżej.
        rewers.style.transformOrigin = "0 0";
        scena.append(rewers);

        const W = window.innerWidth;
        const H = window.innerHeight;
        const czas = czasZaginania();
        const start = performance.now();
        const krok = (teraz: number) => {
          const t = Math.min(1, (teraz - start) / czas);
          const postep = wygladz(t);
          rysujKlatke(
            arkusz,
            rewers,
            W,
            H,
            kierunek === "dalej" ? postep : 1 - postep,
          );
          if (t < 1) {
            klatka = requestAnimationFrame(krok);
            return;
          }
          sprzatnij();
        };
        // Pierwsza klatka od razu, żeby przy „wstecz" kartka nie mrugnęła
        // rozłożona, zanim rAF policzy jej złożony stan startowy.
        krok(start);
        // Karta w tle wstrzymuje rAF — scena nie może zostać na ekranie.
        window.setTimeout(sprzatnij, czas + ZAPAS_MS);
      });
    },
    [router],
  );

  const api = useMemo(() => ({ przeloz }), [przeloz]);

  return <KartkaContext.Provider value={api}>{children}</KartkaContext.Provider>;
}

export function useKartka(): KartkaApi {
  const ctx = useContext(KartkaContext);
  if (!ctx) {
    throw new Error("useKartka() wymaga <KartkaProvider> w drzewie.");
  }
  return ctx;
}
