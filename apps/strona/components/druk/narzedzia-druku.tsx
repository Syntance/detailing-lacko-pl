"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize, Pencil, Printer, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";
import type { EdycjaDruku } from "@/lib/druk-edycja";
import { elementyEdytowalne, PanelEdycji, zastosujStyl, zastosujTeksty } from "./edytor-druku";

/** Poniżej tej skali tekst na A4 robi się za drobny, żeby czytać go ze ściany. */
const MIN_SKALA = 0.62;
/** Drobny krok, żeby treść dochodziła do stopki bez widocznej przerwy. */
const KROK = 0.005;
/** Powyżej tej skali plakat wygląda jak powiększony zrzut, a nie projekt. */
const MAX_SKALA = 1.5;

/**
 * Dopasowuje treść każdej kartki A4 do jej wysokości (CSS `zoom`), w górę i w dół, bo cennik
 * zmienia się w panelu i nie da się z góry założyć, ile ma pozycji. Zwraca
 * liczbę kartek, na których nawet minimalna skala nie wystarczyła.
 */
function dopasujKartki(): number {
  let zaDuzo = 0;
  document.querySelectorAll<HTMLElement>("[data-arkusz-tresc]").forEach((ramka) => {
    const tresc = ramka.firstElementChild as HTMLElement | null;
    if (!tresc) return;
    let skala = 1;
    const ustaw = () => {
      tresc.style.zoom = String(skala);
      // Szerokość w px, nie w %: pod `zoom` procent liczy się od rodzica przed skalą i treść wyjeżdża za kartkę.
      tresc.style.width = `${ramka.clientWidth / skala}px`;
    };
    // Tabele mają min-width i własny poziomy scroll — to też „nie mieści się".
    const przepelnione = () =>
      tresc.getBoundingClientRect().height > ramka.clientHeight + 1 ||
      [...tresc.querySelectorAll<HTMLElement>(".overflow-x-auto")].some(
        (el) => el.scrollWidth > el.clientWidth + 1,
      );
    ustaw();
    // Najpierw powiększ, póki się mieści — pusta połowa kartki to zmarnowana czytelność.
    while (!przepelnione() && skala < MAX_SKALA) {
      skala = Math.round((skala + KROK) * 1000) / 1000;
      ustaw();
    }
    while (przepelnione() && skala > MIN_SKALA) {
      skala = Math.round((skala - KROK) * 1000) / 1000;
      ustaw();
    }
    if (przepelnione()) zaDuzo += 1;
  });
  return zaDuzo;
}

/** Szerokość kartki A4 (210 mm) w px CSS. */
const SZEROKOSC_A4_PX = 793.7;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_KROK = 0.1;

const przytnij = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
const doSzerokosci = () => przytnij(Math.min(1, (window.innerWidth - 32) / SZEROKOSC_A4_PX));

