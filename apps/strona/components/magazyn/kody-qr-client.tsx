"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader, cn } from "@moduly/ui";
import {
  Copy,
  ExternalLink,
  FileCode2,
  ImageDown,
  ImagePlus,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  DOMYSLNY_WYGLAD,
  POZIOMY_KOREKCJI,
  RODZAJE_GRADIENTU,
  TRYBY_KODU,
  tekstKodu,
  celSchema,
  kodyQrDataSchema,
  sciezkaKodu,
  type KodQr,
  type TrybKodu,
  type KodyQrData,
  type WygladQr,
} from "@/lib/kody-qr";
import { korekcjaEfektywna, srodekEfektywny } from "@/lib/qr-geometria";
import { useMagazynHistory } from "@/hooks/use-magazyn-history";
import { Checkbox, Field, Fieldset, UndoRedoToolbar, putEditorData } from "./editor-ui";
import {
  KafelkiModulow,
  KafelkiRamek,
  KafelkiSrodkow,
  NAZWY_MODULOW,
  NAZWY_SRODKOW,
  OZDOBNE_MODULY,
  OZDOBNE_SRODKI,
} from "./qr-kafelki";
import { QrSvg } from "./qr-svg";

const ETYKIETY_TRYBU: Record<TrybKodu, string> = {
  dynamiczny: "Dynamiczny",
  statyczny: "Statyczny",
};

const OPIS_TRYBU: Record<TrybKodu, string> = {
  dynamiczny:
    "Kod prowadzi przez krótki adres na stronie, który od razu przekierowuje pod link. Link zmienisz w każdej chwili, także po wydrukowaniu.",
  statyczny:
    "W kodzie jest sam link — telefon otwiera go od razu, bez strony pośredniej. Po wydrukowaniu linku już nie zmienisz ani nie wyłączysz kodu.",
};

const ETYKIETY_GRADIENTU: Record<WygladQr["gradient"], string> = {
  brak: "Jednolity",
  liniowy: "Gradient liniowy",
  radialny: "Gradient od środka",
};

const FORMATY = [
  { id: "png", etykieta: "PNG", mime: "image/png" },
  { id: "jpg", etykieta: "JPG", mime: "image/jpeg" },
  { id: "webp", etykieta: "WebP", mime: "image/webp" },
] as const;
type Format = (typeof FORMATY)[number];

const OPIS_KOREKCJI: Record<WygladQr["korekcja"], string> = {
  L: "L · 7%",
  M: "M · 15%",
  Q: "Q · 25%",
  H: "H · 30%",
};

const ROZMIARY_PNG = [1000, 2000, 4000] as const;

/** Losowy, krótki adres kodu — bez znaków mylonych na wydruku (0/o, 1/l). */
function nowySlug(zajete: Set<string>): string {
  const znaki = "abcdefghijkmnpqrstuvwxyz23456789";
  for (;;) {
    const bajty = crypto.getRandomValues(new Uint8Array(6));
    const slug = Array.from(bajty, (b) => znaki[b % znaki.length]).join("");
    if (!zajete.has(slug)) return slug;
  }
}

function nazwaPliku(nazwa: string): string {
  const baza = nazwa
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `kod-qr-${baza || "bez-nazwy"}`;
}

/** Względna luminancja WCAG z #RRGGBB. */
function luminancja(hex: string): number {
  const kanaly = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = kanaly;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: string, b: string): number {
  const [jasny, ciemny] = [luminancja(a), luminancja(b)].sort((x, y) => y - x);
  return ((jasny ?? 0) + 0.05) / ((ciemny ?? 0) + 0.05);
}

