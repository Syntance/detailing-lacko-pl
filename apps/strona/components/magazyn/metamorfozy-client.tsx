"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, PageHeader, cn } from "@moduly/ui";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type {
  MetamorfozyData,
  MetamorfozyPara,
  MetamorfozyTemat,
} from "@/lib/metamorfozy";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import {
  Checkbox,
  Field,
  Fieldset,
  RowControls,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

/**
 * Panel → Metamorfozy: edytor sekcji „Efekty — zobacz różnicę".
 * Temat = kafelek na stronie; pary przed/po układa się przeciąganiem —
 * PIERWSZA para jest okładką kafelka, wszystkie widać w podglądzie
 * po kliknięciu kafelka (w tej kolejności).
 */

function reorderTematy(list: MetamorfozyTemat[]): MetamorfozyTemat[] {
  return list.map((t, i) => ({ ...t, order: i }));
}

function reorderPary(list: MetamorfozyPara[]): MetamorfozyPara[] {
  return list.map((p, i) => ({ ...p, order: i }));
}

/** Jedna para przed/po — sortowalna karta z miniaturami i polami. */
function SortableParaCard({
  para,
  index,
  onChange,
  onRemove,
}: {
  para: MetamorfozyPara;
  index: number;
  onChange: (next: MetamorfozyPara) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: para.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card p-4",
        index === 0 ? "border-primary ring-2 ring-primary/20" : "border-border",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Przeciągnij parę ${index + 1}, aby zmienić kolejność`}
            className="inline-flex size-8 cursor-grab touch-none items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <span className="text-sm font-medium">
            {index === 0 ? (
              <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Kafelek (okładka)
              </span>
            ) : (
              `Para ${index + 1} — tylko w podglądzie`
            )}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Usuń parę ${index + 1}`}
          onClick={onRemove}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {/* Miniatury pary — szybki podgląd tego, co wybrano. Proporcja 3:4
          jak na stronie (components/sections/metamorfozy.tsx) — inna
          proporcja + object-cover przycinałaby prawdziwe zdjęcia. */}
      {para.beforeUrl || para.afterUrl ? (
        <div className="mb-3 grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
          {(
            [
              ["PRZED", para.beforeUrl],
              ["PO", para.afterUrl],
            ] as const
          ).map(([label, url]) => (
            <div key={label} className="relative aspect-[3/4] bg-muted">
              {url ? (
                <Image src={url} alt="" fill sizes="200px" className="object-cover" />
              ) : null}
              <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ImageField
          label={'Zdjęcie „przed"'}
          value={para.beforeUrl}
          onChange={(url) => onChange({ ...para, beforeUrl: url })}
        />
        <ImageField
          label={'Zdjęcie „po"'}
          value={para.afterUrl}
          onChange={(url) => onChange({ ...para, afterUrl: url })}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label={'Alt „przed" (SEO)'}>
          <Input
            value={para.beforeAlt}
            onChange={(e) => onChange({ ...para, beforeAlt: e.target.value })}
          />
        </Field>
        <Field label={'Alt „po" (SEO)'}>
          <Input
            value={para.afterAlt}
            onChange={(e) => onChange({ ...para, afterAlt: e.target.value })}
          />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Podpis pary w podglądzie" hint="np. „Wewnętrzna beczka felgi”">
          <Input
            value={para.podpis}
            onChange={(e) => onChange({ ...para, podpis: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

/**
 * Lista par jednego tematu z drag-and-drop. Osobny komponent = `useId()`
 * per DndContext (oficjalny fix hydration mismatch dnd-kit / Next.js).
 */
function TemaParySortable({
  pary,
  sensors,
  onChangePary,
}: {
  pary: MetamorfozyPara[];
  sensors: ReturnType<typeof useSensors>;
  onChangePary: (next: MetamorfozyPara[]) => void;
}) {
  const dndId = useId();

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pary.findIndex((p) => p.id === active.id);
    const newIndex = pary.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChangePary(reorderPary(arrayMove(pary, oldIndex, newIndex)));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={pary.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {pary.map((para, i) => (
            <SortableParaCard
              key={para.id}
              para={para}
              index={i}
              onChange={(next) =>
                onChangePary(pary.map((p) => (p.id === next.id ? next : p)))
              }
              onRemove={() =>
                onChangePary(reorderPary(pary.filter((p) => p.id !== para.id)))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function MetamorfozyClient({ initial }: { initial: MetamorfozyData }) {
  const router = useRouter();
  const history = useMagazynHistory<MetamorfozyData>(initial);
  const { heading, subheading, tematy } = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedTematy = [...tematy].sort((a, b) => a.order - b.order);
  const setTematy = (next: MetamorfozyTemat[]) =>
    history.setState((draft) => ({ ...draft, tematy: next }));

  const patchTemat = (id: string, patch: Partial<MetamorfozyTemat>) =>
    setTematy(sortedTematy.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/metamorfozy", history.state);
    if (result.ok) {
      setStatus("Metamorfozy zapisane.");
      history.commitSaved();
      router.refresh();
    } else {
      setError(true);
      setStatus(result.error);
    }
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metamorfozy"
        description="Sekcja „Efekty — zobacz różnicę”: kafelki przed/po z pełnoekranowym podglądem"
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz metamorfozy"
        pending={pending}
        status={status}
        error={error}
      />

      <Fieldset legend="Nagłówek sekcji">
        <Field label="Nagłówek (H2)">
          <Input
            value={heading}
            onChange={(e) =>
              history.setState((draft) => ({ ...draft, heading: e.target.value }))
            }
          />
        </Field>
        <Field label="Podtytuł">
          <Input
            value={subheading}
            onChange={(e) =>
              history.setState((draft) => ({
                ...draft,
                subheading: e.target.value,
              }))
            }
          />
        </Field>
      </Fieldset>

      {sortedTematy.map((temat, tematIndex) => {
        const sortedPary = [...temat.pary].sort((a, b) => a.order - b.order);
        const setPary = (next: MetamorfozyPara[]) =>
          patchTemat(temat.id, { pary: next });

        return (
          <Fieldset
            key={temat.id}
            legend={temat.title || `Temat ${tematIndex + 1}`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tytuł kafelka" hint="np. „Dekontaminacja”">
                <Input
                  value={temat.title}
                  onChange={(e) =>
                    patchTemat(temat.id, { title: e.target.value })
                  }
                />
              </Field>
              <Field
                label="Opis"
                hint="1–2 zdania: co było i co zrobiliśmy"
              >
                <Input
                  value={temat.text}
                  onChange={(e) => patchTemat(temat.id, { text: e.target.value })}
                />
              </Field>
            </div>

            {/* Ukrycie kafelka bez usuwania — np. temat w przygotowaniu,
                jeszcze bez kompletu zdjęć. */}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!temat.disabled}
                onCheckedChange={(checked) =>
                  patchTemat(temat.id, { disabled: !checked })
                }
                ariaLabel={`Widoczność kafelka ${temat.title || `Temat ${tematIndex + 1}`}`}
              />
              Widoczny na stronie
            </label>

            <p className="text-xs text-muted-foreground">
              Przeciągnij uchwyt, aby zmienić kolejność par. Pierwsza para to
              okładka kafelka na stronie; wszystkie pary widać w podglądzie.
            </p>

            <TemaParySortable
              pary={sortedPary}
              sensors={sensors}
              onChangePary={setPary}
            />

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  setPary(
                    reorderPary([
                      ...sortedPary,
                      {
                        id: `para-${Date.now()}`,
                        beforeUrl: "",
                        beforeAlt: "",
                        afterUrl: "",
                        afterAlt: "",
                        podpis: "",
                        order: sortedPary.length,
                      },
                    ]),
                  )
                }
              >
                <Plus className="size-4" aria-hidden /> Dodaj parę przed/po
              </Button>
              <RowControls
                onUp={() => {
                  const next = [...sortedTematy];
                  const [row] = next.splice(tematIndex, 1);
                  next.splice(tematIndex - 1, 0, row as MetamorfozyTemat);
                  setTematy(reorderTematy(next));
                }}
                onDown={() => {
                  const next = [...sortedTematy];
                  const [row] = next.splice(tematIndex, 1);
                  next.splice(tematIndex + 1, 0, row as MetamorfozyTemat);
                  setTematy(reorderTematy(next));
                }}
                onRemove={() =>
                  setTematy(
                    reorderTematy(sortedTematy.filter((t) => t.id !== temat.id)),
                  )
                }
                upDisabled={tematIndex === 0}
                downDisabled={tematIndex === sortedTematy.length - 1}
                removeLabel={`Usuń temat ${temat.title || tematIndex + 1}`}
              />
            </div>
          </Fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            setTematy(
              reorderTematy([
                ...sortedTematy,
                {
                  id: `temat-${Date.now()}`,
                  title: "",
                  text: "",
                  order: sortedTematy.length,
                  disabled: false,
                  pary: [],
                },
              ]),
            )
          }
        >
          <Plus className="size-4" aria-hidden /> Dodaj temat
        </Button>
      </div>
    </div>
  );
}
