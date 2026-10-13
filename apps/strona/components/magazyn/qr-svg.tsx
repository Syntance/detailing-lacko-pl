"use client";

import { forwardRef, useId, useMemo } from "react";
import type { WygladQr } from "@/lib/kody-qr";
import { zbudujGeometrie } from "@/lib/qr-geometria";

export type QrSvgProps = {
  tekst: string;
  wyglad: WygladQr;
  /** Etykieta dostępności (role="img"). Bez niej SVG jest ozdobny (aria-hidden). */
  etykieta?: string;
  className?: string;
};

/**
 * Kod QR jako czysty SVG — ten sam element służy do podglądu i eksportu
 * (XMLSerializer → .svg, canvas → .png/.jpg/.webp). Geometria w lib/qr-geometria.
 */
export const QrSvg = forwardRef<SVGSVGElement, QrSvgProps>(function QrSvg(
  { tekst, wyglad, etykieta, className },
  ref,
) {
  const geometria = useMemo(() => zbudujGeometrie(tekst, wyglad), [tekst, wyglad]);
  // Unikalne id gradientu — na stronie jest wiele miniatur naraz.
  const idGradientu = `qr-g-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const { bok } = geometria;
  const zGradientem = wyglad.gradient !== "brak";

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
      {zGradientem ? (
        <defs>
          {wyglad.gradient === "radialny" ? (
            <radialGradient id={idGradientu} cx="50%" cy="50%" r="60%">
              <stop offset="0" stopColor={wyglad.kolor} />
              <stop offset="1" stopColor={wyglad.kolor2} />
            </radialGradient>
          ) : (
            <linearGradient id={idGradientu} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={wyglad.kolor} />
              <stop offset="1" stopColor={wyglad.kolor2} />
            </linearGradient>
          )}
        </defs>
      ) : null}
      {wyglad.przezroczysteTlo ? null : <rect width={bok} height={bok} fill={wyglad.tlo} />}
      <path d={geometria.moduly} fill={zGradientem ? `url(#${idGradientu})` : wyglad.kolor} />
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
