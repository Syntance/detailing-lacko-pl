"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { Button, Input, PageHeader } from "@moduly/ui";
import { ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { formatDuration, formatItemPrice, hasVariants } from "@/lib/cennik";
import type {
  CennikCategory,
  CennikData,
  CennikItem,
  CennikVariant,
} from "@/lib/cennik";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Checkbox,
  DragHandle,
  Field,
  Fieldset,
  RowControls,
  TextArea,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

const SECTIONS = [
  { id: "karty", label: "Karty usług" },
  { id: "pozycje", label: "Pozycje cennika" },
  { id: "ustawienia", label: "Ustawienia sekcji" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `pozycja-${Date.now()}`
  );
}

function reorder<T extends { order: number }>(list: T[]): T[] {
  return list.map((entry, index) => ({ ...entry, order: index }));
}

function newCategory(order: number): CennikCategory {
  return {
    id: `karta-${Date.now()}`,
    name: "",
    description: "",
    priceFrom: 0,
    timeLabel: "",
    highlight: "",
    order,
    disabled: false,
  };
}

function newItem(categoryId: string, order: number): CennikItem {
  return {
    id: slugify(`${categoryId}-${Date.now()}`),
    categoryId,
    name: "",
    description: "",
    timeLabel: "",
    durationMinutes: 0,
    priceFrom: 0,
    priceTo: 0,
    pricePrefix: "",
    unit: "",
    popular: false,
    order,
    disabled: false,
  };
}

export function CennikClient({ initial }: { initial: CennikData }) {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("karty");
  const history = useMagazynHistory<CennikData>(initial);
  const { settings, categories, items } = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/cennik", history.state);
    if (result.ok) {
      setStatus("Cennik zapisany — strona odświeży się w kilka sekund.");
      history.commitSaved();
      router.refresh();
    } else {
      setError(true);
      setStatus(result.error);
    }
    setPending(false);
  }

  const setCategories = (next: CennikCategory[]) =>
    history.setState((draft) => ({ ...draft, categories: next }));
  const setItems = (next: CennikItem[]) =>
    history.setState((draft) => ({ ...draft, items: next }));

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const removeCategory = (category: CennikCategory) => {
    const count = items.filter((i) => i.categoryId === category.id).length;
    if (
      count > 0 &&
      !window.confirm(
        `Usunąć kategorię „${category.name || "bez nazwy"}" wraz z ${count} pozycjami?`,
      )
    ) {
      return;
    }
    setCategories(
      reorder(sortedCategories.filter((c) => c.id !== category.id)),
    );
    setItems(items.filter((i) => i.categoryId !== category.id));
  };

  const addCategory = () =>
    setCategories(
      reorder([...sortedCategories, newCategory(sortedCategories.length)]),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cennik"
        description={`${items.length} pozycji · ${categories.length} karty usług — publikowane w sekcji „Usługi i ceny"`}
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz cennik"
        pending={pending}
        status={status}
        error={error}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          aria-label="Sekcje cennika"
          className="flex shrink-0 flex-row flex-wrap gap-1 lg:w-48 lg:flex-col"
        >
          {SECTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSection(entry.id)}
              aria-current={section === entry.id ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                section === entry.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {section === "karty" ? (
            <div className="space-y-4">
              <Reorder.Group
                as="div"
                axis="y"
                values={sortedCategories}
                onReorder={(next) => setCategories(reorder(next))}
                className="space-y-4"
              >
                {sortedCategories.map((category) => (
                  <CategoryKartyCard
                    key={category.id}
                    category={category}
                    onChange={(patch) =>
                      setCategories(
                        categories.map((c) =>
                          c.id === category.id ? { ...c, ...patch } : c,
                        ),
                      )
                    }
                    onRemove={() => removeCategory(category)}
                  />
                ))}
              </Reorder.Group>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={addCategory}
              >
                <Plus className="size-4" aria-hidden /> Dodaj kartę
              </Button>
            </div>
          ) : null}

          {section === "pozycje" ? (
            <div className="space-y-6">
              <Reorder.Group
                as="div"
                axis="y"
                values={sortedCategories}
                onReorder={(next) => setCategories(reorder(next))}
                className="space-y-6"
              >
                {sortedCategories.map((category) => {
                  const rows = items
                    .filter((item) => item.categoryId === category.id)
                    .sort((a, b) => a.order - b.order);

                  const moveItemToCategory = (
                    itemId: string,
                    newCategoryId: string,
                  ) => {
                    if (newCategoryId === category.id) return;
                    const moving = items.find((i) => i.id === itemId);
                    if (!moving) return;
                    const remaining = reorder(
                      rows.filter((i) => i.id !== itemId),
                    );
                    const targetRows = items
                      .filter((i) => i.categoryId === newCategoryId)
                      .sort((a, b) => a.order - b.order);
                    const movedItem = {
                      ...moving,
                      categoryId: newCategoryId,
                      order: targetRows.length,
                    };
                    const untouched = items.filter(
                      (i) =>
                        i.categoryId !== category.id &&
                        i.categoryId !== newCategoryId,
                    );
                    setItems([
                      ...untouched,
                      ...remaining,
                      ...targetRows,
                      movedItem,
                    ]);
                  };

                  return (
                    <CategoryPozycjeCard
                      key={category.id}
                      category={category}
                      rows={rows}
                      allCategories={sortedCategories}
                      allItems={items}
                      onChangeCategory={(patch) =>
                        setCategories(
                          categories.map((c) =>
                            c.id === category.id ? { ...c, ...patch } : c,
                          ),
                        )
                      }
                      onRemoveCategory={() => removeCategory(category)}
                      onReorderItems={(next) => {
                        setItems([
                          ...items.filter((i) => i.categoryId !== category.id),
                          ...reorder(next),
                        ]);
                      }}
                      onChangeItem={(itemId, patch) =>
                        setItems(
                          items.map((i) =>
                            i.id === itemId ? { ...i, ...patch } : i,
                          ),
                        )
                      }
                      onRemoveItem={(itemId) =>
                        setItems(items.filter((i) => i.id !== itemId))
                      }
                      onMoveItemToCategory={moveItemToCategory}
                      onAddItem={() =>
                        setItems([...items, newItem(category.id, rows.length)])
                      }
                    />
                  );
                })}
              </Reorder.Group>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={addCategory}
              >
                <Plus className="size-4" aria-hidden /> Dodaj kategorię
              </Button>
            </div>
          ) : null}

          {section === "ustawienia" ? (
            <Fieldset legend={`Nagłówki i blok „przygotowanie do sprzedaży”`}>
              <Field label="Nagłówek sekcji (H2)">
                <Input
                  value={settings.heading}
                  onChange={(e) =>
                    history.setState((draft) => ({
                      ...draft,
                      settings: { ...draft.settings, heading: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Podtytuł">
                <Input
                  value={settings.subheading}
                  onChange={(e) =>
                    history.setState((draft) => ({
                      ...draft,
                      settings: {
                        ...draft.settings,
                        subheading: e.target.value,
                      },
                    }))
                  }
                />
              </Field>
              <Field label="Tytuł bloku pod kartami">
                <Input
                  value={settings.noteTitle}
                  onChange={(e) =>
                    history.setState((draft) => ({
                      ...draft,
                      settings: {
                        ...draft.settings,
                        noteTitle: e.target.value,
                      },
                    }))
                  }
                />
              </Field>
              <Field label="Treść bloku">
                <Input
                  value={settings.noteText}
                  onChange={(e) =>
                    history.setState((draft) => ({
                      ...draft,
                      settings: { ...draft.settings, noteText: e.target.value },
                    }))
                  }
                />
              </Field>
              {/* Podatek: plakietka pada raz na całą sekcję, dopisek stoi pod
                  każdą kwotą (także w wariantach i pakietach) i trafia do sumy
                  w rezerwacji. Oba pola można wyczyścić — wtedy po prostu
                  znikają ze strony. */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Plakietka o podatku (nad kartami)"
                  hint={`np. „ceny zawierają VAT”, „ceny netto”; puste = bez plakietki`}
                >
                  <Input
                    value={settings.vatNote}
                    onChange={(e) =>
                      history.setState((draft) => ({
                        ...draft,
                        settings: { ...draft.settings, vatNote: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Dopisek przy każdej cenie"
                  hint={`np. „z VAT”, „netto”, „brutto” — 2–3 słowa, bo stoi pod kwotą; puste = bez dopisku`}
                >
                  <Input
                    value={settings.vatSuffix}
                    onChange={(e) =>
                      history.setState((draft) => ({
                        ...draft,
                        settings: {
                          ...draft.settings,
                          vatSuffix: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="CTA bloku">
                  <Input
                    value={settings.noteCtaLabel}
                    onChange={(e) =>
                      history.setState((draft) => ({
                        ...draft,
                        settings: {
                          ...draft.settings,
                          noteCtaLabel: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
                <Field label={`Etykieta „rozwiń”`}>
                  <Input
                    value={settings.expandLabel}
                    onChange={(e) =>
                      history.setState((draft) => ({
                        ...draft,
                        settings: {
                          ...draft.settings,
                          expandLabel: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
                <Field label={`Etykieta „zwiń”`}>
                  <Input
                    value={settings.collapseLabel}
                    onChange={(e) =>
                      history.setState((draft) => ({
                        ...draft,
                        settings: {
                          ...draft.settings,
                          collapseLabel: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </Fieldset>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Karty usług ------------------------------ */

function CategoryKartyCard({
  category,
  onChange,
  onRemove,
}: {
  category: CennikCategory;
  onChange: (patch: Partial<CennikCategory>) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={dragControls}
      as="div"
    >
      <Fieldset
        legend={category.name || "Nowa karta"}
        actions={
          <div className="flex items-center gap-1">
            <DragHandle
              onPointerDown={(e) => dragControls.start(e)}
              label={`Przeciągnij kartę ${category.name || "bez nazwy"}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={`Usuń kartę ${category.name || "bez nazwy"}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nazwa karty">
            <Input
              value={category.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </Field>
          <Field label="Czas trwania" hint="np. 3–5 godzin">
            <Input
              value={category.timeLabel}
              onChange={(e) => onChange({ timeLabel: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Opis na karcie">
          <Input
            value={category.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cena od (zł)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={category.priceFrom}
              onChange={(e) =>
                onChange({ priceFrom: Number(e.target.value) || 0 })
              }
            />
          </Field>
          <Field
            label="Wyróżnik pod kartą"
            hint="np. Najczęściej wybierane: … — 400–500 zł"
          >
            <Input
              value={category.highlight}
              onChange={(e) => onChange({ highlight: e.target.value })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={!category.disabled}
            onCheckedChange={(checked) => onChange({ disabled: !checked })}
            ariaLabel={`Widoczność karty ${category.name || "bez nazwy"}`}
          />
          Widoczna na stronie
        </label>
      </Fieldset>
    </Reorder.Item>
  );
}

/* --------------------------- Pozycje cennika --------------------------- */

function CategoryPozycjeCard({
  category,
  rows,
  allCategories,
  allItems,
  onChangeCategory,
  onRemoveCategory,
  onReorderItems,
  onChangeItem,
  onRemoveItem,
  onMoveItemToCategory,
  onAddItem,
}: {
  category: CennikCategory;
  rows: CennikItem[];
  allCategories: CennikCategory[];
  /** Cały cennik — do wyboru składowych pakietu (przez kategorie). */
  allItems: CennikItem[];
  onChangeCategory: (patch: Partial<CennikCategory>) => void;
  onRemoveCategory: () => void;
  onReorderItems: (next: CennikItem[]) => void;
  onChangeItem: (itemId: string, patch: Partial<CennikItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItemToCategory: (itemId: string, newCategoryId: string) => void;
  onAddItem: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={dragControls}
      as="div"
    >
      <Fieldset
        legend={category.name || "Nowa karta"}
        actions={
          <div className="flex items-center gap-1">
            <DragHandle
              onPointerDown={(e) => dragControls.start(e)}
              label={`Przeciągnij kategorię ${category.name || "bez nazwy"}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemoveCategory}
              aria-label={`Usuń kategorię ${category.name || "bez nazwy"}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        }
      >
        <Field label="Nazwa kategorii">
          <Input
            value={category.name}
            onChange={(e) => onChangeCategory({ name: e.target.value })}
          />
        </Field>

        <Reorder.Group
          as="div"
          axis="y"
          values={rows}
          onReorder={onReorderItems}
          className="space-y-4"
        >
          {rows.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index + 1}
              categories={allCategories}
              allItems={allItems}
              onChange={(patch) => onChangeItem(item.id, patch)}
              onRemove={() => onRemoveItem(item.id)}
              onMoveToCategory={(newCategoryId) =>
                onMoveItemToCategory(item.id, newCategoryId)
              }
            />
          ))}
        </Reorder.Group>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onAddItem}
        >
          <Plus className="size-4" aria-hidden /> Dodaj pozycję
        </Button>
      </Fieldset>
    </Reorder.Item>
  );
}

/** Jednolinijkowe podsumowanie pozycji widoczne, gdy wiersz jest zwinięty. */
function itemSummary(item: CennikItem): string {
  const parts: string[] = [formatItemPrice(item)];
  if (item.timeLabel) parts.push(item.timeLabel);
  if (item.durationMinutes > 0)
    parts.push(`rezerwacje: ${formatDuration(item.durationMinutes)}`);
  const warianty = item.variants?.length ?? 0;
  if (warianty > 0) parts.push(`warianty: ${warianty}`);
  const zawiera = item.includedItemIds?.length ?? 0;
  if (zawiera > 0) parts.push(`zawiera ${zawiera}`);
  const wymaga = item.requiredItemIds?.length ?? 0;
  if (wymaga > 0) parts.push(`wymaga ${wymaga}`);
  if (item.popular) parts.push("najczęściej wybierane");
  if (item.disabled) parts.push("ukryta na stronie");
  return parts.join(" · ");
}

/**
 * Czy od tej pozycji da się wrócić do niej samej po łańcuchu `pole` (składowe
 * albo wymagania — wywołujący decyduje, którym polem chodzimy). Panel
 * pozwala zaznaczyć cokolwiek, więc A→B→A jest do zrobienia jednym
 * kliknięciem; wyliczanie w rezerwacji jest na to odporne (ma strażnika
 * cykli), ale dla właściciela to konfiguracja bez sensu i lepiej ją pokazać.
 */
function maPetle(
  item: CennikItem,
  allItems: CennikItem[],
  pole: (i: CennikItem) => string[],
): boolean {
  const byId = new Map(allItems.map((i) => [i.id, i]));
  const seen = new Set<string>();
  const stack = [...pole(item)];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (id === item.id) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const next = byId.get(id);
    if (next) stack.push(...pole(next));
  }
  return false;
}

/**
 * Wybór powiązanych pozycji, checkboxami grupowanymi po kategorii — wspólna
 * dla dwóch relacji z bardzo różną semantyką dla klienta, ale identycznym
 * kształtem edycji (zbiór id na tej samej pozycji, blokujący wybór siebie
 * samej, z ryzykiem pętli): „Zawiera w cenie" (`includedItemIds` — składowa
 * jest darmowa i zablokowana do osobnego wyboru) i „Wymaga" (`requiredItemIds`
 * — dodatek NIE jest darmowy, tylko doselekcjonowany automatycznie).
 *
 * `pole` wybiera, KTÓRE z tych dwóch pól czytamy/zapisujemy — ta sama funkcja
 * służy też do chodzenia po łańcuchu przy wykrywaniu pętli, więc obie relacje
 * (`item`, jak i każdy inny element `allItems` po drodze) czytane są spójnie.
 *
 * `pomin`: pozycje z wariantami nie mogą być CELEM wymagania — auto-dodanie
 * nie umie zgadnąć rozmiaru auta. Dla „Zawiera w cenie" to nieistotne
 * (rezerwacja i tak blokuje wszystkie warianty składowej), więc filtr jest
 * opcjonalny i włącza go tylko wywołanie dla „Wymaga".
 */
function PowiazanePozycje({
  item,
  allItems,
  categories,
  pole,
  onZmien,
  tytul,
  opis,
  aria,
  petlaOpis,
  pomin,
}: {
  item: CennikItem;
  allItems: CennikItem[];
  categories: CennikCategory[];
  pole: (i: CennikItem) => string[];
  onZmien: (next: string[]) => void;
  tytul: string;
  opis: string;
  /** `(nazwaTej, nazwaPowiazanej) => aria-label checkboxa`. */
  aria: (nazwaTej: string, nazwaPowiazanej: string) => string;
  petlaOpis: string;
  pomin?: (candidate: CennikItem) => boolean;
}) {
  const wartosc = pole(item);

  const toggle = (id: string) =>
    onZmien(
      wartosc.includes(id)
        ? wartosc.filter((x) => x !== id)
        : [...wartosc, id],
    );

  const grupy = categories
    .map((c) => ({
      kategoria: c,
      pozycje: allItems
        .filter(
          (i) =>
            i.categoryId === c.id &&
            i.id !== item.id &&
            !(pomin?.(i) ?? false),
        )
        .sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.pozycje.length > 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          {tytul}
          {wartosc.length > 0 ? ` (${wartosc.length})` : ""}
        </p>
        <p className="text-xs text-muted-foreground">{opis}</p>
      </div>

      {maPetle(item, allItems, pole) ? (
        <p
          role="alert"
          className="rounded-md border border-destructive px-3 py-2 text-xs text-destructive"
        >
          {petlaOpis}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {grupy.map(({ kategoria, pozycje }) => (
          <div key={kategoria.id} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {kategoria.name || "(bez nazwy)"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {pozycje.map((p) => (
                <label
                  key={p.id}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={wartosc.includes(p.id)}
                    onCheckedChange={() => toggle(p.id)}
                    ariaLabel={aria(
                      item.name || "Ta pozycja",
                      p.name || "pozycję bez nazwy",
                    )}
                  />
                  <span className="leading-snug">
                    {p.name || "(bez nazwy)"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Nowy wariant z id odpornym na dublowanie w tej samej milisekundzie. */
function newVariant(existing: CennikVariant[]): CennikVariant {
  const zajete = new Set(existing.map((v) => v.id));
  let id = `wariant-${Date.now()}`;
  for (let i = 2; zajete.has(id); i++) id = `wariant-${Date.now()}-${i}`;
  return {
    id,
    label: "",
    priceFrom: 0,
    priceTo: 0,
    durationMinutes: 0,
    timeLabel: "",
  };
}

/**
 * Warianty pozycji — ten sam zakres pracy w kilku rozmiarach auta, gdzie różni
 * się wyłącznie cena i czas (one step: hatchback / sedan / SUV).
 *
 * Zastępuje trzymanie każdego rozmiaru jako OSOBNEJ pozycji cennika: na stronie
 * dawało to trzy wiersze z identycznym opisem, a w rezerwacji trzy kafelki,
 * z których dwa zawsze były pomyłką.
 *
 * Id wariantu powstaje ze znacznika czasu i NIE zmienia się przy edycji
 * etykiety — leci w rezerwacji jako „id-pozycji::id-wariantu", więc zmiana
 * nazwy rozmiaru nie może unieważnić przyjętych już terminów.
 */
function WariantyPozycji({
  item,
  onChange,
}: {
  item: CennikItem;
  onChange: (patch: Partial<CennikItem>) => void;
}) {
  const variants = item.variants ?? [];
  // Pusta lista wraca do `undefined`, żeby blob nie puchł o `"variants": []`
  // przy każdej pozycji bez wariantów.
  const set = (next: CennikVariant[]) =>
    onChange({ variants: next.length > 0 ? next : undefined });
  const patch = (id: string, p: Partial<CennikVariant>) =>
    set(variants.map((v) => (v.id === id ? { ...v, ...p } : v)));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Warianty{variants.length > 0 ? ` (${variants.length})` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Dla usług, które różnią się tylko rozmiarem auta. Na stronie pozycja
          zostaje JEDNA — ze wspólnym opisem i listą wariantów z cenami,
          a w rezerwacji klient wybiera rozmiar jednym kliknięciem.
        </p>
      </div>

      {variants.length > 0 ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Przy wariantach cena i czas realizacji POZYCJI przestają się liczyć —
          stronę i rezerwację napędzają wartości z wariantów. Pola wyżej zostaw
          jako podgląd widełek.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {variants.map((v, i) => (
          <div
            key={v.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-3"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground"
              >
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {v.label || "(wariant bez etykiety)"}
              </p>
              <RowControls
                onRemove={() => set(variants.filter((x) => x.id !== v.id))}
                removeLabel={`Usuń wariant ${v.label || i + 1}`}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Etykieta" hint="np. SUV / van">
                <Input
                  value={v.label}
                  onChange={(e) => patch(v.id, { label: e.target.value })}
                />
              </Field>
              <Field label="Cena od (zł)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={v.priceFrom}
                  onChange={(e) =>
                    patch(v.id, { priceFrom: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Cena do (zł)" hint="0 = cena stała">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={v.priceTo}
                  onChange={(e) =>
                    patch(v.id, { priceTo: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field
                label="Czas realizacji (min)"
                hint="0 = bierze czas pozycji"
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={15}
                  value={v.durationMinutes}
                  onChange={(e) =>
                    patch(v.id, {
                      durationMinutes: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-max gap-1.5"
        onClick={() => set([...variants, newVariant(variants)])}
      >
        <Plus className="size-4" aria-hidden /> Dodaj wariant
      </Button>
    </div>
  );
}

function ItemRow({
  item,
  index,
  categories,
  allItems,
  onChange,
  onRemove,
  onMoveToCategory,
}: {
  item: CennikItem;
  allItems: CennikItem[];
  /** Numer pozycji w obrębie kategorii (1-based). */
  index: number;
  categories: CennikCategory[];
  onChange: (patch: Partial<CennikItem>) => void;
  onRemove: () => void;
  onMoveToCategory: (newCategoryId: string) => void;
}) {
  const dragControls = useDragControls();
  const panelId = useId();
  // Nowo dodana pozycja (bez nazwy) startuje rozwinięta — inaczej trzeba by
  // klikać "Edytuj" na pustym wierszu zaraz po "Dodaj pozycję".
  const [open, setOpen] = useState(() => item.name.trim() === "");
  const label = item.name || "Nowa pozycja";

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      as="div"
    >
      <div className="rounded-lg border border-border bg-background/50">
        <div className="flex items-center gap-2 p-3">
          <DragHandle
            onPointerDown={(e) => dragControls.start(e)}
            label={`Przeciągnij pozycję ${label}`}
          />
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground"
          >
            {index}
          </span>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={panelId}
            className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="block truncate text-sm font-medium text-foreground">
              <span className="sr-only">{`Pozycja ${index}: `}</span>
              {label}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {itemSummary(item)}
            </span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={panelId}
            className="gap-1.5"
          >
            {open ? (
              <>
                <ChevronUp className="size-4" aria-hidden /> Zwiń
              </>
            ) : (
              <>
                <Pencil className="size-4" aria-hidden /> Edytuj
              </>
            )}
          </Button>
          <RowControls
            onRemove={onRemove}
            removeLabel={`Usuń pozycję ${label}`}
          />
        </div>

        <div
          id={panelId}
          hidden={!open}
          className="space-y-3 border-t border-border p-4"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Nazwa" hint={`prefiks "• " = dodatek`}>
              <Input
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </Field>
            <Field label="Opis">
              <TextArea
                value={item.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </Field>
            <Field label="Czas (opis)" hint="np. 1,5 h">
              <Input
                value={item.timeLabel}
                onChange={(e) => onChange({ timeLabel: e.target.value })}
              />
            </Field>
            {/* Źródło prawdy dla kalendarza rezerwacji (opis wyżej jest tylko
                dla ludzi) — z tego liczy się godzina odbioru i dzienny limit. */}
            <Field
              label="Czas realizacji (min)"
              hint="0 = nie wlicza się do rezerwacji"
            >
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={15}
                value={item.durationMinutes}
                onChange={(e) =>
                  onChange({
                    durationMinutes: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </Field>
            <Field label="Kategoria" hint="przenosi pozycję">
              <select
                value={item.categoryId}
                onChange={(e) => onMoveToCategory(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || "(bez nazwy)"}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Cena od (zł)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={item.priceFrom}
                onChange={(e) =>
                  onChange({ priceFrom: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Cena do (zł)" hint="0 = cena stała">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={item.priceTo}
                onChange={(e) =>
                  onChange({ priceTo: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Przedrostek ceny" hint={`np. "od " albo "+"`}>
              <Input
                value={item.pricePrefix}
                onChange={(e) => onChange({ pricePrefix: e.target.value })}
              />
            </Field>
            <Field label="Dopisek" hint="np. za parę">
              <Input
                value={item.unit}
                onChange={(e) => onChange({ unit: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={item.popular}
                onCheckedChange={(checked) => onChange({ popular: checked })}
                ariaLabel={`Oznacz ${item.name || "pozycję"} jako popularne`}
              />
              Najczęściej wybierane
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!item.disabled}
                onCheckedChange={(checked) => onChange({ disabled: !checked })}
                ariaLabel={`Widoczność pozycji ${item.name || "bez nazwy"}`}
              />
              Widoczna
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={item.priceHidden === true}
                onCheckedChange={(checked) =>
                  onChange({ priceHidden: checked })
                }
                ariaLabel={`Ukryj cenę pozycji ${item.name || "bez nazwy"}`}
              />
              Ukryj cenę
            </label>
          </div>

          <WariantyPozycji item={item} onChange={onChange} />

          <PowiazanePozycje
            item={item}
            allItems={allItems}
            categories={categories}
            pole={(i) => i.includedItemIds ?? []}
            onZmien={(next) => onChange({ includedItemIds: next })}
            tytul="Zawiera w cenie"
            opis="Zaznacz usługi, które ta pozycja już obejmuje. W rezerwacji klient nie dobierze ich osobno — zobaczy komunikat, że są w cenie, a jeśli miał je zaznaczone, zostaną zdjęte z wyboru."
            aria={(ta, powiazana) => `${ta} zawiera ${powiazana}`}
            petlaOpis="Pętla: po łańcuchu składowych ta pozycja wraca do samej siebie. Rozepnij jedną ze stron — inaczej te pozycje będą blokować się nawzajem i klient nie wybierze żadnej."
          />

          <PowiazanePozycje
            item={item}
            allItems={allItems}
            categories={categories}
            pole={(i) => i.requiredItemIds ?? []}
            onZmien={(next) => onChange({ requiredItemIds: next })}
            tytul="Wymaga"
            opis="Zaznacz pozycje, które trzeba dobrać razem z tą (np. wosk wymaga dekontaminacji). W rezerwacji klient dostanie o tym komunikat, a brakujący dodatek zaznaczymy automatycznie — liczy się osobno w cenie i czasie, to nie jest darmowy składnik."
            aria={(ta, powiazana) => `${ta} wymaga ${powiazana}`}
            petlaOpis="Pętla: po łańcuchu wymagań ta pozycja wraca do samej siebie. Rozepnij jedną ze stron — inaczej te pozycje będą się nawzajem domagać zaznaczenia."
            pomin={(candidate) => hasVariants(candidate)}
          />
        </div>
      </div>
    </Reorder.Item>
  );
}
