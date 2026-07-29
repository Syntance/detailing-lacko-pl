import {
  formatItemPrice,
  type CennikData,
  type CennikItem,
} from "@/lib/cennik";
import { buildPhotoContactHref } from "@/lib/photo-contact";
import type { KontaktData } from "@/lib/site";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { PhotoLink } from "./phone-link";

/**
 * Cennik 1:1 z makietą „kreskówka": trzy karty z twardą kreską i przerywanymi
 * liniami między pozycjami, pod nimi czarny pas z pakietem IN+OUT.
 *
 * Makieta nie ma akordeonu, filtrów ani tabeli „pełny cennik" (poprzednia
 * wersja miała wszystkie trzy), więc sekcja jest w całości serwerowa — jedyny
 * klient to CTA z trackingiem. Kolumny = kategorie z panelu Magazyn → Cennik
 * po id; pozycje i ceny pochodzą z panelu, ozdoby nagłówków z makiety.
 */

/** Karta pakietu w czarnym pasie — pozycja z panelu po id. */
const PAKIET_ITEM_ID = "detailing-kompletny-in-out";

/** Kolejność kolumn = kolejność z makiety (Wnętrze jako filar oferty). */
const CARD_CATEGORY_IDS = ["wnetrze", "zewnatrz", "polerowanie-korekta"];

function stripBullet(name: string): string {
  return name.replace(/^•\s*/, "");
}

/**
 * Ozdoby nagłówków kart z makiety — dekoracja, nie treść z panelu:
 * Wnętrze ma żółty nagłówek z plakietką „filar", Mycie i wosk dwa bąble piany,
 * Polerowanie podpis mono. Kategoria dodana w panelu dostaje nagłówek bez ozdób.
 */
function OzdobaNaglowka({ categoryId }: { categoryId: string }) {
  if (categoryId === "wnetrze") {
    return (
      <span className="rounded-full bg-ink px-2.5 py-[5px] font-mono text-[9px] tracking-[0.18em] text-zolty uppercase">
        filar
      </span>
    );
  }
  if (categoryId === "zewnatrz") {
    return (
      <span aria-hidden className="flex">
        <span className="size-4 rounded-full border-2 border-ink bg-zolty" />
        <span className="mt-2 -ml-[5px] size-[11px] rounded-full border-2 border-ink bg-background" />
      </span>
    );
  }
  if (categoryId === "polerowanie-korekta") {
    return (
      <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
        50–70% rys
      </span>
    );
  }
  return null;
}

function PozycjaCennika({ item }: { item: CennikItem }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-t-2 border-dashed border-kreska px-5 py-[13px] first:border-t-0">
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">
          {stripBullet(item.name)}
        </span>
        {item.description ? (
          <span className="text-xs text-pretty text-muted-foreground">
            {item.description}
          </span>
        ) : null}
      </span>
      <span className="text-lg font-bold whitespace-nowrap tabular-nums">
        {formatItemPrice(item)}
      </span>
    </li>
  );
}

export function UslugiCennik({
  cennik,
  kontakt,
}: {
  cennik: CennikData;
  kontakt: KontaktData;
}) {
  const items = cennik.items.filter((i) => !i.disabled);
  const categories = cennik.categories.filter((c) => !c.disabled);

  // Kolumny: najpierw kategorie z makiety w jej kolejności, potem ewentualne
  // dodane w panelu — żadna nie znika ze strony po edycji.
  const cardCategories = [
    ...CARD_CATEGORY_IDS.map((id) => categories.find((c) => c.id === id)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c),
    ),
    ...categories.filter(
      (c) => c.id !== "pakiety" && !CARD_CATEGORY_IDS.includes(c.id),
    ),
  ];

  const pakiet = items.find((item) => item.id === PAKIET_ITEM_ID);
  const photoHref = buildPhotoContactHref(kontakt);

  return (
    <section id="cennik" aria-labelledby="cennik-heading" className="scroll-mt-24">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="w-max -rotate-[1.5deg] rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase">
              01 · cennik
            </p>
            <h2
              id="cennik-heading"
              className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
            >
              {cennik.settings.heading}
            </h2>
          </div>
          {cennik.settings.subheading ? (
            <p className="max-w-[34ch] border-l-4 border-zolty pl-3.5 text-[15px] leading-[1.5] font-medium text-pretty">
              {cennik.settings.subheading}
            </p>
          ) : null}
        </Reveal>

        <RevealStagger className="grid items-start gap-[22px] lg:grid-cols-3">
          {cardCategories.map((category) => {
            const rows = items
              .filter((item) => item.categoryId === category.id)
              .sort((a, b) => a.order - b.order);
            if (!rows.length) return null;
            const filar = category.id === "wnetrze";
            return (
              <RevealItem key={category.id}>
                <article
                  className={`overflow-hidden rounded-2xl border-[3px] border-ink bg-background ${
                    filar ? "cien-zolty-6" : "cien-6"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-[18px] ${
                      filar ? "bg-zolty" : ""
                    }`}
                  >
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <OzdobaNaglowka categoryId={category.id} />
                  </div>
                  <ul className="flex flex-col">
                    {rows.map((item) => (
                      <PozycjaCennika key={item.id} item={item} />
                    ))}
                  </ul>
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        {pakiet ? (
          <Reveal>
            <div className="cien-zolty-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border-[3px] border-ink bg-ink px-[26px] py-[22px] text-background">
              <div className="flex flex-col gap-1">
                <p className="text-[19px] font-bold">
                  {stripBullet(pakiet.name)} —{" "}
                  <span className="text-zolty">{formatItemPrice(pakiet)}</span>
                </p>
                {cennik.settings.noteText ? (
                  <p className="text-[13.5px] text-pretty text-noc-szary">
                    {cennik.settings.noteText}
                  </p>
                ) : null}
              </div>
              <PhotoLink
                href={photoHref}
                section="cennik"
                className="rounded-full border-[3px] border-zolty bg-zolty px-[22px] py-[13px] text-[15px] font-bold whitespace-nowrap text-ink focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
              >
                {cennik.settings.noteCtaLabel}
              </PhotoLink>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
