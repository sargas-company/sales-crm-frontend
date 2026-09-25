import TimePatterns from '../../../components/sales-analytics/market/TimePatterns'
import ScoreDistribution from '../../../components/sales-analytics/market/ScoreDistribution'
import DirectionsBreakdown from '../../../components/sales-analytics/market/DirectionsBreakdown'
import TechnologiesBreakdown from '../../../components/sales-analytics/market/TechnologiesBreakdown'
import TechnologyCombinations from '../../../components/sales-analytics/market/TechnologyCombinations'
import BudgetBreakdown from '../../../components/sales-analytics/market/BudgetBreakdown'
import ClientQualityBreakdown from '../../../components/sales-analytics/market/ClientQualityBreakdown'
import DemandInsights from '../../../components/sales-analytics/market/DemandInsights'
import BidPlaybooks from '../../../components/sales-analytics/market/BidPlaybooks'
import FeedbackMetrics from '../../../components/sales-analytics/market/FeedbackMetrics'
import { TabPanel } from '../salesAnalytics.styled'

const MarketIntelligenceTab = () => (
	<TabPanel>
		<TimePatterns />
		<ScoreDistribution />
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
				gap: 16,
			}}
		>
			<DirectionsBreakdown />
			<TechnologiesBreakdown />
		</div>
		<TechnologyCombinations />
		<BudgetBreakdown />
		<ClientQualityBreakdown />
		<DemandInsights />
		<BidPlaybooks />
		<FeedbackMetrics />
	</TabPanel>
)

export default MarketIntelligenceTab