/** Ostrzeżenia o czytelności — kod, który się nie skanuje, jest gorszy niż brak kodu. */
function ostrzezenia(w: WygladQr): string[] {
  const lista: string[] = [];
  const tlo = w.przezroczysteTlo ? "#ffffff" : w.tlo;
  const kolory: [string, string][] = [
    [w.kolor, w.gradient === "brak" ? "modułów" : "modułów (kolor 1)"],
    [w.kolorOczek, "oczek"],
  ];
  if (w.gradient !== "brak") kolory.push([w.kolor2, "modułów (kolor 2)"]);
  for (const [kolor, czego] of kolory) {
    if (kontrast(kolor, tlo) < 4) {
      lista.push(`Za mały kontrast ${czego} z tłem — część telefonów nie odczyta kodu.`);
    } else if (luminancja(kolor) > luminancja(tlo)) {
      lista.push(`Kolor ${czego} jaśniejszy od tła (odwrócony kod) — starsze czytniki go nie odczytają.`);
    }
  }
  if (w.przezroczysteTlo) {
    lista.push("Przezroczyste tło: drukuj tylko na jasnym, jednolitym podłożu.");
  }
  if (w.margines < 2) {
    lista.push("Margines poniżej 2 modułów utrudnia skanowanie — zostaw wolne miejsce wokół kodu.");
  }
  if (w.logo && !w.tloLogo) {
    lista.push("Bez podkładu moduły prześwitują przez logo — kod może gorzej się skanować. Włącz podkład pod logo.");
  }
  const srodek = srodekEfektywny(w);
  if (OZDOBNE_MODULY.has(w.ksztaltModulow) || OZDOBNE_SRODKI.has(srodek)) {
    const nazwa = OZDOBNE_MODULY.has(w.ksztaltModulow)
      ? `Moduły „${NAZWY_MODULOW[w.ksztaltModulow]}”`
      : `Środek oczek „${NAZWY_SRODKOW[srodek]}”`;
    lista.push(
      `${nazwa} to kształt ozdobny — część aparatów czyta go gorzej. Przed drukiem zeskanuj kod kilkoma telefonami.`,
    );
  }
  return lista;
}

/**
 * Plik z dysku → PNG/WebP w data-URL, zmniejszony do max 512 px (limit rozmiaru bloba),
 * plus szerokość/wysokość pliku — od niej startuje suwak proporcji.
 */
async function wczytajLogo(plik: File): Promise<{ dane: string; stosunek: number }> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(plik.type)) {
    throw new Error("Logo musi być plikiem PNG, JPG albo WebP.");
  }
  const bitmapa = await createImageBitmap(plik);
  const stosunek = Math.min(10, Math.max(0.1, bitmapa.width / bitmapa.height));
  for (const maks of [512, 384, 256]) {
    const skala = Math.min(1, maks / Math.max(bitmapa.width, bitmapa.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmapa.width * skala));
    canvas.height = Math.max(1, Math.round(bitmapa.height * skala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Przeglądarka nie obsługuje canvas.");
    ctx.drawImage(bitmapa, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL("image/png");
    if (png.length < 350_000) return { dane: png, stosunek };
    const webp = canvas.toDataURL("image/webp", 0.9);
    if (webp.startsWith("data:image/webp") && webp.length < 350_000) return { dane: webp, stosunek };
  }
  throw new Error("Logo jest zbyt szczegółowe — użyj prostszego pliku.");
}

function pobierz(href: string, nazwa: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = nazwa;
  a.click();
}

function svgJakoTekst(svg: SVGSVGElement): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
}

async function pobierzObraz(
  svg: SVGSVGElement,
  rozmiar: number,
  nazwa: string,
  format: Format,
): Promise<void> {
  const url = URL.createObjectURL(new Blob([svgJakoTekst(svg)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Nie udało się przygotować obrazu."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = rozmiar;
    canvas.height = rozmiar;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Przeglądarka nie obsługuje canvas.");
    if (format.id === "jpg") {
      // JPG nie ma przezroczystości — bez tego przezroczyste tło wyszłoby czarne.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rozmiar, rozmiar);
    }
    ctx.drawImage(img, 0, 0, rozmiar, rozmiar);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format.mime, 0.95));
    if (!blob || blob.type !== format.mime) {
      throw new Error(`Ta przeglądarka nie zapisuje formatu ${format.etykieta} — wybierz PNG.`);
    }
    const plikUrl = URL.createObjectURL(blob);
    pobierz(plikUrl, `${nazwa}.${format.id}`);
    setTimeout(() => URL.revokeObjectURL(plikUrl), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Segmenty<T extends string>({
  opcje,
  wartosc,
  etykiety,
  onChange,
  nazwa,
}: {
  opcje: readonly T[];
  wartosc: T;
  etykiety: Record<T, string>;
  onChange: (v: T) => void;
  nazwa: string;
}) {
  return (
    <div role="radiogroup" aria-label={nazwa} className="flex flex-wrap gap-1.5">
      {opcje.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={wartosc === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            wartosc === o
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted",
          )}
        >
          {etykiety[o]}
        </button>
      ))}
    </div>
  );
}

function LegendaOzdobnych() {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-500" />
      Kształt ozdobny — wygląda efektownie, ale słabsze aparaty mogą go czytać gorzej.
    </p>
  );
}

