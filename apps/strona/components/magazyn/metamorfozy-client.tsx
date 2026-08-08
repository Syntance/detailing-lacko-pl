"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, ConfirmDialog, Input, PageHeader, cn } from "@moduly/ui";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import {
  paraZdjecia,
  plakietkaZdjecia,
  siatkaKolumny,
  type MetamorfozyData,
  type MetamorfozyPara,
  type MetamorfozyTemat,
  type MetamorfozyZdjecie,
} from "@/lib/metamorfozy";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { ImageField } from "./image-dropzone";
import {
  Checkbox,
  Field,
  Fieldset,
  TextArea,
  UndoRedoToolbar,
  putEditorData,
} from "./editor-ui";

/**
 * Panel → Efekty: edytor sekcji „Przed i po — zobacz różnicę".
 *
 * Układ master–detail: po lewej lista kafelków (przeciąganie = kolejność na
 * stronie), po prawej edycja WYŁĄCZNIE zaznaczonego kafelka. Wcześniej
 * wszystkie kafelki, grupy i zdjęcia renderowały się naraz — przy kilku
 * tematach po kilka par strona ciągnęła się na kilkanaście ekranów i nie dało
 * się połapać, co należy do czego.
 *
 * Nazwy w kodzie (`metamorfozy`, `pary`) zostają: tak leżą dane w blob-ie
 * `site_blobs.metamorfozy` i tak nazywa się endpoint. Zmieniona jest wyłącznie
 * warstwa nazw widoczna dla użytkownika („Efekty", „grupa zdjęć").
 */

/** Pozycja listy dla pól nagłówka sekcji — nie jest tematem, więc własne id. */
const POZYCJA_SEKCJA = "__sekcja__";

function reorderTematy(list: MetamorfozyTemat[]): MetamorfozyTemat[] {
  return list.map((t, i) => ({ ...t, order: i }));
}

function reorderPary(list: MetamorfozyPara[]): MetamorfozyPara[] {
  return list.map((p, i) => ({ ...p, order: i }));
}

function sortujTematy(list: MetamorfozyTemat[]): MetamorfozyTemat[] {
  return [...list].sort((a, b) => a.order - b.order);
}

function sortujPary(list: MetamorfozyPara[]): MetamorfozyPara[] {
  return [...list].sort((a, b) => a.order - b.order);
}

/** Polska odmiana przez liczbę: 1 grupa / 2 grupy / 5 grup. */
function odmiana(n: number, jeden: string, kilka: string, wiele: string) {
  if (n === 1) return jeden;
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  if (jednosci >= 2 && jednosci <= 4 && (dziesiatki < 12 || dziesiatki > 14)) {
    return kilka;
  }
  return wiele;
}

/** Pierwsze wgrane zdjęcie tematu — miniatura na liście. */
function okladkaTematu(temat: MetamorfozyTemat): string | undefined {
  for (const para of sortujPary(temat.pary)) {
    const zdjecie = paraZdjecia(para).find((z) => z.url);
    if (zdjecie) return zdjecie.url;
  }
  return undefined;
}

function podsumowanieTematu(temat: MetamorfozyTemat): string {
  const grupy = temat.pary.length;
  const zdjecia = temat.pary.reduce((n, p) => n + paraZdjecia(p).length, 0);
  return `${grupy} ${odmiana(grupy, "grupa", "grupy", "grup")} · ${zdjecia} ${odmiana(zdjecia, "zdjęcie", "zdjęcia", "zdjęć")}`;
}

/**
 * Miniatura w panelu — zwykły `<img>`, bez next/image: to podgląd dla admina,
 * a nie element strony, więc optymalizacja i konfiguracja domen są zbędne
 * (ta sama decyzja co w `ImageField`).
 */
