"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, PageHeader } from "@moduly/ui";
import { SEO_LIMITS, type SeoData } from "@/lib/seo";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import {
  Checkbox,
  Field,
  Fieldset,
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
function GooglePreview({
  seo,
  sciezka,
  opis,
}: {
  seo: SeoData;
  /** Podstrona w adresie, np. „wulkanizacja" (pusta = strona główna). */
  sciezka: string;
  /** Opis, który faktycznie trafi do Google (własny albo z cennika). */
  opis: string;
}) {
  const host = seo.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const clamp = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Podgląd w Google
      </p>
      <p className="text-xs text-muted-foreground">
        {host}
        {sciezka ? ` › ${sciezka}` : ""}
      </p>
      <p className="mt-0.5 text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {clamp(seo.title || "(brak tytułu)", SEO_LIMITS.titleMax)}
      </p>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        {clamp(opis || "(brak opisu)", SEO_LIMITS.descriptionMax)}
      </p>
    </div>
  );
}

/**
 * Edytor SEO. Dwa tryby na tym samym komponencie:
 * - `glowna` — strona główna (detailing) RAZEM z ustawieniami całej witryny
 *   (adres kanoniczny, indeksowanie, roboty AI),
 * - `wulkanizacja` — tylko pola strony /wulkanizacja; ustawienia witryny są
 *   jedne dla obu linii, więc tu ich nie ma (jest odsyłacz do głównego SEO),
 *   a pusty opis znaczy „złóż z cennika" (`opisAuto` pokazuje, co wyjdzie).
 */
export function SeoClient({
  initial,
  strona = "glowna",
  opisAuto = "",
}: {
  initial: SeoData;
  strona?: "glowna" | "wulkanizacja";
  opisAuto?: string;
}) {
  const router = useRouter();
  const history = useMagazynHistory<SeoData>(initial);
  const seo = history.state;
  const wulkanizacja = strona === "wulkanizacja";
  const opisEfektywny = seo.description.trim() || opisAuto;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (patch: Partial<SeoData>) =>
    history.setState((draft) => ({ ...draft, ...patch }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData(
      wulkanizacja ? "/api/magazyn/seo-wulkanizacja" : "/api/magazyn/seo",
      history.state,
    );
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
        title={wulkanizacja ? "SEO — Wulkanizacja" : "SEO"}
        description={
          wulkanizacja
            ? "Tytuł, opis i obrazek udostępniania strony /wulkanizacja."
            : "Tytuł, opis i obrazek udostępniania strony głównej oraz ustawienia całej witryny."
        }
      />

      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz SEO"
        pending={pending}
        status={status}
        error={error}
      />

      <GooglePreview
        seo={seo}
        sciezka={wulkanizacja ? "wulkanizacja" : ""}
        opis={opisEfektywny}
      />

      <Fieldset legend="Wyszukiwarka">
        <Field
          label="Tytuł strony"
          hint={
            wulkanizacja
              ? "Najważniejsza fraza na początku, np. „Wulkanizacja Łącko — …”."
              : "Najważniejsza fraza na początku, np. „Detailing Łącko — …”."
          }
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
          hint={
            wulkanizacja
              ? "Puste pole = opis składa się sam z aktualnych cen w cenniku wulkanizacji (podpowiedź w polu). Wpisz własny, jeśli wolisz inny."
              : "Konkret zamiast ogólników — cena, lokalizacja, brak ryzyka."
          }
        >
          <textarea
            rows={3}
            className={textareaClass}
            value={seo.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder={wulkanizacja ? opisAuto : undefined}
          />
        </Field>
        <p className="-mt-2 text-xs">
          <CharCount value={opisEfektywny} max={SEO_LIMITS.descriptionMax} />
          {wulkanizacja && !seo.description.trim() ? (
            <span className="text-muted-foreground"> · opis z cennika</span>
          ) : null}
        </p>

        <Field
          label="Główna fraza kluczowa"
          hint="Tylko notatka dla Ciebie — nie trafia do kodu strony (Google ignoruje meta keywords)."
        >
          <Input
            value={seo.focusKeyword}
            onChange={(e) => set({ focusKeyword: e.target.value })}
            placeholder={
              wulkanizacja ? "wulkanizacja Łącko" : "pranie tapicerki Łącko"
            }
          />
        </Field>

        {/* Adres kanoniczny jest jeden dla całej witryny — /wulkanizacja
            dokleja do niego swoją ścieżkę, więc w jej trybie pola nie ma. */}
        {wulkanizacja ? null : (
          <Field
            label="Adres strony (kanoniczny)"
            hint="Bez ukośnika na końcu, np. https://detailing-lacko.pl"
          >
            <Input
              value={seo.siteUrl}
              onChange={(e) =>
                set({ siteUrl: e.target.value.replace(/\/$/, "") })
              }
            />
          </Field>
        )}
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
            placeholder={opisEfektywny}
          />
        </Field>
      </Fieldset>

      {wulkanizacja ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Widoczność w Google i dla robotów AI ustawiasz raz dla całej witryny
          (obie linie naraz) w{" "}
          <Link
            href="/magazyn/panel/seo"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Magazyn → SEO
          </Link>
          .
        </p>
      ) : (
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
      )}
    </div>
  );
}
