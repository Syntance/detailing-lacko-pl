"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GaleriaData } from "@/lib/galeria";
import { trackCompareInteract } from "@/lib/track";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { BeforeAfter } from "./before-after";

/**
 * Sekcja „Efekty — zobacz różnicę" (plan www v2 §3, lęk nr 2: „czy to w ogóle
 * coś daje?"). Kafelki z beforeUrl renderują suwak przed/po; pozostałe —
 * lightbox. Podpis wg formuły: problem + wieś + cena + czas.
 * Dane z panelu Magazyn → Galeria.
 */
export function Galeria({ galeria }: { galeria: GaleriaData }) {
  const photos = galeria.photos
    .filter((photo) => !photo.disabled && photo.url)
    .sort((a, b) => a.order - b.order);

  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  if (!photos.length) return null;

  const current = index !== null ? photos[index] : null;

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-heading"
      className="scroll-mt-20 border-y border-border bg-card/40"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="galeria-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            {galeria.heading}
          </h2>
          {galeria.subheading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {galeria.subheading}
            </p>
          ) : null}
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map((photo, i) => (
            <RevealItem key={photo.id}>
              {photo.beforeUrl ? (
                <figure>
                  <BeforeAfter
                    beforeUrl={photo.beforeUrl}
                    afterUrl={photo.url}
                    alt={photo.alt || photo.caption}
                    sizes="(max-width: 768px) 50vw, 340px"
                    onFirstInteract={() => trackCompareInteract(photo.id)}
                  />
                  {photo.caption ? (
                    <figcaption className="mt-2 text-sm font-medium text-pretty">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Powiększ: ${photo.caption || photo.alt || "zdjęcie"}`}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt || photo.caption}
                    fill
                    sizes="(max-width: 768px) 50vw, 340px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  {photo.caption ? (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3 text-left text-sm font-medium text-white">
                      {photo.caption}
                    </span>
                  ) : null}
                </button>
              )}
            </RevealItem>
          ))}
        </RevealStagger>
      </div>

      {open && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || "Podgląd zdjęcia"}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Zamknij podgląd"
            className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Poprzednie zdjęcie"
                className="absolute left-3 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none md:left-6"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Następne zdjęcie"
                className="absolute right-3 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none md:right-6"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          ) : null}

          <figure
            className="flex max-h-full max-w-4xl flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[70vh] w-[88vw] max-w-4xl">
              <Image
                src={current.url}
                alt={current.alt || current.caption}
                fill
                sizes="88vw"
                className="object-contain"
                priority
              />
            </div>
            {current.caption ? (
              <figcaption className="text-center text-sm text-white/90">
                {current.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </section>
  );
}
