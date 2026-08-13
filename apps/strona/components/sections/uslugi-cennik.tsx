import Image from "next/image";
import {
  formatItemPrice,
  formatVariantPrice,
  itemRequires,
  itemVariants,
  wymien,
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
 * Czy przy pozycji stoi realna KWOTA — pozycje z `priceHidden` pokazują tekst
 * („Zapytaj o cenę", „Wycena indywidualna"), a wtedy dopisek o VAT nie ma do
 * czego się odnieść.
 */
function maKwote(item: CennikItem): boolean {
  return !item.priceHidden;
}

/**
 * Dopisek o podatku przy kwocie — treść z panelu (Magazyn → Cennik →
 * Ustawienia sekcji, pole „Dopisek przy każdej cenie"): „z VAT", „netto",
 * „brutto", co właściciel wpisze. Puste pole = same kwoty, bez dopisków.
 *
 * Stoi przy KAŻDEJ kwocie, nie tylko w plakietce nad kartami: w sekcję wchodzi
 * się też z linku „#cennik" i z wyszukiwarki, czyli czytanie zaczyna się od
 * środka, a wtedy jedna plakietka na górze zostaje poza kadrem.
 *
 * POD kwotą (`block`), nie obok niej: wiersz cennika to `justify-between`, więc
 * każdy piksel kolumny z ceną schodzi z kolumny z nazwą i opisem. Wersja
 * inline („150 zł Z VAT") zabierała jej ~45 px — mono 11px z trackingiem
 * 0,16em ma prawie tyle co sama kwota — i cała trójka kart rosła o ~9%
 * wysokości, bo nazwy pozycji zaczęły się łamać na dwie linie. W bloku
 * dopisek (~40 px) mieści się pod kwotą (55 px dla „150 zł") i kolumna
 * z ceną nie rośnie ani o piksel. To dlatego pole w panelu ma być KRÓTKIE
 * (2–3 słowa) — dłuższy tekst zawinie się pod kwotą na kilka linii.
 *
 * `etykieta-sm` (mono 11px, weight 500) sam zdejmuje odziedziczone `text-lg`
 * i `font-bold` kwoty, więc dopisek nie konkuruje z liczbą — tak jak reszta
 * meta w kartach (czas realizacji, plakietki).
 */
function DopisekPodatek({
  tekst,
  ciemne = false,
}: {
  tekst: string;
  ciemne?: boolean;
}) {
  if (!tekst) return null;
  return (
    <span
      className={`etykieta-sm block leading-none ${
        ciemne ? "text-noc-szary" : "text-tekst"
      }`}
    >
      {tekst}
    </span>
  );
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
    /**
     * Maksymalna szerokość WYŚWIETLANIA (nie pliku) — z niej next/image liczy
     * srcset. Musi iść w parze z `szerokosc`: zaniżona da rozmyty raster,
     * zawyżona pobiera nadmiarowe piksele.
     */
    sizes: string;
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
    sizes: "168px",
    obrot: "rotate-0",
    przesuniecie: "-translate-x-[30px]",
  },
  zewnatrz: {
    src: "/brand/sygnet-naklejka.png",
    width: 1360,
    height: 1280,
    alt: "Lanca z pianą aktywną — mycie detailingowe",
    szerokosc: "w-24 sm:w-28",
    sizes: "112px",
    obrot: "rotate-0",
    przesuniecie: "-translate-x-[50px] -translate-y-5",
  },
  "polerowanie-korekta": {
    src: "/brand/maszyna-polerska.png",
    width: 1789,
    height: 988,
    alt: "Maszyna polerska — polerowanie usuwa 50–70% rys",
    szerokosc: "w-36 sm:w-[168px]",
    sizes: "168px",
    obrot: "rotate-[30deg]",
    przesuniecie: "",
  },
};

/**
 * Warianty pod opisem pozycji: etykieta ↔ cena, jedna linia na wariant.
 *
 * Wariant zastępuje trzy osobne pozycje z tym samym opisem (one step
 * w trzech rozmiarach auta), więc opis pada RAZ, a klient i tak widzi cenę
 * dla swojego auta bez wchodzenia w rezerwację.
 *
 * `<dl>`, nie `<ul>`: to pary etykieta–wartość, więc czytnik ekranu ogłasza
 * „hatchback / małe: 600 zł" zamiast dwóch niepowiązanych tekstów.
 *
 * Renderuje się na PEŁNEJ szerokości wiersza (patrz `PozycjaCennika`), nie
 * w kolumnie z nazwą i opisem — dzięki temu kwoty wariantów kończą się na tej
 * samej pionowej linii co cena główna nad nimi. Wewnątrz lewej kolumny
 * wyrównywały się do jej prawej krawędzi, czyli o szerokość kolumny z ceną
 * plus odstęp za wcześnie: trzy kwoty pod ceną nadrzędną wisiały w powietrzu
 * zamiast tworzyć z nią jedną kolumnę liczb.
 */
