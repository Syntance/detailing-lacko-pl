"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PageHeader } from "@moduly/ui";
import { Save } from "lucide-react";
import type { HomeContentInput } from "@/lib/cms-schema";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import {
  Fieldset,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

/**
 * Edytor „Treść" przycięty do zasobów wymiennych bez developera: zdjęcia.
 * Copy strony (nagłówki, FAQ, sekcje) żyje w kodzie — decyzja 22.07.2026.
 */
export function TrescClient({ initial }: { initial: HomeContentInput }) {
  const router = useRouter();
  const history = useMagazynHistory<HomeContentInput>(initial);
  const data = history.state;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/tresc", history.state);
    if (result.ok) {
      setStatus("Zapisano — strona odświeży się w kilka sekund.");
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
        title="Zdjęcia strony"
        description="Zdjęcie hero na stronie głównej. Teksty strony są utrzymywane w kodzie."
      />

      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <Fieldset legend="Sekcja główna (hero)">
        <ImageField
          label="Zdjęcie hero"
          hint="Najlepiej najlepsza para przed/po tapicerki — to pierwsze, co widzi klient."
          value={data.hero.desktopImageUrl}
          onChange={(url) =>
            history.setState((draft) => ({
              ...draft,
              hero: { desktopImageUrl: url },
            }))
          }
        />
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
