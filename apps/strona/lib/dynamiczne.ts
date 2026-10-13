import { itemPriceRange, itemVariants, type CennikData, type CennikItem } from "./cennik";
import type { Linia } from "./linie";
import type { KontaktData } from "./site";

/**
 * Dynamiczne elementy w tekstach z panelu (SEO, FAQ): znacznik w nawiasach
 * klamrowych podmieniany przy renderze strony na aktualną wartość —
 * cenę z cennika, telefon, adres… Zmiana ceny w cenniku zmienia więc od razu
 * opis w Google i odpowiedź w FAQ, bez ręcznego poprawiania tekstów.
 *
 * Składnia:
 *   {telefon} {email} {adres} {godziny} {obszar} {rok}
 *   {cena:LINIA:ID_POZYCJI}            — cena jak w cenniku (np. „od 100 zł")
 *   {cena:LINIA:ID_POZYCJI:ID_WARIANTU} — cena jednego wariantu
 *   {cena:…|FORMAT}                    — FORMAT: od | zakres | kwota | dopisek
 *
 * Moduł czysty (bez server-only) — ten sam kod liczy podgląd w panelu
 * i tekst na stronie, więc podgląd zawsze zgadza się z wynikiem.
 */

export type DaneDynamiczne = {
  cenniki: Record<Linia, CennikData>;
  kontakt: KontaktData;
};

export const FORMATY_CENY = ["auto", "od", "zakres", "kwota", "dopisek"] as const;
export type FormatCeny = (typeof FORMATY_CENY)[number];

export const OPISY_FORMATU: Record<FormatCeny, string> = {
  auto: "Jak w cenniku",
  od: "Zawsze „od …”",
  zakres: "Widełki „…–… zł”",
  kwota: "Sama liczba",
  dopisek: "Z dopiskiem (np. „za parę”)",
};

export type ProstyZnacznik = "telefon" | "email" | "adres" | "godziny" | "obszar" | "rok";

export const PROSTE_ZNACZNIKI: { id: ProstyZnacznik; etykieta: string; opis: string }[] = [
  { id: "telefon", etykieta: "Telefon", opis: "Numer z Dane firmy" },
  { id: "email", etykieta: "E-mail", opis: "Adres e-mail z Dane firmy" },
  { id: "adres", etykieta: "Adres", opis: "Ulica, kod i miejscowość" },
  { id: "godziny", etykieta: "Godziny", opis: "Opis godzin pracy z Dane firmy" },
  { id: "obszar", etykieta: "Obsługiwane miejscowości", opis: "Lista z Dane firmy" },
  { id: "rok", etykieta: "Bieżący rok", opis: "Zmienia się sam 1 stycznia" },
];

const ZNACZNIK = /\{(telefon|email|adres|godziny|obszar|rok|cena:[^{}\s]+)\}/g;

export function czyMaZnaczniki(tekst: string): boolean {
  ZNACZNIK.lastIndex = 0;
  return ZNACZNIK.test(tekst);
}

export function znacznikCeny(linia: Linia, itemId: string, wariantId: string | null, format: FormatCeny): string {
  const czesci = ["cena", linia, itemId, ...(wariantId ? [wariantId] : [])].join(":");
  return `{${czesci}${format === "auto" ? "" : `|${format}`}}`;
}

type Cena = { wartosc: string } | { problem: string };

function kwotaTekst(from: number, to: number, format: FormatCeny, prefiks: string, dopisek: string): string {
  const zakres = to > from ? `${from}–${to} zł` : `${from} zł`;
  switch (format) {
    case "od":
      return `od ${from} zł`;
    case "zakres":
      return zakres;
    case "kwota":
      return String(from);
    case "dopisek":
      return [`${prefiks}${zakres}`, dopisek].filter(Boolean).join(" ");
    default:
      return `${prefiks}${zakres}`;
  }
}

/** Cena pozycji / wariantu albo opis, dlaczego nie da się jej wstawić. */
export function cenaZCennika(
  cennik: CennikData,
  itemId: string,
  wariantId: string | null,
  format: FormatCeny,
): Cena {
  const item: CennikItem | undefined = cennik.items.find((i) => i.id === itemId);
  if (!item) return { problem: "pozycja usunięta z cennika" };
  const kategoria = cennik.categories.find((c) => c.id === item.categoryId);
  if (item.disabled || kategoria?.disabled) return { problem: `„${item.name}” jest ukryta w cenniku` };
  if (item.priceHidden) return { problem: `„${item.name}” ma ukrytą cenę` };
  const prefiks = item.pricePrefix ?? "";
  if (wariantId) {
    const w = itemVariants(item).find((v) => v.id === wariantId);
    if (!w) return { problem: `wariant „${item.name}” usunięty z cennika` };
    if (w.priceFrom <= 0) return { problem: `„${item.name} — ${w.label}” nie ma ceny` };
    return { wartosc: kwotaTekst(w.priceFrom, w.priceTo || w.priceFrom, format, prefiks, item.unit.trim()) };
  }
  const { from, to } = itemPriceRange(item);
  if (from <= 0) return { problem: `„${item.name}” nie ma ceny` };
  return { wartosc: kwotaTekst(from, to, format, prefiks, item.unit.trim()) };
}

function rozwinZnacznik(tresc: string, dane: DaneDynamiczne): Cena {
  const k = dane.kontakt;
  switch (tresc) {
    case "telefon":
      return { wartosc: k.phoneDisplay };
    case "email":
      return { wartosc: k.email };
    case "adres":
      return { wartosc: `${k.addressLine}, ${k.postalCode} ${k.city}` };
    case "godziny":
      return { wartosc: k.hoursNote };
    case "obszar":
      return { wartosc: k.serviceAreas.join(", ") };
    case "rok":
      return { wartosc: String(new Date().getFullYear()) };
  }
  // cena:LINIA:ITEM[:WARIANT][|FORMAT]
  const [sciezka = "", formatRaw] = tresc.split("|");
  const [, linia, itemId, wariantId] = sciezka.split(":");
  const format = (FORMATY_CENY as readonly string[]).includes(formatRaw ?? "")
    ? (formatRaw as FormatCeny)
    : "auto";
  if ((linia !== "detailing" && linia !== "wulkanizacja") || !itemId) {
    return { problem: "nieprawidłowy znacznik ceny" };
  }
  return cenaZCennika(dane.cenniki[linia], itemId, wariantId ?? null, format);
}

/**
 * Tekst z podmienionymi znacznikami + lista problemów (do podglądu w panelu).
 * Znacznik, którego nie da się rozwinąć, znika — na stronie lepsza dziura
 * w zdaniu niż „{cena:…}" albo nieaktualna kwota; panel pokazuje ostrzeżenie.
 */
export function rozwinTekst(tekst: string, dane: DaneDynamiczne): { tekst: string; problemy: string[] } {
  const problemy: string[] = [];
  const wynik = tekst.replace(ZNACZNIK, (_, tresc: string) => {
    const r = rozwinZnacznik(tresc, dane);
    if ("problem" in r) {
      problemy.push(r.problem);
      return "";
    }
    return r.wartosc;
  });
  // Podwójna spacja po usuniętym znaczniku — zostaje pojedyncza.
  return { tekst: problemy.length ? wynik.replace(/ {2,}/g, " ").trim() : wynik, problemy };
}

export function wstawDynamiczne(tekst: string, dane: DaneDynamiczne): string {
  return czyMaZnaczniki(tekst) ? rozwinTekst(tekst, dane).tekst : tekst;
}
