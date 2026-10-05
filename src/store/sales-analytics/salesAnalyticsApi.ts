import { baseApi } from '../../api/baseApi'
import type { ScannerHealth, ScannerHealthFilters } from './types/scanner'
import type { SalesFilters } from './types/filters'
import type {
	FiltersOptions,
	HeatmapData,
	HeatmapMetric,
	RecentHighScorePostsData,
	SalesOverviewSummary,
} from './types/aggregates'
import type { MockJobPost } from './types/jobPost'

/**
 * Sales Analytics data layer — the Overview tab is the only live
 * surface and every query here hits the real backend at
 * `/analytics/**`. The deferred Market Intelligence / Emerging
 * Signals tabs are kept as disabled "Soon" badges in the UI; their
 * mock implementation was removed, so no runtime fetch stands behind
 * them.
 */

/* JobPostAnalyticsPage and JobPostsQuery mirror the backend list
 * contract — kept here so hook consumers do not touch the removed
 * repository interface. */
export interface JobPostAnalyticsPage {
	items: MockJobPost[]
	page: number
	limit: number
	total: number
	totalPages: number
}

export interface JobPostsQuery {
	filters: SalesFilters
	page: number
	limit: number
}

const filtersToQueryParams = (
	filters: SalesFilters,
): Record<string, string | number> => {
	const params: Record<string, string | number> = {}
	if (filters.dateRange) params.dateRange = filters.dateRange
	if (filters.customFrom) params.customFrom = filters.customFrom
	if (filters.customTo) params.customTo = filters.customTo
	if (filters.timezone) params.timezone = filters.timezone
	if (filters.scoreMin != null) params.scoreMin = filters.scoreMin
	if (filters.scoreMax != null) params.scoreMax = filters.scoreMax
	if (filters.technology?.length)
		params.technology = filters.technology.join(',')
	if (filters.direction?.length)
		params.direction = filters.direction.join(',')
	if (filters.platformId?.length)
		params.platformId = filters.platformId.join(',')
	if (filters.contractType) params.contractType = filters.contractType
	if (filters.budgetBucket) params.budgetBucket = filters.budgetBucket
	if (filters.clientCountry?.length)
		params.clientCountry = filters.clientCountry.join(',')
	if (filters.clientQuality?.length)
		params.clientQuality = filters.clientQuality.join(',')
	if (filters.notificationStatus)
		params.notificationStatus = filters.notificationStatus
	return params
}

export const salesAnalyticsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
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

	}),
})

export const {
	useGetScannerHealthQuery,
	useGetFiltersOptionsQuery,
	useGetSalesOverviewQuery,
	useGetOpportunityHeatmapQuery,
	useGetRecentHighScorePostsQuery,
	useGetJobPostsPageQuery,
	useGetJobPostByIdQuery,
} = salesAnalyticsApi

/* Legacy hook alias retained so existing imports continue to compile
 * without a sweep across the sales-analytics components. */
export const useGetSalesJobPostByIdQuery = useGetJobPostByIdQuery
