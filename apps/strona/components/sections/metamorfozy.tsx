"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
// Funkcje z `metamorfozy-view`, nie z `metamorfozy` — ten drugi buduje schematy
// zod przy imporcie, więc cały zod wjeżdżałby do bundla strony głównej.
import {
  paraZdjecia,
  plakietkaZdjecia,
  podgladMaxSzerokosc,
  siatkaKolumny,
} from "@/lib/metamorfozy-view";
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

/**
 * Plakietka w narożniku zdjęcia. Treść z panelu (własna) albo automatyczne
 * „przed"/„po!" dla pary — patrz `plakietkaZdjecia`. Żółte tło = akcent.
 */
function Plakietka({ tekst, akcent }: { tekst: string; akcent: boolean }) {
  return (
    <span
      aria-hidden
      className={`etykieta-sm pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-full border-2 border-ink px-[9px] py-1 ${
        akcent ? "bg-zolty" : "bg-background"
      }`}
    >
      {tekst}
    </span>
  );
}

/**
 * Grupa zdjęć — kafelek i podgląd. Układ zależy od liczby zdjęć: jedno na
 * całą szerokość, dwa po połowie, więcej w siatce (patrz `siatkaKolumny`).
 *
 * Kafelek (okładka): sztywne 180 px wysokości z makiety, więc pionowe kadry
 * 3:4 zostają przycięte do formatu z projektu — to teaser. Przy większej
 * liczbie zdjęć rośnie liczba wierszy w tych 180 px, a nie wysokość karty.
 *
 * Podgląd (`pelny`): rozmiar liczony z SZEROKOŚCI (flex-basis + aspect-[3/4]),
 * nie z wysokości ekranu — proporcja 3:4 zgodna ze źródłem daje zero
 * przycięcia. O to, żeby grupa zawsze zmieściła się na wysokość, dba sufit
 * szerokości ramki liczony w `podgladMaxSzerokosc` z liczby kolumn i wierszy.
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
  const wszystkie = paraZdjecia(para);
  if (wszystkie.length === 0) return null;

  // Kafelek to teaser o stałej wysokości — przy większej liczbie zdjęć rośnie
  // liczba wierszy, a nie wysokość karty, więc pokazujemy najwyżej cztery
  // (2×2) i zaznaczamy resztę licznikiem. Podgląd pokazuje wszystkie.
  const widoczne = pelny ? wszystkie : wszystkie.slice(0, 4);
  const ukryte = wszystkie.length - widoczne.length;

  const kolumny = siatkaKolumny(widoczne.length, pelny ? 3 : 2);
  const wiersze = Math.ceil(widoczne.length / kolumny);
  // Ostatnie zdjęcie dopełnia niepełny wiersz, żeby w siatce nie została
  // czarna dziura (tło `bg-ink` prześwituje przez puste komórki).
  const reszta = widoczne.length % kolumny;
  const dopelnienie = reszta === 0 ? 1 : kolumny - reszta + 1;

  if (pelny) {
    // Podgląd idzie na flexa, nie na grid: niepełny ostatni wiersz ma się
    // WYŚRODKOWAĆ, a nie zostać domknięty rozciągniętym zdjęciem. Rozciągnięta
    // komórka przy proporcji 3:4 byłaby dwa razy wyższa i rozwalała sufit
    // wysokości liczony w `podgladMaxSzerokosc`.
    return (
      <div className="flex flex-wrap justify-center gap-[3px] bg-ink">
        {wszystkie.map((zdjecie, i) => {
          const plakietka = plakietkaZdjecia(wszystkie, i);
          return (
            <div
              key={zdjecie.id}
              className="relative aspect-[3/4] min-w-0 shrink-0 grow-0 overflow-hidden bg-piasek"
              style={{
                flexBasis: `calc((100% - ${(kolumny - 1) * 3}px) / ${kolumny})`,
              }}
            >
              <Image
                src={zdjecie.url}
                alt={zdjecie.alt}
                fill
                sizes={sizes}
                className="object-cover"
              />
              {plakietka ? (
                <Plakietka tekst={plakietka.tekst} akcent={plakietka.akcent} />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-[3px] bg-ink ${pelny ? "w-full" : "h-[180px]"}`}
      style={{
        gridTemplateColumns: `repeat(${kolumny}, minmax(0, 1fr))`,
        // W kafelku wiersze dzielą stałe 180 px; w podglądzie wysokość
        // wynika z proporcji zdjęć.
        gridTemplateRows: pelny
          ? undefined
          : `repeat(${wiersze}, minmax(0, 1fr))`,
      }}
    >
      {widoczne.map((zdjecie, i) => {
        const ostatnie = i === widoczne.length - 1;
        const plakietka = plakietkaZdjecia(wszystkie, i);
        return (
          <div
            key={zdjecie.id}
            className={`relative min-w-0 overflow-hidden bg-piasek ${
              pelny ? "aspect-[3/4] w-full" : "h-full"
            }`}
            style={
              ostatnie && dopelnienie > 1
                ? { gridColumn: `span ${dopelnienie}` }
                : undefined
            }
          >
            <Image
              src={zdjecie.url}
              alt={zdjecie.alt}
              fill
              sizes={sizes}
              className="object-cover"
            />
            {plakietka ? (
              <Plakietka tekst={plakietka.tekst} akcent={plakietka.akcent} />
            ) : null}
            {ostatnie && ukryte > 0 ? (
              <span className="absolute inset-0 grid place-items-center bg-ink/65 text-xl font-bold text-background">
                +{ukryte}
              </span>
            ) : null}
          </div>
        );
      })}
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
                  {/* Sufit szerokości liczony z liczby zdjęć — to on pilnuje,
                      żeby grupa zawsze zmieściła się na wysokość ekranu
                      (patrz `podgladMaxSzerokosc`). `w-full` sprawia, że na
                      telefonie grupa zwęża się do modala zamiast z niego
                      wychodzić. */}
                  <div
                    className="w-full overflow-hidden rounded-xl border-[3px] border-ink"
                    style={{
                      maxWidth: podgladMaxSzerokosc(paraZdjecia(para).length),
                    }}
                  >
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
