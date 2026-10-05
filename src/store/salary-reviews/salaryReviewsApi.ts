import { baseApi } from '../../api/baseApi'
import type { RateType, PayrollEmployeeRef } from '../payroll/payrollApi'

export type SalaryReviewResult = 'INCREASED' | 'NO_CHANGE' | 'POSTPONED'
export type SalaryReviewStatus = 'upcoming' | 'completed' | 'postponed'

export type SalaryReviewSortBy =
	| 'scheduledDate'
	| 'effectiveDate'
	| 'createdAt'
	| 'result'
	| 'employee'
	| 'previousRate'
	| 'newRate'
export type SalaryReviewSortDirection = 'asc' | 'desc'

export interface SalaryReview {
	id: string
	employeeId: string
	scheduledDate: string
	previousRateType: RateType | null
	previousRate: string | null
	newRateType: RateType | null
	newRate: string | null
	effectiveDate: string | null
	result: SalaryReviewResult | null
	note: string | null
	completedAt: string | null
	createdAt: string
	updatedAt: string
	employee: PayrollEmployeeRef
}

export interface SalaryReviewsPage {
	data: SalaryReview[]
	total: number
	page: number
	limit: number
}

export interface SalaryReviewsListParams {
	page: number
	limit: number
	sortBy?: SalaryReviewSortBy
	sortDirection?: SalaryReviewSortDirection
	search?: string
	employeeId?: string
	result?: SalaryReviewResult
	status?: SalaryReviewStatus
	year?: number
	from?: string
	to?: string
}

export interface CreateSalaryReviewBody {
	employeeId: string
	scheduledDate: string
	previousRateType?: RateType
	previousRate?: number
	newRateType?: RateType
	newRate?: number
	effectiveDate?: string
	result?: SalaryReviewResult
	note?: string
}

export type UpdateSalaryReviewBody = Partial<
	Omit<CreateSalaryReviewBody, 'employeeId'>
>

export const salaryReviewsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getSalaryReviews: builder.query<SalaryReviewsPage, SalaryReviewsListParams>({
			query: (p) => ({
				url: '/salary-reviews',
				params: {
					page: p.page,
					limit: p.limit,
					sortBy: p.sortBy,
					sortDirection: p.sortDirection,
					search: p.search || undefined,
					employeeId: p.employeeId || undefined,
					result: p.result || undefined,
					status: p.status || undefined,
					year: p.year ?? undefined,
					from: p.from || undefined,
					to: p.to || undefined,
				},
			}),
			providesTags: ['SalaryReview'],
		}),
		getSalaryReviewById: builder.query<SalaryReview, string>({
			query: (id) => ({ url: `/salary-reviews/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'SalaryReview', id }],
		}),
		createSalaryReview: builder.mutation<SalaryReview, CreateSalaryReviewBody>({
			query: (body) => ({ url: '/salary-reviews', method: 'POST', body }),
			invalidatesTags: ['SalaryReview', 'CompensationAnalytics'],
		}),
		updateSalaryReview: builder.mutation<
			SalaryReview,
			{ id: string; body: UpdateSalaryReviewBody }
		>({
			query: ({ id, body }) => ({
				url: `/salary-reviews/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['SalaryReview', 'CompensationAnalytics'],
		}),
		deleteSalaryReview: builder.mutation<void, string>({
			query: (id) => ({ url: `/salary-reviews/${id}`, method: 'DELETE' }),
			invalidatesTags: ['SalaryReview', 'CompensationAnalytics'],
		}),
	}),
})

export const {
	useGetSalaryReviewsQuery,
	useGetSalaryReviewByIdQuery,
	useCreateSalaryReviewMutation,
	useUpdateSalaryReviewMutation,
	useDeleteSalaryReviewMutation,
} = salaryReviewsApi
