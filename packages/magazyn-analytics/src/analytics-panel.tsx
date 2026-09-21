"use client";

import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CheckCircle2, CircleOff } from "lucide-react";
import { Badge, Card, Section, StatTile, formatKwota } from "@moduly/ui";
import type {
	AnalyticsDashboardData,
	AnalyticsKpi,
	AnalyticsSourceState,
	SegmentRow,
} from "./types";

const CHART_STROKE = "#AF7C61";

const chartTooltipStyle = {
	background: "var(--card)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	fontSize: 13,
	color: "var(--foreground)",
} as const;

type SourceTab = "combined" | "ga4" | "posthog";

/**
 * Wcześniej ten badge był zawsze zielony z haczykiem, niezależnie od statusu —
 * niewinne, dopóki dane były zawsze demo (zawsze "connected"). Teraz panel
 * dostaje prawdziwy status z fetchAnalyticsDashboard(), więc kolor musi
 * odzwierciedlać rzeczywistość: rozłączone/błąd źle wygląda jako "połączono".
 */
function SourceStatusBadge({ source, label }: { source: AnalyticsSourceState; label: string }) {
	if (source.status === "connected") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
				<CheckCircle2 className="size-3.5" aria-hidden />
				{source.label}
			</span>
		);
	}
	const tone =
		source.status === "error"
			? "bg-destructive/10 text-destructive"
			: "bg-muted text-muted-foreground";
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
			<CircleOff className="size-3.5" aria-hidden />
			{label}
		</span>
	);
}

function pickKpi(data: AnalyticsDashboardData, tab: SourceTab): AnalyticsKpi | null {
	if (tab === "ga4") return data.ga4.kpi ?? null;
	if (tab === "posthog") return data.posthog.kpi ?? null;
	return data.ga4.kpi ?? data.posthog.kpi ?? null;
}

function KpiGrid({ kpi, periodLabel }: { kpi: AnalyticsKpi; periodLabel: string }) {
	return (
		<Section title={`Kluczowe wskaźniki (${periodLabel})`}>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatTile label="Sesje" value={(kpi.sessions ?? 0).toLocaleString("pl-PL")} />
				<StatTile label="Użytkownicy" value={(kpi.users ?? 0).toLocaleString("pl-PL")} />
				<StatTile label="Odsłony" value={(kpi.pageviews ?? 0).toLocaleString("pl-PL")} />
				<StatTile
					label="Konwersja"
					value={kpi.conversionRate != null ? `${kpi.conversionRate}%` : "—"}
					sub={
						kpi.purchases != null
							? `${kpi.purchases.toLocaleString("pl-PL")} zakupów`
							: undefined
					}
				/>
			</div>
			{kpi.revenueMinor != null && kpi.revenueMinor > 0 ? (
				<div className="mt-4">
					<StatTile label="Przychód (zdarzenia purchase)" value={formatKwota(kpi.revenueMinor)} />
				</div>
			) : null}
		</Section>
	);
}

