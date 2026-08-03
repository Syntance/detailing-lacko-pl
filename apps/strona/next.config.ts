import type { NextConfig } from "next";

const MODULY_PACKAGES = [
  "@moduly/analytics",
  "@moduly/auth-core",
  "@moduly/client-panel",
  "@moduly/cms",
  "@moduly/commerce",
  "@moduly/config",
  "@moduly/data-store",
  "@moduly/legal-consent",
  "@moduly/magazyn-analytics",
  "@moduly/magazyn-categories",
  "@moduly/magazyn-content",
  "@moduly/magazyn-core",
  "@moduly/magazyn-emails",
  "@moduly/magazyn-forms",
  "@moduly/magazyn-orders",
  "@moduly/magazyn-products",
  "@moduly/magazyn-returns",
  "@moduly/magazyn-settings",
  "@moduly/payments",
  "@moduly/seo-geo",
  "@moduly/types",
  "@moduly/ui",
] as const;

/**
 * CSP bez nonce: nonce wymusiłby dynamic rendering każdej strony (utrata ISR
 * i LCP na one-page'u), a strona nie renderuje HTML od użytkowników. Stąd
 * `'unsafe-inline'` dla skryptów Next + jawna lista hostów analityki.
 */
// React w trybie dev wymaga eval() (odtwarzanie stacktrace'ów); prod — nie.
const SCRIPT_DEV = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${SCRIPT_DEV} https://va.vercel-scripts.com https://eu-assets.i.posthog.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // R2 S3 API — przeglądarka PUTuje duże zdjęcia presignem prosto na bucket
  // (omija limit body Vercel ~4,5 MB). Bez tego hosta CSP blokuje upload.
  "connect-src 'self' https://08414a969e8107b01088ca1ced57dd94.r2.cloudflarestorage.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [...MODULY_PACKAGES],
  // Next dopuszcza tylko jawnie zadeklarowane wartości `quality` — bez tego
  // <Image quality={70}> po cichu wraca do 75. Hero leży pod scrimem, więc
  // q70 mieści LCP w budżecie 120 KB bez widocznej straty jakości.
  images: {
    qualities: [70, 75],
    // Next domyślnie wydaje tylko WebP. AVIF idzie pierwszy w negocjacji przez
    // `Accept`, daje ~25% mniej przy tej samej jakości i ma kanał alfa, którego
    // wymagają naklejki marki (wypalone obwódki); przeglądarki bez AVIF dostają
    // WebP, więc to czysty zysk bez fallbacku po naszej stronie.
    formats: ["image/avif", "image/webp"],
    // Zdjęcia wgrane przez panel (Metamorfozy itp.) trafiają na R2 — bez
    // jawnego hosta next/image odrzuca render z „hostname not configured".
    remotePatterns: [
      { protocol: "https", hostname: "pub-44ef6d6523b942e5b4074911f7e5a7f0.r2.dev" },
    ],
  },
  // @moduly/data-store czyta pliki .sql (readFileSync) przy imporcie —
  // muszą trafić do bundla funkcji serverless na Vercelu.
  outputFileTracingIncludes: {
    "/**": ["../../packages/data-store/src/postgres/migrations/*.sql"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [...SECURITY_HEADERS] }];
  },
  // Panel żyje pod /magazyn (login) → /magazyn/panel. Wpisanie /panel(/…)
  // kierujemy do wejścia panelu, żeby skrót z pamięci nie dawał 404.
  async redirects() {
    return [
      { source: "/panel", destination: "/magazyn", permanent: false },
      { source: "/panel/:path*", destination: "/magazyn", permanent: false },
      // Moduły sklepowe (Medusa) wyłączone — bezpośrednie URL-e nie mogą dać 500.
      {
        source: "/magazyn/panel/maile/:path*",
        destination: "/magazyn/panel",
        permanent: false,
      },
      {
        source: "/magazyn/panel/ustawienia/:path*",
        destination: "/magazyn/panel",
        permanent: false,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
    // Arkusz strony (~12 KB) blokował render przez ~150 ms jako osobne żądanie.
    // Wstawiony w <style> jedzie razem z HTML-em, więc znika z krytycznej
    // ścieżki. Działa tylko w App Routerze na produkcji.
    inlineCss: true,
  },
};

export default nextConfig;