function Miniatura({
  url,
  rozmiar = "size-10",
}: {
  url?: string;
  rozmiar?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={cn(
          "shrink-0 rounded-md border border-border object-cover",
          rozmiar,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground",
        rozmiar,
      )}
    >
      <ImageIcon className="size-4" aria-hidden />
    </span>
  );
}

/* ─── Lewa kolumna: lista kafelków ──────────────────────────────── */

/**
 * Wiersz listy. Bez lewego paddingu — z lewej stoi już uchwyt przeciągania
 * (albo równa mu rozpórka), więc treść wiersza jest w jednej linii pionowej.
 */
function PozycjaListy({
  aktywna,
  onClick,
  children,
}: {
  aktywna: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={aktywna ? "true" : undefined}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pr-2.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        aktywna
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SortowalnyTemat({
  temat,
  index,
  aktywny,
  onSelect,
}: {
  temat: MetamorfozyTemat;
  index: number;
  aktywny: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: temat.id });

  const tytul = temat.title || `Kafelek ${index + 1}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-0.5 rounded-lg",
        aktywny && "ring-1 ring-primary/40",
        isDragging && "z-10 bg-card opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Przeciągnij „${tytul}", aby zmienić kolejność kafelków`}
        className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <PozycjaListy aktywna={aktywny} onClick={onSelect}>
        <Miniatura url={okladkaTematu(temat)} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{tytul}</span>
            {temat.disabled ? (
              <>
                <EyeOff
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="sr-only">ukryty na stronie</span>
              </>
            ) : null}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {podsumowanieTematu(temat)}
          </span>
        </span>
      </PozycjaListy>
    </li>
  );
}

