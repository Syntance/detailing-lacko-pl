"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "@moduly/analytics";
import { ConsentProvider } from "@moduly/legal-consent";
import { KartkaProvider } from "@/components/marka/kartka";
import { CookieConsent } from "@/components/sections/cookie-consent";
import { kontekstAnalitykiDlaSciezki } from "@/lib/linie";
import { modulyConfig } from "../../moduly.config";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ConsentProvider
			siteName={modulyConfig.branding.name}
			privacyPolicyHref="/polityka-prywatnosci"
			analyticsDescription="Anonimowe statystyki ruchu na stronie — pomagają mi ją ulepszać."
			marketingDescription="Personalizacja reklam w mediach społecznościowych."
		>
			{/* `resolveContext` dopina do każdego zdarzenia `service_line`
			    (detailing / wulkanizacja) — GA4 i PostHog rozdzielają po tym ruch
			    i lejek obu linii. Patrz lib/linie.ts. */}
			<AnalyticsProvider
				locale={modulyConfig.commerce.locale}
				resolveContext={kontekstAnalitykiDlaSciezki}
			>
				<KartkaProvider>{children}</KartkaProvider>
				<CookieConsent />
			</AnalyticsProvider>
		</ConsentProvider>
	);
}
