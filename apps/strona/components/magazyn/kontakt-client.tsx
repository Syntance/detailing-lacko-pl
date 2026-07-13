"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@moduly/ui";
import { Save } from "lucide-react";
import type { KontaktData } from "@/lib/site";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import {
  Field,
  Fieldset,
  StatusMessage,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

export function KontaktClient({ initial }: { initial: KontaktData }) {
  const router = useRouter();
  const history = useMagazynHistory<KontaktData>(initial);
  const data = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof KontaktData>(key: K, value: KontaktData[K]) =>
    history.setState((draft) => ({ ...draft, [key]: value }));

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/kontakt", history.state);
    if (result.ok) {
      setStatus("Dane firmy zapisane.");
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
        title="Dane firmy"
        description="Telefon, adres, obszar dojazdu — używane w sekcji Kontakt, sticky CTA, stopce i danych dla Google (JSON-LD)"
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      <Fieldset legend="Kontakt">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telefon — jak na stronie" hint="np. 530 123 456">
            <Input
              value={data.phoneDisplay}
              onChange={(e) => set("phoneDisplay", e.target.value)}
            />
          </Field>
          <Field label="Telefon — format tel:" hint="np. +48530123456">
            <Input
              value={data.phoneE164}
              onChange={(e) => set("phoneE164", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Link Messenger" hint="np. https://m.me/twojprofil">
            <Input
              value={data.messengerUrl}
              onChange={(e) => set("messengerUrl", e.target.value)}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Godziny / dostępność" hint="np. popołudnia i weekendy">
          <Input
            value={data.hoursNote}
            onChange={(e) => set("hoursNote", e.target.value)}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Adres i dojazd">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Adres">
            <Input
              value={data.addressLine}
              onChange={(e) => set("addressLine", e.target.value)}
            />
          </Field>
          <Field label="Kod pocztowy">
            <Input
              value={data.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
            />
          </Field>
          <Field label="Miejscowość">
            <Input
              value={data.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Obsługiwane miejscowości"
            hint="Oddziel przecinkami — na stronie rozdzielone kropką"
          >
            <Input
              value={data.serviceAreas.join(", ")}
              onChange={(e) =>
                set(
                  "serviceAreas",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field
            label="Dojazd gratis do (km)"
            hint="0 = brak dojazdu (obecnie usługa tylko stacjonarna)"
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={data.freeTravelKm}
              onChange={(e) => set("freeTravelKm", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Szerokość geo (lat)" hint="do JSON-LD LocalBusiness">
            <Input
              type="number"
              step="0.0001"
              value={data.latitude}
              onChange={(e) => set("latitude", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Długość geo (lng)">
            <Input
              type="number"
              step="0.0001"
              value={data.longitude}
              onChange={(e) => set("longitude", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Firma i Google">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="NIP" hint="widoczny w stopce (opcjonalnie)">
            <Input value={data.nip} onChange={(e) => set("nip", e.target.value)} />
          </Field>
          <Field label={`Link „Zostaw opinię”`} hint="link do wizytówki Google">
            <Input
              value={data.googleReviewUrl}
              onChange={(e) => set("googleReviewUrl", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Link Google Maps" hint={`przycisk „Wyznacz trasę”`}>
          <Input
            value={data.googleMapsUrl}
            onChange={(e) => set("googleMapsUrl", e.target.value)}
          />
        </Field>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={pending || !history.isDirty}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Zapisywanie…" : "Zapisz dane"}
        </Button>
        <StatusMessage message={status} error={error} />
      </div>
    </div>
  );
}
