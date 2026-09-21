# Deploy — detailing-lacko.pl

## Stan po wdrożeniu (2026-07-12)

- **Vercel**: projekt `syntance/detailing-lacko` (root: `apps/strona`, framework Next.js).
- **Baza**: Prisma Postgres `eu-central-1` (utworzona przez `npx create-db`).
  ⚠️ **Baza jest „claimable"** — przejmij ją na konto Prisma linkiem z
  `DOSTEPY.local.md` **przed upływem 24 h od utworzenia**, inaczej zostanie
  usunięta. Po przejęciu nic się nie zmienia (ten sam connection string).
- **ENV na Vercelu** (production + preview): `DATABASE_URL`, `AUTH_JWT_SECRET`,
  `MODULY_CMS_PAGE_IDS`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_POSTHOG_HOST`,
  `MAGAZYN_ADMIN_ALLOWLIST`.
- **Domeny** `detailing-lacko.pl` + `www` — dodane do projektu Vercel,
  czekają na DNS (patrz niżej).

## Domena: Cloudflare (do zrobienia ręcznie — 10 minut)

Domena jest zarejestrowana w **Squarespace** (NS: `nsc1-4.squarespacedns.com`).
Konto Cloudflare (`lumine.strona@gmail.com`) nie ma jeszcze tej strefy, a token
wranglera ma tylko `zone:read` — dlatego te dwa kroki wymagają kliknięcia:

1. **Cloudflare** → Add a site → `detailing-lacko.pl` (plan Free).
   Dodaj rekordy (Proxy: **DNS only** — szare chmurki; Vercel sam robi TLS):
   | Typ | Nazwa | Wartość |
   |-----|-------|---------|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |
   Cloudflare pokaże 2 nameservery (np. `xxx.ns.cloudflare.com`).
2. **Squarespace** → Domains → `detailing-lacko.pl` → DNS → Use custom
   nameservers → wpisz nameservery z kroku 1.

Propagacja NS: zwykle 1–4 h (max 48 h). Vercel sam zweryfikuje domenę i wyda
certyfikat — status: `vercel domains inspect detailing-lacko.pl`.

## Po podpięciu domeny (checklist startowy)

- [ ] Przejmij bazę (link w `DOSTEPY.local.md`).
- [ ] Zaloguj się do panelu: `https://detailing-lacko.pl/magazyn`
      (dostępy w `DOSTEPY.local.md`) i uzupełnij w **Dane firmy**: prawdziwy
      numer telefonu, link Messenger, NIP, link do wizytówki Google.
- [ ] Podmień zdjęcia galerii na prawdziwe (panel → Galeria);
      spec sesji: `docs/zdjecia-spec.md`.
- [ ] Resend: dodaj `RESEND_API_KEY` (+ `CONTACT_INBOX_EMAIL`) w Vercel env,
      żeby formularz wysyłał maile. Bez tego zgłoszenia i tak trafiają do
      panelu (Formularze → Otrzymane).
- [ ] Analityka storefrontu: `NEXT_PUBLIC_GA4_ID` + `NEXT_PUBLIC_POSTHOG_KEY`
      w Vercel env (Production). Instrukcja skąd wziąć klucze:
      `apps/strona/.env.example`. W GA4 wyłącz w Enhanced measurement
      „historię przeglądarki" i „przewinięcia" (nasz kod wysyła je sam).
- [ ] Panel Statystyki: `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_JSON`,
      `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` w Vercel env —
      bez nich `/magazyn/panel/statystyki` pokazuje „nie połączono".
- [ ] Wizytówka Google: link strona ↔ wizytówka w obie strony (NAP identyczny).

## Operacje

```bash
pnpm install            # root repo
pnpm dev                # dev (apps/strona, :3000)
pnpm --filter @detailing-lacko/strona migrate   # migracje + seed admina (env z .env.local)
pnpm typecheck && pnpm lint && pnpm build        # quality gate
vercel deploy --prod    # deploy (z rootu repo)
```

Zmiana hasła admina: ustaw `MAGAZYN_ADMIN_EMAIL` + `MAGAZYN_ADMIN_PASSWORD`
w `apps/strona/.env.local` i uruchom `pnpm migrate` (upsert).

## Architektura treści

| Treść | Gdzie edytować | Storage |
|-------|----------------|---------|
| Zdjęcie hero detailingu | Magazyn → CMS | `page_content` (`home`) |
| Cennik detailingu (karty, pozycje, nagłówki) | Magazyn → Cennik | `site_blobs.cennik` |
| FAQ detailingu | Magazyn → FAQ | `site_blobs.faq` |
| SEO strony głównej + ustawienia całej witryny (indeksowanie, roboty AI) | Magazyn → SEO | `site_blobs.seo` |
| Wulkanizacja: cennik | Magazyn → Wulkanizacja → Cennik | `site_blobs.cennik-wulkanizacja` |
| Wulkanizacja: zdjęcie hero | Magazyn → Wulkanizacja → CMS | `page_content` (`wulkanizacja`) |
| Wulkanizacja: FAQ | Magazyn → Wulkanizacja → FAQ | `site_blobs.faq-wulkanizacja` |
| Wulkanizacja: SEO strony (tytuł, opis, obrazek) | Magazyn → Wulkanizacja → SEO | `site_blobs.seo-wulkanizacja` |
| Zdjęcia galerii realizacji | Magazyn → Galeria | `site_blobs.galeria` |
| Rezerwacje online (tylko detailing) | Magazyn → Rezerwacje → Zgłoszenia | `reservations` (tabela) |
| Dostępność terminów (dni, godziny, sloty, urlopy) | Magazyn → Rezerwacje → Dostępność | `site_blobs.dostepnosc` |
| Telefon, adres, NIP, obszar dojazdu | Magazyn → Dane firmy | `site_blobs.kontakt` |
| Definicje formularzy + skrzynka | Magazyn → Formularze | `form_definitions`, `contact_submissions` |
| Maile transakcyjne | Magazyn → E-maile | `site_settings` |

Obie strony (`/` i `/wulkanizacja`): ISR 10 min + `revalidatePath` obu ścieżek
przy każdym zapisie z panelu. Architektura dwóch linii usług: `docs/adr/002`.

## Linia Wulkanizacja — checklist wdrożenia

Bez migracji bazy: dane wulkanizacji to nowe wiersze w istniejących tabelach
(`site_blobs`, `page_content`), a do czasu pierwszego zapisu z panelu strona
czyta domyślne wartości z kodu. Wulkanizacja nie ma rezerwacji online — CTA
prowadzą do telefonu i do „Wyślij zdjęcie opony".

- [ ] Panel → Wulkanizacja → Cennik: potwierdź kwoty startowe (są propozycją
      z kodu, `lib/cennik-wulkanizacja.ts`); → FAQ: przejrzyj odpowiedzi;
      → CMS: wgraj zdjęcie hero (do tego czasu strona pokazuje ilustrację
      koła); → SEO: pusty opis składa się sam z cen w cenniku.
- [ ] GA4 → Administracja → Definicje niestandardowe → wymiar zdarzenia
      `service_line` (zakres: zdarzenie). Bez rejestracji raporty GA4 rozdzielą
      linie tylko po ścieżce strony; PostHog widzi właściwość od razu.
- [ ] Wizytówka Google: dopisz kategorię „Serwis opon / wulkanizacja" i link
      do `https://detailing-lacko.pl/wulkanizacja`.
