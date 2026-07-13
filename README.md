# detailing-lacko.pl

One-page wizytówka **Detailing Łącko** (pranie tapicerki, polerowanie lakieru —
Łącko / Nowy Sącz) + panel administracyjny **Magazyn**. Mini-monorepo
wygenerowane przez `moduly create strona` (Syntance/moduly), aplikacja w
`apps/strona`.

Plan i copy strony: dokument Notion „Strona www — plan i copy (one page)".
Wdrożenie, domena i checklist startowy: **[DEPLOY.md](DEPLOY.md)**.
Dostępy (lokalnie, poza git): `DOSTEPY.local.md`.

## Start

```bash
pnpm install
# uzupełnij apps/strona/.env.local według apps/strona/.env.example
pnpm --filter @detailing-lacko/strona migrate   # schemat DB + seed admina i treści
pnpm dev                                        # http://localhost:3000
```

## Co jest edytowalne w panelu (`/magazyn`)

- **Cennik** — karty usług, pozycje pełnej tabeli, nagłówki sekcji
- **Galeria** — zdjęcia realizacji w siatce z lightboxem (upload lub URL)
- **Dane firmy** — telefon, Messenger, adres, NIP, obszar dojazdu, link opinii
- **CMS** — hero, FAQ, galeria, opinie (blok testimonials)
- **Formularze** — definicje formularza kontaktowego + skrzynka zgłoszeń
- **E-maile** — szablony powiadomień (Resend)

## Quality gate

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Zdjęcia: obecne grafiki to art-directed placeholdery (`pnpm --filter
@detailing-lacko/strona generate:images`); spec prawdziwej sesji:
`docs/zdjecia-spec.md`.
