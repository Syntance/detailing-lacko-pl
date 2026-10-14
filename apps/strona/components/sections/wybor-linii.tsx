import type { KontaktData } from "@/lib/site";
import type { Linia } from "@/lib/linie";

export type OpcjaWyboru = {
  linia: Linia;
  href: string;
  /** Co klient tam znajdzie — jedno zdanie pod logo. */
  opis: string;
  /** Tekst przycisku: czasownik + cel. */
  cta: string;
};

const LOGO: Record<Linia, { src: string; alt: string }> = {
  detailing: { src: "/brand/det-logo-poziome.svg", alt: "Detailing Łącko" },
  wulkanizacja: { src: "/brand/wulk-logo-poziome.svg", alt: "Wulkanizacja Łącko" },
};

/**
 * Mini-strona wyboru między liniami (pod wspólny kod QR w warsztacie):
 * dwie duże karty, każda w barwie swojej linii (data-marka przepina akcent),
 * cała karta jest linkiem — cel na telefonie trafia się kciukiem bez celowania.
 */
export function WyborLinii({
  etykieta,
  tytul,
  opis,
  opcje,
  kontakt,
}: {
  etykieta: string;
  tytul: string;
  opis: string;
  opcje: OpcjaWyboru[];
  kontakt: KontaktData;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-piasek px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 sm:gap-10">
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="etykieta w-max -rotate-1 rounded-full border-2 border-ink bg-background px-3 py-1">{etykieta}</p>
          <h1 className="text-[clamp(2rem,7vw,3.25rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
            {tytul}
          </h1>
          {opis ? <p className="max-w-md text-pretty text-tekst">{opis}</p> : null}
        </header>

        <ul className="grid w-full gap-6 sm:grid-cols-2 sm:gap-7">
          {opcje.map((o) => (
            <li key={o.linia} data-marka={o.linia}>
              <a
                href={o.href}
                className="group flex h-full flex-col gap-5 rounded-2xl border-[3px] border-ink bg-background p-6 cien-akcent-6 transition-[transform,box-shadow] duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--akcent)] focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-piasek focus-visible:outline-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--akcent)] motion-reduce:transition-none sm:p-7"
              >
                <img src={LOGO[o.linia].src} alt={LOGO[o.linia].alt} className="h-14 w-auto self-start sm:h-16" />
                <p className="text-pretty text-tekst">{o.opis}</p>
                <span className="mt-auto flex items-center justify-between gap-3 rounded-xl border-[2.5px] border-ink bg-akcent px-4 py-3 font-bold">
                  {o.cta}
                  <span
                    aria-hidden
                    className="text-xl leading-none transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="etykieta-sm text-center text-muted-foreground">
          {kontakt.addressLine} · {kontakt.city} ·{" "}
          <a href={`tel:${kontakt.phoneE164}`} className="underline-offset-4 hover:text-foreground hover:underline">
            {kontakt.phoneDisplay}
          </a>
        </p>
      </div>
    </main>
  );
}
