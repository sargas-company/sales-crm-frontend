import type { ScannerHealth, ScannerHealthFilters } from './types/scanner'
import type { SalesFilters } from './types/filters'
import type {
	ActionableInsights,
	BidPlaybook,
	BudgetBreakdownData,
	ClientQualityData,
	CoverageWindows,
	DemandInsightsData,
	DirectionRow,
	EmergingOverview,
	EmergingSignalDetail,
	EmergingSignalRow,
	FiltersOptions,
	HeatmapData,
	HeatmapMetric,
	RecentHighScorePostsData,
	SalesOverviewSummary,
	ScoreDistributionData,
	TechnologyCombinationRow,
	TechnologyRow,
	TimePatternsData,
} from './types/aggregates'
import type { MockJobPost } from './types/jobPost'
import type { CanonicalTaxonomy } from './types/taxonomy'
import type {
	CandidateActionPayload,
	EmergingAlertConfig,
	TaxonomyCandidate,
} from './types/candidates'
import type { FeedbackMetrics, RelevanceFeedbackPayload } from './types/feedback'

export type DataSource = 'mock' | 'api'

export interface JobPostAnalyticsPage {
	items: MockJobPost[]
	total: number
	page: number
	limit: number
}

export interface JobPostsQuery {
	filters: SalesFilters
	page: number
	limit: number
}

export interface SalesAnalyticsRepository {
	readonly dataSource: DataSource

	getScannerHealth(filters: ScannerHealthFilters): Promise<ScannerHealth>

	getFiltersOptions(): Promise<FiltersOptions>

	getSalesOverview(filters: SalesFilters): Promise<SalesOverviewSummary>
	getOpportunityHeatmap(filters: SalesFilters, metric: HeatmapMetric): Promise<HeatmapData>
	getCoverageWindows(filters: SalesFilters): Promise<CoverageWindows>
	getActionableInsights(filters: SalesFilters): Promise<ActionableInsights>
	getRecentHighScorePosts(filters: SalesFilters, limit: number): Promise<RecentHighScorePostsData>

	getTimePatterns(filters: SalesFilters): Promise<TimePatternsData>
	getScoreDistribution(filters: SalesFilters): Promise<ScoreDistributionData>
	getDirectionsBreakdown(filters: SalesFilters): Promise<DirectionRow[]>
	getTechnologiesBreakdown(filters: SalesFilters): Promise<TechnologyRow[]>
	getTechnologyCombinations(filters: SalesFilters): Promise<TechnologyCombinationRow[]>

	getBudgetBreakdown(filters: SalesFilters): Promise<BudgetBreakdownData>
	getClientQualityBreakdown(filters: SalesFilters): Promise<ClientQualityData>
	getDemandInsights(filters: SalesFilters): Promise<DemandInsightsData>
	getBidPlaybooks(filters: SalesFilters): Promise<BidPlaybook[]>

	getJobPostsPage(query: JobPostsQuery): Promise<JobPostAnalyticsPage>
	getJobPostById(id: string): Promise<MockJobPost | null>

	getCanonicalTaxonomy(): Promise<CanonicalTaxonomy>
	getEmergingOverview(filters: SalesFilters): Promise<EmergingOverview>
	getEmergingList(filters: SalesFilters): Promise<EmergingSignalRow[]>
	getEmergingDetail(id: string): Promise<EmergingSignalDetail | null>
	getEmergingAlertConfig(): Promise<EmergingAlertConfig>

	setRelevanceFeedback(payload: RelevanceFeedbackPayload): Promise<void>
	getFeedbackMetrics(filters: SalesFilters): Promise<FeedbackMetrics>
	runCandidateAction(payload: CandidateActionPayload): Promise<TaxonomyCandidate | null>
	setEmergingAlertConfig(patch: Partial<EmergingAlertConfig>): Promise<EmergingAlertConfig>
	resetMockState(): Promise<void>
}
