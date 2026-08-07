import { hasConsent } from "./consent";

const UTM_STORAGE_KEY = "moduly.analytics.utm.v1";

export type AnalyticsContext = {
	page_type: "storefront" | "admin" | "account" | "other";
	locale: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_content?: string;
	utm_term?: string;
};

type UtmParams = Pick<
	AnalyticsContext,
	"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term"
>;

/**
 * Art. 173 Pt: sessionStorage wolno tykać (zapis I odczyt) dopiero po zgodzie
 * analitycznej. Przed zgodą UTM-y z URL-a żyją wyłącznie w pamięci modułu —
 * withContext() dopisuje je do storage przy pierwszym evencie po zgodzie.
 */
let memoryUtm: UtmParams = {};

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

function readUtmFromUrl(): UtmParams {
	if (!isBrowser()) return {};
	const params = new URLSearchParams(window.location.search);
	const pick = (key: string) => params.get(key)?.trim() || undefined;
	const utm: UtmParams = {
		utm_source: pick("utm_source"),
		utm_medium: pick("utm_medium"),
		utm_campaign: pick("utm_campaign"),
		utm_content: pick("utm_content"),
		utm_term: pick("utm_term"),
	};
	const hasAny = Object.values(utm).some(Boolean);
	return hasAny ? utm : {};
}

function loadStoredUtm(): UtmParams {
	if (!isBrowser()) return {};
	try {
		const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as UtmParams;
	} catch {
		return {};
	}
}

function storeUtm(utm: UtmParams): void {
	if (!isBrowser()) return;
	try {
		window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
	} catch {
		/* quota / private mode */
	}
}

function rememberUtmFromUrl(): void {
	const fromUrl = readUtmFromUrl();
	if (Object.keys(fromUrl).length > 0) {
		memoryUtm = { ...memoryUtm, ...fromUrl };
	}
}

function persistMemoryUtm(): void {
	if (Object.keys(memoryUtm).length === 0) return;
	storeUtm({ ...loadStoredUtm(), ...memoryUtm });
}

function resolvePageType(pathname: string): AnalyticsContext["page_type"] {
	if (pathname.includes("/magazyn/panel")) return "admin";
	if (pathname.startsWith("/konto")) return "account";
	if (
		pathname.startsWith("/sklep") ||
		pathname.startsWith("/checkout") ||
		pathname === "/"
	) {
		return "storefront";
	}
	return "other";
}

export function captureFirstTouchUtm(): void {
	rememberUtmFromUrl();
	if (hasConsent("analytics")) {
		persistMemoryUtm();
	}
}

export function withContext(
	pathname: string,
	locale: string,
	payload: Record<string, unknown>,
): Record<string, unknown> {
	rememberUtmFromUrl();
	const consented = hasConsent("analytics");
	const utm = consented
		? { ...loadStoredUtm(), ...memoryUtm }
		: { ...memoryUtm };
	if (consented) persistMemoryUtm();

	return {
		page_type: resolvePageType(pathname),
		locale,
		page_path: pathname,
		...utm,
		...payload,
	};
}
