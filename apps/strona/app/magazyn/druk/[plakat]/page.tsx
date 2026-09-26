import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { Arkusz } from "@/components/druk/arkusz";
import { NarzedziaDruku } from "@/components/druk/narzedzia-druku";
import { PlakatCennik } from "@/components/druk/plakat-cennik";
import {
  KARTKI_MOMENTOW,
  PlakatMomentyMarki,
  PlakatMomentyWstep,
} from "@/components/druk/plakat-momenty";
import {
  PlakatCoNaprawie,
  PlakatLegenda,
  PlakatNaprawyCiezkieStrona,
  PlakatNaprawyOsoboweDostawcze,
} from "@/components/druk/plakaty-napraw";
import {
  UKLAD_CENNIKA_DETAILING,
  UKLAD_CENNIKA_WULKANIZACJA,
} from "@/components/sections/uslugi-cennik";
import { requireAdminSessionForPanel } from "@/lib/auth";
import { plakatPoId } from "@/lib/plakaty";
import { jestEdytowalny } from "@/lib/druk-edycja";
import { getCennikDoDruku, getCennikWulkanizacjaDoDruku, getEdycjaDruku, getKontakt } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Materiały do druku",
  robots: { index: false, follow: false },
};

type Wynik<T> = { dane: T } | { blad: string };

/** Błąd odczytu cennika pokazujemy na kartce zamiast domyślnych cen z kodu. */
async function wczytaj<T>(pobierz: () => Promise<T>): Promise<Wynik<T>> {
  try {
    return { dane: await pobierz() };
  } catch (error) {
    console.error("[druk] Nie udało się pobrać cennika:", error);
    return { blad: error instanceof Error ? error.message : "Nieznany błąd odczytu." };
  }
}

function BladDanych({ komunikat }: { komunikat: string }) {
  return (
    <section className="arkusz-a4 items-center justify-center gap-4 text-center">
      <p className="text-2xl font-bold">Nie można pobrać cennika z panelu</p>
      <p className="max-w-[120mm] text-sm text-tekst">
        Żeby nie wydrukować nieaktualnych cen, plakat nie został wygenerowany.
        Odśwież stronę — jeśli błąd wraca, sprawdź połączenie z bazą.
      </p>
      <p className="etykieta-sm text-muted-foreground">{komunikat}</p>
    </section>
  );
}

