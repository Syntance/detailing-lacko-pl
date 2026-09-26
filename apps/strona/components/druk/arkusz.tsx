import type { ReactNode } from "react";
import type { KontaktData } from "@/lib/site";
import type { Marka } from "@/lib/plakaty";

const MARKI: Record<Marka, { sygnet: string; nazwa: string; podpis: string }> = {
  detailing: { sygnet: "/brand/syg-kolor.png", nazwa: "Detailing Łącko", podpis: "wnętrze · lakier" },
  wulkanizacja: { sygnet: "/brand/wulk-sygnet.svg", nazwa: "Wulkanizacja Łącko", podpis: "opony · wyważanie" },
};

/**
 * Jedna kartka A4 plakatu: nagłówek z tytułem po lewej oraz telefonem i
 * (opcjonalnie) kodem QR do opinii po prawej, treść dopasowywana skalą do wysokości (NarzedziaDruku) i mała
 * stopka z logo marki.
 */
export function Arkusz({
  marka,
  etykieta,
  tytul,
  podtytul,
  kontakt,
  qrOpinie = false,
  wewnetrzny = false,
  children,
}: {
  marka: Marka;
  etykieta: string;
  tytul: string;
  podtytul?: string;
  kontakt: KontaktData;
  /** Kod QR do opinii w Google w prawym górnym rogu. */
  qrOpinie?: boolean;
  /** Materiał tylko dla warsztatu: zamiast telefonu adnotacja, bez tekstów do klienta. */
  wewnetrzny?: boolean;
  children: ReactNode;
}) {
  const dane = MARKI[marka];
  return (
    <section className="arkusz-a4" data-marka={marka}>
      <header className="flex items-center justify-between gap-6 border-b-[3px] border-ink pb-4">
        <div className="flex flex-col items-start gap-1.5">
          <p className="etykieta w-max -rotate-1 rounded-full border-2 border-ink bg-akcent px-3 py-1">
            {etykieta}
          </p>
          <h1 className="text-[30px] leading-[1.02] font-bold tracking-[-0.02em]">{tytul}</h1>
          {podtytul ? (
            <p className="max-w-[110mm] text-[12px] leading-snug text-pretty text-tekst">{podtytul}</p>
          ) : null}
        </div>

        {qrOpinie ? (
          <div className="flex shrink-0 items-center gap-3 text-right">
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-[13px] leading-tight font-bold">
                Podobało się?
                <br />
                Zostaw opinię w Google
              </p>
              <p className="cien-3 rounded-lg border-[2.5px] border-ink bg-background px-2.5 py-1 text-[15px] leading-none font-bold whitespace-nowrap">
                {kontakt.phoneDisplay}
              </p>
            </div>
            <div className="cien-3 rounded-xl border-[3px] border-ink bg-white p-0.5">
              <img src="/brand/qr-opinie-google.png" alt="Kod QR do opinii w Google" className="size-[27mm] object-contain" />
            </div>
          </div>
        ) : wewnetrzny ? (
          <p className="etykieta-sm shrink-0 rounded-full border-2 border-ink px-3 py-1 text-[10px] whitespace-nowrap">
            materiał wewnętrzny
          </p>
        ) : (
          <p className="cien-3 shrink-0 rounded-xl border-[3px] border-ink bg-background px-3 py-1.5 text-[19px] leading-none font-bold whitespace-nowrap">
            {kontakt.phoneDisplay}
          </p>
        )}
      </header>

      <div data-arkusz-tresc className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-4">{children}</div>
      </div>

      <footer className="flex items-center justify-center gap-2.5 border-t-2 border-ink pt-2.5">
        <img src={dane.sygnet} alt="" className="size-[9mm] shrink-0 object-contain" />
        <p className="text-[12px] leading-none font-bold tracking-[-0.01em] uppercase">{dane.nazwa}</p>
        <p className="etykieta-sm text-[8.5px] text-muted-foreground">· {dane.podpis}</p>
      </footer>
    </section>
  );
}
