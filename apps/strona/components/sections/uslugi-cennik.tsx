import {
  formatItemPrice,
  type CennikData,
  type CennikItem,
} from "@/lib/cennik";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { BookingLink } from "./phone-link";

/**
 * Cennik 1:1 z makietą „kreskówka": karty kategorii z twardą kreską i
 * przerywanymi liniami — pełny cennik pozycja po pozycji, pod nimi czarny pas
 * ze wszystkimi pakietami (cena + krótki opis + czas).
 *
 * Makieta nie ma akordeonu, filtrów ani tabeli „pełny cennik" (poprzednia
 * wersja miała wszystkie trzy), więc sekcja jest w całości serwerowa — jedyny
 * klient to CTA z trackingiem. Kolumny = kategorie z panelu Magazyn → Cennik
 * po id; pozycje i ceny pochodzą z panelu, ozdoby nagłówków z makiety.
 */

/**
 * Pakiety idą do czarnego pasa POD kartami kategorii (nie jako czwarta
 * kolumna) — to podsumowanie oferty po przejrzeniu pełnego cennika: całe auto
 * w jednej wizycie.
 */
const PAKIETY_CATEGORY_ID = "pakiety";

/** Kolejność kolumn = kolejność z makiety (Wnętrze jako filar oferty). */
const CARD_CATEGORY_IDS = ["wnetrze", "zewnatrz", "polerowanie-korekta"];

function stripBullet(name: string): string {
  return name.replace(/^•\s*/, "");
}

/**
 * Naklejki narzędzi wychodzące poza prawy górny róg karty — jedna na
 * kategorię, w języku hero (grafika z wypaloną białą obwódką + czarna kreska
 * marki dookoła, obie w pliku PNG, zero filtrów CSS).
 *
 * Zastąpiły ozdoby w nagłówkach (plakietka „filar", bąble piany, podpis
 * „50–70% rys") — naklejka zajmuje dokładnie ten róg, więc obie rzeczy naraz
 * by na siebie nachodziły.
 *
 * `szerokosc` jest per pozycja, bo proporcje się różnią: odkurzacz i polerka
 * są szerokie (~1,86:1), sygnet niemal kwadratowy (1,07:1). Przy jednakowej
 * szerokości sygnet byłby dwa razy wyższy od reszty, więc dostaje mniejszą —
 * wyrównujemy WYSOKOŚĆ, czyli realny ciężar wizualny.
 *
 * Konsekwencja dla obwódek wypalonych w plikach: skoro sygnet wyświetla się
 * w 96 px, a pozostałe w 144 px, to jego pierścienie musiały być GRUBSZE
 * w źródle, żeby po przeskalowaniu dać na ekranie te same ~2,7 px. Liczone
 * są więc z docelowej szerokości wyświetlania, nie z szerokości pliku.
 */
const NAKLEJKI: Record<
  string,
  {
    src: string;
    width: number;
    height: number;
    alt: string;
    szerokosc: string;
    obrot: string;
    /** Dodatkowe przesunięcie względem domyślnego rogu — `translate-x/y`. */
    przesuniecie: string;
  }
> = {
  wnetrze: {
    src: "/brand/odkurzacz.png",
    width: 1547,
    height: 860,
    alt: "Odkurzacz — sprzątanie i pranie tapicerki",
    szerokosc: "w-36 sm:w-[168px]",
    obrot: "rotate-0",
    przesuniecie: "-translate-x-[30px]",
  },
  zewnatrz: {
    src: "/brand/sygnet-naklejka.png",
    width: 1360,
    height: 1280,
    alt: "Lanca z pianą aktywną — mycie detailingowe",
    szerokosc: "w-24 sm:w-28",
    obrot: "rotate-0",
    przesuniecie: "-translate-x-[50px] -translate-y-5",
  },
  "polerowanie-korekta": {
    src: "/brand/maszyna-polerska.png",
    width: 1789,
    height: 988,
    alt: "Maszyna polerska — polerowanie usuwa 50–70% rys",
    szerokosc: "w-36 sm:w-[168px]",
    obrot: "rotate-[30deg]",
    przesuniecie: "",
  },
};