export function NarzedziaDruku({
  tytul,
  podglad,
  drukujOdRazu,
  edycja,
  children,
}: {
  tytul: string;
  podglad: boolean;
  drukujOdRazu: boolean;
  /** Plakaty z edytowalną treścią: id i zapisane zmiany. Cenniki go nie dostają. */
  edycja?: { plakatId: string; dane: EdycjaDruku };
  children: ReactNode;
}) {
  const [zaDuzo, setZaDuzo] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [edytuje, setEdytuje] = useState(false);
  const [styl, setStyl] = useState(edycja?.dane.styl ?? {});
  const skalaRef = useRef<HTMLDivElement>(null);
  const elementy = useRef<Map<string, HTMLElement>>(new Map());
  const oryginaly = useRef<Map<string, string>>(new Map());

  /** Ponowne dopasowanie po edycji — przy zoomie podglądu 1, bo inaczej pomiary kartek się rozjeżdżają. */
  const dopasujPonownie = useCallback(() => {
    const wrap = skalaRef.current;
    const poprzedni = wrap?.style.zoom ?? "";
    if (wrap) wrap.style.zoom = "1";
    setZaDuzo(dopasujKartki());
    if (wrap) wrap.style.zoom = poprzedni;
  }, []);

  useEffect(() => {
    let anulowane = false;
    // Zapisane zmiany nakładamy przed dopasowaniem, bo zmieniają wysokość treści.
    if (edycja) {
      elementy.current = elementyEdytowalne();
      oryginaly.current = new Map([...elementy.current].map(([k, el]) => [k, el.textContent ?? ""]));
      zastosujTeksty(elementy.current, edycja.dane.teksty);
      zastosujStyl(edycja.dane.styl);
    }
    // Dopasowanie liczy wysokość nagłówka, więc czekamy na krój pisma i obrazki (logo, QR).
    // Zoom podglądu zostaje na 1 do końca liczenia — inaczej pomiary by się rozjechały.
    const obrazki = [...document.images].map((img) => img.decode().catch(() => undefined));
    Promise.all([document.fonts.ready, ...obrazki]).then(() => {
      if (anulowane) return;
      setZaDuzo(dopasujKartki());
      if (!podglad) setZoom(doSzerokosci());
      if (drukujOdRazu) window.print();
    });
    return () => {
      anulowane = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tylko przy pierwszym renderze
  }, [drukujOdRazu, podglad]);

  // Kolory i czcionki na żywo; czcionka zmienia wysokość tekstu, więc kartki dopasowujemy od nowa.
  const pierwszyStyl = useRef(true);
  useEffect(() => {
    if (!edycja) return;
    if (pierwszyStyl.current) {
      pierwszyStyl.current = false;
      return;
    }
    zastosujStyl(styl);
    const klatka = requestAnimationFrame(dopasujPonownie);
    return () => cancelAnimationFrame(klatka);
  }, [edycja, styl, dopasujPonownie]);

  useEffect(() => {
    const els = [...elementy.current.values()];
    if (!edytuje) {
      els.forEach((el) => {
        el.removeAttribute("contenteditable");
        el.removeAttribute("data-edytowalny");
      });
      return;
    }
    const naEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    };
    els.forEach((el) => {
      el.setAttribute("contenteditable", "plaintext-only");
      el.setAttribute("data-edytowalny", "");
      el.addEventListener("keydown", naEnter);
      el.addEventListener("blur", dopasujPonownie);
    });
    return () => {
      els.forEach((el) => {
        el.removeEventListener("keydown", naEnter);
        el.removeEventListener("blur", dopasujPonownie);
      });
    };
  }, [edytuje, dopasujPonownie]);

  const zbierzTeksty = () => {
    const teksty: EdycjaDruku["teksty"] = {};
    for (const [klucz, el] of elementy.current) {
      const oryginal = oryginaly.current.get(klucz) ?? "";
      const tekst = el.textContent ?? "";
      if (tekst !== oryginal) teksty[klucz] = { oryginal, tekst };
    }
    return teksty;
  };

  if (podglad) return <>{children}</>;

  const przycisk =
    "inline-flex size-9 items-center justify-center rounded-lg border-[3px] border-ink bg-background font-bold hover:bg-piasek disabled:opacity-40 disabled:hover:bg-background focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:outline-none";

  return (
    <>
      <div className="druk-ukryj sticky top-0 z-10 border-b-[3px] border-ink bg-background">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/magazyn/panel/materialy"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink hover:bg-piasek"
              aria-label="Wróć do listy materiałów do druku"
              title="Wróć do listy"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <div>
              <p className="etykieta-sm text-muted-foreground">materiały do druku · A4</p>
              <p className="font-bold">{tytul}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {edycja ? (
              <button
                type="button"
                onClick={() => setEdytuje((e) => !e)}
                aria-pressed={edytuje}
                className={`inline-flex items-center gap-1.5 rounded-xl border-[3px] border-ink px-3 py-2 text-sm font-bold ${
                  edytuje ? "bg-ink text-background" : "bg-background hover:bg-piasek"
                }`}
              >
                <Pencil className="size-4" aria-hidden />
                {edytuje ? "Edytujesz" : "Edytuj"}
              </button>
            ) : null}
            <div role="group" aria-label="Powiększenie podglądu" className="flex items-center gap-1.5">
              <button
                type="button"
                className={przycisk}
                onClick={() => setZoom((z) => przytnij(z - ZOOM_KROK))}
                disabled={zoom <= ZOOM_MIN}
                aria-label="Pomniejsz podgląd"
                title="Pomniejsz"
              >
                <ZoomOut className="size-4" aria-hidden />
              </button>
              <span className="w-12 text-center text-sm font-bold tabular-nums" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className={przycisk}
                onClick={() => setZoom((z) => przytnij(z + ZOOM_KROK))}
                disabled={zoom >= ZOOM_MAX}
                aria-label="Powiększ podgląd"
                title="Powiększ"
              >
                <ZoomIn className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className={`${przycisk} w-auto px-3 text-sm`}
                onClick={() => setZoom(doSzerokosci())}
                title="Dopasuj kartkę do szerokości okna"
              >
                <Maximize className="mr-1.5 size-4" aria-hidden />
                Dopasuj
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="cien-3 inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-akcent px-4 py-2 font-bold"
            >
              <Printer className="size-4" aria-hidden />
              Drukuj / zapisz PDF
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[1000px] px-4 pb-3 text-xs text-muted-foreground">
          W oknie drukowania wybierz „Zapisz jako PDF", żeby pobrać plik. Marginesy:
          brak, skala: 100%, zaznacz „Grafika tła". Powiększenie podglądu nie wpływa na wydruk.
        </p>
        {edycja && edytuje ? (
          <PanelEdycji
            plakatId={edycja.plakatId}
            styl={styl}
            onStyl={setStyl}
            zbierzTeksty={zbierzTeksty}
            onZapisano={dopasujPonownie}
            onZamknij={() => {
              setEdytuje(false);
              dopasujPonownie();
            }}
          />
        ) : null}
        {zaDuzo > 0 ? (
          <p className="mx-auto flex max-w-[1000px] items-center gap-2 px-4 pb-3 text-sm font-semibold text-[var(--czerwony-mocny)]">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            Treść nie mieści się na kartce nawet po pomniejszeniu — skróć opisy
            pozycji w panelu albo wyłącz część z nich.
          </p>
        ) : null}
      </div>

      <div ref={skalaRef} className={`druk-skala mt-8 ${edytuje ? "druk-edytuj" : ""}`} style={{ zoom }}>
        {children}
      </div>
    </>
  );
}
