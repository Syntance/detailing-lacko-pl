export type AnalyticsSourceState =
	| { status: "connected"; label: string }
	| { status: "disconnected"; reason: string }
	| { status: "error"; reason: string };

export type AnalyticsKpi = {
	sessions: number | null;
	users: number | null;
	pageviews: number | null;
	purchases: number | null;
	/** Przychód w groszach (integer). */
	revenueMinor: number | null;
	conversionRate: number | null;
};

export type DailyPoint = {
	date: string;
	label: string;
	value: number;
};

export type FunnelStep = {
	event: string;
	label: string;
	count: number;
	rateFromTop: number;
};

export type ChannelRow = {
	channel: string;
	sessions: number;
	share: number;
};

export type TopPageRow = {
	path: string;
	views: number;
	share: number;
};

export type TopEventRow = {
	event: string;
	count: number;
};

/**
 * Wiersz podziału po segmencie (np. linii usług). `funnel` to liczności
 * kroków lejka w kolejności `funnelLabels` slice'a — PostHog liczy je po
 * właściwości zdarzenia, GA4 nie ma tu danych (rozdziela tylko ruch).
 */
export type SegmentRow = {
	key: string;
	label: string;
	sessions?: number;
	users?: number;
	pageviews: number;
	funnel?: number[];
};

export type Ga4AnalyticsSlice = AnalyticsSourceState & {
	kpi?: AnalyticsKpi;
	traffic?: DailyPoint[];
	channels?: ChannelRow[];
	topPages?: TopPageRow[];
	segments?: SegmentRow[];
	segmentsLabel?: string;
};

export type PosthogAnalyticsSlice = AnalyticsSourceState & {
	kpi?: AnalyticsKpi;
	traffic?: DailyPoint[];
	funnel?: FunnelStep[];
	topEvents?: TopEventRow[];
	segments?: SegmentRow[];
	segmentsLabel?: string;
	/** Etykiety kroków lejka — kolumny tabeli segmentów. */
	funnelLabels?: string[];
};

export type AnalyticsDashboardData = {
	fetchedAt: string;
	rangeDays: number;
	ga4: Ga4AnalyticsSlice;
	posthog: PosthogAnalyticsSlice;
};
