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

export const salesAnalyticsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getSalesDataSource: builder.query<{ dataSource: DataSource }, void>({
			queryFn: () => ({ data: { dataSource: repo.dataSource } }),
		}),

		getScannerHealth: builder.query<ScannerHealth, ScannerHealthFilters>({
			queryFn: q((args: ScannerHealthFilters) => repo.getScannerHealth(args)),
		}),

		getFiltersOptions: builder.query<FiltersOptions, void>({
			queryFn: q(() => repo.getFiltersOptions()),
			providesTags: ['SalesTaxonomy'],
		}),

		getSalesOverview: builder.query<SalesOverviewSummary, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getSalesOverview(args)),
			providesTags: ['SalesFeedback'],
		}),

		getOpportunityHeatmap: builder.query<
			HeatmapData,
			{ filters: SalesFilters; metric: HeatmapMetric }
		>({
			queryFn: q(({ filters, metric }: { filters: SalesFilters; metric: HeatmapMetric }) =>
				repo.getOpportunityHeatmap(filters, metric)
			),
			providesTags: ['SalesFeedback'],
		}),

		getCoverageWindows: builder.query<CoverageWindows, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getCoverageWindows(args)),
			providesTags: ['SalesFeedback'],
		}),

		getActionableInsights: builder.query<ActionableInsights, SalesFilters>({
			queryFn: q((args: SalesFilters) => repo.getActionableInsights(args)),
			providesTags: ['SalesFeedback'],
		}),

		getRecentHighScorePosts: builder.query<
			RecentHighScorePostsData,
			{ filters: SalesFilters; limit: number }
		>({
			queryFn: q(({ filters, limit }: { filters: SalesFilters; limit: number }) =>
				repo.getRecentHighScorePosts(filters, limit)
			),
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

		getJobPostsPage: builder.query<JobPostAnalyticsPage, JobPostsQuery>({
			queryFn: q((args: JobPostsQuery) => repo.getJobPostsPage(args)),
			providesTags: ['SalesFeedback'],
		}),

		getJobPostById: builder.query<MockJobPost | null, string>({
			queryFn: q((id: string) => repo.getJobPostById(id)),
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
