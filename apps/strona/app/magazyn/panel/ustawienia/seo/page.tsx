import { PageHeader } from "@moduly/ui";

export const dynamic = "force-dynamic";

/**
 * SEO tej strony jest zarządzane w kodzie (`generateMetadata` + JSON-LD),
 * nie przez CMS. Edytor `@moduly/magazyn-content` wymaga Medusy, której tu nie
 * ma — pokazujemy notę zamiast błędu serwera.
 */
export default function SeoInfoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO"
        description="Meta tytuły, opisy i dane strukturalne."
      />
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <p className="text-foreground">SEO strony jest ustawione w kodzie.</p>
        <p className="mt-2">
          Meta tytuł/opis, Open Graph i dane strukturalne (JSON-LD LocalBusiness
          + FAQ) generują się automatycznie z treści i danych firmy (sekcje
          „Dane firmy" i „Treść strony"). Edycja SEO z panelu nie jest dostępna
          w tej wersji — zmiany robimy w kodzie.
        </p>
      </div>
    </div>
  );
}
