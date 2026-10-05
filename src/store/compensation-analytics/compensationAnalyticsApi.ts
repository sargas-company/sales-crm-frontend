import { baseApi } from '../../api/baseApi'
import type { RateType, PayrollEmployeeRef, PayrollStatus, PayrollSummary } from '../payroll/payrollApi'
import type { SalaryReviewResult } from '../salary-reviews/salaryReviewsApi'

export interface CompMonthlyPoint {
	year: number
	month: number
	baseSalaries: string
	taxes: string
	bonuses: string
	totalAccrued: string
	payoneerFees: string
	companyCost: string
}

export interface CompEmployeeBreakdownRow {
	id: string
	employee: PayrollEmployeeRef
	rateType: RateType
	baseSalary: string
	totalAccrued: string
	companyCost: string
	status: PayrollStatus
}

export interface CompUpcomingReview {
	id: string
	employee: PayrollEmployeeRef
	scheduledDate: string
	previousRateType: RateType | null
	previousRate: string | null
	note: string | null
}

export interface CompIncreaseRow {
	id: string
	employee: PayrollEmployeeRef
	effectiveDate: string | null
	previousRateType: RateType | null
	previousRate: string
	newRateType: RateType | null
	newRate: string
	diff: string
	pct: string
}

export interface CompHistoryRow {
	id: string
	employee: PayrollEmployeeRef
	result: SalaryReviewResult
	scheduledDate: string
	effectiveDate: string | null
	completedAt: string | null
	previousRateType: RateType | null
	previousRate: string | null
	newRateType: RateType | null
	newRate: string | null
}

export interface CompOverview {
	year: number
	month: number
	summary: PayrollSummary
	monthlySeries: CompMonthlyPoint[]
	employeeBreakdown: CompEmployeeBreakdownRow[]
	upcomingReviews: CompUpcomingReview[]
	biggestIncreases: CompIncreaseRow[]
	recentHistory: CompHistoryRow[]
}

export const compensationAnalyticsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getCompensationOverview: builder.query<
			CompOverview,
			{ year: number; month: number }
		>({
			query: ({ year, month }) => ({
				url: '/compensation-analytics/overview',
				params: { year, month },
			}),
			providesTags: ['CompensationAnalytics'],
		}),
	}),
})

export const { useGetCompensationOverviewQuery } = compensationAnalyticsApi
