import Link from "next/link";
import { LINIA_INFO, LINIE, type Linia } from "@/lib/linie";

/**
 * Przełącznik linii usług w edytorach panelu (Cennik, CMS, FAQ, SEO): jedna
 * zakładka na sekcję, a w środku wybór strony, której treść edytujesz.
 * Linia siedzi w adresie (`?linia=`), więc odświeżenie i link zachowują wybór.
 */
export function PrzelacznikLinii({ sciezka, aktywna }: { sciezka: string; aktywna: Linia }) {
  return (
    <nav aria-label="Linia usług" className="mb-6 inline-flex rounded-xl border border-border bg-muted p-1">
      {LINIE.map((linia) => {
        const wybrana = linia === aktywna;
        return (
          <Link
            key={linia}
            href={linia === "detailing" ? sciezka : `${sciezka}?linia=${linia}`}
            aria-current={wybrana ? "page" : undefined}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
              wybrana
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {LINIA_INFO[linia].etykieta}
            {LINIA_INFO[linia].path !== "/" ? (
              <span className="ml-1.5 text-xs opacity-70">{LINIA_INFO[linia].path}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Linia z parametru adresu — wszystko poza „wulkanizacja" to detailing. */
export const liniaZParametru = (wartosc?: string): Linia =>
  wartosc === "wulkanizacja" ? "wulkanizacja" : "detailing";
