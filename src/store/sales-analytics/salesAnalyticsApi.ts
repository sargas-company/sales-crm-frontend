import { baseApi } from '../../api/baseApi'
import { mockAdapter } from './mock/adapter'
import type {
	DataSource,
	JobPostAnalyticsPage,
	JobPostsQuery,
	SalesAnalyticsRepository,
} from './repository'
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
import type {
	CandidateActionPayload,
	EmergingAlertConfig,
	TaxonomyCandidate,
} from './types/candidates'
import type { FeedbackMetrics, RelevanceFeedbackPayload } from './types/feedback'
import type { CanonicalTaxonomy } from './types/taxonomy'
import type { MockJobPost } from './types/jobPost'

// The Overview tab, its transitively-mounted controls (SalesFiltersBar
// options, JobPostAnalyticsDrawer detail fetch) and the shared drawer
// go through the real backend at /analytics/**.  The remaining
// endpoints stay on `mockAdapter` because they belong to the deferred
// Market Intelligence / Emerging Signals tabs OR to client-side-only
// state (manual relevance feedback has no backend model yet).
const repo: SalesAnalyticsRepository = mockAdapter

const asBaseQueryError = (e: unknown) => ({
	error: {
		status: 'CUSTOM_ERROR' as const,
		error: e instanceof Error ? e.message : String(e),
	},
})

const q =
	<Args, Result>(fn: (args: Args) => Promise<Result>) =>
	async (args: Args) => {
		try {
			return { data: await fn(args) }
		} catch (e) {
			return asBaseQueryError(e)
		}
	}

const filtersToQueryParams = (filters: SalesFilters): Record<string, string | number> => {
	const params: Record<string, string | number> = {}
	if (filters.dateRange) params.dateRange = filters.dateRange
	if (filters.customFrom) params.customFrom = filters.customFrom
	if (filters.customTo) params.customTo = filters.customTo
	if (filters.timezone) params.timezone = filters.timezone
	if (filters.scoreMin != null) params.scoreMin = filters.scoreMin
	if (filters.scoreMax != null) params.scoreMax = filters.scoreMax
	if (filters.technology?.length) params.technology = filters.technology.join(',')
	if (filters.direction?.length) params.direction = filters.direction.join(',')
	if (filters.platformId?.length) params.platformId = filters.platformId.join(',')
	if (filters.contractType) params.contractType = filters.contractType
	if (filters.budgetBucket) params.budgetBucket = filters.budgetBucket
	if (filters.clientCountry?.length) params.clientCountry = filters.clientCountry.join(',')
	if (filters.clientQuality?.length) params.clientQuality = filters.clientQuality.join(',')
	if (filters.manualRelevance) params.manualRelevance = filters.manualRelevance
	if (filters.notificationStatus) params.notificationStatus = filters.notificationStatus
	return params
}

