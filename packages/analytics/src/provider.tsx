"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getConsent } from "@moduly/legal-consent";
import {
	applyConsentToDestinations,
	track,
	setTrackContext,
} from "./track";
import {
	ensureDataLayer,
	initConsentMode,
	subscribeConsentUpdates,
	syncConsentFromState,
} from "./consent";
import { analyticsConfig, enabled } from "./config";
import { captureFirstTouchUtm } from "./context";

type Props = {
	children: ReactNode;
	locale?: string;
};

/**
 * gtag.js montowany dopiero PO zgodzie analitycznej (basic consent mode —
 * art. 173 Pt: skrypt nie ładuje się przed decyzją użytkownika; kolejka
 * dataLayer ma już wtedy default:denied → update:granted z consent.ts).
 * `send_page_view: false`, bo odsłony wysyła AnalyticsProvider przez track() —
 * jedno źródło prawdy, bez dubli z auto-page_view configa i enhanced
 * measurement.
 */
function GoogleTag({ gaId }: { gaId: string }) {
	useEffect(() => {
		ensureDataLayer();
		window.gtag?.("js", new Date());
		window.gtag?.("config", gaId, { send_page_view: false });
	}, [gaId]);

	return (
		<Script
			src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
			strategy="afterInteractive"
		/>
	);
}

export function AnalyticsProvider({ children, locale = "pl-PL" }: Props) {
	const pathname = usePathname() ?? "/";
	const [analyticsGranted, setAnalyticsGranted] = useState(false);

	useEffect(() => {
		captureFirstTouchUtm();
		initConsentMode();

		const existing = getConsent();
		if (existing) {
			syncConsentFromState(existing);
			setAnalyticsGranted(existing.analytics);
			void applyConsentToDestinations({
				analytics: existing.analytics,
				marketing: existing.marketing,
			});
		}

		return subscribeConsentUpdates((state) => {
			syncConsentFromState(state);
			setAnalyticsGranted(state.analytics);
			void applyConsentToDestinations({
				analytics: state.analytics,
				marketing: state.marketing,
			});
		});
	}, []);

	// page_view dopiero od momentu zgody: wcześniej track() i tak by je odrzucił,
	// a zależność od analyticsGranted dosyła odsłonę bieżącej strony w chwili,
	// gdy użytkownik kliknie „Akceptuję" (efekt GoogleTag z configiem odpala się
	// przed tym efektem — dzieci przed rodzicem — więc kolejność w dataLayer
	// jest poprawna). Ref pilnuje, żeby cofnięcie i ponowne nadanie zgody na
	// tej samej podstronie nie dublowało odsłony.
	const lastPageViewPath = useRef<string | null>(null);
	useEffect(() => {
		setTrackContext(pathname, locale);
		if (!analyticsGranted) return;
		if (lastPageViewPath.current === pathname) return;
		lastPageViewPath.current = pathname;
		track("page_view", {
			page_path: pathname,
			page_title: typeof document !== "undefined" ? document.title : undefined,
		});
	}, [pathname, locale, analyticsGranted]);

	return (
		<>
			{children}
			{analyticsGranted && enabled.ga4() && analyticsConfig.ga4Id ? (
				<GoogleTag gaId={analyticsConfig.ga4Id} />
			) : null}
			<Analytics />
			<SpeedInsights />
		</>
	);
}