/**
 * Wiersz koloru: etykieta · próbnik · kod HEX · reset do domyślnego.
 * Wiersze zamiast siatki — w wąskiej kolumnie edytora siatka ściskała pole
 * HEX do pustego okienka.
 */
function PoleKoloru({
  label,
  value,
  domyslny,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  domyslny: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [tekst, setTekst] = useState(value);
  const [poprzedni, setPoprzedni] = useState(value);
  if (value !== poprzedni) {
    setPoprzedni(value);
    setTekst(value);
  }
  const jestDomyslny = value.toLowerCase() === domyslny.toLowerCase();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
      <span className={cn("w-36 shrink-0 font-medium text-foreground", disabled && "opacity-50")}>
        {label}
      </span>
      <div className={cn("flex items-center gap-2", disabled && "opacity-50")}>
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} — próbnik`}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1 disabled:cursor-not-allowed"
        />
        <Input
          value={tekst}
          disabled={disabled}
          aria-label={`${label} — kod HEX`}
          maxLength={7}
          spellCheck={false}
          className="w-28 font-mono uppercase"
          onChange={(e) => {
            const v = e.target.value.trim();
            setTekst(v);
            if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
          }}
          onBlur={() => setTekst(value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || jestDomyslny}
          onClick={() => onChange(domyslny)}
          aria-label={`Przywróć domyślny kolor: ${label}`}
          title={`Przywróć domyślny (${domyslny.toUpperCase()})`}
        >
          <RotateCcw className="size-4" aria-hidden />
        </Button>
      </div>
      {children}
    </div>
  );
}

export function KodyQrClient({
  initial,
  adresBazowy,
}: {
  initial: KodyQrData;
  adresBazowy: string;
}) {
  const router = useRouter();
  const history = useMagazynHistory<KodyQrData>(initial);
  const { kody } = history.state;

  const [wybranyId, setWybranyId] = useState<string | null>(initial.kody[0]?.id ?? null);
  const [zapisaneSlugi, setZapisaneSlugi] = useState(() => new Set(initial.kody.map((k) => k.slug)));
  // Ostatnio zapisany tryb i treść kodu — po zmianie wydrukowany kod statyczny przestaje pasować do podglądu.
  const [zapisane, setZapisane] = useState(
    () => new Map(initial.kody.map((k) => [k.id, { tryb: k.tryb, tresc: tekstKodu(k, adresBazowy) }])),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [rozmiarPng, setRozmiarPng] = useState<(typeof ROZMIARY_PNG)[number]>(2000);
  const [bladLogo, setBladLogo] = useState<string | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const plikRef = useRef<HTMLInputElement>(null);

  const wybrany = kody.find((k) => k.id === wybranyId) ?? kody[0] ?? null;
  const adresKodu = (slug: string) => `${adresBazowy}${sciezkaKodu(slug)}`;

  const zmienKod = (id: string, zmiana: (k: KodQr) => KodQr) =>
    history.setState((d) => ({ ...d, kody: d.kody.map((k) => (k.id === id ? zmiana(k) : k)) }));
  const zmienWyglad = (zmiana: Partial<WygladQr>) => {
    if (!wybrany) return;
    zmienKod(wybrany.id, (k) => ({ ...k, wyglad: { ...k.wyglad, ...zmiana } }));
  };

  function dodaj() {
    const slug = nowySlug(new Set(kody.map((k) => k.slug)));
    const kod: KodQr = {
      id: `qr-${Date.now()}`,
      nazwa: `Kod QR ${kody.length + 1}`,
      slug,
      cel: adresBazowy,
      tryb: "dynamiczny",
      aktywny: true,
      wyglad: wybrany ? { ...wybrany.wyglad } : DOMYSLNY_WYGLAD,
      utworzono: new Date().toISOString(),
    };
    history.setState((d) => ({ ...d, kody: [kod, ...d.kody] }));
    setWybranyId(kod.id);
  }

  function usun(kod: KodQr) {
    // Usunięcie psuje tylko kody, które przechodzą przez przekierowanie (dynamiczne i zapisane).
    const opis =
      zapisaneSlugi.has(kod.slug) && zapisane.get(kod.id)?.tryb !== "statyczny"
        ? `Usunąć „${kod.nazwa}”? Wydrukowane kody dynamiczne przestaną prowadzić pod ${kod.cel} i otworzą stronę główną.`
        : `Usunąć „${kod.nazwa}”?`;
    if (!window.confirm(opis)) return;
    history.setState((d) => ({ ...d, kody: d.kody.filter((k) => k.id !== kod.id) }));
    setWybranyId(null);
  }

  async function save() {
    const parsed = kodyQrDataSchema.safeParse(history.state);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const idx = issue?.path[1];
      const kod = typeof idx === "number" ? history.state.kody[idx] : undefined;
      if (kod) setWybranyId(kod.id);
      setError(true);
      setStatus(`${kod ? `${kod.nazwa}: ` : ""}${issue?.message ?? "Popraw dane kodów."}`);
      return;
    }
    setPending(true);
    setStatus(null);
    setError(false);
    const result = await putEditorData("/api/magazyn/kody-qr", parsed.data);
    if (result.ok) {
      setStatus("Kody QR zapisane.");
      history.commitSaved();
      setZapisaneSlugi(new Set(parsed.data.kody.map((k) => k.slug)));
      setZapisane(
        new Map(parsed.data.kody.map((k) => [k.id, { tryb: k.tryb, tresc: tekstKodu(k, adresBazowy) }])),
      );
      router.refresh();
    } else {
      setError(true);
      setStatus(result.error);
    }
    setPending(false);
  }

  async function onLogo(plik: File | undefined) {
    setBladLogo(null);
    if (!plik) return;
    try {
      const wgrane = await wczytajLogo(plik);
      // Nowy plik = nowe proporcje i bez obrotu/zaokrąglenia po poprzednim logo.
      zmienWyglad({
        logo: wgrane.dane,
        logoOryginalne: wgrane.stosunek,
        logoProporcje: undefined,
        logoObrot: 0,
        logoZaokraglenie: 0,
      });
    } catch (e) {
      setBladLogo(e instanceof Error ? e.message : "Nie udało się wczytać logo.");
    } finally {
      if (plikRef.current) plikRef.current.value = "";
    }
  }

  async function kopiuj(tekst: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 1500);
    } catch {
      setSkopiowano(false);
    }
  }

  const bladCelu = wybrany ? celSchema.safeParse(wybrany.cel).error?.issues[0]?.message : undefined;
  const w = wybrany?.wyglad;
  const statyczny = wybrany?.tryb === "statyczny";
  const tekstWybranego = wybrany ? tekstKodu(wybrany, adresBazowy) : null;
  // Suwak proporcji startuje od proporcji wgranego pliku, żeby pierwszy ruch nie zniekształcał logo skokowo.
  const proporcjeLogo = w ? (w.logoProporcje ?? w.logoOryginalne ?? 1) : 1;
  const uwagi = w ? ostrzezenia(w) : [];
  if (statyczny && tekstWybranego && tekstWybranego.length > 80) {
    uwagi.push("Długi link = gęsty kod. Drukuj go większy (min. ok. 3 × 3 cm) albo użyj kodu dynamicznego.");
  }
  // Nowy kod dynamiczny działa dopiero po zapisie (przekierowanie czyta bazę); statyczny działa od razu.
  const niezapisany = wybrany ? !statyczny && !zapisaneSlugi.has(wybrany.slug) : false;
  // Tylko kod, który już był zapisany jako statyczny, ma „stary” wydruk z innym linkiem;
  // wydruki dynamiczne dalej działają przez przekierowanie.
  const zapisanyWybrany = wybrany ? zapisane.get(wybrany.id) : undefined;
  const wzorZmieniony =
    zapisanyWybrany?.tryb === "statyczny" && tekstWybranego !== null && zapisanyWybrany.tresc !== tekstWybranego;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kody QR"
        description="Kod dynamiczny prowadzi przez stały adres na stronie, więc link zmienisz także po wydrukowaniu. Statyczny otwiera link od razu, ale po wydrukowaniu jest już na zawsze."
      />
      <UndoRedoToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={history.isDirty}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={save}
        saveLabel="Zapisz kody"
        pending={pending}
        status={status}
        error={error}
      />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <Button type="button" variant="outline" className="gap-1.5" onClick={dodaj}>
            <Plus className="size-4" aria-hidden /> Nowy kod QR
          </Button>
          {kody.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Nie masz jeszcze żadnego kodu. Dodaj pierwszy — np. do opinii Google albo cennika.
            </p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Twoje kody QR">
              {kody.map((k) => {
                const aktywnyWybor = wybrany?.id === k.id;
                const miniatura = tekstKodu(k, adresBazowy);
                let host = k.cel;
                try {
                  host = new URL(k.cel).host + new URL(k.cel).pathname.replace(/\/$/, "");
                } catch {
                  /* niepoprawny adres — pokazujemy surowy tekst */
                }
                return (
                  <li key={k.id}>
                    <button
                      type="button"
                      onClick={() => setWybranyId(k.id)}
                      aria-current={aktywnyWybor ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        aktywnyWybor ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                        {miniatura ? <QrSvg tekst={miniatura} wyglad={k.wyglad} className="size-full" /> : null}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{k.nazwa || "Bez nazwy"}</span>
                        <span className="truncate text-xs text-muted-foreground">{host}</span>
                        <span className="text-[0.7rem] text-muted-foreground">
                          {k.tryb === "statyczny" ? "statyczny" : "dynamiczny"}
                        </span>
                        {!k.aktywny ? (
                          <span className="text-xs font-medium text-destructive">Wyłączony</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {wybrany && w ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-6">
              <Fieldset
                legend="Kod i link"
                actions={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => usun(wybrany)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden /> Usuń
                  </Button>
                }
              >
                <Field label="Nazwa" hint="Widzisz ją tylko Ty — np. „Opinie Google — naklejka na ladzie”.">
                  <Input
                    value={wybrany.nazwa}
                    maxLength={120}
                    onChange={(e) => zmienKod(wybrany.id, (k) => ({ ...k, nazwa: e.target.value }))}
                  />
                </Field>
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Rodzaj kodu</span>
                  <Segmenty
                    nazwa="Rodzaj kodu"
                    opcje={TRYBY_KODU}
                    wartosc={wybrany.tryb}
                    etykiety={ETYKIETY_TRYBU}
                    onChange={(tryb) => zmienKod(wybrany.id, (k) => ({ ...k, tryb }))}
                  />
                  <span className="text-xs text-muted-foreground">{OPIS_TRYBU[wybrany.tryb]}</span>
                </div>
                <Field
                  label="Link docelowy"
                  hint={
                    statyczny
                      ? "Dokąd kod ma prowadzić. Link jest zapisany w samym kodzie — zmiana po wydrukowaniu wymaga nowego wydruku."
                      : "Dokąd kod ma prowadzić. Możesz go zmieniać — wydrukowane kody przejdą pod nowy adres."
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      inputMode="url"
                      value={wybrany.cel}
                      aria-invalid={bladCelu ? true : undefined}
                      onChange={(e) => zmienKod(wybrany.id, (k) => ({ ...k, cel: e.target.value }))}
                    />
                    <a
                      href={bladCelu ? undefined : wybrany.cel}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Otwórz link docelowy w nowej karcie"
                      aria-disabled={bladCelu ? true : undefined}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  </div>
                </Field>
                {bladCelu ? (
                  <p role="alert" className="text-sm text-destructive">
                    {bladCelu}
                  </p>
                ) : null}
                {statyczny ? null : (
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Adres zapisany w kodzie</span>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs">
                        {adresKodu(wybrany.slug)}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => kopiuj(adresKodu(wybrany.slug))}
                      >
                        <Copy className="size-4" aria-hidden /> {skopiowano ? "Skopiowano" : "Kopiuj"}
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ten adres się nie zmienia — dlatego kod można drukować bez obaw.
                    </span>
                  </div>
                )}
                {/* Statycznego kodu nie da się wyłączyć — telefon nie pyta strony, tylko od razu otwiera link. */}
                <label className={cn("flex items-center gap-2.5 text-sm", statyczny && "hidden")}>
                  <Checkbox
                    checked={wybrany.aktywny}
                    onCheckedChange={(v) => zmienKod(wybrany.id, (k) => ({ ...k, aktywny: v }))}
                    ariaLabel="Kod aktywny"
                  />
                  <span>
                    Kod aktywny
                    <span className="block text-xs text-muted-foreground">
                      Wyłączony kod otwiera stronę główną zamiast linku docelowego.
                    </span>
                  </span>
                </label>
              </Fieldset>

              <Fieldset
                legend="Kolory"
                actions={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    disabled={
                      w.kolor === DOMYSLNY_WYGLAD.kolor &&
                      w.kolor2 === DOMYSLNY_WYGLAD.kolor2 &&
                      w.kolorOczek === DOMYSLNY_WYGLAD.kolorOczek &&
                      w.tlo === DOMYSLNY_WYGLAD.tlo &&
                      w.gradient === DOMYSLNY_WYGLAD.gradient &&
                      w.przezroczysteTlo === DOMYSLNY_WYGLAD.przezroczysteTlo
                    }
                    onClick={() =>
                      zmienWyglad({
                        kolor: DOMYSLNY_WYGLAD.kolor,
                        kolor2: DOMYSLNY_WYGLAD.kolor2,
                        kolorOczek: DOMYSLNY_WYGLAD.kolorOczek,
                        tlo: DOMYSLNY_WYGLAD.tlo,
                        gradient: DOMYSLNY_WYGLAD.gradient,
                        przezroczysteTlo: DOMYSLNY_WYGLAD.przezroczysteTlo,
                      })
                    }
                  >
                    <RotateCcw className="size-4" aria-hidden /> Przywróć wszystkie
                  </Button>
                }
              >
                <Segmenty
                  nazwa="Wypełnienie modułów"
                  opcje={RODZAJE_GRADIENTU}
                  wartosc={w.gradient}
                  etykiety={ETYKIETY_GRADIENTU}
                  onChange={(gradient) => zmienWyglad({ gradient })}
                />
                <div className="space-y-3">
                  <PoleKoloru
                    label={w.gradient === "brak" ? "Moduły" : "Moduły — kolor 1"}
                    value={w.kolor}
                    domyslny={DOMYSLNY_WYGLAD.kolor}
                    onChange={(kolor) => zmienWyglad({ kolor })}
                  >
                    {w.kolorOczek !== w.kolor ? (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        onClick={() => zmienWyglad({ kolorOczek: w.kolor })}
                      >
                        Ustaw też dla oczek
                      </button>
                    ) : null}
                  </PoleKoloru>
                  {w.gradient !== "brak" ? (
                    <PoleKoloru
                      label="Moduły — kolor 2"
                      value={w.kolor2}
                      domyslny={DOMYSLNY_WYGLAD.kolor2}
                      onChange={(kolor2) => zmienWyglad({ kolor2 })}
                    />
                  ) : null}
                  <PoleKoloru
                    label="Oczka (rogi)"
                    value={w.kolorOczek}
                    domyslny={DOMYSLNY_WYGLAD.kolorOczek}
                    onChange={(kolorOczek) => zmienWyglad({ kolorOczek })}
                  />
                  <PoleKoloru
                    label="Tło"
                    value={w.tlo}
                    domyslny={DOMYSLNY_WYGLAD.tlo}
                    disabled={w.przezroczysteTlo}
                    onChange={(tlo) => zmienWyglad({ tlo })}
                  />
                </div>
                <label className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={w.przezroczysteTlo}
                    onCheckedChange={(v) => zmienWyglad({ przezroczysteTlo: v })}
                    ariaLabel="Przezroczyste tło"
                  />
                  Przezroczyste tło (PNG/SVG bez tła)
                </label>
              </Fieldset>

              <Fieldset legend="Kształt modułów">
                <KafelkiModulow
                  wartosc={w.ksztaltModulow}
                  onChange={(ksztaltModulow) => zmienWyglad({ ksztaltModulow })}
                />
                <LegendaOzdobnych />
              </Fieldset>

              <Fieldset legend="Oczka (rogi kodu)">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ramka</p>
                  <KafelkiRamek
                    wartosc={w.ksztaltOczek}
                    onChange={(ksztaltOczek) => zmienWyglad({ ksztaltOczek })}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Środek</p>
                  <KafelkiSrodkow
                    wartosc={srodekEfektywny(w)}
                    onChange={(ksztaltSrodka) => zmienWyglad({ ksztaltSrodka })}
                  />
                </div>
              </Fieldset>

              <Fieldset legend="Rozmiar i odporność">
                <Field
                  label={`Margines: ${w.margines} ${w.margines === 1 ? "moduł" : w.margines >= 2 && w.margines <= 4 ? "moduły" : "modułów"}`}
                >
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={w.margines}
                    onChange={(e) => zmienWyglad({ margines: Number(e.target.value) })}
                    className="accent-primary"
                  />
                </Field>
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Odporność na uszkodzenia</span>
                  <Segmenty
                    nazwa="Poziom korekcji błędów"
                    opcje={POZIOMY_KOREKCJI}
                    wartosc={korekcjaEfektywna(w)}
                    etykiety={OPIS_KOREKCJI}
                    onChange={(korekcja) => zmienWyglad({ korekcja })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {w.logo
                      ? "Z logo kod zawsze używa najwyższego poziomu (H) — logo zasłania część modułów."
                      : "Wyższy poziom = kod gęstszy, ale czytelny nawet po zabrudzeniu lub zarysowaniu."}
                  </span>
                </div>
              </Fieldset>

              <Fieldset legend="Logo w środku">
                <div className="flex flex-wrap items-center gap-3">
                  {w.logo ? (
                    <img
                      src={w.logo}
                      alt="Wgrane logo"
                      className="size-14 rounded-md border border-border bg-white object-contain p-1"
                    />
                  ) : null}
                  <input
                    ref={plikRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    id="qr-logo"
                    onChange={(e) => void onLogo(e.target.files?.[0])}
                  />
                  <Button type="button" variant="outline" className="gap-1.5" onClick={() => plikRef.current?.click()}>
                    <ImagePlus className="size-4" aria-hidden /> {w.logo ? "Zmień logo" : "Dodaj logo"}
                  </Button>
                  {w.logo ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() =>
                        zmienWyglad({
                          logo: undefined,
                          logoOryginalne: undefined,
                          logoProporcje: undefined,
                          logoObrot: 0,
                          logoZaokraglenie: 0,
                          kolorTlaLogo: undefined,
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden /> Usuń logo
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG lub WebP. Najlepiej kwadratowe, z przezroczystym tłem.
                </p>
                {bladLogo ? (
                  <p role="alert" className="text-sm text-destructive">
                    {bladLogo}
                  </p>
                ) : null}
                {w.logo ? (
                  <>
                    <Field label={`Wielkość logo: ${Math.round(w.rozmiarLogo * 100)}% kodu`}>
                      <input
                        type="range"
                        min={10}
                        max={30}
                        value={Math.round(w.rozmiarLogo * 100)}
                        onChange={(e) => zmienWyglad({ rozmiarLogo: Number(e.target.value) / 100 })}
                        className="accent-primary"
                      />
                    </Field>
                    <Field
                      label={`Proporcje: ${proporcjeLogo.toFixed(2).replace(".", ",")} : 1`}
                      hint="Szerokość do wysokości. Dłuższy bok logo nigdy nie przekracza ustawionej wielkości."
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={40}
                          max={250}
                          value={Math.round(proporcjeLogo * 100)}
                          onChange={(e) => zmienWyglad({ logoProporcje: Number(e.target.value) / 100 })}
                          className="min-w-0 flex-1 accent-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={w.logoProporcje === undefined}
                          onClick={() => zmienWyglad({ logoProporcje: undefined })}
                          aria-label="Przywróć oryginalne proporcje logo"
                          title="Oryginalne proporcje"
                        >
                          <RotateCcw className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </Field>
                    <Field
                      label={`Obrót: ${w.logoObrot}°`}
                      hint="Logo obraca się razem z podkładem. Przy mocnym obrocie jest automatycznie nieco mniejsze, żeby dziura w kodzie nie urosła."
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={5}
                          value={w.logoObrot}
                          onChange={(e) => zmienWyglad({ logoObrot: Number(e.target.value) })}
                          className="min-w-0 flex-1 accent-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={w.logoObrot === 0}
                          onClick={() => zmienWyglad({ logoObrot: 0 })}
                          aria-label="Wyzeruj obrót logo"
                          title="Bez obrotu"
                        >
                          <RotateCcw className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </Field>
                    <Field label={`Zaokrąglenie rogów: ${Math.round(w.logoZaokraglenie * 100)}%`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(w.logoZaokraglenie * 100)}
                          onChange={(e) => zmienWyglad({ logoZaokraglenie: Number(e.target.value) / 100 })}
                          className="min-w-0 flex-1 accent-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={w.logoZaokraglenie === 0}
                          onClick={() => zmienWyglad({ logoZaokraglenie: 0 })}
                          aria-label="Wyzeruj zaokrąglenie rogów logo"
                          title="Ostre rogi"
                        >
                          <RotateCcw className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </Field>
                    <label className="flex items-center gap-2.5 text-sm">
                      <Checkbox
                        checked={w.tloLogo}
                        onCheckedChange={(v) => zmienWyglad({ tloLogo: v })}
                        ariaLabel="Podkład pod logo"
                      />
                      Podkład pod logo (zalecane — wycina moduły, logo nie zlewa się z kodem)
                    </label>
                    <PoleKoloru
                      label="Kolor podkładu"
                      value={w.kolorTlaLogo ?? w.tlo}
                      domyslny={w.tlo}
                      disabled={!w.tloLogo}
                      onChange={(kolor) => zmienWyglad({ kolorTlaLogo: kolor === w.tlo ? undefined : kolor })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kształt logo nie wpływa na skanowanie: wycięty obszar nigdy nie jest większy niż wynika z
                      suwaka wielkości.
                    </p>
                  </>
                ) : null}
              </Fieldset>
            </div>

            <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: w.przezroczysteTlo
                      ? "repeating-conic-gradient(oklch(0.92 0 0) 0 25%, oklch(0.99 0 0) 0 50%) 0 0 / 16px 16px"
                      : undefined,
                  }}
                >
                  {tekstWybranego ? (
                    <QrSvg
                      ref={svgRef}
                      tekst={tekstWybranego}
                      wyglad={w}
                      etykieta={`Kod QR: ${wybrany.nazwa}`}
                      className="mx-auto block aspect-square w-full max-w-72"
                    />
                  ) : (
                    <p className="mx-auto flex aspect-square w-full max-w-72 items-center justify-center rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Wpisz poprawny link docelowy — kod statyczny zawiera sam link.
                    </p>
                  )}
                </div>
                {wzorZmieniony ? (
                  <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden />
                    Wzór kodu się zmienił. Wydrukowane wcześniej kody tego wpisu nadal prowadzą pod stary adres — wydrukuj nowy.
                  </p>
                ) : null}
                {niezapisany ? (
                  <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs">
                    <QrCode className="size-4 shrink-0" aria-hidden />
                    Nowy kod zacznie działać po kliknięciu „Zapisz kody”. Zapisz, zanim go wydrukujesz.
                  </p>
                ) : null}
                {uwagi.length > 0 ? (
                  <ul className="space-y-2" aria-label="Uwagi o czytelności">
                    {uwagi.map((u) => (
                      <li key={u} className="flex gap-2 text-xs text-destructive">
                        <TriangleAlert className="size-4 shrink-0" aria-hidden />
                        {u}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pobierz obraz</p>
                  <div role="radiogroup" aria-label="Rozdzielczość obrazu" className="grid grid-cols-3 gap-1.5">
                    {ROZMIARY_PNG.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={rozmiarPng === r}
                        onClick={() => setRozmiarPng(r)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                          rozmiarPng === r
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {r} px
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FORMATY.map((format, i) => (
                      <Button
                        key={format.id}
                        type="button"
                        variant={i === 0 ? "default" : "outline"}
                        className="gap-1.5"
                        aria-label={`Pobierz ${format.etykieta} ${rozmiarPng} px`}
                        disabled={!tekstWybranego}
                        onClick={() => {
                          if (!svgRef.current) return;
                          void pobierzObraz(svgRef.current, rozmiarPng, nazwaPliku(wybrany.nazwa), format).catch(
                            (e: unknown) => {
                              setError(true);
                              setStatus(e instanceof Error ? e.message : "Nie udało się pobrać obrazu.");
                            },
                          );
                        }}
                      >
                        {i === 0 ? <ImageDown className="size-4" aria-hidden /> : null}
                        {format.etykieta}
                      </Button>
                    ))}
                  </div>
                  {w.przezroczysteTlo ? (
                    <p className="text-xs text-muted-foreground">JPG nie ma przezroczystości — dostanie białe tło.</p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-1.5"
                    disabled={!tekstWybranego}
                    onClick={() => {
                      if (!svgRef.current) return;
                      const url = URL.createObjectURL(
                        new Blob([svgJakoTekst(svgRef.current)], { type: "image/svg+xml" }),
                      );
                      pobierz(url, `${nazwaPliku(wybrany.nazwa)}.svg`);
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    <FileCode2 className="size-4" aria-hidden /> Pobierz SVG (do drukarni)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Przed drukiem zeskanuj kod telefonem. Minimalny rozmiar na wydruku: ok. 2 × 2 cm.
                </p>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
