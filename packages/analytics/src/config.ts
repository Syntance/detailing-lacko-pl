/**
 * NEXT_PUBLIC_* musi być czytane statycznym wyrażeniem `process.env.NAZWA` —
 * tylko takie Next inline'uje do bundla klienta. Dynamiczne `process.env[name]`
 * w przeglądarce zawsze daje undefined, czyli wyłączoną analitykę mimo
 * ustawionych kluczy.
 */
function clean(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed || undefined;
}

function isProductionRuntime(): boolean {
	return process.env.NODE_ENV === "production";
}

export const analyticsConfig = {
	get ga4Id(): string | undefined {
		return clean(process.env.NEXT_PUBLIC_GA4_ID);
	},
	get posthogKey(): string | undefined {
		return clean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
	},
	get posthogHost(): string {
		return clean(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://eu.i.posthog.com";
	},
	get metaPixelId(): string | undefined {
		return clean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
	},
	get clarityId(): string | undefined {
		return clean(process.env.NEXT_PUBLIC_CLARITY_ID);
	},
	get locale(): string {
		return clean(process.env.NEXT_PUBLIC_SITE_LOCALE) ?? "pl-PL";
	},
};

export const enabled = {
	ga4(): boolean {
		return isProductionRuntime() && Boolean(analyticsConfig.ga4Id);
	},
	posthog(): boolean {
		return isProductionRuntime() && Boolean(analyticsConfig.posthogKey);
	},
	meta(): boolean {
		return isProductionRuntime() && Boolean(analyticsConfig.metaPixelId);
	},
	clarity(): boolean {
		return isProductionRuntime() && Boolean(analyticsConfig.clarityId);
	},
	any(): boolean {
		return enabled.ga4() || enabled.posthog() || enabled.meta() || enabled.clarity();
	},
};

export function isTrackingProduction(): boolean {
	return isProductionRuntime() && enabled.any();
}
