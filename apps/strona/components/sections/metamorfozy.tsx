"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { MetamorfozyData, MetamorfozyPara } from "@/lib/metamorfozy";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * Sekcja „Efekty" 1:1 z makietą „kreskówka": kafelki par przed/po na ciepłej
 * szarości, twarda kreska, plakietki „przed" / „po!" i lekkie przekrzywienie
 * kafelków. Dane z panelu Magazyn → Metamorfozy (pierwsza para tematu =
 * okładka kafelka).
 *
 * Klik otwiera podgląd z KOMPLETEM par tematu — makieta tego nie pokazuje
 * (jej kafelki to statyczne pola na zdjęcia), ale to jedyne miejsce, gdzie
 * widać pozostałe pary z panelu, więc podgląd zostaje, przepisany na język
 * makiety.
 */

/** Przekrzywienia kafelków — wartości z makiety, cyklicznie po indeksie. */
const ROTACJE = ["-rotate-[1.2deg]", "rotate-[1deg]", "-rotate-[0.8deg]"];

/** Plakietka „przed" (biała) / „po!" (żółta) — narożnik zdjęcia. */
function Plakietka({ po }: { po?: boolean }) {
  return (
    <span
      aria-hidden
      className={`etykieta-sm pointer-events-none absolute top-2.5 left-2.5 rounded-full border-2 border-ink px-[9px] py-1 ${
        po ? "bg-zolty" : "bg-background"
      }`}
    >
      {po ? "po!" : "przed"}
    </span>
  );
}

/**
 * Para zdjęć — kafelek i podgląd.
 *
 * Kafelek (okładka): sztywne 180 px wysokości z makiety, więc pionowe kadry
 * 3:4 zostają przycięte do formatu z projektu — to teaser.
 * Podgląd (`pelny`): proporcja źródłowa 3:4 bez przycięcia, wysokość ograniczona
 * do połowy ekranu +20% (60vh/70vw), żeby para mieściła się bez przewijania.
 */
function ParaZdjec({
  para,
  sizes,
  pelny,
}: {
  para: MetamorfozyPara;
  sizes: string;
  pelny?: boolean;
}) {
  return (
    <div
      className={
        pelny
          ? "inline-flex items-start gap-[3px] bg-ink"
          : "grid grid-cols-2 gap-[3px] bg-ink"
      }
    >
      {(
        [
          ["przed", para.beforeUrl, para.beforeAlt],
          ["po", para.afterUrl, para.afterAlt],
        ] as const
      ).map(([label, url, alt]) => (
        <div
          key={label}
          className={`relative min-w-0 overflow-hidden bg-piasek ${
            pelny ? "aspect-[3/4] h-[min(60vh,70vw)] max-w-full" : "h-[180px]"
          }`}
        >
          <Image
            src={url}
            alt={alt}
            fill
            sizes={sizes}
            className="object-cover"
          />
          <Plakietka po={label === "po"} />
        </div>
      ))}
    </div>
  );
}

export function Metamorfozy({ data }: { data: MetamorfozyData }) {
  const tematy = data.tematy
    .filter((t) => !t.disabled)
    .sort((a, b) => a.order - b.order)
    .flatMap((t) => {
      const pary = [...t.pary].sort((a, b) => a.order - b.order);
      const cover = pary[0];
      // Temat bez ani jednej pary nie ma czego pokazać — pomijamy.
      return cover ? [{ ...t, pary, cover }] : [];
    });

  const [openId, setOpenId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenId(null), []);
  const temat = tematy.find((t) => t.id === openId) ?? null;

  useEffect(() => {
    if (!temat) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [temat, close]);

  if (!tematy.length) return null;

  return (
    <section
      id="efekty"
      aria-labelledby="efekty-heading"
      className="scroll-mt-24 border-y-[3px] border-ink bg-piasek"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-col gap-2.5">
          <p className="etykieta w-max rotate-[1.5deg] rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5">
            02 · efekty
          </p>
          <h2
            id="efekty-heading"
            className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
          >
            {data.heading}
          </h2>
        </Reveal>

        <RevealStagger className="grid gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
          {tematy.map((t, index) => (
            <RevealItem key={t.id}>
              <button
                type="button"
                onClick={() => setOpenId(t.id)}
                aria-haspopup="dialog"
                aria-label={`Zobacz wszystkie zdjęcia: ${t.title}`}
                className={`cien-6 block w-full overflow-hidden rounded-[14px] border-[3px] border-ink bg-background text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none ${
                  ROTACJE[index % ROTACJE.length]
                }`}
              >
                <ParaZdjec
                  para={t.cover}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
                />
                <span className="flex flex-col gap-[3px] border-t-[3px] border-ink px-4 py-[13px]">
                  <span className="text-[15px] font-bold">{t.title}</span>
                  {t.cover.podpis ? (
                    <span className="etykieta text-pretty text-muted-foreground">
                      {t.cover.podpis}
                    </span>
                  ) : null}
                </span>
              </button>
            </RevealItem>
          ))}
        </RevealStagger>

        <p className="self-center text-center text-sm font-medium text-tekst">
          Zdjęcia z realizacji — bez stocków.
        </p>
      </div>

      {temat ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${temat.title} — zdjęcia przed i po`}
          className="fixed inset-0 z-50 bg-ink/70"
          onClick={close}
        >
          <div
            className="absolute inset-x-2 inset-y-3 overflow-y-auto rounded-2xl border-[3px] border-ink bg-background md:inset-x-8 md:inset-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-[3px] border-ink bg-background px-5 py-4 md:px-8">
              <div>
                <h3 className="text-xl leading-tight font-bold md:text-2xl">
                  {temat.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-pretty text-tekst">
                  {temat.text}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Zamknij podgląd"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-ink transition-colors hover:bg-zolty focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
              {temat.pary.map((para) => (
                <figure key={para.id} className="flex flex-col items-center">
                  <div className="overflow-hidden rounded-xl border-[3px] border-ink">
                    <ParaZdjec
                      para={para}
                      sizes="(max-width: 768px) 45vw, 400px"
                      pelny
                    />
                  </div>
                  {para.podpis ? (
                    <figcaption className="mt-2.5 text-sm font-medium text-pretty text-tekst">
                      {para.podpis}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
