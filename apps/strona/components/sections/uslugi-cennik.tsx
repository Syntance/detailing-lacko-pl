"use client";

import { useState } from "react";
import { Camera, ChevronDown } from "lucide-react";
import {
  formatItemPrice,
  type CennikCategory,
  type CennikData,
  type CennikItem,
} from "@/lib/cennik";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { trackPricingExpand, trackPricingFilter } from "@/lib/track";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { PhotoLink } from "./phone-link";

/**
 * Cennik — plan www v2 §2: domyka lęk nr 1 („ile to kosztuje?").
 * Nikt w promieniu 20 km nie publikuje pełnego cennika, więc cennik jest
 * NA stronie: karty z cenami 1:1 (zasada anty-„od"), pełna tabela widoczna
 * od razu na desktopie, na mobile akordeon per kategoria (Wnętrze otwarte).
 * Dane z panelu Magazyn → Cennik.
 */

/** Kategorie-karty (usługi) vs pas pakietów — po id z panelu. */
const CARD_CATEGORY_IDS = ["wnetrze", "zewnatrz", "polerowanie-korekta"];
const PAKIETY_CATEGORY_IDS = ["pakiety"];

function stripBullet(name: string): string {
  return name.replace(/^•\s*/, "");
}

function isAddon(item: CennikItem): boolean {
  return item.name.startsWith("•");
}

/**
 * Poziomy pasek filtrów nad pełnym cennikiem. „Wszystkie" = brak filtrowania
 * (stan domyślny — pełna lista to wyróżnik, więc filtr tylko zawęża na życzenie).
 * Na wąskich ekranach przewija się poziomo zamiast zawijać.
 */
