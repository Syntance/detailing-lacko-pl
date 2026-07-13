"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "@moduly/analytics";
import { ConsentProvider } from "@moduly/legal-consent";
import { CookieConsent } from "@/components/sections/cookie-consent";
import { modulyConfig } from "../../moduly.config";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ConsentProvider
			siteName={modulyConfig.branding.name}
			privacyPolicyHref="/polityka-prywatnosci"
			analyticsDescription="Anonimowe statystyki ruchu na stronie — pomagają mi ją ulepszać."
			marketingDescription="Personalizacja reklam w mediach społecznościowych."
		>
			<AnalyticsProvider locale={modulyConfig.commerce.locale}>
				{children}
				<CookieConsent />
			</AnalyticsProvider>
		</ConsentProvider>
	);
}
