"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { useKartka, type KierunekKartki } from "@/components/marka/kartka";
import { LINIA_INFO, type Linia } from "@/lib/linie";

/**
 * Przełącznik marek w nagłówku: „Detailing Łącko / Wulkanizacja" — dwa
 * lockupy (sygnet + nazwa, bez ramek) po obu stronach ukośnika, jak dwie
 * kartki rozłożonego komiksu (ukośnik = grzbiet). Aktywna kartka leży płasko;
 * nieaktywna jest odchylona w głąb i przygaszona (`.marka-karta` w
 * globals.css), a klik przekłada kartkę na drugą stronę (scena z klonem
 * strony, falowanie filtrem SVG — patrz components/marka/kartka.tsx).
 *
 * Poniżej `md` zostają same sygnety: dwa pełne lockupy plus telefon nie
 * mieszczą się w 375 px, a hero pod nagłówkiem i tak mówi, gdzie jesteśmy.
 * Nazwy zostają dla czytników ekranu w `aria-label`.
 */

const SYGNET: Record<Linia, { src: string; width: number; height: number }> = {
  detailing: { src: "/brand/syg-kolor.png", width: 56, height: 56 },
  // Realne logo klienta (koło z felgą), przycięte do samej ikony — bez
  // dzielącej kreski i napisu z oryginalnego pliku (patrz wulk-sygnet.svg).
  // Proporcje 372:383 (niemal kwadrat) zamiast 1:1 detailingu.
  wulkanizacja: { src: "/brand/wulk-sygnet.svg", width: 372, height: 383 },
};

/** Kąt spoczynku kartki: lewa odchyla się prawą krawędzią w głąb, prawa lewą. */
const KAT: Record<Linia, string> = {
  detailing: "22deg",
  wulkanizacja: "-22deg",
};

const KIERUNEK: Record<Linia, KierunekKartki> = {
  detailing: "wstecz",
  wulkanizacja: "dalej",
};

function Karta({ linia, aktywna }: { linia: Linia; aktywna: boolean }) {
  const { przeloz } = useKartka();
  const info = LINIA_INFO[linia];
  const sygnet = SYGNET[linia];

  const style = { "--karta-kat": KAT[linia] } as CSSProperties;

  // Bez ramki i wypełnienia — lockup wygląda jak dotąd (sygnet + nazwa);
  // stan aktywny/nieaktywny niesie wyłącznie odchylenie i przygaszenie.
  const className =
    "marka-karta flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:gap-3";

  const tresc = (
    <>
      <Image
        src={sygnet.src}
        alt=""
        width={sygnet.width}
        height={sygnet.height}
        priority={aktywna}
        className="block w-11 md:w-14"
      />
      <span className="hidden flex-col gap-[3px] md:flex">
        <span className="text-[15px] leading-none font-bold tracking-[0.06em] whitespace-nowrap uppercase md:text-base">
          {info.nazwa}
        </span>
        <span className="etykieta-sm text-muted-foreground">{info.podpis}</span>
      </span>
    </>
  );

  if (aktywna) {
    return (
      <a
        href="#hero"
        aria-current="page"
        aria-label={`${info.nazwa} — początek strony`}
        data-aktywna="true"
        className={className}
        style={style}
      >
        {tresc}
      </a>
    );
  }

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Nowa karta / okno / pobieranie — oddajemy przeglądarce.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    przeloz(info.path, KIERUNEK[linia]);
  };

  return (
    <Link
      href={info.path}
      onClick={onClick}
      aria-label={`Przejdź do: ${info.nazwa}`}
      data-aktywna="false"
      className={className}
      style={style}
    >
      {tresc}
    </Link>
  );
}

/** Ukośnik-grzbiet: kreska 3px w kolorze kreski z cieniem w akcencie strony. */
function Ukosnik() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 30 64"
      className="h-11 w-auto shrink-0 md:h-14"
      focusable="false"
    >
      <path
        d="M25 6 L5 58"
        stroke="var(--akcent)"
        strokeWidth="6"
        strokeLinecap="round"
        transform="translate(3 3)"
      />
      <path
        d="M25 6 L5 58"
        stroke="var(--ink)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MarkaSwitch({ aktywna }: { aktywna: Linia }) {
  return (
    <nav
      aria-label="Linie usług"
      className="flex min-w-0 items-center gap-1.5 md:gap-2.5"
    >
      <Karta linia="detailing" aktywna={aktywna === "detailing"} />
      <Ukosnik />
      <Karta linia="wulkanizacja" aktywna={aktywna === "wulkanizacja"} />
    </nav>
  );
}
