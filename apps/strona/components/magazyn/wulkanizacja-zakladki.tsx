"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Podzakładki sekcji „Wulkanizacja" w panelu: te same edytory co dla
 * detailingu (cennik, zdjęcia strony, FAQ, SEO), podpięte pod osobne bloby
 * linii. Osobne trasy, nie stan komponentu — każdy edytor ma własną historię
 * cofania, a adres mówi, co właśnie edytujesz.
 */
const BAZA = "/magazyn/panel/wulkanizacja";

const ZAKLADKI = [
  { href: `${BAZA}/cennik`, label: "Cennik" },
  { href: `${BAZA}/cms`, label: "CMS" },
  { href: `${BAZA}/faq`, label: "FAQ" },
  { href: `${BAZA}/seo`, label: "SEO" },
] as const;

export function WulkanizacjaZakladki() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sekcje wulkanizacji" className="flex flex-row flex-wrap gap-1">
      {ZAKLADKI.map((z) => {
        const active = pathname === z.href || pathname.startsWith(`${z.href}/`);
        return (
          <Link
            key={z.href}
            href={z.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {z.label}
          </Link>
        );
      })}
    </nav>
  );
}
