# ADR 001 — Architektura treści: CMS moduly + site_blobs dla cennika/galerii/NAP

Data: 2026-07-12 · Status: przyjęte

## Kontekst

One-page dla detailingu (brief Notion) wymaga: (1) cennika edytowalnego w
panelu „jak w syntance-web /magazyn/cennik", (2) CMS wg moduly, (3) formularzy
z edycją, (4) galerii przed/po, (5) danych NAP używanych w kilku miejscach
(kontakt, sticky CTA, stopka, JSON-LD).

## Rozważane opcje

1. **Dedykowane tabele Drizzle per zasób** (wzorzec syntance-web:
   pricing_items, pricing_categories + API per tabela).
2. **Wszystko w CMS moduly (page_content)** — wymagałoby nowych typów bloków
   w pakiecie magazyn-content (zmiany w pakietach współdzielonych).
3. **Jedna tabela `site_blobs` (klucz → jsonb)** + walidacja Zod + edytory
   w aplikacji wzorowane na syntance-web (undo/redo, sekcje, PUT na API).

## Decyzja

Opcja 3. Dane są małe (kilkanaście pozycji), zapisy rzadkie i zawsze „całość
naraz" — jeden wiersz jsonb na zasób daje atomowy zapis, zero joinów, brak
migracji przy zmianach kształtu (Zod + fallback na defaulty z kodu). UX edycji
odtwarza syntance-web (useMagazynHistory, sekcje, zapisz per widok), storage
spójny z konwencją moduly (site_settings/page_content to też jsonb-bloby).
Hero/FAQ/galeria-CMS/opinie zostają w CMS moduly (page_content) — edytory
istnieją w @moduly/magazyn-content i nie wymagają zmian pakietów.

## Konsekwencje

- (+) Zero zmian w pakietach @moduly/*; całość own-code w apps/strona.
- (+) Odczyt strony = 3 SELECT-y po kluczu + page_content; ISR 10 min +
  revalidatePath przy zapisie.
- (−) Brak edycji konkurencyjnej per pole (last-write-wins na zasób) —
  akceptowalne: jeden administrator.
- (−) Copy sekcji „Proces"/„Dlaczego ja" pozostaje w kodzie (zmiana = deploy) —
  świadomie, bo zmienia się ~nigdy; reszta briefu jest w panelu.
