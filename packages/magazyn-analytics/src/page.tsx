import { PageHeader } from "@moduly/ui";
import { requireAnalyticsAdmin } from "./configure";
import { fetchAnalyticsDashboard } from "./fetch-analytics";
import { StatisticsTabs } from "./statistics-tabs";

export const dynamic = "force-dynamic";

export default async function AnalyticsStatisticsPage() {
	await requireAnalyticsAdmin();
	const analytics = await fetchAnalyticsDashboard();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Statystyki"
				description="Sprzedaż sklepu oraz ruch i konwersja z Google Analytics 4 i PostHog."
			/>
			<StatisticsTabs analytics={analytics} />
		</div>
	);
}
