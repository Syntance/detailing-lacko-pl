"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Plus } from "lucide-react";
import type { FaqData, FaqItemInput } from "@/lib/faq";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Field,
  Fieldset,
  RowControls,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

const textareaClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function reorder(list: FaqItemInput[]): FaqItemInput[] {
  return list.map((entry, index) => ({ ...entry, order: index }));
}

export function FaqClient({ initial }: { initial: FaqData }) {
  const router = useRouter();
  const history = useMagazynHistory<FaqData>(initial);
  const { items } = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const sorted = [...items].sort((a, b) => a.order - b.order);
  const setItems = (next: FaqItemInput[]) =>
    history.setState((draft) => ({ ...draft, items: next }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/faq", history.state);
    if (result.ok) {
      setStatus("Zapisano FAQ.");
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
        title="FAQ"
        description={`${items.length} pytań — sekcja „Częste pytania" na stronie głównej`}
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz FAQ"
        pending={pending}
        status={status}
        error={error}
      />

      {sorted.map((item, index) => (
        <Fieldset
          key={item.id}
          legend={item.question || `Pytanie ${index + 1}`}
          actions={
            <RowControls
              onUp={() => {
                const next = [...sorted];
                const [row] = next.splice(index, 1);
                next.splice(index - 1, 0, row as FaqItemInput);
                setItems(reorder(next));
              }}
              onDown={() => {
                const next = [...sorted];
                const [row] = next.splice(index, 1);
                next.splice(index + 1, 0, row as FaqItemInput);
                setItems(reorder(next));
              }}
              onRemove={() =>
                setItems(reorder(sorted.filter((i) => i.id !== item.id)))
              }
              upDisabled={index === 0}
              downDisabled={index === sorted.length - 1}
              removeLabel={`Usuń pytanie ${item.question || index + 1}`}
            />
          }
        >
          <Field label="Pytanie">
            <Input
              value={item.question}
              onChange={(e) =>
                setItems(
                  sorted.map((i) =>
                    i.id === item.id ? { ...i, question: e.target.value } : i,
                  ),
                )
              }
            />
          </Field>
          <Field label="Odpowiedź">
            <textarea
              rows={3}
              className={textareaClass}
              value={item.answer}
              onChange={(e) =>
                setItems(
                  sorted.map((i) =>
                    i.id === item.id ? { ...i, answer: e.target.value } : i,
                  ),
                )
              }
            />
          </Field>
        </Fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            setItems(
              reorder([
                ...sorted,
                {
                  id: `pytanie-${Date.now()}`,
                  question: "",
                  answer: "",
                  order: sorted.length,
                },
              ]),
            )
          }
        >
          <Plus className="size-4" aria-hidden /> Dodaj pytanie
        </Button>
      </div>
    </div>
  );
}
