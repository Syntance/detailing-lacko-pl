import "server-only";

import { getMagazynAnalyticsConfig, type AnalyticsFunnelStep } from "../configure";
import { analyticsEnv } from "../env";
import type {
	AnalyticsKpi,
	DailyPoint,
	FunnelStep,
	PosthogAnalyticsSlice,
	SegmentRow,
	TopEventRow,
} from "../types";

const FETCH_TIMEOUT_MS = 30_000;

/** Lejek domyślny (sklep) — aplikacja usługowa podmienia go w konfiguracji. */
const ECOMMERCE_FUNNEL: AnalyticsFunnelStep[] = [
	{ event: "product_view", label: "Wyświetlenie produktu" },
	{ event: "add_to_cart", label: "Dodanie do koszyka" },
	{ event: "begin_checkout", label: "Rozpoczęcie checkoutu" },
	{ event: "purchase", label: "Zakup" },
];

type PosthogQueryResponse = {
	results?: unknown;
	columns?: string[];
};

async function posthogQuery(body: Record<string, unknown>): Promise<PosthogQueryResponse> {
	const apiKey = analyticsEnv.posthogPersonalApiKey;
	const projectId = analyticsEnv.posthogProjectId;
	if (!apiKey || !projectId) {
		throw new Error("Brak konfiguracji PostHog.");
	}

	const response = await fetch(`${analyticsEnv.posthogHost}/api/projects/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`PostHog API ${response.status}: ${text.slice(0, 240)}`);
	}

	return (await response.json()) as PosthogQueryResponse;
}

function toNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number(value) || 0;
	return 0;
}

function parseHogqlCount(response: PosthogQueryResponse): number {
	const results = response.results;
	if (!Array.isArray(results) || results.length === 0) return 0;
	const row = results[0];
	if (!Array.isArray(row)) return 0;
	return toNumber(row[0]);
}

function parseTrendsSeries(response: PosthogQueryResponse): DailyPoint[] {
	const results = response.results;
	if (!Array.isArray(results) || results.length === 0) return [];
	const result = results[0];
	if (!result || typeof result !== "object") return [];

	const data = (result as { data?: number[]; labels?: string[] }).data;
	const labels = (result as { data?: number[]; labels?: string[] }).labels;
	if (!Array.isArray(data) || !Array.isArray(labels)) return [];

	return labels.map((label, index) => ({
		date: label,
		label: new Date(label).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }),
		value: data[index] ?? 0,
	}));
}

function buildKpi(metrics: {
	sessions: number;
	users: number;
	pageviews: number;
	purchases: number;
	revenueMinor: number;
}): AnalyticsKpi {
	const conversionRate =
		metrics.sessions > 0
			? Math.round((metrics.purchases / metrics.sessions) * 10000) / 100
			: null;
	return {
		sessions: metrics.sessions,
		users: metrics.users,
		pageviews: metrics.pageviews,
		purchases: metrics.purchases,
		revenueMinor: metrics.revenueMinor,
		conversionRate,
	};
}

/** Nazwa zdarzenia jako literał HogQL (nazwy pochodzą z kodu, nie od użytkownika). */
function hogqlLiteral(value: string): string {
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function stepCondition(step: AnalyticsFunnelStep): string {
	if (step.match) return `(${step.match})`;
	const base = `event = ${hogqlLiteral(step.event)}`;
	return step.where ? `${base} AND (${step.where})` : base;
}

export async function fetchPosthogAnalytics(rangeDays: number): Promise<PosthogAnalyticsSlice> {
	if (!analyticsEnv.posthogConfigured) {
		return {
			status: "disconnected",
			reason: "Uzupełnij POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID i opcjonalnie POSTHOG_HOST.",
		};
	}

	const config = getMagazynAnalyticsConfig();
	const funnelSteps = config.funnel?.length ? config.funnel : ECOMMERCE_FUNNEL;
	const segmentsConfig = config.segments;

	try {
		const dateFrom = `-${rangeDays}d`;
		const since = `timestamp >= now() - INTERVAL ${rangeDays} DAY`;

		const [
			trafficResponse,
			usersResponse,
			pageviewsResponse,
			purchasesResponse,
			revenueResponse,
			topEventsResponse,
			segmentsResponse,
		] = await Promise.all([
			posthogQuery({
				query: {
					kind: "TrendsQuery",
					dateRange: { date_from: dateFrom },
					interval: "day",
					series: [
						{
							kind: "EventsNode",
							event: "$pageview",
							name: "$pageview",
							math: "total",
						},
					],
					filterTestAccounts: true,
				},
			}),
			posthogQuery({
				query: {
					kind: "HogQLQuery",
					query: `SELECT uniq(person_id) AS users FROM events WHERE ${since}`,
				},
			}),
			posthogQuery({
				query: {
					kind: "HogQLQuery",
					query: `SELECT count() AS pageviews FROM events WHERE event = '$pageview' AND ${since}`,
				},
			}),
			posthogQuery({
				query: {
					kind: "HogQLQuery",
					query: `SELECT count() AS purchases FROM events WHERE event = 'purchase' AND ${since}`,
				},
			}),
			posthogQuery({
				query: {
					kind: "HogQLQuery",
					query: `SELECT sum(toFloat(properties.$value)) AS revenue FROM events WHERE event = 'purchase' AND ${since}`,
				},
			}),
			posthogQuery({
				query: {
					kind: "HogQLQuery",
					query: `SELECT event, count() AS c FROM events WHERE ${since} GROUP BY event ORDER BY c DESC LIMIT 8`,
				},
			}),
			// Podział po właściwości segmentu (np. service_line): odsłony,
			// użytkownicy i każdy krok lejka w JEDNYM zapytaniu grupowanym.
			segmentsConfig
				? posthogQuery({
						query: {
							kind: "HogQLQuery",
							query: [
								`SELECT ifNull(toString(properties.${segmentsConfig.property}), '') AS seg,`,
								`countIf(event = '$pageview') AS pageviews,`,
								`uniqIf(person_id, event = '$pageview') AS users,`,
								funnelSteps
									.map((step, index) => `countIf(${stepCondition(step)}) AS f${index}`)
									.join(", "),
								`FROM events WHERE ${since} GROUP BY seg`,
							].join(" "),
						},
					})
				: Promise.resolve(null),
		]);

		const funnelCounts = await Promise.all(
			funnelSteps.map(async (step) => {
				const response = await posthogQuery({
					query: {
						kind: "HogQLQuery",
						query: `SELECT count() AS c FROM events WHERE ${stepCondition(step)} AND ${since}`,
					},
				});
				return parseHogqlCount(response);
			}),
		);

		const traffic = parseTrendsSeries(trafficResponse);
		const users = parseHogqlCount(usersResponse);
		const pageviews = parseHogqlCount(pageviewsResponse);
		const purchases = parseHogqlCount(purchasesResponse);
		const revenueRaw = parseHogqlCount(revenueResponse);
		const sessions = traffic.reduce((sum, point) => sum + point.value, 0);

		const topEventRows = topEventsResponse.results ?? [];
		const topEvents: TopEventRow[] = Array.isArray(topEventRows)
			? topEventRows
					.filter((row): row is [string, number] => Array.isArray(row) && row.length >= 2)
					.map(([event, count]) => ({
						event,
						count: typeof count === "number" ? count : Number(count) || 0,
					}))
			: [];

		const topFunnel = funnelCounts[0] ?? 0;
		const funnel: FunnelStep[] = funnelSteps.map(({ event, label }, index) => {
			const count = funnelCounts[index] ?? 0;
			return {
				event,
				label,
				count,
				rateFromTop: topFunnel > 0 ? Math.round((count / topFunnel) * 1000) / 10 : 0,
			};
		});

		let segments: SegmentRow[] | undefined;
		if (segmentsConfig && segmentsResponse) {
			const rows = Array.isArray(segmentsResponse.results) ? segmentsResponse.results : [];
			const byKey = new Map<string, SegmentRow>();
			for (const raw of rows) {
				if (!Array.isArray(raw)) continue;
				const [seg, pv, uq, ...steps] = raw as unknown[];
				byKey.set(String(seg ?? ""), {
					key: String(seg ?? ""),
					label: String(seg ?? ""),
					pageviews: toNumber(pv),
					users: toNumber(uq),
					funnel: steps.slice(0, funnelSteps.length).map(toNumber),
				});
			}
			const known = new Set(segmentsConfig.values.map((v) => v.key));
			segments = [
				...segmentsConfig.values.map((segment) => {
					const hit = byKey.get(segment.key);
					return {
						key: segment.key,
						label: segment.label,
						pageviews: hit?.pageviews ?? 0,
						users: hit?.users ?? 0,
						funnel: hit?.funnel ?? funnelSteps.map(() => 0),
					};
				}),
				// Zdarzenia bez właściwości (sprzed wdrożenia podziału) albo z nieznaną
				// wartością — osobny wiersz, żeby suma dalej zgadzała się z KPI.
				...[...byKey.values()]
					.filter((row) => !known.has(row.key) && row.pageviews + (row.users ?? 0) > 0)
					.map((row) => ({
						...row,
						label: row.key ? `inne (${row.key})` : "bez podziału (starsze zdarzenia)",
					})),
			];
		}

		return {
			status: "connected",
			label: `PostHog · projekt ${analyticsEnv.posthogProjectId}`,
			kpi: buildKpi({
				sessions,
				users,
				pageviews,
				purchases,
				revenueMinor: Math.round(revenueRaw * 100),
			}),
			traffic,
			funnel,
			topEvents,
			...(segments
				? {
						segments,
						segmentsLabel: segmentsConfig?.label,
						funnelLabels: funnelSteps.map((step) => step.label),
					}
				: {}),
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Nieznany błąd PostHog";
		return { status: "error", reason: message };
	}
}
