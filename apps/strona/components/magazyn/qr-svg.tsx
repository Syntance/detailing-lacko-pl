"use client";

import { forwardRef, useMemo } from "react";
import { create } from "qrcode";
import type { WygladQr } from "@/lib/kody-qr";

type Rogi = [number, number, number, number];

/** Prostokąt z osobnym promieniem każdego rogu (TL, TR, BR, BL) jako fragment ścieżki SVG. */
function prostokat(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Rogi): string {
  return [
    `M${x + tl} ${y}`,
    `H${x + w - tr}`,
    tr ? `A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}` : "",
    `V${y + h - br}`,
    br ? `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}` : "",
    `H${x + bl}`,
    bl ? `A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` : "",
    `V${y + tl}`,
    tl ? `A${tl} ${tl} 0 0 1 ${x + tl} ${y}` : "",
    "Z",
  ].join("");
}

const r4 = (r: number): Rogi => [r, r, r, r];

/** Oczko (wzorzec pozycjonujący 7×7): zewnętrzna ramka z otworem + środek 3×3. */
function oczko(ex: number, ey: number, ksztalt: WygladQr["ksztaltOczek"]): { ramka: string; srodek: string } {
  const [zew, otw, sr] =
    ksztalt === "kolo" ? [3.5, 2.5, 1.5] : ksztalt === "zaokraglone" ? [2.2, 1.4, 0.9] : [0, 0, 0];
  return {
    ramka: prostokat(ex, ey, 7, 7, r4(zew)) + prostokat(ex + 1, ey + 1, 5, 5, r4(otw)),
    srodek: prostokat(ex + 2, ey + 2, 3, 3, r4(sr)),
  };
}

export type QrSvgProps = {
  tekst: string;
  wyglad: WygladQr;
  /** Etykieta dostępności (role="img"). Bez niej SVG jest ozdobny (aria-hidden). */
  etykieta?: string;
  className?: string;
};

/** Poziom korekcji faktycznie użyty — logo zasłania moduły, więc wymusza H. */
export function korekcjaEfektywna(wyglad: WygladQr): WygladQr["korekcja"] {
  return wyglad.logo ? "H" : wyglad.korekcja;
}

/**
 * Kod QR jako czysty SVG (bez zależności od DOM) — ten sam element służy do
 * podglądu i eksportu (XMLSerializer → .svg, canvas → .png).
 */
export const QrSvg = forwardRef<SVGSVGElement, QrSvgProps>(function QrSvg(
  { tekst, wyglad, etykieta, className },
  ref,
) {
  const geometria = useMemo(() => {
    const qr = create(tekst, { errorCorrectionLevel: korekcjaEfektywna(wyglad) });
    const n = qr.modules.size;
    const m = wyglad.margines;
    const ciemny = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < n && y < n && qr.modules.get(y, x) === 1;

    const oczka: [number, number][] = [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ];
    const wOczku = (x: number, y: number) =>
      oczka.some(([ex, ey]) => x >= ex && x < ex + 7 && y >= ey && y < ey + 7);

    // Pole logo w modułach (z marginesem pół modułu), wyrównane do siatki.
    const bokLogo = wyglad.logo ? Math.round(n * wyglad.rozmiarLogo) : 0;
    const startLogo = (n - bokLogo) / 2;
    const pole = wyglad.logo && wyglad.tloLogo ? bokLogo + 1 : 0;
    const startPola = (n - pole) / 2;
    const wPolu = (x: number, y: number) =>
      pole > 0 &&
      x + 1 > startPola &&
      x < startPola + pole &&
      y + 1 > startPola &&
      y < startPola + pole;

    const widoczny = (x: number, y: number) => ciemny(x, y) && !wOczku(x, y) && !wPolu(x, y);

    let moduly = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!widoczny(x, y)) continue;
        const px = x + m;
        const py = y + m;
        switch (wyglad.ksztaltModulow) {
          case "kropki":
            // Pełna średnica modułu: mniejsze kropki (0,9) dekoder jsQR gubił
            // przy większych rozdzielczościach — sprawdzone testem odczytu.
            moduly += `M${px} ${py + 0.5}a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0Z`;
            break;
          case "drobne":
            moduly += prostokat(px + 0.1, py + 0.1, 0.8, 0.8, r4(0.15));
            break;
          case "plynne": {
            // Róg zaokrąglony tylko tam, gdzie oba sąsiednie boki są puste —
            // moduły w ciągu zlewają się w jedną płynną linię.
            const g = widoczny(x, y - 1);
            const d = widoczny(x, y + 1);
            const l = widoczny(x - 1, y);
            const p = widoczny(x + 1, y);
            const r = 0.5;
            moduly += prostokat(px, py, 1, 1, [
              !g && !l ? r : 0,
              !g && !p ? r : 0,
              !d && !p ? r : 0,
              !d && !l ? r : 0,
            ]);
            break;
          }
          default: {
            // Kwadraty łączone w poziome odcinki — mniej węzłów w ścieżce.
            let dl = 1;
            while (widoczny(x + dl, y)) dl++;
            moduly += `M${px} ${py}h${dl}v1h${-dl}Z`;
            x += dl - 1;
          }
        }
      }
    }

    let ramki = "";
    let srodki = "";
    for (const [ex, ey] of oczka) {
      const o = oczko(ex + m, ey + m, wyglad.ksztaltOczek);
      ramki += o.ramka;
      srodki += o.srodek;
    }

    return {
      bok: n + 2 * m,
      moduly,
      ramki,
      srodki,
      logo: bokLogo > 0 ? { start: startLogo + m, bok: bokLogo } : null,
      pole: pole > 0 ? { start: startPola + m, bok: pole } : null,
    };
  }, [tekst, wyglad]);

  const { bok } = geometria;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${bok} ${bok}`}
      role={etykieta ? "img" : undefined}
      aria-label={etykieta || undefined}
      aria-hidden={etykieta ? undefined : true}
      className={className}
    >
      {wyglad.przezroczysteTlo ? null : <rect width={bok} height={bok} fill={wyglad.tlo} />}
      <path d={geometria.moduly} fill={wyglad.kolor} />
      <path d={geometria.ramki} fill={wyglad.kolorOczek} fillRule="evenodd" />
      <path d={geometria.srodki} fill={wyglad.kolorOczek} />
      {geometria.pole && !wyglad.przezroczysteTlo ? (
        <rect
          x={geometria.pole.start}
          y={geometria.pole.start}
          width={geometria.pole.bok}
          height={geometria.pole.bok}
          rx={0.6}
          fill={wyglad.tlo}
        />
      ) : null}
      {geometria.logo && wyglad.logo ? (
        <image
          href={wyglad.logo}
          x={geometria.logo.start}
          y={geometria.logo.start}
          width={geometria.logo.bok}
          height={geometria.logo.bok}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </svg>
  );
});
