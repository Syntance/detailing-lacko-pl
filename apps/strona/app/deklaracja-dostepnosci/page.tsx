import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageTemplate } from "@moduly/legal-consent";
import { modulyConfig } from "@/moduly.config";

export const metadata: Metadata = {
  title: "Deklaracja dostępności",
  robots: { index: false },
};

/** Deklaracja dostępności — wymóg European Accessibility Act. */
export default function DeklaracjaDostepnosciPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Detailing Łącko
        </Link>
      </div>
      <LegalPageTemplate
        brandName={modulyConfig.branding.name}
        title="Deklaracja dostępności"
        intro="Zobowiązujemy się zapewnić dostępność strony detailing-lacko.pl zgodnie z wymogami Europejskiego Aktu o Dostępności (EAA) i standardem WCAG 2.2 AA."
        breadcrumbs={[
          { label: "Strona główna", href: "/" },
          { label: "Deklaracja dostępności" },
        ]}
      >
        <h2 className="mt-8 mb-3 text-xl font-medium">Status zgodności</h2>
        <p className="mb-4">
          Strona jest projektowana i testowana pod kątem zgodności z{" "}
          <strong>WCAG 2.2 na poziomie AA</strong>: nawigacja klawiaturą,
          widoczny fokus, kontrast minimum 4,5:1, poprawna struktura nagłówków
          i etykiety formularzy, poszanowanie ustawienia „ogranicz animacje".
        </p>

        <h2 className="mt-8 mb-3 text-xl font-medium">Data przeglądu</h2>
        <p className="mb-4">
          Ostatni przegląd dostępności: lipiec 2026 (audyt automatyczny axe +
          przegląd ręczny). Przeglądy wykonujemy co najmniej raz w roku.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-medium">
          Zgłaszanie problemów z dostępnością
        </h2>
        <p className="mb-4">
          Jeśli cokolwiek na tej stronie jest dla Ciebie niedostępne, napisz:{" "}
          <a
            className="underline underline-offset-2"
            href={`mailto:${modulyConfig.email.contactEmail}?subject=Problem%20z%20dost%C4%99pno%C5%9Bci%C4%85`}
          >
            {modulyConfig.email.contactEmail}
          </a>
          . Krytyczne problemy naprawiamy w ciągu 30 dni.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-medium">Procedura skargowa</h2>
        <p className="mb-4">
          W przypadku braku reakcji przysługuje Ci skarga do{" "}
          <a
            className="underline underline-offset-2"
            href="https://www.rzecznik.gov.pl/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Rzecznika Praw Obywatelskich
          </a>
          .
        </p>
      </LegalPageTemplate>
    </div>
  );
}
