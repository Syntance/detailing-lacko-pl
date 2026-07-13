import Link from "next/link";
import type { ReactNode } from "react";
import { PanelNav } from "@/components/magazyn/panel-nav";
import { logoutAction } from "@/lib/auth-actions";
import { toPanelConfig } from "@/lib/panel-config";

export const maxDuration = 120;

/**
 * Powłoka panelu — markup 1:1 z PanelShell (@moduly/ui), z własną nawigacją
 * PanelNav (dodatkowe pozycje: Cennik, Galeria przed/po, Dane firmy).
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  const config = toPanelConfig();
  const { basePath, branding } = config;

  return (
    <div
      data-moduly-panel
      className="fixed inset-0 w-full overflow-y-auto bg-background text-foreground"
    >
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col lg:flex-row">
        <aside className="flex shrink-0 flex-col gap-6 border-b border-border p-5 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-r lg:border-b-0">
          <Link href={`${basePath}/panel`} className="block shrink-0">
            <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
              {branding.name}
            </p>
            <p className="font-serif text-lg text-foreground">
              {branding.panelTitle}
            </p>
          </Link>

          <PanelNav config={config} logoutAction={logoutAction} />
        </aside>

        <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
