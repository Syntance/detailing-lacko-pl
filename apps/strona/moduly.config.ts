import type { ModulyConfig } from "@moduly/config";

/**
 * Konfiguracja instancji Moduly — Detailing Łącko (one-page + panel Magazyn).
 * Sekrety trzymaj w `.env.local` — patrz `.env.example`.
 */
export const modulyConfig: ModulyConfig = {
  basePath: "/magazyn",

  branding: {
    name: "Detailing Łącko",
    panelTitle: "Magazyn",
    storefrontUrl:
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl",
  },

  auth: {
    cookieName: "moduly_admin_session",
    google: false,
    provider: "postgres",
  },

  modules: {
    orders: false,
    products: false,
    categories: false,
    content: true,
    emails: true,
    settings: true,
    forms: true,
    returns: false,
  },

  content: {
    pages: [
      {
        id: "home",
        label: "Strona główna",
        path: "/",
        // Tylko bloki, które strona faktycznie renderuje (galeria realizacji ma
        // własny edytor Magazyn → Galeria; opinie dodamy wraz z sekcją opinii).
        blocks: ["hero", "faq"],
      },
    ],
    globalBlocks: ["socialLinks", "footerText"],
  },

  payments: {
    enabled: [],
    defaultProvider: "pp_system_default",
    bankTransfer: {
      recipientName: "Detailing Łącko",
      iban: "PL00000000000000000000000000",
      swift: "",
      addressLine1: "Czerniec 72",
      addressLine2: "33-390 Łącko",
      paymentDays: 7,
      transferTitlePrefix: "Usługa",
    },
  },

  commerce: {
    search: { enabled: false },
    currency: "pln",
    locale: "pl-PL",
  },

  email: {
    fromName: "Detailing Łącko",
    contactEmail: "kontakt@detailing-lacko.pl",
    footerText: "Detailing Łącko · Czerniec 72, 33-390 Łącko",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl",
  },

  // Barwy maili spójne z brandem strony: żółty #FFC800 + grafit (nie turkus startera).
  emailTheme: {
    bg: "#f7f7f5",
    contentBg: "#ffffff",
    text: "#3f3f46",
    heading: "#23272f",
    accent: "#a16207",
    muted: "#71717a",
    link: "#a16207",
    fontKey: "sans",
    headerFontKey: "sans",
    contentWidth: 600,
    radius: 8,
    headerBg: "#ffc800",
    headerText: "#23272f",
    headerEyebrow: "Detailing Łącko",
    brandName: "Detailing Łącko",
  },
};
