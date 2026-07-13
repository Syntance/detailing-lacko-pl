"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@moduly/types";
import { trackFaqOpen } from "@/lib/track";
import { Reveal } from "@/components/motion/reveal";

/**
 * FAQ — pozostałe obiekcje (brief §6). Treść edytowalna w Magazyn → CMS.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => a.order - b.order);
  if (!sorted.length) return null;

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Reveal>
          <h2
            id="faq-heading"
            className="font-serif text-3xl leading-tight font-medium md:text-4xl"
          >
            Częste pytania
          </h2>
        </Reveal>

        <Reveal className="mt-8">
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {sorted.map((item) => {
              const open = openId === item.id;
              return (
                <li key={item.id}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`faq-panel-${item.id}`}
                      onClick={() => {
                        setOpenId(open ? null : item.id);
                        if (!open) trackFaqOpen(item.question);
                      }}
                      className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium transition-colors hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {item.question}
                      <ChevronDown
                        className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${item.id}`}
                    hidden={!open}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-pretty text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