export default async function DrukPage({
  params,
  searchParams,
}: {
  params: Promise<{ plakat: string }>;
  searchParams: Promise<{ podglad?: string; drukuj?: string }>;
}) {
  const { plakat: id } = await params;
  const { podglad, drukuj } = await searchParams;

  try {
    await requireAdminSessionForPanel();
  } catch {
    redirect(`/magazyn?redirect=${encodeURIComponent(`/magazyn/druk/${id}`)}`);
  }

  const plakat = plakatPoId(id);
  if (!plakat) notFound();

  const kontakt = await getKontakt();
  const edycja = jestEdytowalny(plakat.id)
    ? { plakatId: plakat.id, dane: await getEdycjaDruku(plakat.id) }
    : undefined;
  const wspolne = { marka: plakat.marka, kontakt } as const;

  let kartki: ReactNode;
  switch (plakat.id) {
    case "cennik-detailing": {
      const wynik = await wczytaj(getCennikDoDruku);
      if ("blad" in wynik) {
        kartki = <BladDanych komunikat={wynik.blad} />;
        break;
      }
      const cennik = wynik.dane;
      kartki = (
        <Arkusz
          {...wspolne}
          etykieta={cennik.settings.vatNote || "cennik"}
          tytul="Cennik usług"
          qrOpinie
        >
          <PlakatCennik cennik={cennik} uklad={UKLAD_CENNIKA_DETAILING} />
        </Arkusz>
      );
      break;
    }
    case "cennik-wulkanizacja": {
      const wynik = await wczytaj(getCennikWulkanizacjaDoDruku);
      if ("blad" in wynik) {
        kartki = <BladDanych komunikat={wynik.blad} />;
        break;
      }
      const cennik = wynik.dane;
      kartki = (
        <Arkusz
          {...wspolne}
          etykieta={cennik.settings.vatNote || "cennik"}
          tytul="Cennik wulkanizacji"
          podtytul={cennik.settings.subheading}
        >
          <PlakatCennik cennik={cennik} uklad={UKLAD_CENNIKA_WULKANIZACJA} />
        </Arkusz>
      );
      break;
    }
    case "tabele-napraw": {
      const RAZEM = 5;
      const kartka = (n: number) => `${n}/${RAZEM}`;
      const podtytulTabeli =
        "Maksymalny rozmiar uszkodzenia w mm dla łatki radialnej, wg tabeli producenta łatek. Krzyżyk = naprawa w tej strefie niedozwolona.";
      kartki = (
        <>
          <Arkusz
            {...wspolne}
            wewnetrzny
            etykieta={`ściąga · ${kartka(1)}`}
            tytul="Kwalifikacja opony do naprawy"
            podtytul="Strefy naprawy z limitami dla indeksu H oraz przypadki, w których opona idzie do wymiany."
          >
            <PlakatCoNaprawie />
          </Arkusz>
          <Arkusz
            {...wspolne}
            wewnetrzny
            etykieta={`legenda · ${kartka(2)}`}
            tytul="Jak czytać tabele napraw"
            podtytul="Oznaczenia wspólne dla wszystkich tabel na kolejnych kartkach."
          >
            <PlakatLegenda />
          </Arkusz>
          <Arkusz
            {...wspolne}
            wewnetrzny
            etykieta={`tabela napraw · ${kartka(3)}`}
            tytul="Osobowe i dostawcze"
            podtytul={podtytulTabeli}
          >
            <PlakatNaprawyOsoboweDostawcze />
          </Arkusz>
          {([1, 2] as const).map((strona) => (
            <Arkusz
              key={strona}
              {...wspolne}
              wewnetrzny
              etykieta={`tabela napraw · ${kartka(strona + 3)}`}
              tytul="Przyczepy i autobusy"
              podtytul="Opony ciężkie od indeksu nośności 122. Grupę wybierasz po rozmiarze opony, potem odczytujesz limity uszkodzeń w mm."
            >
              <PlakatNaprawyCiezkieStrona strona={strona} />
            </Arkusz>
          ))}
        </>
      );
      break;
    }
    case "momenty-kol":
      kartki = (
        <>
          <Arkusz
            {...wspolne}
            wewnetrzny
            etykieta={`momenty kół · 1/${KARTKI_MOMENTOW + 1}`}
            tytul="Momenty dokręcania kół"
            podtytul="Ściąga orientacyjna — jak czytać, procedura dokręcania, źródła."
          >
            <PlakatMomentyWstep />
          </Arkusz>
          {Array.from({ length: KARTKI_MOMENTOW }, (_, i) => (
            <Arkusz
              key={i}
              {...wspolne}
              wewnetrzny
              etykieta={`momenty kół · ${i + 2}/${KARTKI_MOMENTOW + 1}`}
              tytul="Momenty dokręcania kół (Nm)"
              podtytul="Wartości orientacyjne wg zestawień warsztatowych. Kolorem zaznaczono wpisy, w których źródła się różnią."
            >
              <PlakatMomentyMarki kartka={i} />
            </Arkusz>
          ))}
        </>
      );
      break;
    default:
      notFound();
  }

  return (
    <div className={podglad ? "bg-background" : "min-h-screen bg-piasek pb-10 print:min-h-0 print:bg-transparent print:pb-0"}>
      <NarzedziaDruku
        tytul={plakat.tytul}
        podglad={Boolean(podglad)}
        drukujOdRazu={drukuj === "1"}
        edycja={edycja}
      >
        {kartki}
      </NarzedziaDruku>
    </div>
  );
}
