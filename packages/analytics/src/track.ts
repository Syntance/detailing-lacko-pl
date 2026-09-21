import {
	EVENT_REGISTRY,
	type EventKey,
	type EventPayloads,
} from "@syntance/analytics-events";
import { enabled } from "./config";
import { hasConsent } from "./consent";
import { withContext, type TrackExtraContext } from "./context";
import { sendGa4Event } from "./destinations/ga4";
import { sendMetaEvent } from "./destinations/meta";
import { sendPosthogEvent, ensurePosthogOptIn, ensurePosthogOptOut } from "./destinations/posthog";
import { sendClarityEvent } from "./destinations/clarity";

let currentPathname = "/";
let currentLocale = "pl-PL";
/** Kontekst aplikacji dla bieżącej ścieżki (patrz AnalyticsProvider.resolveContext). */
let currentExtra: TrackExtraContext = {};

export function setTrackContext(
	pathname: string,
	locale?: string,
	extra?: TrackExtraContext,
): void {
	currentPathname = pathname;
	if (locale) currentLocale = locale;
	currentExtra = extra ?? {};
}

export function track<K extends EventKey>(name: K, payload: EventPayloads[K]): void {
	if (!enabled.any()) return;
	if (!(name in EVENT_REGISTRY)) return;

	const enriched = withContext(
		currentPathname,
		currentLocale,
		payload as Record<string, unknown>,
		currentExtra,
	);

	if (hasConsent("analytics")) {
		if (enabled.ga4()) sendGa4Event(name, enriched);
		void sendPosthogEvent(name, enriched);
		if (enabled.clarity()) sendClarityEvent(name, enriched);
	}

	if (hasConsent("marketing") && EVENT_REGISTRY[name].meta && enabled.meta()) {
		sendMetaEvent(name, enriched);
	}
}

export async function applyConsentToDestinations(input: {
	analytics: boolean;
	marketing: boolean;
}): Promise<void> {
	if (input.analytics) {
		await ensurePosthogOptIn();
	} else {
		await ensurePosthogOptOut();
	}
}

export type { EventKey, EventPayloads };