function ListaTematow({
  tematy,
  sensors,
  selectedId,
  onSelect,
  onReorder,
  onDodaj,
}: {
  tematy: MetamorfozyTemat[];
  sensors: ReturnType<typeof useSensors>;
  selectedId: string;
  onSelect: (id: string) => void;
  onReorder: (next: MetamorfozyTemat[]) => void;
  onDodaj: () => void;
}) {
  const dndId = useId();

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tematy.findIndex((t) => t.id === active.id);
    const newIndex = tematy.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(reorderTematy(arrayMove(tematy, oldIndex, newIndex)));
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
      <div className="flex items-center gap-0.5">
        {/* Wcięcie równe szerokości uchwytu — tekst w jednej linii pionowej
            z tytułami kafelków poniżej. */}
        <span className="size-8 shrink-0" aria-hidden />
        <PozycjaListy
          aktywna={selectedId === POZYCJA_SEKCJA}
          onClick={() => onSelect(POZYCJA_SEKCJA)}
        >
          <span className="text-sm font-medium">Nagłówek sekcji</span>
        </PozycjaListy>
      </div>

      <p className="px-3 pt-1 text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
        Kafelki ({tematy.length})
      </p>

      {tematy.length > 0 ? (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={tematy.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-0.5">
              {tematy.map((temat, i) => (
                <SortowalnyTemat
                  key={temat.id}
                  temat={temat}
                  index={i}
                  aktywny={temat.id === selectedId}
                  onSelect={() => onSelect(temat.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="px-3 pb-1 text-xs text-muted-foreground">
          Brak kafelków — dodaj pierwszy.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1 w-full gap-1.5"
        onClick={onDodaj}
      >
        <Plus className="size-4" aria-hidden /> Dodaj kafelek
      </Button>
    </div>
  );
}

/* ─── Prawa kolumna: zdjęcia w grupie ───────────────────────────── */

/**
 * Zdjęcia jednej grupy — dowolna liczba, kolejność strzałkami.
 *
 * Zapisujemy WYŁĄCZNIE do `zdjecia`; stare `beforeUrl`/`afterUrl` czyścimy
 * przy pierwszej edycji, żeby nie zostały dwa źródła prawdy dla tej samej
 * grupy (czytanie i tak idzie przez `paraZdjecia`).
 */
function ZdjeciaGrupy({
  para,
  onChange,
}: {
  para: MetamorfozyPara;
  onChange: (next: MetamorfozyPara) => void;
}) {
  const zdjecia = paraZdjecia(para);

  const zapisz = (next: MetamorfozyZdjecie[]) =>
    onChange({
      ...para,
      zdjecia: next,
      beforeUrl: undefined,
      beforeAlt: undefined,
      afterUrl: undefined,
      afterAlt: undefined,
    });

  const zmien = (id: string, patch: Partial<MetamorfozyZdjecie>) =>
    zapisz(zdjecia.map((z) => (z.id === id ? { ...z, ...patch } : z)));

  const usun = (id: string) => zapisz(zdjecia.filter((z) => z.id !== id));

  const przesun = (index: number, delta: number) => {
    const cel = index + delta;
    if (cel < 0 || cel >= zdjecia.length) return;
    const next = [...zdjecia];
    const wyjete = next[index];
    if (!wyjete) return;
    next.splice(index, 1);
    next.splice(cel, 0, wyjete);
    zapisz(next);
  };

  const dodaj = () =>
    zapisz([
      ...zdjecia,
      { id: `zdj-${Date.now()}-${zdjecia.length}`, url: "", alt: "" },
    ]);

  // Ta sama reguła co na stronie, żeby podgląd w panelu nie kłamał.
  const kolumny = siatkaKolumny(zdjecia.length, 3);

  return (
    <div className="flex flex-col gap-4">
      {zdjecia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Tak grupa wygląda na stronie:
          </p>
          <div
            className="grid max-w-md gap-1 overflow-hidden rounded-lg"
            style={{ gridTemplateColumns: `repeat(${kolumny}, minmax(0, 1fr))` }}
          >
            {zdjecia.map((z, i) => {
              // Miniatura pokazuje dokładnie to, co wyjdzie na stronie —
              // inaczej panel obiecywałby „PRZED", a strona pokazywała własny
              // napis.
              const plakietka = plakietkaZdjecia(zdjecia, i);
              return (
                <div key={z.id} className="relative aspect-[3/4] bg-muted">
                  {z.url ? (
                    <img
                      src={z.url}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : null}
                  <span className="absolute top-1 left-1 max-w-[calc(100%-8px)] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                    {plakietka ? plakietka.tekst : i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {zdjecia.length === 2
          ? "Dwa zdjęcia = klasyczne przed/po: bez wpisanej plakietki strona sama doda „przed” i „po!”."
          : "Plakietka pojawi się tylko tam, gdzie ją wpiszesz — automatyczne „przed/po” działa wyłącznie przy dwóch zdjęciach."}
      </p>

      <div className="flex flex-col gap-3">
        {zdjecia.map((z, i) => (
          <div
            key={z.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Zdjęcie {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => przesun(i, -1)}
                  disabled={i === 0}
                  aria-label={`Przesuń zdjęcie ${i + 1} wcześniej`}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => przesun(i, 1)}
                  disabled={i === zdjecia.length - 1}
                  aria-label={`Przesuń zdjęcie ${i + 1} później`}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => usun(z.id)}
                  aria-label={`Usuń zdjęcie ${i + 1}`}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <ImageField
              label={`Plik zdjęcia ${i + 1}`}
              value={z.url}
              onChange={(url) => zmien(z.id, { url })}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Plakietka na zdjęciu"
                hint={
                  zdjecia.length === 2
                    ? "puste = automatycznie „przed” i „po!”"
                    : "puste = bez plakietki, np. „zbliżenie”"
                }
              >
                <Input
                  value={z.badge ?? ""}
                  onChange={(e) => zmien(z.id, { badge: e.target.value })}
                />
              </Field>
              <Field label="Opis alternatywny (SEO)">
                <Input
                  value={z.alt}
                  onChange={(e) => zmien(z.id, { alt: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={dodaj}
        className="inline-flex w-max items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Plus className="size-4" aria-hidden /> Dodaj zdjęcie
      </button>
    </div>
  );
}

/**
 * Jedna grupa zdjęć — zwinięta do paska z miniaturami, rozwijana kliknięciem.
 * Naraz otwarta jest jedna grupa: przy trzech grupach po komplecie pól
 * (plik + plakietka + alt na każde zdjęcie) rozwinięcie wszystkich dawało
 * ekran, po którym nie dało się nawigować.
 */
function SortowalnaGrupa({
  para,
  index,
  otwarta,
  onToggle,
  onChange,
  onRemove,
}: {
  para: MetamorfozyPara;
  index: number;
  otwarta: boolean;
  onToggle: () => void;
  onChange: (next: MetamorfozyPara) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: para.id });

  const zdjecia = paraZdjecia(para);
  const etykieta = index === 0 ? "Okładka kafelka" : `Grupa ${index + 1}`;
  // Biernik do etykiet czytnika ekranu („Usuń okładkę", nie „Usuń okładka").
  const biernik = index === 0 ? "okładkę kafelka" : `grupę ${index + 1}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card",
        index === 0 ? "border-primary/60" : "border-border",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          aria-label={`Przeciągnij ${biernik}, aby zmienić kolejność grup`}
          className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={otwarta}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex shrink-0 items-center gap-1">
            {zdjecia.slice(0, 3).map((z) => (
              <Miniatura key={z.id} url={z.url} rozmiar="size-9" />
            ))}
            {zdjecia.length === 0 ? <Miniatura rozmiar="size-9" /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium">{etykieta}</span>
              {index === 0 ? (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                  widoczna na stronie
                </span>
              ) : null}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {zdjecia.length}{" "}
              {odmiana(zdjecia.length, "zdjęcie", "zdjęcia", "zdjęć")}
              {para.podpis ? ` · ${para.podpis}` : ""}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              otwarta && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <button
          type="button"
          aria-label={`Usuń ${biernik}`}
          onClick={onRemove}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {otwarta ? (
        <div className="space-y-4 border-t border-border p-4">
          <ZdjeciaGrupy para={para} onChange={onChange} />
          <Field
            label="Podpis grupy w podglądzie"
            hint="np. „Wewnętrzna beczka felgi”"
          >
            <Input
              value={para.podpis}
              onChange={(e) => onChange({ ...para, podpis: e.target.value })}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Lista grup jednego kafelka z przeciąganiem. Osobny komponent = `useId()`
 * per DndContext (oficjalny fix hydration mismatch dnd-kit / Next.js).
 */
function GrupySortable({
  pary,
  sensors,
  otwartaId,
  onToggle,
  onChangePary,
}: {
  pary: MetamorfozyPara[];
  sensors: ReturnType<typeof useSensors>;
  otwartaId: string | null;
  onToggle: (id: string) => void;
  onChangePary: (next: MetamorfozyPara[]) => void;
}) {
  const dndId = useId();

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pary.findIndex((p) => p.id === active.id);
    const newIndex = pary.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChangePary(reorderPary(arrayMove(pary, oldIndex, newIndex)));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={pary.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {pary.map((para, i) => (
            <SortowalnaGrupa
              key={para.id}
              para={para}
              index={i}
              otwarta={para.id === otwartaId}
              onToggle={() => onToggle(para.id)}
              onChange={(next) =>
                onChangePary(pary.map((p) => (p.id === next.id ? next : p)))
              }
              onRemove={() =>
                onChangePary(reorderPary(pary.filter((p) => p.id !== para.id)))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** Prawa kolumna dla zaznaczonego kafelka. */
function TematDetal({
  temat,
  index,
  sensors,
  onPatch,
  onUsun,
}: {
  temat: MetamorfozyTemat;
  index: number;
  sensors: ReturnType<typeof useSensors>;
  onPatch: (patch: Partial<MetamorfozyTemat>) => void;
  onUsun: () => void;
}) {
  const pary = sortujPary(temat.pary);
  const [otwartaId, setOtwartaId] = useState<string | null>(
    () => pary[0]?.id ?? null,
  );

  const setPary = (next: MetamorfozyPara[]) => onPatch({ pary: next });

  const dodajGrupe = () => {
    const stempel = Date.now();
    const nowa: MetamorfozyPara = {
      id: `para-${stempel}`,
      // Nowa grupa startuje z dwoma slotami — przed/po jest wciąż
      // najczęstszym przypadkiem, a dołożenie kolejnych to jeden przycisk.
      zdjecia: [
        { id: `zdj-${stempel}-0`, url: "", alt: "" },
        { id: `zdj-${stempel}-1`, url: "", alt: "" },
      ],
      podpis: "",
      order: pary.length,
    };
    setPary(reorderPary([...pary, nowa]));
    setOtwartaId(nowa.id);
  };

  return (
    <div className="space-y-5">
      <Fieldset
        legend={temat.title || `Kafelek ${index + 1}`}
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUsun}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden /> Usuń kafelek
          </Button>
        }
      >
        <Field label="Tytuł kafelka" hint="np. „Dekontaminacja”">
          <Input
            value={temat.title}
            onChange={(e) => onPatch({ title: e.target.value })}
          />
        </Field>
        <Field label="Opis" hint="1–2 zdania: co było i co zrobiliśmy">
          <TextArea
            value={temat.text}
            onChange={(e) => onPatch({ text: e.target.value })}
          />
        </Field>

        {/* Ukrycie kafelka bez usuwania — np. temat w przygotowaniu,
            jeszcze bez kompletu zdjęć. */}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={!temat.disabled}
            onCheckedChange={(checked) => onPatch({ disabled: !checked })}
            ariaLabel={`Widoczność kafelka ${temat.title || `Kafelek ${index + 1}`}`}
          />
          Widoczny na stronie
        </label>
      </Fieldset>

      <Fieldset
        legend="Grupy zdjęć"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={dodajGrupe}
          >
            <Plus className="size-4" aria-hidden /> Dodaj grupę
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">
          Przeciągnij uchwyt, aby zmienić kolejność. Pierwsza grupa to okładka
          kafelka na stronie; wszystkie widać w pełnoekranowym podglądzie.
          Kliknij grupę, aby edytować zdjęcia.
        </p>

        {pary.length > 0 ? (
          <GrupySortable
            pary={pary}
            sensors={sensors}
            otwartaId={otwartaId}
            onToggle={(id) => setOtwartaId((prev) => (prev === id ? null : id))}
            onChangePary={setPary}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Ten kafelek nie ma jeszcze zdjęć — dodaj pierwszą grupę.
          </p>
        )}
      </Fieldset>
    </div>
  );
}

/* ─── Ekran ─────────────────────────────────────────────────────── */

export function MetamorfozyClient({ initial }: { initial: MetamorfozyData }) {
  const router = useRouter();
  const history = useMagazynHistory<MetamorfozyData>(initial);
  const { heading, subheading, tematy } = history.state;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(
    () => sortujTematy(initial.tematy)[0]?.id ?? POZYCJA_SEKCJA,
  );
  const [doUsuniecia, setDoUsuniecia] = useState<MetamorfozyTemat | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedTematy = sortujTematy(tematy);
  const wybranyIndex = sortedTematy.findIndex((t) => t.id === selectedId);
  const wybrany = wybranyIndex === -1 ? null : sortedTematy[wybranyIndex];

  const setTematy = (next: MetamorfozyTemat[]) =>
    history.setState((draft) => ({ ...draft, tematy: next }));

  const patchTemat = (id: string, patch: Partial<MetamorfozyTemat>) =>
    setTematy(sortedTematy.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  // Po zmianie zaznaczenia na wąskim ekranie edytor jest POD listą — bez tego
  // skoku klik w kafelek wyglądałby, jakby nic się nie stało.
  const detalRef = useRef<HTMLDivElement>(null);
  const pierwszeWejscie = useRef(true);
  useEffect(() => {
    if (pierwszeWejscie.current) {
      pierwszeWejscie.current = false;
      return;
    }
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    detalRef.current?.scrollIntoView({ block: "start" });
  }, [selectedId]);

  function dodajTemat() {
    const nowy: MetamorfozyTemat = {
      id: `temat-${Date.now()}`,
      title: "",
      text: "",
      order: sortedTematy.length,
      disabled: false,
      pary: [],
    };
    setTematy(reorderTematy([...sortedTematy, nowy]));
    setSelectedId(nowy.id);
  }

  function usunTemat(temat: MetamorfozyTemat) {
    const index = sortedTematy.findIndex((t) => t.id === temat.id);
    const next = reorderTematy(sortedTematy.filter((t) => t.id !== temat.id));
    setTematy(next);
    // Po usunięciu zaznaczamy sąsiada, żeby prawa kolumna nie została pusta.
    setSelectedId((next[index] ?? next[index - 1])?.id ?? POZYCJA_SEKCJA);
    setDoUsuniecia(null);
  }

  async function save() {
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData(
      "/api/magazyn/metamorfozy",
      history.state,
    );
    if (result.ok) {
      setStatus("Efekty zapisane.");
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
        title="Efekty"
        description="Sekcja „Przed i po — zobacz różnicę”: kafelki ze zdjęciami przed/po i pełnoekranowym podglądem"
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz efekty"
        pending={pending}
        status={status}
        error={error}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <ListaTematow
          tematy={sortedTematy}
          sensors={sensors}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={setTematy}
          onDodaj={dodajTemat}
        />

        <div ref={detalRef} className="min-w-0 scroll-mt-4">
          {wybrany ? (
            <TematDetal
              // Klucz per kafelek: przełączenie pozycji ma zaczynać od
              // rozwiniętej pierwszej grupy, a nie dziedziczyć stan po
              // poprzednim kafelku.
              key={wybrany.id}
              temat={wybrany}
              index={wybranyIndex}
              sensors={sensors}
              onPatch={(patch) => patchTemat(wybrany.id, patch)}
              onUsun={() => setDoUsuniecia(wybrany)}
            />
          ) : (
            <div className="space-y-5">
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
                <Field label="Podtytuł" hint="opcjonalny — puste = bez podtytułu">
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

              <Fieldset legend="Jak to działa">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  <li>
                    Kafelek to jedna metamorfoza na stronie. Kolejność kafelków
                    ustawiasz przeciąganiem na liście po lewej.
                  </li>
                  <li>
                    Kafelek składa się z grup zdjęć. Pierwsza grupa jest okładką
                    — to ona widnieje na stronie.
                  </li>
                  <li>
                    Wszystkie grupy pokazują się w pełnoekranowym podglądzie po
                    kliknięciu kafelka, w kolejności z panelu.
                  </li>
                  <li>
                    Grupa z dwoma zdjęciami dostaje automatyczne plakietki
                    „przed” i „po!”; przy innej liczbie zdjęć wpisujesz je sam.
                  </li>
                </ol>
              </Fieldset>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={doUsuniecia !== null}
        title="Usunąć kafelek?"
        description={`„${doUsuniecia?.title || "Kafelek bez tytułu"}” zniknie ze strony razem ze wszystkimi grupami zdjęć. Zmianę możesz cofnąć przyciskiem Cofnij, dopóki jej nie zapiszesz.`}
        confirmLabel="Usuń kafelek"
        variant="destructive"
        onConfirm={() => {
          if (doUsuniecia) usunTemat(doUsuniecia);
        }}
        onCancel={() => setDoUsuniecia(null)}
      />
    </div>
  );
}
