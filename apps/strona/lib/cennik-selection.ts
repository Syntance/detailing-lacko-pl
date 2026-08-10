/**
 * Czysta logika wyboru usług i formatowania czasu — BEZ zod-a.
 *
 * Wydzielone z `lib/cennik.ts` wyłącznie z powodu rozmiaru bundla: widget
 * rezerwacji („use client") potrzebuje tylko tych funkcji, ale schematy
 * `z.object(...)` w `cennik.ts` wykonują się przy imporcie modułu, więc
 * bundler nie może ich wyrzucić i cały zod (~61 KB) jechał na stronę główną.
 * `lib/cennik.ts` re-eksportuje wszystko poniżej, więc kod serwerowy i panel
 * dalej importują z jednego miejsca.
 */

/**
 * Minimum, jakiego potrzebuje liczenie blokad. Typowane strukturalnie, bo tę
 * samą logikę uruchamia panel (na `CennikItem`), widget rezerwacji (na
 * odchudzonym `RezerwacjaPozycja`) i walidacja w API — jedno źródło prawdy
 * zamiast trzech kopii, które rozjadą się przy pierwszej zmianie reguł.
 */
export type PozycjaZeSkladowymi = {
  id: string;
  name: string;
  includedItemIds?: string[];
};

/**
 * Separator w złożonym id wybranego wariantu („one-step::suv-van").
 *
 * Rezerwacja operuje na PŁASKIEJ liście id (`serviceIds`), a wariant zmienia
 * cenę i czas pracy, więc sam id pozycji nie wystarcza — harmonogram musiałby
 * zgadywać, czy to 6,5 h czy 8,5 h roboty. Zamiast dokładać drugie pole do
 * protokołu (i migrować walidację, maile, panel), wariant jedzie w id: każdy
 * wariant jest osobną pozycją wybieralną, więc blokady, konflikty i migawki
 * usług liczą się DOKŁADNIE tak jak dotąd.
 *
 * Dwa dwukropki, nie jeden: id pozycji to slug z panelu (`[a-z0-9-]`), ale
 * pojedynczy `:` bywa odruchowo wpisywany w nazwach, a `::` nie.
 */
export const VARIANT_SEP = "::";

/** Id pozycji + id wariantu → jedno id wybieralnej pozycji rezerwacji. */
export function variantKey(itemId: string, variantId: string): string {
  return `${itemId}${VARIANT_SEP}${variantId}`;
}

/**
 * Rozbiór złożonego id. `variantId` = null dla pozycji bez wariantów, więc
 * stare rezerwacje i pozycje jednocenowe przechodzą tą samą ścieżką.
 */
export function parseVariantKey(key: string): {
  itemId: string;
  variantId: string | null;
} {
  const at = key.indexOf(VARIANT_SEP);
  if (at === -1) return { itemId: key, variantId: null };
  return {
    itemId: key.slice(0, at),
    variantId: key.slice(at + VARIANT_SEP.length),
  };
}

/** Format czasu realizacji: „30 min", „1,5 h", „4 h", „9,5 h". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = Math.round(hours * 2) / 2;
  return `${String(rounded).replace(".", ",")} h`;
}

/** Składowe pozycji, odporne na brak pola w starych blob-ach z bazy. */
export function itemIncludes(item: PozycjaZeSkladowymi): string[] {
  return item.includedItemIds ?? [];
}

/**
 * Mapa: id zablokowanej pozycji → pozycja, która ją zawiera. Pozycja jest
 * zablokowana, gdy któraś z WYBRANYCH już ją obejmuje w cenie.
 *
 * Przechodnie: pakiet zawierający „Mycie + dekontaminacja + wosk" blokuje też
 * składowe tego mycia. `seen` pilnuje cykli — panel pozwala zaznaczyć dowolne
 * pozycje, więc ktoś może omyłkowo zapętlić A→B→A; bez tej straży byłaby
 * nieskończona rekurencja i zawieszona strona.
 */
export function blockedItemIds<T extends PozycjaZeSkladowymi>(
  items: T[],
  selectedIds: string[],
): Map<string, T> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const blocked = new Map<string, T>();

  const walk = (owner: T, current: T, seen: Set<string>) => {
    for (const childId of itemIncludes(current)) {
      if (seen.has(childId)) continue;
      seen.add(childId);
      if (!blocked.has(childId)) blocked.set(childId, owner);
      const child = byId.get(childId);
      if (child) walk(owner, child, seen);
    }
  };

  for (const id of selectedIds) {
    const item = byId.get(id);
    if (item) walk(item, item, new Set([id]));
  }
  return blocked;
}

/** Skutek kliknięcia w pozycję: nowy wybór + co z niego wypadło i dlaczego. */
export type SelectionChange<T> = {
  selected: string[];
  /** Zdjęte z wyboru, bo świeżo wybrana pozycja już je zawiera. */
  removed: T[];
  /** Ustawione, gdy kliknięto pozycję zawartą w już wybranym pakiecie. */
  blockedBy: T | null;
};

/**
 * Jedyne miejsce, które zmienia wybór usług w rezerwacji — dzięki temu panel,
 * widget i walidacja serwera liczą to samo.
 *
 * Odznaczenie zawsze przechodzi. Zaznaczenie pozycji zawartej w wybranym
 * pakiecie NIE przechodzi (zwracamy `blockedBy`, wybór bez zmian). Zaznaczenie
 * pakietu przechodzi i zdejmuje jego składowe.
 */
export function toggleServiceSelection<T extends PozycjaZeSkladowymi>(
  items: T[],
  selectedIds: string[],
  id: string,
): SelectionChange<T> {
  const byId = new Map(items.map((i) => [i.id, i]));

  if (selectedIds.includes(id)) {
    return {
      selected: selectedIds.filter((x) => x !== id),
      removed: [],
      blockedBy: null,
    };
  }

  const blockedBy = blockedItemIds(items, selectedIds).get(id) ?? null;
  if (blockedBy) return { selected: selectedIds, removed: [], blockedBy };

  const zawarte = blockedItemIds(items, [id]);
  const removed = selectedIds
    .filter((x) => zawarte.has(x))
    .map((x) => byId.get(x))
    .filter((x): x is T => Boolean(x));

  return {
    selected: [...selectedIds.filter((x) => !zawarte.has(x)), id],
    removed,
    blockedBy: null,
  };
}

/**
 * Kolizja w gotowym zamówieniu: pakiet i jego składowa naraz. UI na to nie
 * pozwala, ale payload przychodzi od klienta — bez tej kontroli dałoby się
 * zamówić pakiet + mycie i zapłacić podwójnie za tę samą robotę, a harmonogram
 * zarezerwowałby podwójny czas. Zwraca pierwszą kolizję albo null.
 */
export function findSelectionConflict<T extends PozycjaZeSkladowymi>(
  items: T[],
  ids: string[],
): { owner: T; included: T } | null {
  const byId = new Map(items.map((i) => [i.id, i]));
  const blocked = blockedItemIds(items, ids);
  for (const id of ids) {
    const owner = blocked.get(id);
    const included = byId.get(id);
    if (owner && included && owner.id !== id) return { owner, included };
  }
  return null;
}
