"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SettingsSidebarNav,
  SidebarFooter,
  buildNavItems,
  isSettingsPath,
  type NavItem,
  type PanelConfig,
} from "@moduly/ui";
import { Building2, CircleDollarSign, Images } from "lucide-react";

/**
 * Nawigacja panelu z pozycjami własnymi projektu (Cennik, Galeria przed/po,
 * Dane firmy) — kopia PanelSidebarNav z @moduly/ui, bo buildNavItems nie
 * przyjmuje pozycji spoza modułów.
 */
export function PanelNav({
  config,
  logoutAction,
}: {
  config: PanelConfig;
  logoutAction?: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const panel = `${config.basePath}/panel`;

  const base = buildNavItems(config);
  const custom: NavItem[] = [
    {
      href: `${panel}/cennik`,
      label: "Cennik",
      icon: CircleDollarSign,
      exact: false,
    },
    {
      href: `${panel}/galeria`,
      label: "Galeria",
      icon: Images,
      exact: false,
    },
    {
      href: `${panel}/dane-firmy`,
      label: "Dane firmy",
      icon: Building2,
      exact: false,
    },
  ];
  // Własne pozycje zaraz po „Przegląd" i „Statystyki" — najczęściej używane.
  const statsCount = base.findIndex(
    (item) => !item.exact && item.href.endsWith("/statystyki"),
  );
  const insertAt = statsCount === -1 ? 1 : statsCount + 1;
  const items = [...base.slice(0, insertAt), ...custom, ...base.slice(insertAt)];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        {isSettingsPath(pathname, config.basePath) ? (
          <SettingsSidebarNav config={config} />
        ) : (
          <nav aria-label="Nawigacja panelu" className="flex flex-col gap-1">
            {items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      <SidebarFooter
        storefrontUrl={config.branding.storefrontUrl}
        logoutAction={logoutAction}
        className="mt-auto shrink-0"
      />
    </div>
  );
}
