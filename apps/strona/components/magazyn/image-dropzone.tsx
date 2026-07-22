"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@moduly/ui";
import {
  CMS_ACCEPT_ATTRIBUTE,
  CMS_ALLOWED_FORMATS_LABEL,
  MAX_CMS_UPLOAD_MB,
  formatCmsBrowserUploadError,
  inferCmsMimeType,
  uploadCmsImageFromBrowser,
  validateCmsBrowserUploadFile,
} from "@moduly/magazyn-core/client";
import { useFileDropZone } from "@moduly/magazyn-core/hooks/use-file-drop-zone";
import { ImagePlus, Loader2, X } from "lucide-react";
import { StatusMessage } from "./editor-ui";

/**
 * Wgrywanie zdjęć: przeciągnij i upuść, kliknij albo wklej ze schowka
 * (Ctrl+V). Upload idzie przez `uploadCmsImageFromBrowser` z magazyn-core —
 * małe pliki przez API, duże presignem prosto do R2 (omija limit ~4,5 MB
 * na Vercelu). Serwer konwertuje każdy plik do WebP.
 *
 * `multiple` = tryb galerii (wiele plików naraz → onUploaded z listą URL-i).
 */
export function ImageDropzone({
  onUploaded,
  multiple = false,
  label = "Przeciągnij zdjęcie tutaj",
  className,
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const picked = multiple ? files : files.slice(0, 1);

      // Odrzucamy niewspierane formaty od razu w przeglądarce — czytelniej
      // niż czekać na błąd 400 z serwera.
      const rejected: string[] = [];
      const accepted: File[] = [];
      for (const file of picked) {
        const sizeError = validateCmsBrowserUploadFile(file);
        if (sizeError) {
          rejected.push(sizeError);
        } else if (!inferCmsMimeType(file)) {
          rejected.push(`„${file.name}" — nieobsługiwany format.`);
        } else {
          accepted.push(file);
        }
      }

      setError(rejected.length ? rejected.join(" ") : null);
      if (accepted.length === 0) return;

      setTotal(accepted.length);
      setBusy(accepted.length);

      const urls: string[] = [];
      const failures: string[] = [];
      for (const file of accepted) {
        try {
          urls.push(await uploadCmsImageFromBrowser(file));
        } catch (uploadError) {
          failures.push(
            `„${file.name}" — ${formatCmsBrowserUploadError(uploadError)}`,
          );
        } finally {
          setBusy((n) => n - 1);
        }
      }

      setTotal(0);
      if (failures.length) {
        setError((prev) => [prev, ...failures].filter(Boolean).join(" "));
      }
      if (urls.length) onUploaded(urls);
    },
    [multiple, onUploaded],
  );

  const { isDragging, dropZoneProps } = useFileDropZone({
    onDropFiles: (files) => void handleFiles(files),
  });

  // Wklejanie ze schowka działa, gdy strefa ma fokus — bez globalnego
  // listenera, żeby nie przechwytywać Ctrl+V z pól tekstowych obok.
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) {
        event.preventDefault();
        void handleFiles(files);
      }
    };
    zone.addEventListener("paste", onPaste);
    return () => zone.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const uploading = busy > 0;

  return (
    <div className={className}>
      <div
        ref={zoneRef}
        {...dropZoneProps}
        role="button"
        tabIndex={0}
        aria-label={`${label}. Obsługiwane formaty: ${CMS_ALLOWED_FORMATS_LABEL}. Możesz też wkleić zdjęcie ze schowka.`}
        aria-busy={uploading}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border bg-background hover:border-primary-strong/60 hover:bg-muted/40"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary-strong" aria-hidden />
            <p className="text-sm font-medium">
              Wgrywanie{total > 1 ? ` — zostało ${busy} z ${total}` : "…"}
            </p>
          </>
        ) : (
          <>
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">
              {isDragging ? "Upuść, aby wgrać" : label}
            </p>
            <p className="text-xs text-muted-foreground">
              kliknij, przeciągnij{multiple ? " (można kilka naraz)" : ""} albo
              wklej ze schowka · {CMS_ALLOWED_FORMATS_LABEL} · do{" "}
              {MAX_CMS_UPLOAD_MB} MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={CMS_ACCEPT_ATTRIBUTE}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void handleFiles(files);
            event.target.value = "";
          }}
        />
      </div>

      {error ? (
        <div className="mt-2 flex items-start gap-2">
          <StatusMessage message={error} error />
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Ukryj błąd"
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Pole pojedynczego zdjęcia: dropzone + ręczny URL + podgląd.
 * Używane tam, gdzie zdjęcie jest jedno (hero, OG image).
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>

      {value ? (
        <div className="flex items-start gap-3">
          {/* Podgląd w panelu — zwykły <img>, bez optymalizacji next/image. */}
          <img
            src={value}
            alt=""
            className="h-28 w-44 shrink-0 rounded-lg border border-border object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${label} — adres pliku`}
              placeholder="/images/…"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-destructive underline-offset-4 hover:underline"
            >
              Usuń zdjęcie
            </button>
          </div>
        </div>
      ) : (
        <ImageDropzone
          label={`Wgraj: ${label}`}
          onUploaded={(urls) => {
            const first = urls[0];
            if (first) onChange(first);
          }}
        />
      )}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
