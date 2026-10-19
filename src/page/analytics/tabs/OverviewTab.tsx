import ScannerHealthBlock from '../../../components/sales-analytics/overview/ScannerHealthBlock'
import AiPipelinePanel from '../../../components/sales-analytics/overview/AiPipelinePanel'
import AiSpendBlock from '../../../components/sales-analytics/overview/AiSpendBlock'
import KpiSummary from '../../../components/sales-analytics/overview/KpiSummary'
import OpportunityHeatmap from '../../../components/sales-analytics/overview/OpportunityHeatmap'
import { TabPanel } from '../salesAnalytics.styled'
import { useAnalyticsStream } from '../../../hooks/useAnalyticsStream'
import { useSalesFilters } from '../filters/useSalesFilters'

const OverviewTab = () => {
	const { filters } = useSalesFilters()
	// One SSE connection powers the whole Overview tab: scanner card,
	// AI pipeline panel, at-a-glance KPIs and the AI-spend block. The
	// first two are filter-independent (operational "right now"); the
	// last two are scoped to `filters` and reconnect on filter change
	// so the server resends the window the user is viewing.
	useAnalyticsStream({ enabled: true, filters })

	return (
		<TabPanel>
			<ScannerHealthBlock middleSlot={<AiPipelinePanel />} />
			<KpiSummary />
			<AiSpendBlock />
			<OpportunityHeatmap />
		</TabPanel>
	)
}

export default OverviewTab
