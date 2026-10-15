"use client";

import { forwardRef, useId, useMemo } from "react";
import type { WygladQr } from "@/lib/kody-qr";
import { prostokat, zbudujGeometrie } from "@/lib/qr-geometria";

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
  const idKlipu = `${idGradientu}-logo`;
  const { bok, logo } = geometria;
  const zGradientem = wyglad.gradient !== "brak";
  // Podkład: wybrany kolor, a bez niego kolor tła kodu (przy przezroczystym tle — bez podkładu,
  // moduły pod logo i tak są wycięte).
  const kolorPodkladu = wyglad.kolorTlaLogo ?? (wyglad.przezroczysteTlo ? null : wyglad.tlo);

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
      {logo && wyglad.logo ? (
        <g transform={`rotate(${logo.obrot} ${logo.cx} ${logo.cy})`}>
          {logo.podklad && kolorPodkladu ? (
            <path
              d={prostokat(
                logo.cx - logo.podklad.w / 2,
                logo.cy - logo.podklad.h / 2,
                logo.podklad.w,
                logo.podklad.h,
                logo.podklad.rogi,
              )}
              fill={kolorPodkladu}
            />
          ) : null}
          <clipPath id={idKlipu}>
            <rect x={logo.cx - logo.w / 2} y={logo.cy - logo.h / 2} width={logo.w} height={logo.h} rx={logo.rx} />
          </clipPath>
          <image
            href={wyglad.logo}
            x={logo.cx - logo.w / 2}
            y={logo.cy - logo.h / 2}
            width={logo.w}
            height={logo.h}
            preserveAspectRatio={logo.rozciagnij ? "none" : "xMidYMid meet"}
            clipPath={`url(#${idKlipu})`}
          />
        </g>
      ) : null}
    </svg>
  );
});