function CategoryFilter({
  categories,
  filter,
  onSelect,
}: {
  categories: CennikCategory[];
  filter: string | null;
  onSelect: (id: string | null, label: string) => void;
}) {
  const options: { id: string | null; label: string }[] = [
    { id: null, label: "Wszystkie" },
    ...categories.map((category) => ({
      id: category.id,
      label: category.name,
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Filtruj cennik według kategorii"
      className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {options.map((option) => {
        const active = filter === option.id;
        return (
          <button
            key={option.id ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.id, option.label)}
            className={`min-h-11 shrink-0 rounded-xl border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary-strong/60 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function UslugiCennik({
  cennik,
  kontakt,
}: {
  cennik: CennikData;
  kontakt: KontaktData;
}) {
  const categories = cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order);
  const items = cennik.items.filter((i) => !i.disabled);
  const itemsOf = (categoryId: string) =>
    items
      .filter((item) => item.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);

  const cardCategories = CARD_CATEGORY_IDS.map((id) =>
    categories.find((c) => c.id === id),
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const pakietyCategories = PAKIETY_CATEGORY_IDS.map((id) =>
    categories.find((c) => c.id === id),
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const pakietyItems = pakietyCategories.flatMap((c) => itemsOf(c.id));
  // Kategorie spoza mapowania (dodane w panelu) — nie znikają, lądują w tabeli.
  const tableCategories = categories;

  const [openMobile, setOpenMobile] = useState<string[]>(["wnetrze"]);
  const toggleMobile = (id: string) => {
    setOpenMobile((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    trackPricingExpand(!openMobile.includes(id));
  };

  // Filtr kategorii pełnego cennika; null = bez filtrowania („Wszystkie").
  const [filter, setFilter] = useState<string | null>(null);
  const applyFilter = (id: string | null, label: string) => {
    setFilter(id);
    // Na mobile zawężenie do jednej kategorii musi ją od razu pokazać —
    // inaczej po kliknięciu filtra zostaje sam zwinięty nagłówek.
    if (id) setOpenMobile((prev) => (prev.includes(id) ? prev : [...prev, id]));
    trackPricingFilter(label);
  };
  const filteredCategories = filter
    ? tableCategories.filter((c) => c.id === filter)
    : tableCategories;

  const photoHref = buildPhotoContactHref(kontakt);

  return (
    <section id="cennik" aria-labelledby="cennik-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="cennik-heading"
            className="max-w-3xl font-serif text-3xl leading-tight font-medium text-balance md:text-4xl"
          >
            {cennik.settings.heading}
          </h2>
          {cennik.settings.subheading ? (
            <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
              {cennik.settings.subheading}
            </p>
          ) : null}
        </Reveal>

        {/* Karty usług — ceny konkretne, nie „od" (cena jest bohaterem UI). */}
        <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
          {cardCategories.map((category) => {
            const mains = itemsOf(category.id).filter((i) => !isAddon(i));
            const addons = itemsOf(category.id).filter(isAddon);
            const filar = category.id === "wnetrze";
            return (
              <RevealItem key={category.id} className="h-full">
                <article
                  className={`flex h-full flex-col rounded-2xl border p-6 ${
                    filar
                      ? "border-primary/40 bg-primary/[0.04]"
                      : "border-border bg-card"
                  }`}
                >
                  {filar ? (
                    <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary-strong uppercase">
                      Nasza specjalizacja
                    </p>
                  ) : null}
                  <h3 className="font-serif text-xl font-medium">
                    {category.name}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {mains.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span
                          className={item.popular ? "font-medium" : undefined}
                        >
                          {stripBullet(item.name)}
                        </span>
                        <span className="font-semibold whitespace-nowrap tabular-nums">
                          {formatItemPrice(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {addons.length ? (
                    <p className="mt-4 border-t border-border pt-3 text-xs text-pretty text-muted-foreground">
                      Dodatki:{" "}
                      {addons
                        .map(
                          (item) =>
                            `${stripBullet(item.name).replace(/\s*\(.*\)$/, "")} ${formatItemPrice(item)}`,
                        )
                        .join(" · ")}
                    </p>
                  ) : null}
                  {category.highlight ? (
                    <p className="mt-auto pt-4 text-sm text-pretty text-foreground/90">
                      {category.highlight}
                    </p>
                  ) : null}
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        {/* Pas pakietów: całe auto + przygotowanie do sprzedaży (segment S2). */}
        {pakietyItems.length ? (
          <Reveal className="mt-6">
            <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-6">
              <h3 className="font-serif text-lg font-medium">
                {pakietyCategories[0]?.name ?? "Pakiety"}
              </h3>
              <ul className="mt-4 grid gap-x-10 gap-y-2 md:grid-cols-2">
                {pakietyItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className={item.popular ? "font-medium" : undefined}>
                      {stripBullet(item.name)}
                    </span>
                    <span className="font-semibold whitespace-nowrap tabular-nums">
                      {formatItemPrice(item)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-primary/20 pt-4 text-sm text-pretty text-muted-foreground">
                {cennik.settings.noteText}
              </p>
            </div>
          </Reveal>
        ) : null}

        {/* Pełna tabela — desktop: widoczna od razu (wyróżnik, nie wstyd). */}
        <Reveal className="mt-10 hidden md:block">
          <h3 className="font-serif text-xl font-medium">Pełny cennik</h3>

          <CategoryFilter
            categories={tableCategories}
            filter={filter}
            onSelect={applyFilter}
          />

          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Pełny cennik usług detailingu</caption>
              <thead>
                <tr className="border-b border-border bg-card text-left">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Usługa
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Zakres
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium whitespace-nowrap">
                    Czas
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-medium">
                    Cena
                  </th>
                </tr>
              </thead>
              {filteredCategories.map((category) => {
                const rows = itemsOf(category.id);
                if (!rows.length) return null;
                return (
                  <tbody key={category.id}>
                    <tr className="border-b border-border bg-muted/50">
                      <th
                        scope="rowgroup"
                        colSpan={4}
                        className="px-5 py-2.5 text-left text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
                      >
                        {category.name}
                      </th>
                    </tr>
                    {rows.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-5 py-3.5 font-medium">
                          {item.name}
                          {item.popular ? (
                            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-strong">
                              najczęściej wybierane
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {item.description}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                          {item.timeLabel}
                        </td>
                        <td className="px-5 py-3.5 text-right text-base font-semibold whitespace-nowrap tabular-nums">
                          {formatItemPrice(item)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        </Reveal>

        {/* Mobile: akordeon per kategoria, Wnętrze domyślnie otwarte. */}
        <Reveal className="mt-10 md:hidden">
          <h3 className="font-serif text-xl font-medium">Pełny cennik</h3>

          <CategoryFilter
            categories={tableCategories}
            filter={filter}
            onSelect={applyFilter}
          />

          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {filteredCategories.map((category) => {
              const rows = itemsOf(category.id);
              if (!rows.length) return null;
              const open = openMobile.includes(category.id);
              const panelId = `cennik-mobile-${category.id}`;
              return (
                <li key={category.id}>
                  <h4>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggleMobile(category.id)}
                      className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {category.name}
                      <ChevronDown
                        className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </h4>
                  <div id={panelId} hidden={!open} className="px-5 pb-4">
                    <ul className="space-y-4">
                      {rows.map((item) => (
                        <li key={item.id} className="text-sm">
                          <p className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">
                              {item.name}
                              {item.popular ? (
                                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-strong">
                                  najczęściej wybierane
                                </span>
                              ) : null}
                            </span>
                            <span className="text-base font-semibold whitespace-nowrap tabular-nums">
                              {formatItemPrice(item)}
                            </span>
                          </p>
                          {item.description ? (
                            <p className="mt-1 text-pretty text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                          {item.timeLabel ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.timeLabel}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* Zasada dopłat wprost pod cennikiem — zero niespodzianek przy odbiorze. */}
        <Reveal className="mt-6">
          <p className="text-sm text-pretty text-muted-foreground">
            Busy, auta 7-osobowe i mocne zabrudzenie: +20–40% — zawsze ustalone
            z góry, zanim zaczniemy. Rozliczamy dokładnie według cennika.
          </p>
        </Reveal>

        {/* Mikro-CTA — kwalifikacja zdjęciem zamiast „wyceny indywidualnej". */}
        <Reveal className="mt-8">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pretty">
              <span className="font-medium">Nie wiesz, która usługa?</span>{" "}
              <span className="text-muted-foreground">
                Wyślij zdjęcie — doradzimy i podamy cenę z cennika.
              </span>
            </p>
            <PhotoLink
              href={photoHref}
              section="cennik"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
            >
              <Camera className="size-4" aria-hidden />
              Wyślij zdjęcie
            </PhotoLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
