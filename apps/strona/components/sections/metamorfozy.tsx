"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { MetamorfozyData, MetamorfozyPara } from "@/lib/metamorfozy";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

/**
 * Sekcja „Efekty" — kuratorowane kafelki przed/po (lęk nr 2: „czy to coś
 * daje?"). Kafelek = jedna para TEJ SAMEJ powierzchni: brudna po lewej,
 * gotowa po prawej — różnica broni się sama, bez suwaka i animacji.
 * Klik otwiera prawie pełnoekranowy podgląd z KOMPLETEM par danego tematu.
 * Dane z panelu Magazyn → Metamorfozy (pierwsza para tematu = okładka).
 */

/** Etykieta + zdjęcie — wspólny klocek kafelka i podglądu. */
function ParaZdjec({
  para,
  sizes,
  hover,
  compact,
}: {
  para: MetamorfozyPara;
  sizes: string;
  hover?: boolean;
  /**
   * Pełnoekranowy podgląd: na szerokim ekranie grid-cols-2 rozciąga każde
   * zdjęcie na ~44vw, a przy proporcji 3:4 to i tak za wysoko, żeby się
   * zmieścić. Flex + h-[min(60vh,70vw)] daje pudełku KONKRETNĄ wysokość
   * (nie max-h — `fill` jest position:absolute i nie ma własnego rozmiaru,
   * więc "auto" wysokość liczona z aspect-ratio kolabsuje do 0), z której
   * dopiero liczy się szerokość. Bazowa granica to połowa wysokości ekranu
   * (50vh/44vw), +20% na czytelność (60vh/~53vw → 70vw w proporcji 3:4);
   * wąskie/wysokie ekrany (mobile) nadal rosną w dół, nie w bok.
   */
  compact?: boolean;
}) {
  // Tło `bg-border` maluje się na całym pudełku — w trybie compact pudełko
  // MUSI się skurczyć do szerokości pary (inline-flex), inaczej "obramowanie"
  // ciągnie się na całą szerokość modala. Centrowanie idzie więc na osobnym,
  // przezroczystym wrapperze na zewnątrz.
  return (
    <div className={compact ? "flex justify-center" : ""}>
      <div
        className={`overflow-hidden rounded-xl bg-border ${
          compact ? "inline-flex items-start gap-px" : "grid grid-cols-2 gap-px"
        }`}
      >
        {(
          [
            ["PRZED", para.beforeUrl, para.beforeAlt],
            ["PO", para.afterUrl, para.afterAlt],
          ] as const
        ).map(([label, url, alt]) => (
          // aspect 3:4 = proporcja źródłowych zdjęć — kadr widać W CAŁOŚCI,
          // object-cover niczego tu nie przycina.
          <div
            key={label}
            className={`relative aspect-[3/4] bg-card ${compact ? "h-[min(60vh,70vw)] max-w-full" : ""}`}
          >
            <Image
              src={url}
              alt={alt}
              fill
              sizes={sizes}
              className={`object-cover ${
                hover
                  ? "transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  : ""
              }`}
            />
            <span
              aria-hidden
              className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                label === "PO"
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 text-white"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
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
      id="metamorfozy"
      aria-labelledby="metamorfozy-heading"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="metamorfozy-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            {data.heading}
          </h2>
          {data.subheading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {data.subheading}
            </p>
          ) : null}
        </Reveal>

        <RevealStagger className="mt-10 grid gap-6 lg:grid-cols-2">
          {tematy.map((t) => (
            <RevealItem key={t.id} className="h-full">
              <button
                type="button"
                onClick={() => setOpenId(t.id)}
                aria-haspopup="dialog"
                aria-label={`Zobacz wszystkie zdjęcia: ${t.title}`}
                className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary-strong/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <ParaZdjec
                  para={t.cover}
                  sizes="(max-width: 1024px) 50vw, 240px"
                  hover
                />
                <span className="flex flex-1 flex-col p-5">
                  <span className="font-serif text-lg font-medium">
                    {t.title}
                  </span>
                  <span className="mt-2 text-sm text-pretty text-muted-foreground">
                    {t.text}
                  </span>
                  <span className="mt-3 text-sm font-medium text-primary-strong">
                    Zobacz więcej →
                  </span>
                </span>
              </button>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>

      {temat ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${temat.title} — zdjęcia przed i po`}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="absolute inset-x-2 inset-y-3 overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl md:inset-x-8 md:inset-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/95 px-5 py-4 backdrop-blur md:px-8">
              <div>
                <h3 className="font-serif text-xl leading-tight font-medium md:text-2xl">
                  {temat.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">
                  {temat.text}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Zamknij podgląd"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
              {temat.pary.map((para) => (
                <figure key={para.id}>
                  <ParaZdjec para={para} sizes="(max-width: 768px) 45vw, 400px" compact />
                  {para.podpis ? (
                    <figcaption className="mt-2 text-sm font-medium text-pretty text-muted-foreground">
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