function WariantyPozycji({
  item,
  dopisek,
}: {
  item: CennikItem;
  dopisek: string;
}) {
  const variants = itemVariants(item);
  if (!variants.length) return null;
  return (
    <dl className="mt-0.5 flex flex-col gap-1">
      {variants.map((v) => (
        <div
          key={v.id}
          className="flex items-baseline justify-between gap-3 border-t border-dashed border-kreska/70 pt-1"
        >
          <dt className="text-[13px] leading-[1.4] text-tekst">{v.label}</dt>
          <dd className="text-right text-[13px] font-bold whitespace-nowrap tabular-nums">
            {formatVariantPrice(item, v)}
            {maKwote(item) ? <DopisekPodatek tekst={dopisek} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Nazwy wymaganych dodatków tej pozycji — z pominięciem tych ukrytych na
 * stronie (skoro nie da się ich zobaczyć w cenniku, wypisanie ich tu tylko by
 * myliło) i bez prefiksu „• " składowych (jak `stripBullet` dla nazwy głównej).
 */
function wymaganeNazwy(item: CennikItem, allItems: CennikItem[]): string[] {
  const byId = new Map(allItems.map((i) => [i.id, i]));
  return itemRequires(item)
    .map((id) => byId.get(id))
    .filter((i): i is CennikItem => i != null && !i.disabled)
    .map((i) => stripBullet(i.name));
}

/**
 * „Wymaga: Dekontaminacja lakieru" — dodatki, które trzeba dobrać razem z tą
 * pozycją (patrz `requiredItemIds` w panelu). Klient widzi to już w cenniku,
 * zanim jeszcze dotrze do widgetu rezerwacji, gdzie wybór i tak dobierze je
 * automatycznie — chodzi o to, żeby nie zaskoczyła go zmiana wyboru.
 *
 * Ten sam stopień/kolor co opis (13px, `text-tekst`) — to dalej informacja
 * o zakresie usługi, nie osobna kategoria treści jak warianty (tam zmienia
 * się cena, tu nie).
 */
function WymaganeDodatki({
  item,
  allItems,
}: {
  item: CennikItem;
  allItems: CennikItem[];
}) {
  const nazwy = wymaganeNazwy(item, allItems);
  if (!nazwy.length) return null;
  return (
    <span className="text-[13px] leading-[1.5] text-pretty text-tekst">
      <span className="font-semibold">Wymaga:</span> {wymien(nazwy)}
    </span>
  );
}

function PozycjaCennika({
  item,
  allItems,
  dopisek,
}: {
  item: CennikItem;
  allItems: CennikItem[];
  dopisek: string;
}) {
  return (
    // Kolumna, nie jeden wiersz: warianty muszą wyjść POZA parę
    // „opis ↔ cena", żeby rozciągnąć się na całą szerokość wiersza i wyrównać
    // kwoty do tej samej pionowej linii co cena główna. `gap-1` odtwarza
    // odstęp, który warianty miały wcześniej jako ostatnie dziecko lewej
    // kolumny — pozycja bez wariantów wygląda dokładnie tak jak przedtem.
    <li className="flex flex-col gap-1 border-t-2 border-dashed border-kreska px-5 py-[13px] first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
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
          <WymaganeDodatki item={item} allItems={allItems} />
        </span>
        {/* `max-w-[145px]` + bez `whitespace-nowrap`: samo zdjęcie nowrap NIE
            wystarczyło — w tym wierszu (`justify-between`, cena bez
            `flex-grow`) flex nigdy nie wchodzi w tryb kurczenia, dopóki wiersz
            się mieści, więc cena i tak renderowała się w naturalnej,
            jednoliniowej szerokości, a CAŁY nadmiar szedł do kolumny z opisem
            (`flex-grow` tam jest ustawiony) — dokładnie odwrotnie, niż trzeba.
            Realne pomiary (Space Grotesk 18px bold): najdłuższa zwykła cena
            w tym komponencie to „80 zł za parę" = 112px, domyślne
            „Zapytaj o cenę" = 129px, custom tekst przy ukrytej cenie
            (np. „Wycena indywidualna") = 191px. 145px zostawia zapas nad
            zwykłymi cenami, a dłuższy tekst zmusza do zawinięcia — `text-balance`
            wtedy dzieli go na równe linie zamiast jednego wiersza + ogona.
            Dopisek o podatku idzie POD kwotą (patrz `DopisekPodatek`), więc
            nie wchodzi w te szerokości — mierzone są dalej samą kwotą. */}
        <span className="max-w-[145px] text-right text-lg font-bold text-balance tabular-nums">
          {formatItemPrice(item)}
          {maKwote(item) ? <DopisekPodatek tekst={dopisek} /> : null}
        </span>
      </div>
      <WariantyPozycji item={item} dopisek={dopisek} />
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
 * zawyżoną szerokość i ucinał zdjęcia. Lista jest dziś multicol, nie gridem,
 * ale `min-w-0` zostaje: wewnętrzny wiersz nazwa↔cena to dalej flex, więc bez
 * niego kwota nadal wypychałaby nazwę poza kolumnę.
 *
 * `break-inside-avoid` + `mb-[18px]`: w kolumnach CSS pozycja mogłaby się
 * przełamać w połowie na granicy kolumn (nazwa u dołu lewej, warianty
 * u góry prawej), a odstęp pionowy między pozycjami nie leci już z `row-gap`
 * listy — multicol go nie zna.
 */
function PakietPozycja({
  item,
  allItems,
  dopisek,
}: {
  item: CennikItem;
  allItems: CennikItem[];
  dopisek: string;
}) {
  const wymagane = wymaganeNazwy(item, allItems);
  return (
    <li className="mb-[18px] flex min-w-0 break-inside-avoid flex-col gap-1.5 border-t-2 border-dashed border-noc-szary/40 pt-3.5">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="min-w-0 text-[15px] font-semibold">
          {stripBullet(item.name)}
        </span>
        <span className="text-right text-lg font-bold text-balance text-zolty tabular-nums">
          {formatItemPrice(item)}
          {maKwote(item) ? <DopisekPodatek tekst={dopisek} ciemne /> : null}
        </span>
      </div>
      {item.description ? (
        <span className="text-[13px] leading-[1.5] text-pretty text-noc-szary">
          {item.description}
        </span>
      ) : null}
      {wymagane.length ? (
        <span className="text-[13px] leading-[1.5] text-pretty text-noc-szary">
          <span className="font-semibold">Wymaga:</span> {wymien(wymagane)}
        </span>
      ) : null}
      {/* Warianty pakietu — te same pary etykieta↔cena co w kartach kategorii,
          przełożone na kontrast czarnego pasa (żółta kwota, szara etykieta). */}
      {itemVariants(item).length ? (
        <dl className="flex flex-col gap-1">
          {itemVariants(item).map((v) => (
            <div
              key={v.id}
              className="flex items-baseline justify-between gap-3 border-t border-dashed border-noc-szary/30 pt-1"
            >
              <dt className="text-[13px] leading-[1.4] text-noc-szary">
                {v.label}
              </dt>
              <dd className="text-right text-[13px] font-bold whitespace-nowrap text-zolty tabular-nums">
                {formatVariantPrice(item, v)}
                {maKwote(item) ? <DopisekPodatek tekst={dopisek} ciemne /> : null}
              </dd>
            </div>
          ))}
        </dl>
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
  const categories = cennik.categories.filter((c) => !c.disabled);
  /**
   * Ukrycie KATEGORII w panelu („Widoczna na stronie") ukrywa też wszystkie jej
   * pozycje — pozycja bez swojej karty nie ma na stronie miejsca, w którym
   * mogłaby stanąć. Filtr musi być tutaj, na wspólnej liście, bo z `items`
   * korzystają trzy rzeczy naraz: kolumny kategorii, czarny pas z pakietami
   * i nazwy w „Wymaga: …". Kolumny sprawdzały widoczność same (renderują tylko
   * kategorie z `categories`), ale pozostałe dwie brały pozycje wprost — więc
   * wyłączenie kategorii „Pakiety" nie ruszało czarnego pasa, a dodatek
   * z wyłączonej kategorii dalej dawało się wyczytać z „Wymaga: …".
   *
   * To samo, co robi widget rezerwacji (`grupyRezerwacji`): grupy leci z
   * kategorii przefiltrowanych po `disabled`, więc pozycja z ukrytej kategorii
   * nie ma jak się tam pokazać.
   */
  const widoczneKategorie = new Set(categories.map((c) => c.id));
  const items = cennik.items.filter(
    (i) => !i.disabled && widoczneKategorie.has(i.categoryId),
  );

  // Oba teksty o podatku są z panelu (Ustawienia sekcji) — puste pole znaczy
  // „nie pokazuj", więc właściciel może wyłączyć plakietkę, dopiski albo obie
  // rzeczy naraz, bez ruszania kodu. `trim()`, bo samo wyczyszczenie pola
  // w przeglądarce zostawia czasem spację, a ta wyrenderowałaby pustą pigułkę.
  const dopisekPodatek = cennik.settings.vatSuffix.trim();
  const plakietkaPodatek = cennik.settings.vatNote.trim();

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

  // `pakietyKategoria` bierze się z listy PO odsianiu ukrytych, więc jego brak
  // znaczy „kategoria wyłączona w panelu" — i wtedy czarny pas w ogóle nie
  // wchodzi do drzewa (warunek przy renderze), zamiast lecieć na fallbackowym
  // tytule „Pakiety" nad pozycjami, których nie powinno tam być.
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
            {/* Druga plakietka obok „01 · cennik": informacja o podatku musi
                paść RAZ, pełnym zdaniem, na poziomie całej sekcji (dopiski przy
                kwotach mówią „z VAT", ale nie „wszystkie ceny"). Ten sam język
                co badge sekcji — pigułka z twardą kreską i lekkim obrotem
                w drugą stronę — tylko biała i o stopień mniejsza, żeby nie
                zabierała numeracji sekcji pierwszeństwa. Treść z panelu;
                puste pole = zostaje sam badge sekcji. */}
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="etykieta w-max -rotate-[1.5deg] rounded-full border-2 border-ink bg-zolty px-3.5 py-1.5">
                01 · cennik
              </p>
              {plakietkaPodatek ? (
                <p className="etykieta-sm w-max rotate-[1.5deg] rounded-full border-2 border-ink bg-background px-3 py-1.5">
                  {plakietkaPodatek}
                </p>
              ) : null}
            </div>
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
                      <PozycjaCennika
                        key={item.id}
                        item={item}
                        allItems={items}
                        dopisek={dopisekPodatek}
                      />
                    ))}
                  </ul>
                </article>
                {naklejka ? (
                  // next/image, nie surowy <img>: pliki źródłowe mają 1360–1789
                  // px szerokości (obwódki wypalane w dużym rastrze), a na
                  // ekranie schodzą do 96–168 px. Surowe PNG-i szły w całości —
                  // 686 KB pobierane EAGER, zanim jeszcze ktokolwiek doscrollował
                  // do cennika, konkurując pasmem ze zdjęciem hero (LCP).
                  // Optymalizator skaluje do srcsetu z `sizes` i podaje AVIF/WebP,
                  // a domyślny `loading="lazy"` zdejmuje je ze ścieżki krytycznej.
                  // `h-auto`: szerokość narzuca klasa, więc wysokość musi zostać
                  // policzona z proporcji pliku, nie z atrybutu `height`.
                  <Image
                    src={naklejka.src}
                    alt={naklejka.alt}
                    width={naklejka.width}
                    height={naklejka.height}
                    sizes={naklejka.sizes}
                    // Zwis w prawo dopiero od `sm`: obrót o 30° rozszerza
                    // prostokąt otaczający o ~10–16 px z każdej strony, więc na
                    // 375 px sam zwis 28 px wypychał stronę do 399 px. Poziome
                    // przepełnienie rozciąga layout viewport, przez co
                    // `position: fixed` podglądu Efektów wychodzi poza ekran.
                    className={`pointer-events-none absolute -top-[14px] right-0 z-10 h-auto sm:-right-[28px] ${naklejka.szerokosc} ${naklejka.obrot} ${naklejka.przesuniecie}`}
                  />
                ) : null}
              </RevealItem>
            );
          })}
        </RevealStagger>

        {pakietyKategoria && pakiety.length ? (
          <Reveal>
            <div className="cien-zolty-6 flex flex-col gap-[22px] rounded-2xl border-[3px] border-ink bg-ink px-[26px] py-6 text-background">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex flex-col gap-1.5">
                  <p className="etykieta-sm text-zolty">pakiety</p>
                  <h3 className="text-[22px] leading-[1.1] font-bold">
                    {pakietyKategoria.name}
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
              {/* Kolumny CSS, nie grid: w gridzie oba pola jednego wiersza
                  mają wspólną wysokość, więc pakiet z trzema wariantami
                  („Przygotowanie do sprzedaży PRO") podnosił sąsiada obok —
                  pod krótkim pakietem zostawała pusta dziura, a następny
                  wchodził dopiero pod najwyższym. W multicol każda pozycja
                  kończy się tam, gdzie kończy się jej treść, a przeglądarka
                  sama rozkłada je tak, żeby obie kolumny miały zbliżoną
                  wysokość — bez dziur i bez rozdzielania listy w JSX (jeden
                  `<ul>`, kolejność DOM = kolejność z panelu).
                  `-mb-[18px]` zdejmuje margines spod ostatniej pozycji
                  w kolumnie, żeby czarny pas kończył się na swoim `py-6`. */}
              <ul className="-mb-[18px] gap-x-8 sm:columns-2">
                {pakiety.map((item) => (
                  <PakietPozycja
                    key={item.id}
                    item={item}
                    allItems={items}
                    dopisek={dopisekPodatek}
                  />
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
