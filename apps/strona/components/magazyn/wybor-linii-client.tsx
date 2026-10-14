"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@moduly/ui";
import { ExternalLink } from "lucide-react";
import type { DaneDynamiczne } from "@/lib/dynamiczne";
import type { Linia } from "@/lib/linie";
import {
  SCIEZKI_WYBORU,
  wyborLiniiSchema,
  type StronaWyboru,
  type StronaWyboruId,
  type WyborLiniiData,
} from "@/lib/wybor-linii";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { Field, Fieldset, UndoRedoToolbar, putEditorData } from "./editor-ui";
import { PoleDynamiczne } from "./pole-dynamiczne";

const STRONY: { id: StronaWyboruId; nazwa: string; opis: string }[] = [
  { id: "mapy", nazwa: "Wizytówki Google", opis: "Wybór między wizytówką detailingu a wulkanizacji w Google Maps." },
  { id: "strony", nazwa: "Strony internetowe", opis: "Wybór między stroną detailingu a wulkanizacji." },
];

const KARTY: { linia: Linia; nazwa: string }[] = [
  { linia: "detailing", nazwa: "Opis karty — Detailing" },
  { linia: "wulkanizacja", nazwa: "Opis karty — Wulkanizacja" },
];

/** Edytor tekstów mini-stron wyboru /mapy i /strony (Magazyn → CMS). */
export function WyborLiniiClient({ initial, dane }: { initial: WyborLiniiData; dane: DaneDynamiczne }) {
  const router = useRouter();
  const history = useMagazynHistory<WyborLiniiData>(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const zmienStrone = (id: StronaWyboruId, zmiana: (s: StronaWyboru) => StronaWyboru) =>
    history.setState((d) => ({ ...d, [id]: zmiana(d[id]) }));

  async function save() {
    const parsed = wyborLiniiSchema.safeParse(history.state);
    if (!parsed.success) {
      setError(true);
      setStatus(parsed.error.issues[0]?.message ?? "Popraw teksty.");
      return;
    }
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/wybor-linii", parsed.data);
    if (result.ok) {
      setStatus("Zapisano — strony odświeżą się w kilka sekund.");
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
        title="Strony wyboru (kody QR)"
        description="Krótkie strony, na których klient wybiera detailing albo wulkanizację. Linki w kartach są stałe — tu zmieniasz same teksty."
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz strony wyboru"
        pending={pending}
        status={status}
        error={error}
      />

      {STRONY.map(({ id, nazwa, opis }) => {
        const strona = history.state[id];
        return (
          <Fieldset
            key={id}
            legend={`${nazwa} — ${SCIEZKI_WYBORU[id]}`}
            actions={
              <a
                href={SCIEZKI_WYBORU[id]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-4" aria-hidden /> Podgląd
              </a>
            }
          >
            <p className="-mt-1 text-xs text-muted-foreground">{opis} Podgląd pokazuje wersję zapisaną.</p>
            <Field label="Nagłówek strony">
              <PoleDynamiczne
                value={strona.tytul}
                dane={dane}
                onChange={(tytul) => zmienStrone(id, (s) => ({ ...s, tytul }))}
              />
            </Field>
            <Field label="Opis pod nagłówkiem" hint="Puste pole = bez opisu.">
              <PoleDynamiczne
                multiline
                rows={2}
                value={strona.opis}
                dane={dane}
                onChange={(o) => zmienStrone(id, (s) => ({ ...s, opis: o }))}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              {KARTY.map(({ linia, nazwa: etykieta }) => (
                <Field key={linia} label={etykieta}>
                  <PoleDynamiczne
                    multiline
                    rows={3}
                    value={strona.karty[linia].opis}
                    dane={dane}
                    linia={linia}
                    onChange={(o) =>
                      zmienStrone(id, (s) => ({ ...s, karty: { ...s.karty, [linia]: { opis: o } } }))
                    }
                  />
                </Field>
              ))}
            </div>
          </Fieldset>
        );
      })}
    </div>
  );
}
