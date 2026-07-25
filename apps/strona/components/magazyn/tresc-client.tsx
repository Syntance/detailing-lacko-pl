"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@moduly/ui";
import type { HomeContentInput } from "@/lib/cms-schema";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import { Fieldset, UndoRedoToolbar, putEditorData } from "./editor-ui";

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
        description="Zdjęcia hero — osobno komputer i telefon. Teksty strony są utrzymywane w kodzie."
      />

      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz"
        pending={pending}
        status={status}
        error={error}
      />

      <Fieldset legend="Desktop (komputery i tablety)">
        <ImageField
          label="Zdjęcie hero — desktop"
          hint="Kadr poziomy. To pierwsze, co widzi klient na komputerze."
          value={data.hero.desktopImageUrl}
          onChange={(url) =>
            history.setState((draft) => ({
              ...draft,
              hero: { ...draft.hero, desktopImageUrl: url },
            }))
          }
        />
      </Fieldset>

      <Fieldset legend="Mobile (telefony)">
        <ImageField
          label="Zdjęcie hero — telefon"
          hint="Kadr pionowy pod pierwszy ekran telefonu. Puste pole = telefon użyje zdjęcia desktopowego."
          value={data.hero.mobileImageUrl}
          onChange={(url) =>
            history.setState((draft) => ({
              ...draft,
              hero: { ...draft.hero, mobileImageUrl: url },
            }))
          }
        />
      </Fieldset>
    </div>
  );
}
