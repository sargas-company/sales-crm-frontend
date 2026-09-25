import { useState } from 'react'
import ScannerHealthBlock from '../../../components/sales-analytics/overview/ScannerHealthBlock'
import KpiSummary from '../../../components/sales-analytics/overview/KpiSummary'
import OpportunityHeatmap from '../../../components/sales-analytics/overview/OpportunityHeatmap'
import RecentHighScorePosts from '../../../components/sales-analytics/overview/RecentHighScorePosts'
import AllPostsList from '../../../components/sales-analytics/overview/AllPostsList'
import { TabPanel } from '../salesAnalytics.styled'

const OverviewTab = () => {
	const [showAll, setShowAll] = useState(false)

	return (
		<TabPanel>
			<ScannerHealthBlock />
			<KpiSummary />
			<OpportunityHeatmap />
			<RecentHighScorePosts onViewAll={() => setShowAll(true)} />
			{showAll && <AllPostsList onClose={() => setShowAll(false)} />}
		</TabPanel>
	)
}

export default OverviewTab
