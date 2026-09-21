import { defaultModulyConfig } from "@moduly/config";

/**
 * Segment ruchu — np. linia usług. `key` to wartość właściwości zdarzenia
 * w PostHogu (`segments.property`), `pagePaths` to ścieżki GA4 (`pagePath`,
 * bez query) zaliczane do segmentu — GA4 nie zna właściwości niestandardowych
 * bez rejestracji wymiaru, więc rozdziela po stronie.
 */
export type AnalyticsSegment = {
	key: string;
	label: string;
	pagePaths: string[];
};

/**
 * Krok lejka liczony w PostHogu. `where` to dodatkowy warunek HogQL na
 * właściwościach zdarzenia (np. `toString(properties.cta_id) = 'booking_start'`)
 * — konfiguracja z kodu aplikacji, nigdy z danych użytkownika.
 *
 * `match` zastępuje cały warunek `event = …` — dla kroku, który łączy kilka
 * zdarzeń (np. „telefon LUB rezerwacja"). `event` służy wtedy tylko za
 * identyfikator kroku w panelu.
 */
export type AnalyticsFunnelStep = {
	event: string;
	label: string;
	where?: string;
	match?: string;
};

export type MagazynAnalyticsConfig = {
	basePath: string;
	/** Podział ruchu i lejka po segmentach (PostHog: właściwość, GA4: ścieżki). */
	segments?: {
		property: string;
		label: string;
		values: AnalyticsSegment[];
	};
	/** Lejek konwersji (PostHog). Domyślnie e-commerce: product_view → purchase. */
	funnel?: AnalyticsFunnelStep[];
};

let config: MagazynAnalyticsConfig = {
	basePath: defaultModulyConfig.basePath,
};

let adminGuard: (() => Promise<void>) | null = null;

export function configureMagazynAnalytics(
	next: Partial<MagazynAnalyticsConfig> & { guardAdmin?: () => Promise<void> },
): void {
	const { guardAdmin, ...rest } = next;
	config = { ...config, ...rest };
	if (guardAdmin) adminGuard = guardAdmin;
}

export function getMagazynAnalyticsConfig(): MagazynAnalyticsConfig {
	return config;
}

export async function requireAnalyticsAdmin(): Promise<void> {
	if (!adminGuard) {
		throw new Error(
			"Skonfiguruj guardAdmin w configureMagazynAnalytics przed wejściem w analitykę.",
		);
	}
	await adminGuard();
}
