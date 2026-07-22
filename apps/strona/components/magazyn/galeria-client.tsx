"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Plus, Save } from "lucide-react";
import type { GaleriaData, GaleriaPhoto } from "@/lib/galeria";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageDropzone, ImageField } from "./image-dropzone";
import {
  Field,
  Fieldset,
  RowControls,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

function reorder(list: GaleriaPhoto[]): GaleriaPhoto[] {
  return list.map((entry, index) => ({ ...entry, order: index }));
}

/** Nazwa pliku z URL-a → wstępny podpis, żeby pole nie było puste. */
function captionFromUrl(url: string): string {
  const name = url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const cleaned = name.replace(/^\d+-[a-z0-9]{4,8}-/i, "").replace(/[-_]+/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function GaleriaClient({ initial }: { initial: GaleriaData }) {
  const router = useRouter();
  const history = useMagazynHistory<GaleriaData>(initial);
  const { heading, subheading, photos } = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const sorted = [...photos].sort((a, b) => a.order - b.order);
  const setPhotos = (nextPhotos: GaleriaPhoto[]) =>
    history.setState((draft) => ({ ...draft, photos: nextPhotos }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/galeria", history.state);
    if (result.ok) {
      setStatus("Galeria zapisana.");
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
        title="Galeria"
        description={`${photos.length} zdjęć — sekcja „Galeria realizacji" z powiększaniem`}
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <Fieldset legend="Nagłówek sekcji">
        <Field label="Nagłówek (H2)">
          <Input
            value={heading}
            onChange={(e) =>
              history.setState((draft) => ({
                ...draft,
                heading: e.target.value,
              }))
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

      {/* Masowe wgrywanie — każdy plik tworzy nowy wpis galerii. */}
      <Fieldset legend="Dodaj zdjęcia">
        <ImageDropzone
          multiple
          label="Przeciągnij zdjęcia realizacji"
          onUploaded={(urls) =>
            setPhotos(
              reorder([
                ...sorted,
                ...urls.map((url, i) => ({
                  id: `zdjecie-${Date.now()}-${i}`,
                  url,
                  caption: captionFromUrl(url),
                  alt: "",
                  order: sorted.length + i,
                  disabled: false,
                })),
              ]),
            )
          }
        />
      </Fieldset>

      {sorted.map((photo, index) => (
        <Fieldset key={photo.id} legend={photo.caption || `Zdjęcie ${index + 1}`}>
          <ImageField
            label="Zdjęcie"
            value={photo.url}
            onChange={(url) =>
              setPhotos(
                sorted.map((p) => (p.id === photo.id ? { ...p, url } : p)),
              )
            }
          />
          <ImageField
            label={'Zdjęcie „przed" (opcjonalne)'}
            hint="Gdy ustawione, kafelek pokaże suwak przed/po zamiast zwykłego zdjęcia."
            value={photo.beforeUrl ?? ""}
            onChange={(url) =>
              setPhotos(
                sorted.map((p) =>
                  p.id === photo.id ? { ...p, beforeUrl: url || undefined } : p,
                ),
              )
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Podpis"
              hint={`np. „Kanapa po kompleksowym czyszczeniu”`}
            >
              <Input
                value={photo.caption}
                onChange={(e) =>
                  setPhotos(
                    sorted.map((p) =>
                      p.id === photo.id ? { ...p, caption: e.target.value } : p,
                    ),
                  )
                }
              />
            </Field>
            <Field
              label="Alt (SEO)"
              hint={`np. „pranie tapicerki Łącko — fotel po czyszczeniu”`}
            >
              <Input
                value={photo.alt}
                onChange={(e) =>
                  setPhotos(
                    sorted.map((p) =>
                      p.id === photo.id ? { ...p, alt: e.target.value } : p,
                    ),
                  )
                }
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <RowControls
              onUp={() => {
                const nextPhotos = [...sorted];
                const [row] = nextPhotos.splice(index, 1);
                nextPhotos.splice(index - 1, 0, row as GaleriaPhoto);
                setPhotos(reorder(nextPhotos));
              }}
              onDown={() => {
                const nextPhotos = [...sorted];
                const [row] = nextPhotos.splice(index, 1);
                nextPhotos.splice(index + 1, 0, row as GaleriaPhoto);
                setPhotos(reorder(nextPhotos));
              }}
              onRemove={() =>
                setPhotos(reorder(sorted.filter((p) => p.id !== photo.id)))
              }
              upDisabled={index === 0}
              downDisabled={index === sorted.length - 1}
              removeLabel={`Usuń zdjęcie ${photo.caption || index + 1}`}
            />
          </div>
        </Fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            setPhotos(
              reorder([
                ...sorted,
                {
                  id: `zdjecie-${Date.now()}`,
                  url: "",
                  caption: "",
                  alt: "",
                  order: sorted.length,
                  disabled: false,
                },
              ]),
            )
          }
        >
          <Plus className="size-4" aria-hidden /> Dodaj zdjęcie
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz galerię"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
