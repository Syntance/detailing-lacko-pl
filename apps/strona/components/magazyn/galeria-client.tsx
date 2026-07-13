"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Plus, Save, Upload } from "lucide-react";
import type { GaleriaData, GaleriaPhoto } from "@/lib/galeria";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
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

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/magazyn/cms-upload", {
        method: "POST",
        body: formData,
      });
      const body = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !body.urls?.[0]) {
        setUploadError(body.error ?? "Upload nie powiódł się.");
        return;
      }
      onChange(body.urls[0]);
    } catch {
      setUploadError("Brak połączenia — spróbuj ponownie.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Field label={label} hint="URL albo wgraj plik (JPG/WebP)">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/galeria/…"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            aria-label={`Wgraj plik: ${label}`}
          >
            <Upload className="size-4" aria-hidden />
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </div>
      </Field>
      {value ? (
        // Podgląd w panelu — zwykły <img>, bez optymalizacji next/image.
        <img
          src={value}
          alt=""
          className="h-28 w-full max-w-xs rounded-md border border-border object-cover"
        />
      ) : null}
      <StatusMessage message={uploadError} error />
      {uploading ? (
        <p className="text-xs text-muted-foreground">Wgrywanie…</p>
      ) : null}
    </div>
  );
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
