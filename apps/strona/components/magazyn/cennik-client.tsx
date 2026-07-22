"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Plus, Save, Trash2 } from "lucide-react";
import type { CennikCategory, CennikData, CennikItem } from "@/lib/cennik";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Checkbox,
  DragHandle,
  Field,
  Fieldset,
  RowControls,
  StatusMessage,
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
    setCategories(reorder(sortedCategories.filter((c) => c.id !== category.id)));
    setItems(items.filter((i) => i.categoryId !== category.id));
  };

  const addCategory = () =>
    setCategories(reorder([...sortedCategories, newCategory(sortedCategories.length)]));

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
              <Button type="button" variant="outline" className="gap-1.5" onClick={addCategory}>
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
                    const remaining = reorder(rows.filter((i) => i.id !== itemId));
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
                    setItems([...untouched, ...remaining, ...targetRows, movedItem]);
                  };

                  return (
                    <CategoryPozycjeCard
                      key={category.id}
                      category={category}
                      rows={rows}
                      allCategories={sortedCategories}
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
                          items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
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
              <Button type="button" variant="outline" className="gap-1.5" onClick={addCategory}>
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
                      settings: { ...draft.settings, noteTitle: e.target.value },
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={save}
              disabled={pending || !history.isDirty}
              className="gap-1.5"
            >
              <Save className="size-4" aria-hidden />
              {pending ? "Zapisywanie…" : "Zapisz cennik"}
            </Button>
            <StatusMessage message={status} error={error} />
          </div>
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
            <Input value={category.name} onChange={(e) => onChange({ name: e.target.value })} />
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
              onChange={(e) => onChange({ priceFrom: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Wyróżnik pod kartą" hint="np. Najczęściej wybierane: … — 400–500 zł">
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
          {rows.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              categories={allCategories}
              onChange={(patch) => onChangeItem(item.id, patch)}
              onRemove={() => onRemoveItem(item.id)}
              onMoveToCategory={(newCategoryId) =>
                onMoveItemToCategory(item.id, newCategoryId)
              }
            />
          ))}
        </Reorder.Group>

        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAddItem}>
          <Plus className="size-4" aria-hidden /> Dodaj pozycję
        </Button>
      </Fieldset>
    </Reorder.Item>
  );
}

function ItemRow({
  item,
  categories,
  onChange,
  onRemove,
  onMoveToCategory,
}: {
  item: CennikItem;
  categories: CennikCategory[];
  onChange: (patch: Partial<CennikItem>) => void;
  onRemove: () => void;
  onMoveToCategory: (newCategoryId: string) => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      as="div"
    >
      <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex items-center justify-between">
          <DragHandle
            onPointerDown={(e) => dragControls.start(e)}
            label={`Przeciągnij pozycję ${item.name || "bez nazwy"}`}
          />
          <RowControls
            onRemove={onRemove}
            removeLabel={`Usuń pozycję ${item.name || "bez nazwy"}`}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa" hint={`prefiks "• " = dodatek`}>
            <Input value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Opis">
            <Input
              value={item.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </Field>
          <Field label="Czas" hint="np. 1,5 h">
            <Input
              value={item.timeLabel}
              onChange={(e) => onChange({ timeLabel: e.target.value })}
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
              onChange={(e) => onChange({ priceFrom: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Cena do (zł)" hint="0 = cena stała">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={item.priceTo}
              onChange={(e) => onChange({ priceTo: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Przedrostek ceny" hint={`np. "od " albo "+"`}>
            <Input
              value={item.pricePrefix}
              onChange={(e) => onChange({ pricePrefix: e.target.value })}
            />
          </Field>
          <Field label="Dopisek" hint="np. za parę">
            <Input value={item.unit} onChange={(e) => onChange({ unit: e.target.value })} />
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
              onCheckedChange={(checked) => onChange({ priceHidden: checked })}
              ariaLabel={`Ukryj cenę pozycji ${item.name || "bez nazwy"}`}
            />
            Ukryj cenę
          </label>
        </div>
      </div>
    </Reorder.Item>
  );
}
