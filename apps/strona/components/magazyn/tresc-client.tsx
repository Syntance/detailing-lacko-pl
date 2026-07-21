"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import type { FaqItemInput, HomeContentInput } from "@/lib/cms-schema";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Field,
  Fieldset,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

const textareaClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function TrescClient({ initial }: { initial: HomeContentInput }) {
  const router = useRouter();
  const history = useMagazynHistory<HomeContentInput>(initial);
  const data = history.state;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const setHero = (patch: Partial<HomeContentInput["hero"]>) =>
    history.setState((draft) => ({ ...draft, hero: { ...draft.hero, ...patch } }));

  const setFaq = (next: FaqItemInput[]) =>
    history.setState((draft) => ({
      ...draft,
      faq: next.map((item, index) => ({ ...item, order: index })),
    }));

  const updateFaq = (id: string, patch: Partial<FaqItemInput>) =>
    setFaq(data.faq.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addFaq = () =>
    setFaq([
      ...data.faq,
      {
        id: crypto.randomUUID(),
        question: "",
        answer: "",
        order: data.faq.length,
      },
    ]);

  const removeFaq = (id: string) =>
    setFaq(data.faq.filter((item) => item.id !== id));

  const moveFaq = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= data.faq.length) return;
    const next = [...data.faq];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    setFaq(next);
  };

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/tresc", history.state);
    if (result.ok) {
      setStatus("Treść zapisana — strona odświeży się w kilka sekund.");
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
        title="Treść strony"
        description="Nagłówek (hero) i pytania FAQ na stronie głównej."
      />

      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <Fieldset legend="Sekcja główna (hero)">
        <Field label="Nagłówek">
          <Input
            value={data.hero.headline}
            onChange={(e) => setHero({ headline: e.target.value })}
          />
        </Field>
        <Field label="Opis pod nagłówkiem">
          <textarea
            rows={3}
            className={textareaClass}
            value={data.hero.description}
            onChange={(e) => setHero({ description: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Etykieta przycisku CTA" hint={`np. „Zadzwoń”`}>
            <Input
              value={data.hero.ctaLabel}
              onChange={(e) => setHero({ ctaLabel: e.target.value })}
            />
          </Field>
          <Field label="Link CTA" hint="np. #kontakt albo tel:…">
            <Input
              value={data.hero.ctaHref}
              onChange={(e) => setHero({ ctaHref: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label="Zdjęcie hero (ścieżka)"
          hint="np. /images/hero.jpg — podmianę pliku robisz w repo/uploadzie"
        >
          <Input
            value={data.hero.desktopImageUrl}
            onChange={(e) => setHero({ desktopImageUrl: e.target.value })}
          />
        </Field>
      </Fieldset>

      <Fieldset legend={`FAQ (${data.faq.length})`}>
        <div className="space-y-4">
          {data.faq.map((item, index) => (
            <div
              key={item.id}
              className="space-y-3 rounded-xl border border-border bg-background/50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Pytanie {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Wyżej"
                    disabled={index === 0}
                    onClick={() => moveFaq(index, -1)}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Niżej"
                    disabled={index === data.faq.length - 1}
                    onClick={() => moveFaq(index, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Usuń pytanie"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFaq(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Pytanie"
                value={item.question}
                onChange={(e) => updateFaq(item.id, { question: e.target.value })}
              />
              <textarea
                rows={2}
                className={textareaClass}
                placeholder="Odpowiedź"
                value={item.answer}
                onChange={(e) => updateFaq(item.id, { answer: e.target.value })}
              />
            </div>
          ))}
          <Button type="button" variant="outline" className="gap-1.5" onClick={addFaq}>
            <Plus className="size-4" aria-hidden /> Dodaj pytanie
          </Button>
        </div>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz treść"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