function TrafficChart({
	title,
	points,
}: {
	title: string;
	points: Array<{ label: string; value: number }>;
}) {
	if (points.length === 0) return null;
	return (
		<Card>
			<h2 className="font-serif text-lg text-foreground">{title}</h2>
			<div className="mt-4">
				<ResponsiveContainer width="100%" height={220}>
					<AreaChart data={points} margin={{ left: -20 }}>
						<defs>
							<linearGradient id="analytics-traffic-grad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={CHART_STROKE} stopOpacity={0.3} />
								<stop offset="95%" stopColor={CHART_STROKE} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
						<XAxis
							dataKey="label"
							tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip contentStyle={chartTooltipStyle} />
						<Area
							type="monotone"
							dataKey="value"
							stroke={CHART_STROKE}
							strokeWidth={2}
							fill="url(#analytics-traffic-grad)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}

function pct(part: number, total: number): string {
	if (total <= 0) return "—";
	return `${Math.round((part / total) * 1000) / 10}%`;
}

/**
 * Podział po segmentach (np. linie usług): tabela z ruchem i — gdy źródło
 * je zna — krokami lejka per segment plus konwersją (ostatni krok / odsłony).
 * Paski udziału pod nazwą pokazują proporcję odsłon między segmentami.
 */
function SegmentsCard({
	title,
	source,
	rows,
	funnelLabels,
}: {
	title: string;
	source: string;
	rows: SegmentRow[];
	funnelLabels?: string[];
}) {
	const totalViews = rows.reduce((sum, row) => sum + row.pageviews, 0);
	const withFunnel = Boolean(funnelLabels?.length) && rows.some((row) => row.funnel?.length);
	const lastStep = funnelLabels ? funnelLabels.length - 1 : -1;

	return (
		<Card>
			<div className="mb-4 flex items-center justify-between gap-2">
				<h2 className="font-serif text-lg text-foreground">{title}</h2>
				<Badge tone="neutral">{source}</Badge>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[520px] text-sm">
					<thead>
						<tr className="text-left text-xs text-muted-foreground">
							<th className="pb-2 font-medium">Segment</th>
							<th className="pb-2 text-right font-medium">Odsłony</th>
							<th className="pb-2 text-right font-medium">Użytkownicy</th>
							{rows.some((row) => row.sessions != null) ? (
								<th className="pb-2 text-right font-medium">Sesje</th>
							) : null}
							{withFunnel
								? funnelLabels?.slice(1).map((label) => (
										<th key={label} className="pb-2 text-right font-medium">
											{label}
										</th>
									))
								: null}
							{withFunnel && lastStep > 0 ? (
								<th className="pb-2 text-right font-medium">Konwersja</th>
							) : null}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.key} className="border-t border-border">
								<td className="py-2 pr-3">
									<div className="font-medium text-foreground">{row.label}</div>
									<div className="mt-1 h-1.5 w-32 rounded-full bg-muted">
										<div
											className="h-1.5 rounded-full bg-primary"
											style={{
												width: totalViews > 0 ? `${Math.min(100, (row.pageviews / totalViews) * 100)}%` : "0%",
											}}
										/>
									</div>
								</td>
								<td className="py-2 text-right tabular-nums text-foreground">
									{row.pageviews.toLocaleString("pl-PL")}
									<span className="ml-1 text-xs text-muted-foreground">{pct(row.pageviews, totalViews)}</span>
								</td>
								<td className="py-2 text-right tabular-nums text-foreground">
									{(row.users ?? 0).toLocaleString("pl-PL")}
								</td>
								{rows.some((r) => r.sessions != null) ? (
									<td className="py-2 text-right tabular-nums text-foreground">
										{(row.sessions ?? 0).toLocaleString("pl-PL")}
									</td>
								) : null}
								{withFunnel
									? funnelLabels?.slice(1).map((label, index) => (
											<td key={label} className="py-2 text-right tabular-nums text-foreground">
												{(row.funnel?.[index + 1] ?? 0).toLocaleString("pl-PL")}
											</td>
										))
									: null}
								{withFunnel && lastStep > 0 ? (
									<td className="py-2 text-right font-medium tabular-nums text-foreground">
										{pct(row.funnel?.[lastStep] ?? 0, row.funnel?.[0] ?? row.pageviews)}
									</td>
								) : null}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

export type AnalyticsPanelProps = {
	data: AnalyticsDashboardData;
	/** Podgląd demo — bez live API. */
	demo?: boolean;
};

export function AnalyticsPanel({ data, demo = false }: AnalyticsPanelProps) {
	const [tab, setTab] = useState<SourceTab>("combined");
	const periodLabel = `ostatnie ${data.rangeDays} dni`;
	const kpi = pickKpi(data, tab);

	const sourceTabs: Array<{ id: SourceTab; label: string }> = [
		{ id: "combined", label: "Łącznie" },
		{ id: "ga4", label: "GA4" },
		{ id: "posthog", label: "PostHog" },
	];

	const trafficPoints = useMemo(() => {
		if (tab === "ga4") return data.ga4.traffic ?? [];
		if (tab === "posthog") return data.posthog.traffic ?? [];
		return data.ga4.traffic ?? data.posthog.traffic ?? [];
	}, [tab, data.ga4.traffic, data.posthog.traffic]);

	const disconnectedReasons = [data.ga4, data.posthog]
		.filter((source) => source.status !== "connected")
		.map((source) => source.reason)
		.filter((reason): reason is string => Boolean(reason));

	const funnel = data.posthog.funnel ?? [];
	const funnelBadge =
		funnel.length >= 2 ? `${funnel[0]?.event} → ${funnel[funnel.length - 1]?.event}` : null;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2">
					<SourceStatusBadge source={data.ga4} label="GA4" />
					<SourceStatusBadge source={data.posthog} label="PostHog" />
					{demo ? <Badge tone="brand">Podgląd demo</Badge> : null}
				</div>
				{demo ? (
					<p className="text-xs text-muted-foreground">Źródła: Google Analytics 4 · PostHog</p>
				) : (
					<p className="text-xs text-muted-foreground">
						Odświeżono:{" "}
						{new Date(data.fetchedAt).toLocaleString("pl-PL", {
							dateStyle: "short",
							timeStyle: "short",
						})}
						{" · "}
						cache 15 min
					</p>
				)}
			</div>

			<div
				className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
				role="tablist"
				aria-label="Źródło analityki"
			>
				{sourceTabs.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						onClick={() => { setTab(id); }}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
							tab === id
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{label}
					</button>
				))}
			</div>

			{kpi ? (
				<KpiGrid kpi={kpi} periodLabel={periodLabel} />
			) : disconnectedReasons.length > 0 ? (
				<Card>
					<p className="text-sm text-muted-foreground">
						Brak danych: {disconnectedReasons.join(" ")}
					</p>
				</Card>
			) : null}

			{/* Podział po segmentach (linie usług) — PostHog ma też lejek per
			    segment, GA4 tylko ruch po stronach. W widoku „Łącznie" pierwszeństwo
			    ma PostHog (pełniejszy), a GA4 pokazujemy, gdy PostHoga brak. */}
			{(tab === "combined" || tab === "posthog") && data.posthog.segments?.length ? (
				<SegmentsCard
					title={data.posthog.segmentsLabel ?? "Segmenty"}
					source="PostHog"
					rows={data.posthog.segments}
					funnelLabels={data.posthog.funnelLabels}
				/>
			) : null}
			{(tab === "ga4" || (tab === "combined" && !data.posthog.segments?.length)) &&
			data.ga4.segments?.length ? (
				<SegmentsCard
					title={data.ga4.segmentsLabel ?? "Segmenty"}
					source="GA4 · wg ścieżki strony"
					rows={data.ga4.segments}
				/>
			) : null}

			<TrafficChart
				title={tab === "posthog" ? "Odsłony (PostHog $pageview)" : "Sesje / ruch"}
				points={trafficPoints.map((p) => ({ label: p.label, value: p.value }))}
			/>

			{(tab === "combined" || tab === "ga4") && data.ga4.channels?.length ? (
				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<h2 className="font-serif text-lg text-foreground">Kanały ruchu (GA4)</h2>
						<div className="mt-4">
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={data.ga4.channels} layout="vertical" margin={{ left: 0, right: 16 }}>
									<XAxis type="number" hide />
									<YAxis
										type="category"
										dataKey="channel"
										width={110}
										tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
									/>
									<Tooltip contentStyle={chartTooltipStyle} />
									<Bar dataKey="sessions" fill={CHART_STROKE} radius={[0, 6, 6, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</Card>

					<Card>
						<h2 className="font-serif text-lg text-foreground">Top strony (GA4)</h2>
						<ol className="mt-4 space-y-2">
							{data.ga4.topPages?.map((page) => (
								<li key={page.path} className="flex items-center justify-between gap-3 text-sm">
									<span className="truncate text-foreground">{page.path}</span>
									<span className="shrink-0 tabular-nums text-muted-foreground">
										{page.views.toLocaleString("pl-PL")} · {page.share}%
									</span>
								</li>
							))}
						</ol>
					</Card>
				</div>
			) : null}

			{(tab === "combined" || tab === "posthog") && funnel.length ? (
				<Card>
					<div className="mb-4 flex items-center justify-between gap-2">
						<h2 className="font-serif text-lg text-foreground">Lejek konwersji (PostHog)</h2>
						{funnelBadge ? <Badge tone="brand">{funnelBadge}</Badge> : null}
					</div>
					<div className="space-y-3">
						{funnel.map((step) => (
							<div key={step.event + step.label}>
								<div className="mb-1 flex justify-between text-sm">
									<span className="text-foreground">{step.label}</span>
									<span className="font-medium tabular-nums text-foreground">
										{step.count.toLocaleString("pl-PL")} · {step.rateFromTop}%
									</span>
								</div>
								<div className="h-2 rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-primary"
										style={{ width: `${Math.min(step.rateFromTop, 100)}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</Card>
			) : null}

			{(tab === "combined" || tab === "posthog") && data.posthog.topEvents?.length ? (
				<Card>
					<h2 className="font-serif text-lg text-foreground">Top zdarzenia (PostHog)</h2>
					<ul className="mt-4 space-y-2">
						{data.posthog.topEvents.map((row) => (
							<li key={row.event} className="flex justify-between text-sm">
								<span className="font-mono text-foreground">{row.event}</span>
								<span className="tabular-nums text-muted-foreground">
									{row.count.toLocaleString("pl-PL")}
								</span>
							</li>
						))}
					</ul>
				</Card>
			) : null}
		</div>
	);
}
