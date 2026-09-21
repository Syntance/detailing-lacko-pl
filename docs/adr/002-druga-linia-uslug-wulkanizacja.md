# ADR 002 — Druga linia usług (Wulkanizacja) na tej samej makiecie

Data: 2026-09-15 · Status: przyjęte

## Kontekst

Warsztat dokłada wulkanizację (wymiana i wyważanie opon, naprawa przebić,
przechowywanie kół). Strona ma pokazać ją jako drugą markę pod jednym dachem:
w nagłówku „Detailing Łącko / Wulkanizacja", własna strona `/wulkanizacja`
w tym samym języku makiety „kreskówka", ale z żółtym podmienionym na
komiksową czerwień, z przejściem „przełożenia kartki" między stronami, oraz
analityką rozdzielającą obie linie.

## Rozważane opcje

1. **Kopia sekcji** (`hero-wulkanizacja`, `cennik-wulkanizacja`, …) z twardo
   wpisaną czerwienią — szybko, ale dwa razy tyle kodu do utrzymania.
2. **Token akcentu + zakres atrybutu** — komponenty renderują się po
   semantycznym `--akcent`; strona `/wulkanizacja` przepina go na czerwień
   atrybutem `data-marka` na wrapperze. Dane per linia w osobnych blobach.
3. **Osobna aplikacja / subdomena** — pełna izolacja, ale podwójny deploy,
   panel i kalendarz; nieproporcjonalne do jednego warsztatu.

## Decyzja

Opcja 2.

- **Kolor:** `--zolty` zostaje literałem, komponenty używają `--akcent`
  (`bg-akcent`, `cien-akcent-*`), `[data-marka="wulkanizacja"]` w
  `globals.css` przepina `--akcent`, `--primary`, `--primary-strong`,
  `--ring` na czerwień `#f0392e` (kontrast ciemnej kreski ~4,9:1, jak na
  żółtym; do tekstu na bieli wariant „mocny").
- **Dane:** osobne bloby `cennik-wulkanizacja`, `faq-wulkanizacja`,
  `seo-wulkanizacja` (schematy Zod wspólne z detailingiem, domyślki
  w `lib/cennik-wulkanizacja.ts`, `lib/faq-wulkanizacja.ts`,
  `lib/seo-wulkanizacja.ts`) i wiersz `page_content.wulkanizacja` na zdjęcie
  hero. Kontakt i godziny pracy są wspólne — jeden warsztat, jeden człowiek.
  SEO wulkanizacji trzyma tylko pola strony; indeksowanie i roboty AI są
  jedne dla całej witryny (główne SEO). Pusty opis SEO = opis złożony z cen
  w cenniku, żeby kwoty w Google nie rozjeżdżały się z cennikiem.
- **Panel:** osobna zakładka „Wulkanizacja" w bocznej nawigacji (pod kreską,
  bo wszystko powyżej dotyczy detailingu) z podzakładkami Cennik / CMS / FAQ /
  SEO — te same edytory co detailing, podpięte pod bloby wulkanizacji
  (`app/magazyn/panel/wulkanizacja/*`).
- **Rezerwacje:** tylko detailing. Wulkanizację umawia się telefonicznie
  (`LINIA_INFO.*.rezerwacjaOnline`): CTA w hero, czarnym pasie cennika
  i sekcji kontaktu dzwonią albo wysyłają zdjęcie opony. Pierwsza wersja
  rozszerzała rezerwacje o `linia` (osobny cennik w API, kolumna
  `reservations.line`) — wycofane przed wdrożeniem, gdy okazało się, że
  wulkanizacja rezerwacji nie ma; tabela i API rezerwacji są bez zmian.
- **Sekcje:** wspólne `UslugiCennik` (parametry `uklad` i `kontaktCta`),
  `Faq`, `Kontakt`, `Stopka`, `JsonLd`; własne dla wulkanizacji: hero
  (ilustracja koła, gdy brak zdjęcia), „02 · jak to wygląda" (zamiast
  Efektów przed/po), „03 · co naprawię, a czego nie".
- **Przejście:** własna scena z klonami DOM stron
  (`components/marka/kartka.tsx`, `.kartka-*` w `globals.css`) i klasyczny
  model „ciągniętego rogu" (jak turn.js / StPageFlip): wolny róg kartki jedzie
  do grzbietu, linia zagięcia to symetralna jego drogi, a kawałek arkusza za
  nią jest odbity i pokazuje REWERS — papier z cieniowaniem i cieniem rzuconym
  na odsłanianą stronę. Co klatkę JS liczy dwa wielokąty `clip-path`
  (płaska reszta / zagięty narożnik), macierz odbicia i gradient papieru.
  Odrzucone po drodze: View Transitions API (Chrome nie renderuje filtrów
  referencyjnych na zrzutach pseudo-elementów) oraz obrót całej płaszczyzny
  w 3D — bez zagięcia kartka czyta się jak sztywna deska, a nie papier.
  Tempo stoi w `--kartka-czas` (CSS), więc da się je spowolnić do oglądania
  klatek; przy `prefers-reduced-motion` nawigacja jest zwykła.
- **Analityka:** `AnalyticsProvider.resolveContext` dopina `service_line`
  do każdego zdarzenia (GA4 parametr → wymiar niestandardowy; PostHog
  właściwość). Panel Statystyki dostaje tabelę „Linie usług" (odsłony,
  użytkownicy, kliknięcia w telefon, kliknięcia „Zarezerwuj", rezerwacje
  i „Telefon lub rezerwacja", od którego liczy się konwersja) i lejek
  usługowy zamiast sklepowego — konfiguracja w `lib/init.ts`. Łączny krok
  jest po to, żeby linię bez rezerwacji dało się porównać z detailingiem.

## Konsekwencje

- (+) Zero duplikacji sekcji; nowa linia w przyszłości = nowy token,
  bloby i wpis w `LINIA_INFO`.
- (+) Panel edytuje obie linie tymi samymi edytorami, bez migracji bazy.
- (−) `UslugiCennik` zna układ kart przez parametr — id kategorii linii
  muszą zgadzać się z `UKLAD_CENNIKA_*` (jak dotąd z makietą).
- (−) Kwoty startowe cennika wulkanizacji są propozycją — do potwierdzenia
  w panelu przed publikacją.
- (−) Wymiar `service_line` w GA4 trzeba zarejestrować ręcznie
  (Administracja → Definicje niestandardowe), inaczej raporty GA4 rozdzielą
  linie tylko po ścieżce strony.
