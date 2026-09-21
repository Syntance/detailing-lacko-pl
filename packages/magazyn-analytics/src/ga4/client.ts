import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getMagazynAnalyticsConfig } from "../configure";
import { analyticsEnv } from "../env";
import type {
	AnalyticsKpi,
	ChannelRow,
	DailyPoint,
	Ga4AnalyticsSlice,
	SegmentRow,
	TopPageRow,
} from "../types";

const FETCH_TIMEOUT_MS = 30_000;

function dateRange(days: number): { startDate: string; endDate: string } {
	return {
		startDate: `${days}daysAgo`,
		endDate: "today",
	};
}

function formatGa4Date(raw: string): { date: string; label: string } {
	// GA4 zwraca YYYYMMDD
	if (raw.length !== 8) return { date: raw, label: raw };
	const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
	const label = new Date(`${iso}T12:00:00`).toLocaleDateString("pl-PL", {
		day: "numeric",
		month: "short",
	});
	return { date: iso, label };
}

function toPercent(part: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((part / total) * 1000) / 10;
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

/** Ścieżka GA4 bez query i bez końcowego ukośnika (poza samym „/"). */
function normalizePath(path: string): string {
	const bare = path.split("?")[0] ?? "/";
	return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}

export async function fetchGa4Analytics(rangeDays: number): Promise<Ga4AnalyticsSlice> {
	if (!analyticsEnv.ga4Configured) {
		return {
			status: "disconnected",
			reason: "Uzupełnij GA4_PROPERTY_ID i GA4_SERVICE_ACCOUNT_JSON w .env.",
		};
	}

	const propertyId = analyticsEnv.ga4PropertyId;
	const credentials = analyticsEnv.ga4Credentials;
	if (!propertyId || !credentials) {
		return { status: "disconnected", reason: "Brak konfiguracji GA4." };
	}

	const segmentsConfig = getMagazynAnalyticsConfig().segments;

	try {
		const client = new BetaAnalyticsDataClient({ credentials });
		const property = `properties/${propertyId}`;
		const range = dateRange(rangeDays);

		const [
			baseOverviewReport,
			purchaseReport,
			trafficReport,
			channelsReport,
			pagesReport,
			segmentPagesReport,
		] = await Promise.all([
			client.runReport(
				{
					property,
					dateRanges: [range],
					metrics: [
						{ name: "sessions" },
						{ name: "activeUsers" },
						{ name: "screenPageViews" },
						{ name: "purchaseRevenue" },
					],
				},
				{ timeout: FETCH_TIMEOUT_MS },
			),
			client.runReport(
				{
					property,
					dateRanges: [range],
					metrics: [{ name: "eventCount" }],
					dimensionFilter: {
						filter: {
							fieldName: "eventName",
							stringFilter: { matchType: "EXACT", value: "purchase" },
						},
					},
				},
				{ timeout: FETCH_TIMEOUT_MS },
			),
			client.runReport(
				{
					property,
					dateRanges: [range],
					dimensions: [{ name: "date" }],
					metrics: [{ name: "sessions" }],
					orderBys: [{ dimension: { dimensionName: "date" } }],
				},
				{ timeout: FETCH_TIMEOUT_MS },
			),
			client.runReport(
				{
					property,
					dateRanges: [range],
					dimensions: [{ name: "sessionDefaultChannelGroup" }],
					metrics: [{ name: "sessions" }],
					orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
					limit: 8,
				},
				{ timeout: FETCH_TIMEOUT_MS },
			),
			client.runReport(
				{
					property,
					dateRanges: [range],
					dimensions: [{ name: "pagePath" }],
					metrics: [{ name: "screenPageViews" }],
					orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
					limit: 10,
				},
				{ timeout: FETCH_TIMEOUT_MS },
			),
			// Podział po segmentach = po ścieżkach stron (GA4 nie zna właściwości
			// niestandardowych bez rejestracji wymiaru). Jedno zapytanie, agregacja
			// po naszej stronie.
			segmentsConfig
				? client.runReport(
						{
							property,
							dateRanges: [range],
							dimensions: [{ name: "pagePath" }],
							metrics: [
								{ name: "sessions" },
								{ name: "activeUsers" },
								{ name: "screenPageViews" },
							],
							limit: 200,
						},
						{ timeout: FETCH_TIMEOUT_MS },
					)
				: Promise.resolve(null),
		]);

		const baseRow = baseOverviewReport[0]?.rows?.[0];
		const purchaseRow = purchaseReport[0]?.rows?.[0];

		const sessions = Number(baseRow?.metricValues?.[0]?.value ?? 0);
		const users = Number(baseRow?.metricValues?.[1]?.value ?? 0);
		const pageviews = Number(baseRow?.metricValues?.[2]?.value ?? 0);
		const revenuePln = Number(baseRow?.metricValues?.[3]?.value ?? 0);
		const purchases = Number(purchaseRow?.metricValues?.[0]?.value ?? 0);

		const traffic: DailyPoint[] =
			trafficReport[0]?.rows?.map((row) => {
				const rawDate = row.dimensionValues?.[0]?.value ?? "";
				const { date, label } = formatGa4Date(rawDate);
				return {
					date,
					label,
					value: Number(row.metricValues?.[0]?.value ?? 0),
				};
			}) ?? [];

		const channelTotal =
			channelsReport[0]?.rows?.reduce(
				(sum, row) => sum + Number(row.metricValues?.[0]?.value ?? 0),
				0,
			) ?? 0;

		const channels: ChannelRow[] =
			channelsReport[0]?.rows?.map((row) => {
				const sessionsCount = Number(row.metricValues?.[0]?.value ?? 0);
				return {
					channel: row.dimensionValues?.[0]?.value ?? "—",
					sessions: sessionsCount,
					share: toPercent(sessionsCount, channelTotal),
				};
			}) ?? [];

		const pageTotal =
			pagesReport[0]?.rows?.reduce(
				(sum, row) => sum + Number(row.metricValues?.[0]?.value ?? 0),
				0,
			) ?? 0;

		const topPages: TopPageRow[] =
			pagesReport[0]?.rows?.map((row) => {
				const views = Number(row.metricValues?.[0]?.value ?? 0);
				return {
					path: row.dimensionValues?.[0]?.value ?? "/",
					views,
					share: toPercent(views, pageTotal),
				};
			}) ?? [];

		let segments: SegmentRow[] | undefined;
		if (segmentsConfig && segmentPagesReport) {
			const byPath = new Map<string, { sessions: number; users: number; pageviews: number }>();
			for (const row of segmentPagesReport[0]?.rows ?? []) {
				const path = normalizePath(row.dimensionValues?.[0]?.value ?? "/");
				const prev = byPath.get(path) ?? { sessions: 0, users: 0, pageviews: 0 };
				byPath.set(path, {
					sessions: prev.sessions + Number(row.metricValues?.[0]?.value ?? 0),
					users: prev.users + Number(row.metricValues?.[1]?.value ?? 0),
					pageviews: prev.pageviews + Number(row.metricValues?.[2]?.value ?? 0),
				});
			}
			segments = segmentsConfig.values.map((segment) => {
				const sum = { sessions: 0, users: 0, pageviews: 0 };
				for (const path of segment.pagePaths) {
					const hit = byPath.get(normalizePath(path));
					if (!hit) continue;
					sum.sessions += hit.sessions;
					sum.users += hit.users;
					sum.pageviews += hit.pageviews;
				}
				return { key: segment.key, label: segment.label, ...sum };
			});
		}

		return {
			status: "connected",
			label: `GA4 · ${propertyId}`,
			kpi: buildKpi({
				sessions,
				users,
				pageviews,
				purchases,
				revenueMinor: Math.round(revenuePln * 100),
			}),
			traffic,
			channels,
			topPages,
			...(segments ? { segments, segmentsLabel: segmentsConfig?.label } : {}),
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Nieznany błąd GA4";
		return { status: "error", reason: message };
	}
}
