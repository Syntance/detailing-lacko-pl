"use client";

import { useId, useState } from "react";
import { ChevronDown, Clock, Phone, Sparkles } from "lucide-react";
import {
  formatItemPrice,
  type CennikData,
} from "@/lib/cennik";
import type { KontaktData } from "@/lib/site";
import { trackPricingExpand } from "@/lib/track";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { PhoneLink } from "./phone-link";

/**
 * Sekcja „Usługi i ceny" — pytanie: „co dokładnie robisz i za ile?" (brief §2).
 * 3 karty + rozwijana pełna tabela. Dane z panelu Magazyn → Cennik.
 */
export function UslugiCennik({
  cennik,
  kontakt,
}: {
  cennik: CennikData;
  kontakt: KontaktData;
}) {
  const [expanded, setExpanded] = useState(false);
  const tableId = useId();

  const categories = cennik.categories
    .filter((c) => !c.disabled)
    .sort((a, b) => a.order - b.order);
  const items = cennik.items.filter((i) => !i.disabled);

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

        <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <RevealItem key={category.id} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <h3 className="font-serif text-xl font-medium">{category.name}</h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-primary-strong">
                    od {category.priceFrom} zł
                  </span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  {category.timeLabel}
                </p>
                {category.highlight ? (
                  <p className="mt-auto flex items-start gap-1.5 border-t border-border pt-4 text-sm text-foreground/90">
                    <Sparkles
                      className="mt-0.5 size-4 shrink-0 text-primary-strong"
                      aria-hidden
                    />
                    {category.highlight}
                  </p>
                ) : null}
              </article>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="mt-8">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={tableId}
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              trackPricingExpand(next);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary-strong/60 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {expanded
              ? cennik.settings.collapseLabel
              : cennik.settings.expandLabel}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            id={tableId}
            hidden={!expanded}
            className="mt-6 overflow-x-auto rounded-2xl border border-border"
          >
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">
                Pełny cennik usług detailingu
              </caption>
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
              {categories.map((category) => {
                const rows = items
                  .filter((item) => item.categoryId === category.id)
                  .sort((a, b) => a.order - b.order);
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
                            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary-strong">
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
                        <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">
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

        <Reveal className="mt-10">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-lg font-medium">
                {cennik.settings.noteTitle}
              </h3>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {cennik.settings.noteText}
              </p>
            </div>
            <PhoneLink
              phoneE164={kontakt.phoneE164}
              section="cennik"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
            >
              <Phone className="size-4" aria-hidden />
              {cennik.settings.noteCtaLabel}
            </PhoneLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
