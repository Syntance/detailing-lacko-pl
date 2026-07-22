"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Save } from "lucide-react";
import { SEO_LIMITS, type SeoData } from "@/lib/seo";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import {
  Checkbox,
  Field,
  Fieldset,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

const textareaClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** Licznik znaków — zielony w limicie, czerwony po przekroczeniu. */
function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={over ? "font-medium text-destructive" : "text-muted-foreground"}>
      {value.length} / {max} znaków
      {over ? " — Google utnie" : ""}
    </span>
  );
}

/** Podgląd tego, co zobaczy użytkownik w wynikach wyszukiwania. */
function GooglePreview({ seo }: { seo: SeoData }) {
  const host = seo.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const clamp = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Podgląd w Google
      </p>
      <p className="text-xs text-muted-foreground">{host}</p>
      <p className="mt-0.5 text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {clamp(seo.title || "(brak tytułu)", SEO_LIMITS.titleMax)}
      </p>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        {clamp(seo.description || "(brak opisu)", SEO_LIMITS.descriptionMax)}
      </p>
    </div>
  );
}

export function SeoClient({ initial }: { initial: SeoData }) {
  const router = useRouter();
  const history = useMagazynHistory<SeoData>(initial);
  const seo = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (patch: Partial<SeoData>) =>
    history.setState((draft) => ({ ...draft, ...patch }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/seo", history.state);
    if (result.ok) {
      setStatus("SEO zapisane — strona odświeży się w kilka sekund.");
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
        title="SEO"
        description="Tytuł, opis i obrazek udostępniania dla całej strony."
      />

      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <GooglePreview seo={seo} />

      <Fieldset legend="Wyszukiwarka">
        <Field
          label="Tytuł strony"
          hint="Najważniejsza fraza na początku, np. „Detailing Łącko — …”."
        >
          <Input
            value={seo.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
        <p className="-mt-2 text-xs">
          <CharCount value={seo.title} max={SEO_LIMITS.titleMax} />
        </p>

        <Field
          label="Opis (meta description)"
          hint="Konkret zamiast ogólników — cena, lokalizacja, brak ryzyka."
        >
          <textarea
            rows={3}
            className={textareaClass}
            value={seo.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
        <p className="-mt-2 text-xs">
          <CharCount value={seo.description} max={SEO_LIMITS.descriptionMax} />
        </p>

        <Field
          label="Główna fraza kluczowa"
          hint="Tylko notatka dla Ciebie — nie trafia do kodu strony (Google ignoruje meta keywords)."
        >
          <Input
            value={seo.focusKeyword}
            onChange={(e) => set({ focusKeyword: e.target.value })}
            placeholder="pranie tapicerki Łącko"
          />
        </Field>

        <Field
          label="Adres strony (kanoniczny)"
          hint="Bez ukośnika na końcu, np. https://detailing-lacko.pl"
        >
          <Input
            value={seo.siteUrl}
            onChange={(e) => set({ siteUrl: e.target.value.replace(/\/$/, "") })}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Udostępnianie (Facebook, Messenger, WhatsApp)">
        <ImageField
          label="Obrazek udostępniania"
          hint="Zalecane 1200×630 px. Widoczny, gdy ktoś wyśle link do strony."
          value={seo.ogImageUrl}
          onChange={(url) => set({ ogImageUrl: url })}
        />
        <Field label="Tytuł przy udostępnianiu" hint="Puste = użyje tytułu strony.">
          <Input
            value={seo.ogTitle}
            onChange={(e) => set({ ogTitle: e.target.value })}
            placeholder={seo.title}
          />
        </Field>
        <Field label="Opis przy udostępnianiu" hint="Puste = użyje opisu strony.">
          <textarea
            rows={2}
            className={textareaClass}
            value={seo.ogDescription}
            onChange={(e) => set({ ogDescription: e.target.value })}
            placeholder={seo.description}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Widoczność dla robotów">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={seo.indexable}
            onCheckedChange={(next) => set({ indexable: next })}
            ariaLabel="Pozwól wyszukiwarkom indeksować stronę"
          />
          <div className="text-sm">
            <p className="font-medium">Pozwól wyszukiwarkom indeksować stronę</p>
            <p className="text-xs text-muted-foreground">
              Odznacz tylko na czas przygotowywania strony — odznaczone znaczy,
              że strona zniknie z Google.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={seo.allowAiBots}
            onCheckedChange={(next) => set({ allowAiBots: next })}
            ariaLabel="Pozwól robotom AI czytać stronę"
          />
          <div className="text-sm">
            <p className="font-medium">Pozwól robotom AI czytać stronę</p>
            <p className="text-xs text-muted-foreground">
              ChatGPT, Claude, Perplexity. Włączone = strona może być polecana
              w odpowiedziach AI.
            </p>
          </div>
        </div>

        {!seo.indexable ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Uwaga: strona jest ustawiona jako niewidoczna w wyszukiwarkach.
          </p>
        ) : null}
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz SEO"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