function PozycjaCennika({ item }: { item: CennikItem }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-t-2 border-dashed border-kreska px-5 py-[13px] first:border-t-0">
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold">
          {stripBullet(item.name)}
        </span>
        {item.description ? (
          // 13px/1,5 w `text-tekst`, nie 12px w `text-muted-foreground`: opisy
          // mają po 3–4 linie w wąskiej kolumnie, a #6B7075 daje na bieli 5:1 —
          // ledwie ponad progiem AA. Hierarchię wobec nazwy trzyma stopień
          // i grubość (15px semibold vs 13px regular), nie wyblakły kolor.
          // Ten sam stopień co opisy pakietów w czarnym pasie nad kartami.
          <span className="text-[13px] leading-[1.5] text-pretty text-tekst">
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

/**
 * Pakiet w czarnym pasie: nazwa, cena, mały opis i czas trwania.
 *
 * `min-w-0` na `li` i na wierszu, a cena bez `whitespace-nowrap`: pozycje
 * cennika mogą mieć dopisek przy kwocie („1000–1300 zł wg rozmiaru auta").
 * Nierozrywalny ciąg tej długości rozpychał kolumnę gridu (grid-item ma
 * domyślnie `min-width: auto`), przez co na telefonie CAŁA strona robiła się
 * szersza od ekranu — a `position: fixed` podglądu Efektów dziedziczył tę
 * zawyżoną szerokość i ucinał zdjęcia.
 */
function PakietPozycja({ item }: { item: CennikItem }) {
  return (
    <li className="flex min-w-0 flex-col gap-1.5 border-t-2 border-dashed border-noc-szary/40 pt-3.5">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="min-w-0 text-[15px] font-semibold">
          {stripBullet(item.name)}
        </span>
        <span className="text-lg font-bold text-balance text-zolty tabular-nums">
          {formatItemPrice(item)}
        </span>
      </div>
      {item.description ? (
        <span className="text-[13px] leading-[1.5] text-pretty text-noc-szary">
          {item.description}
        </span>
      ) : null}
      {item.timeLabel || item.popular ? (
        <span className="etykieta-sm flex flex-wrap items-center gap-2">
          {item.popular ? (
            <span className="rounded-full bg-zolty px-2 py-[3px] text-ink">
              najczęściej wybierane
            </span>
          ) : null}
          {item.timeLabel ? (
            <span className="text-noc-szary">{item.timeLabel}</span>
          ) : null}
        </span>
      ) : null}
    </li>
  );
}

export function UslugiCennik({ cennik }: { cennik: CennikData }) {
  const items = cennik.items.filter((i) => !i.disabled);
  const categories = cennik.categories.filter((c) => !c.disabled);

  // Kolumny: najpierw kategorie z makiety w jej kolejności, potem ewentualne
  // dodane w panelu — żadna nie znika ze strony po edycji.
  const cardCategories = [
    ...CARD_CATEGORY_IDS.map((id) =>
      categories.find((c) => c.id === id),
    ).filter((c): c is NonNullable<typeof c> => Boolean(c)),
    ...categories.filter(
      (c) => c.id !== PAKIETY_CATEGORY_ID && !CARD_CATEGORY_IDS.includes(c.id),
    ),
  ];

  const pakietyKategoria = categories.find((c) => c.id === PAKIETY_CATEGORY_ID);
  const pakiety = items
    .filter((item) => item.categoryId === PAKIETY_CATEGORY_ID)
    .sort((a, b) => a.order - b.order);

  return (
    <section
      id="cennik"
      aria-labelledby="cennik-heading"
      className="scroll-mt-24"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col gap-[34px] px-5 py-16 md:px-6 md:py-[68px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="etykieta w-max -rotate-[1.5deg] rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5">
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
            const naklejka = NAKLEJKI[category.id];
            return (
              // relative: kotwica dla naklejki narzędzia — SIBLING <article>,
              // nie jego dziecko, bo <article> ma overflow-hidden (potrzebne
              // dla zaokrąglonych rogów nagłówka) i przyciąłby naklejkę
              // wychodzącą poza kartę. Ten sam wzorzec co lanca w hero:
              // sekcja nadrzędna (bez overflow-hidden) jest jedynym
              // ograniczeniem, karta go nie ma.
              <RevealItem key={category.id} className="relative">
                <article
                  className={`overflow-hidden rounded-2xl border-[3px] border-ink bg-background ${
                    filar ? "cien-zolty-6" : "cien-6"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 border-b-[3px] border-ink px-5 py-[18px] ${
                      filar ? "bg-zolty" : ""
                    }`}
                  >
                    <h3 className="text-xl font-bold">{category.name}</h3>
                  </div>
                  <ul className="flex flex-col">
                    {rows.map((item) => (
                      <PozycjaCennika key={item.id} item={item} />
                    ))}
                  </ul>
                </article>
                {naklejka ? (
                  <img
                    src={naklejka.src}
                    alt={naklejka.alt}
                    width={naklejka.width}
                    height={naklejka.height}
                    // Zwis w prawo dopiero od `sm`: obrót o 30° rozszerza
                    // prostokąt otaczający o ~10–16 px z każdej strony, więc na
                    // 375 px sam zwis 28 px wypychał stronę do 399 px. Poziome
                    // przepełnienie rozciąga layout viewport, przez co
                    // `position: fixed` podglądu Efektów wychodzi poza ekran.
                    className={`pointer-events-none absolute -top-[14px] right-0 z-10 sm:-right-[28px] ${naklejka.szerokosc} ${naklejka.obrot} ${naklejka.przesuniecie}`}
                  />
                ) : null}
              </RevealItem>
            );
          })}
        </RevealStagger>

        {pakiety.length ? (
          <Reveal>
            <div className="cien-zolty-6 flex flex-col gap-[22px] rounded-2xl border-[3px] border-ink bg-ink px-[26px] py-6 text-background">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex flex-col gap-1.5">
                  <p className="etykieta-sm text-zolty">pakiety</p>
                  <h3 className="text-[22px] leading-[1.1] font-bold">
                    {pakietyKategoria?.name ?? "Pakiety"}
                  </h3>
                  {cennik.settings.noteText ? (
                    <p className="max-w-[62ch] text-[13.5px] text-pretty text-noc-szary">
                      {cennik.settings.noteText}
                    </p>
                  ) : null}
                </div>
                <BookingLink
                  section="cennik"
                  className="rounded-full border-[3px] border-zolty bg-zolty px-[22px] py-[13px] text-[15px] font-bold whitespace-nowrap text-ink focus-visible:ring-3 focus-visible:ring-background/60 focus-visible:outline-none"
                >
                  {cennik.settings.noteCtaLabel}
                </BookingLink>
              </div>
              <ul className="grid gap-x-8 gap-y-[18px] sm:grid-cols-2">
                {pakiety.map((item) => (
                  <PakietPozycja key={item.id} item={item} />
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
