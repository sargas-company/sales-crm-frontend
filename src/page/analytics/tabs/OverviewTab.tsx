import { useState } from 'react'
import ScannerHealthBlock from '../../../components/sales-analytics/overview/ScannerHealthBlock'
import AiPipelinePanel from '../../../components/sales-analytics/overview/AiPipelinePanel'
import KpiSummary from '../../../components/sales-analytics/overview/KpiSummary'
import OpportunityHeatmap from '../../../components/sales-analytics/overview/OpportunityHeatmap'
import RecentHighScorePosts from '../../../components/sales-analytics/overview/RecentHighScorePosts'
import AllPostsList from '../../../components/sales-analytics/overview/AllPostsList'
import { TabPanel } from '../salesAnalytics.styled'
import { useAnalyticsStream } from '../../../hooks/useAnalyticsStream'

const OverviewTab = () => {
	const [showAll, setShowAll] = useState(false)

	// One SSE connection powers both the scanner header card and the
	// AI pipeline panel. Mounting the hook here keeps the stream
	// alive while this tab is visible and tears it down on tab
	// switch / page leave, so idle clients don't hold connections.
	useAnalyticsStream({ enabled: true })

	return (
		<TabPanel>
			<ScannerHealthBlock middleSlot={<AiPipelinePanel />} />
			<KpiSummary />
			<OpportunityHeatmap />
			<RecentHighScorePosts onViewAll={() => setShowAll(true)} />
			{showAll && <AllPostsList onClose={() => setShowAll(false)} />}
		</TabPanel>
	)
}

export default OverviewTab
