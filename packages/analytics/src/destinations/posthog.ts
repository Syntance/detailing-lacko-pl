import type { PostHog } from "posthog-js";
import type { EventKey } from "@syntance/analytics-events";
import { analyticsConfig, enabled } from "../config";
import { hasConsent } from "../consent";

let client: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

async function getPosthogClient(): Promise<PostHog | null> {
	if (!enabled.posthog() || !hasConsent("analytics")) return null;
	if (client) return client;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const { default: posthog } = await import("posthog-js");
		const key = analyticsConfig.posthogKey;
		if (!key) return null;

		// Init odpala się wyłącznie po zgodzie (guard wyżej). Bez callbacka
		// `loaded` z opt_out: odpalał się PO naszym opt_in_capturing() i po
		// cichu wyłączał zbieranie mimo zgody.
		posthog.init(key, {
			api_host: analyticsConfig.posthogHost,
			autocapture: false,
			// Odsłony idą przez track() jako $pageview — patrz sendPosthogEvent.
			capture_pageview: false,
			// $pageleave daje Web Analytics czas trwania wizyty i bounce rate.
			capture_pageleave: true,
			mask_all_text: true,
			opt_out_capturing_by_default: true,
			persistence: "localStorage+cookie",
			// Strona nie ma logowania — nikt się nie „identyfikuje". Bez tego
			// każdy anonim dostaje pełny profil osoby: drożej w rozliczeniu
			// PostHoga i więcej danych osobowych niż potrzeba. Web Analytics
			// liczy ruch tak samo, bo opiera się na $session_id.
			person_profiles: "identified_only",
		});

		client = posthog;
		return posthog;
	})();

	return initPromise;
}

export async function ensurePosthogOptIn(): Promise<void> {
	const ph = await getPosthogClient();
	// Zgoda mogła zostać cofnięta w trakcie pobierania chunka posthog-js —
	// bez re-checku zawieszony opt-in dokończyłby się PO odmowie.
	if (!ph || !hasConsent("analytics")) return;
	ph.opt_in_capturing({ captureEventName: null });
}

export async function ensurePosthogOptOut(): Promise<void> {
	// Nie ignoruj trwającego init: odmowa w oknie pobierania chunka byłaby
	// no-opem (client === null), a stały opt-in zapisałby się mimo odmowy.
	const ph = client ?? (initPromise ? await initPromise : null);
	if (!hasConsent("analytics")) ph?.opt_out_capturing();
}

/**
 * `page_view` → `$pageview`: wbudowany dashboard Web Analytics w PostHogu
 * liczy ruch wyłącznie po $pageview/$pageleave — pod własną nazwą eventu
 * zostałby pusty. Pozostałe eventy idą pod nazwami z rejestru.
 */
export async function sendPosthogEvent(
	name: EventKey,
	payload: Record<string, unknown>,
): Promise<void> {
	if (!enabled.posthog() || !hasConsent("analytics")) return;
	const ph = await getPosthogClient();
	// Drugi check hasConsent: zgoda mogła zostać cofnięta w trakcie init.
	if (!ph || !hasConsent("analytics")) return;

	// Zgoda mogła zapaść tuż przed dokończeniem init — bez dopięcia opt-in
	// pierwszy event po zgodzie po cichu przepada.
	if (ph.has_opted_out_capturing()) ph.opt_in_capturing({ captureEventName: null });

	ph.capture(name === "page_view" ? "$pageview" : name, payload);
}