export const salesAnalyticsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		// ── Overview-served endpoints (real backend) ───────────────────────
		getSalesDataSource: builder.query<{ dataSource: DataSource }, void>({
			queryFn: () => ({ data: { dataSource: 'api' as const } }),
		}),

		getScannerHealth: builder.query<ScannerHealth, ScannerHealthFilters>({
			query: ({ period }) => ({
				url: '/analytics/scanner-health',
				params: { period },
			}),
		}),

		getFiltersOptions: builder.query<FiltersOptions, void>({
			query: () => ({ url: '/analytics/filters-options' }),
			providesTags: ['SalesTaxonomy'],
		}),

		getSalesOverview: builder.query<SalesOverviewSummary, SalesFilters>({
			query: (filters) => ({
				url: '/analytics/sales-overview',
				params: filtersToQueryParams(filters),
			}),
			providesTags: ['SalesFeedback'],
		}),

		getOpportunityHeatmap: builder.query<
			HeatmapData,
			{ filters: SalesFilters; metric: HeatmapMetric }
		>({
			query: ({ filters, metric }) => ({
				url: '/analytics/opportunity-heatmap',
				params: { ...filtersToQueryParams(filters), metric },
			}),
			providesTags: ['SalesFeedback'],
		}),

		getRecentHighScorePosts: builder.query<
			RecentHighScorePostsData,
			{ filters: SalesFilters; limit: number }
		>({
			query: ({ filters, limit }) => ({
				url: '/analytics/recent-high-score-posts',
				params: { ...filtersToQueryParams(filters), limit },
			}),
			providesTags: ['SalesFeedback'],
		}),

		getJobPostsPage: builder.query<JobPostAnalyticsPage, JobPostsQuery>({
			query: ({ filters, page, limit }) => ({
				url: '/analytics/job-posts',
				params: { ...filtersToQueryParams(filters), page, limit },
			}),
			providesTags: ['SalesFeedback'],
		}),

		getJobPostById: builder.query<MockJobPost | null, string>({
			query: (id) => ({ url: `/analytics/job-posts/${id}` }),
			providesTags: ['SalesFeedback'],
		}),

		// ── Deferred tabs (Market Intelligence / Emerging) stay on mock ────
		getCoverageWindows: builder.query<CoverageWindows, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getCoverageWindows(args)),
			providesTags: ['SalesFeedback'],
		}),

		getActionableInsights: builder.query<ActionableInsights, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getActionableInsights(args)),
			providesTags: ['SalesFeedback'],
		}),

		getTimePatterns: builder.query<TimePatternsData, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getTimePatterns(args)),
			providesTags: ['SalesFeedback'],
		}),

		getScoreDistribution: builder.query<ScoreDistributionData, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getScoreDistribution(args)),
			providesTags: ['SalesFeedback'],
		}),

		getDirectionsBreakdown: builder.query<DirectionRow[], SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getDirectionsBreakdown(args)),
			providesTags: ['SalesFeedback'],
		}),

		getTechnologiesBreakdown: builder.query<TechnologyRow[], SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getTechnologiesBreakdown(args)),
			providesTags: ['SalesFeedback'],
		}),

		getTechnologyCombinations: builder.query<TechnologyCombinationRow[], SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getTechnologyCombinations(args)),
			providesTags: ['SalesFeedback'],
		}),

		getBudgetBreakdown: builder.query<BudgetBreakdownData, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getBudgetBreakdown(args)),
			providesTags: ['SalesFeedback'],
		}),

		getClientQualityBreakdown: builder.query<ClientQualityData, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getClientQualityBreakdown(args)),
			providesTags: ['SalesFeedback'],
		}),

		getDemandInsights: builder.query<DemandInsightsData, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getDemandInsights(args)),
			providesTags: ['SalesFeedback'],
		}),

		getBidPlaybooks: builder.query<BidPlaybook[], SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getBidPlaybooks(args)),
			providesTags: ['SalesFeedback'],
		}),

		getCanonicalTaxonomy: builder.query<CanonicalTaxonomy, void>({
			queryFn: q(() => repo.getCanonicalTaxonomy()),
			providesTags: ['SalesTaxonomy'],
		}),

		getEmergingOverview: builder.query<EmergingOverview, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getEmergingOverview(args)),
			providesTags: ['SalesCandidate'],
		}),

		getEmergingList: builder.query<EmergingSignalRow[], SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getEmergingList(args)),
			providesTags: ['SalesCandidate'],
		}),

		getEmergingDetail: builder.query<EmergingSignalDetail | null, string>({
			queryFn: q((id: string) => repo.getEmergingDetail(id)),
			providesTags: ['SalesCandidate'],
		}),

		getEmergingAlertConfig: builder.query<EmergingAlertConfig, void>({
			queryFn: q(() => repo.getEmergingAlertConfig()),
			providesTags: ['SalesAlertConfig'],
		}),

		getFeedbackMetrics: builder.query<FeedbackMetrics, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getFeedbackMetrics(args)),
			providesTags: ['SalesFeedback'],
		}),

		// ── Manual relevance is user-supplied session state, no backend
		//    persistence yet — stays in the in-memory mock state store.
		setRelevanceFeedback: builder.mutation<void, RelevanceFeedbackPayload>({
			queryFn: q((payload: RelevanceFeedbackPayload) => repo.setRelevanceFeedback(payload)),
			invalidatesTags: ['SalesFeedback'],
		}),

		runCandidateAction: builder.mutation<TaxonomyCandidate | null, CandidateActionPayload>({
			queryFn: q((payload: CandidateActionPayload) => repo.runCandidateAction(payload)),
			invalidatesTags: ['SalesCandidate', 'SalesTaxonomy'],
		}),

		setEmergingAlertConfig: builder.mutation<EmergingAlertConfig, Partial<EmergingAlertConfig>>({
			queryFn: q((patch: Partial<EmergingAlertConfig>) => repo.setEmergingAlertConfig(patch)),
			invalidatesTags: ['SalesAlertConfig'],
		}),

		resetSalesMockState: builder.mutation<void, void>({
			queryFn: q(() => repo.resetMockState()),
			invalidatesTags: ['SalesFeedback', 'SalesCandidate', 'SalesAlertConfig', 'SalesTaxonomy'],
		}),
	}),
})

export const {
	useGetSalesDataSourceQuery,
	useGetScannerHealthQuery,
	useGetFiltersOptionsQuery,
	useGetSalesOverviewQuery,
	useGetOpportunityHeatmapQuery,
	useGetCoverageWindowsQuery,
	useGetActionableInsightsQuery,
	useGetRecentHighScorePostsQuery,
	useGetTimePatternsQuery,
	useGetScoreDistributionQuery,
	useGetDirectionsBreakdownQuery,
	useGetTechnologiesBreakdownQuery,
	useGetTechnologyCombinationsQuery,
	useGetBudgetBreakdownQuery,
	useGetClientQualityBreakdownQuery,
	useGetDemandInsightsQuery,
	useGetBidPlaybooksQuery,
	useGetJobPostsPageQuery,
	useGetJobPostByIdQuery: useGetSalesJobPostByIdQuery,
	useGetCanonicalTaxonomyQuery,
	useGetEmergingOverviewQuery,
	useGetEmergingListQuery,
	useGetEmergingDetailQuery,
	useGetEmergingAlertConfigQuery,
	useGetFeedbackMetricsQuery,
	useSetRelevanceFeedbackMutation,
	useRunCandidateActionMutation,
	useSetEmergingAlertConfigMutation,
	useResetSalesMockStateMutation,
} = salesAnalyticsApi
