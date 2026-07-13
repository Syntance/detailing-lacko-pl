"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader, Switch } from "@moduly/ui";
import { Plus, Save } from "lucide-react";
import type {
  CennikCategory,
  CennikData,
  CennikItem,
} from "@/lib/cennik";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
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

function move<T extends { order: number }>(
  list: T[],
  index: number,
  delta: -1 | 1,
): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [row] = next.splice(index, 1);
  next.splice(target, 0, row as T);
  return reorder(next);
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
              {sortedCategories.map((category, index) => (
                <Fieldset key={category.id} legend={category.name || "Nowa karta"}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nazwa karty">
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          setCategories(
                            sortedCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, name: e.target.value }
                                : c,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="Czas trwania" hint="np. 3–5 godzin">
                      <Input
                        value={category.timeLabel}
                        onChange={(e) =>
                          setCategories(
                            sortedCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, timeLabel: e.target.value }
                                : c,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Opis na karcie">
                    <Input
                      value={category.description}
                      onChange={(e) =>
                        setCategories(
                          sortedCategories.map((c) =>
                            c.id === category.id
                              ? { ...c, description: e.target.value }
                              : c,
                          ),
                        )
                      }
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
                          setCategories(
                            sortedCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, priceFrom: Number(e.target.value) || 0 }
                                : c,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field
                      label="Wyróżnik pod kartą"
                      hint="np. Najczęściej wybierane: … — 400–500 zł"
                    >
                      <Input
                        value={category.highlight}
                        onChange={(e) =>
                          setCategories(
                            sortedCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, highlight: e.target.value }
                                : c,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch
                        checked={!category.disabled}
                        onCheckedChange={(checked) =>
                          setCategories(
                            sortedCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, disabled: !checked }
                                : c,
                            ),
                          )
                        }
                        aria-label={`Widoczność karty ${category.name}`}
                      />
                      Widoczna na stronie
                    </label>
                    <RowControls
                      onUp={() => setCategories(move(sortedCategories, index, -1))}
                      onDown={() => setCategories(move(sortedCategories, index, 1))}
                      onRemove={() =>
                        setCategories(
                          reorder(
                            sortedCategories.filter((c) => c.id !== category.id),
                          ),
                        )
                      }
                      upDisabled={index === 0}
                      downDisabled={index === sortedCategories.length - 1}
                      removeLabel={`Usuń kartę ${category.name}`}
                    />
                  </div>
                </Fieldset>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  setCategories(
                    reorder([
                      ...sortedCategories,
                      {
                        id: `karta-${Date.now()}`,
                        name: "",
                        description: "",
                        priceFrom: 0,
                        timeLabel: "",
                        highlight: "",
                        order: sortedCategories.length,
                        disabled: false,
                      },
                    ]),
                  )
                }
              >
                <Plus className="size-4" aria-hidden /> Dodaj kartę
              </Button>
            </div>
          ) : null}

          {section === "pozycje" ? (
            <div className="space-y-6">
              {sortedCategories.map((category) => {
                const rows = items
                  .filter((item) => item.categoryId === category.id)
                  .sort((a, b) => a.order - b.order);
                return (
                  <Fieldset key={category.id} legend={category.name}>
                    <div className="space-y-4">
                      {rows.map((item, index) => (
                        <div
                          key={item.id}
                          className="space-y-3 rounded-lg border border-border bg-background/50 p-4"
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Nazwa">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  setItems(
                                    items.map((i) =>
                                      i.id === item.id
                                        ? { ...i, name: e.target.value }
                                        : i,
                                    ),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Opis">
                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  setItems(
                                    items.map((i) =>
                                      i.id === item.id
                                        ? { ...i, description: e.target.value }
                                        : i,
                                    ),
                                  )
                                }
                              />
                            </Field>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <Field label="Cena od (zł)">
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={item.priceFrom}
                                onChange={(e) =>
                                  setItems(
                                    items.map((i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            priceFrom:
                                              Number(e.target.value) || 0,
                                          }
                                        : i,
                                    ),
                                  )
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
                                  setItems(
                                    items.map((i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            priceTo: Number(e.target.value) || 0,
                                          }
                                        : i,
                                    ),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Dopisek" hint="np. za parę">
                              <Input
                                value={item.unit}
                                onChange={(e) =>
                                  setItems(
                                    items.map((i) =>
                                      i.id === item.id
                                        ? { ...i, unit: e.target.value }
                                        : i,
                                    ),
                                  )
                                }
                              />
                            </Field>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-5">
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch
                                  checked={item.popular}
                                  onCheckedChange={(checked) =>
                                    setItems(
                                      items.map((i) =>
                                        i.id === item.id
                                          ? { ...i, popular: checked }
                                          : i,
                                      ),
                                    )
                                  }
                                  aria-label={`Oznacz ${item.name} jako popularne`}
                                />
                                Najczęściej wybierane
                              </label>
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch
                                  checked={!item.disabled}
                                  onCheckedChange={(checked) =>
                                    setItems(
                                      items.map((i) =>
                                        i.id === item.id
                                          ? { ...i, disabled: !checked }
                                          : i,
                                      ),
                                    )
                                  }
                                  aria-label={`Widoczność pozycji ${item.name}`}
                                />
                                Widoczna
                              </label>
                            </div>
                            <RowControls
                              onUp={() => {
                                const moved = move(rows, index, -1);
                                setItems([
                                  ...items.filter(
                                    (i) => i.categoryId !== category.id,
                                  ),
                                  ...moved,
                                ]);
                              }}
                              onDown={() => {
                                const moved = move(rows, index, 1);
                                setItems([
                                  ...items.filter(
                                    (i) => i.categoryId !== category.id,
                                  ),
                                  ...moved,
                                ]);
                              }}
                              onRemove={() =>
                                setItems(items.filter((i) => i.id !== item.id))
                              }
                              upDisabled={index === 0}
                              downDisabled={index === rows.length - 1}
                              removeLabel={`Usuń pozycję ${item.name}`}
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          setItems([
                            ...items,
                            {
                              id: slugify(`${category.id}-${Date.now()}`),
                              categoryId: category.id,
                              name: "",
                              description: "",
                              priceFrom: 0,
                              priceTo: 0,
                              unit: "",
                              popular: false,
                              order: rows.length,
                              disabled: false,
                            },
                          ])
                        }
                      >
                        <Plus className="size-4" aria-hidden /> Dodaj pozycję
                      </Button>
                    </div>
                  </Fieldset>
                );
              })}
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
