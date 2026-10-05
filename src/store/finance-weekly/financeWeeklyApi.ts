import { baseApi } from '../../api/baseApi'

export type PaymentStatus =
	| 'received'
	| 'in_transit'
	| 'expected_this_month'
	| 'expected_later'
	| 'planned_invoice'
	| 'no_work'

export type PaymentRuleType = 'FIXED_DELAY' | 'WEEKLY_ON_DOW' | 'EVERY_N_WEEKS' | 'CUSTOM'

export interface FiscalMonthSummary {
	id: string
	year: number
	sequenceInYear: number
	startDate: string
	endDate: string
	weeksCount: number
	label: string
}

export interface FiscalWeek {
	id: string
	indexInMonth: number
	startDate: string
	endDate: string
	label: string
}

export interface FinanceGridEntry {
	id: string
	amount: string | null
	status: PaymentStatus
	note: string | null
	invoiceSentAt: string | null
	receivedAt: string | null
	updatedAt: string
}

export interface FinanceGridProject {
	id: string
	name: string
	status: string
	clientName: string | null
}

export interface FinanceKpiByStatus {
	received: { count: number; total: string }
	in_transit: { count: number; total: string }
	expected_this_month: { count: number; total: string }
	expected_later: { count: number; total: string }
	planned_invoice: { count: number; total: string }
	no_work: { count: number; total: string }
}

export interface FinanceKpi {
	byStatus: FinanceKpiByStatus
	total: string
}

export interface FinancePredictionBucket {
	date: string
	total: string
	count: number
	projectIds: string[]
	statuses: PaymentStatus[]
}

export interface FinancePredictions {
	byDate: FinancePredictionBucket[]
	cumulative: Array<{ date: string; cumulative: string }>
}

export interface FinanceMonthOverview {
	month: {
		id: string
		year: number
		sequenceInYear: number
		label: string
		startDate: string
		endDate: string
		weeksCount: number
	}
	navigation: {
		prev: { id: string; label: string } | null
		next: { id: string; label: string } | null
	}
	weeks: FiscalWeek[]
	projects: FinanceGridProject[]
	grid: Record<string, Record<string, FinanceGridEntry | null>>
	kpi: FinanceKpi
	predictions: FinancePredictions
	statuses: PaymentStatus[]
}

export interface FinanceListRow {
	id: string
	weekId: string
	weekLabel: string
	weekStart: string
	weekEnd: string
	projectId: string
	projectName: string
	clientName: string | null
	amount: string | null
	status: PaymentStatus
	note: string | null
	invoiceSentAt: string | null
	receivedAt: string | null
}

export interface FinanceMonthList {
	month: { id: string; label: string; startDate: string; endDate: string }
	rows: FinanceListRow[]
	kpi: FinanceKpi
}

export interface UpsertEntryPayload {
	fiscalWeekId: string
	projectId: string
	status: PaymentStatus
	amount?: string | null
	note?: string | null
	invoiceSentAt?: string | null
	receivedAt?: string | null
}

export interface PaymentRule {
	id: string
	projectId: string
	type: PaymentRuleType
	delayDays: number | null
	dayOfWeek: number | null
	intervalWeeks: number | null
	note: string | null
	effectiveFrom: string
	createdAt: string
}

export interface FinanceRegistryRow {
	id: string
	weekId: string
	weekLabel: string
	weekStart: string
	weekEnd: string
	monthId: string
	monthLabel: string
	projectId: string
	projectName: string
	clientName: string | null
	amount: string | null
	status: PaymentStatus
	note: string | null
	invoiceSentAt: string | null
	receivedAt: string | null
}

export interface FinanceRegistryResponse {
	rows: FinanceRegistryRow[]
	pagination: { page: number; pageSize: number; total: number }
	filters: {
		from: string | null
		to: string | null
		status: PaymentStatus | null
		projectId: string | null
		search: string | null
	}
}

export interface FinanceRegistryQuery {
	from?: string
	to?: string
	status?: PaymentStatus
	projectId?: string
	search?: string
	page?: number
	pageSize?: number
}

export interface FinanceProjectSummary {
	id: string
	name: string
	clientName: string | null
}

export interface AnalyticsSnapshot {
	receivedThisMonth: number
	pipelineThisMonth: number
	receivedYtd: number
	prevMonthReceived: number
	deltaMoM: number | null
}

export interface AnalyticsMonthlyRow {
	monthId: string
	label: string
	sequenceInYear: number
	received: number
	pipeline: number
	entriesReceived: number
}

export interface AnalyticsMonthly {
	year: number
	months: AnalyticsMonthlyRow[]
	average: number
}

export interface AnalyticsBreakdown {
	key: string
	label: string
	sub: string | null
	received: number
	pipeline: number
	entriesReceived: number
	percent: number
}

export interface AnalyticsPipelineBucket {
	total: number
	count: number
}

export interface AnalyticsPipeline {
	in_transit: AnalyticsPipelineBucket
	expected_this_month: AnalyticsPipelineBucket
	expected_later: AnalyticsPipelineBucket
	planned_invoice: AnalyticsPipelineBucket
	totalPipeline: number
}

export interface AnalyticsYear {
	year: number
	totalReceived: number
	avgMonthly: number
	bestMonth: { label: string; total: number } | null
	worstMonth: { label: string; total: number } | null
	paymentsCount: number
	activeProjects: number
	activeClients: number
}

export interface AnalyticsConcentration {
	topClientPercent: number
	topThreePercent: number
	atRisk: boolean
}

export interface FinanceAnalyticsResponse {
	filters: {
		year: number
		from: string | null
		to: string | null
		projectId: string | null
		clientId: string | null
		rangeLabel: string
	}
	snapshot: AnalyticsSnapshot
	monthly: AnalyticsMonthly
	byProject: AnalyticsBreakdown[]
	byClient: AnalyticsBreakdown[]
	concentration: AnalyticsConcentration
	pipeline: AnalyticsPipeline
	yearOverview: AnalyticsYear
}

export interface FinanceAnalyticsQuery {
	year?: number
	from?: string
	to?: string
	projectId?: string
	clientId?: string
	scope?: 'thisMonth' | 'last3Months' | 'thisYear' | 'allTime' | 'custom'
}

export interface UpsertPaymentRulePayload {
	type: PaymentRuleType
	delayDays?: number | null
	dayOfWeek?: number | null
	intervalWeeks?: number | null
	note?: string | null
	effectiveFrom?: string
}

export const financeWeeklyApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getFiscalMonths: builder.query<FiscalMonthSummary[], { year?: number } | void>({
			query: (params) => ({
				url: '/finances/fiscal-months',
				params: params ?? {},
			}),
			providesTags: ['FinanceWeeklyMonth'],
		}),

		getCurrentFiscalMonth: builder.query<FiscalMonthSummary | null, void>({
			query: () => ({ url: '/finances/months/current' }),
			providesTags: ['FinanceWeeklyMonth'],
		}),

		getMonthOverview: builder.query<FinanceMonthOverview, string>({
			query: (id) => ({ url: `/finances/months/${id}/overview` }),
			providesTags: (_r, _e, id) => [{ type: 'FinanceWeeklyMonth', id }, 'FinanceWeeklyEntry'],
		}),

		getMonthList: builder.query<FinanceMonthList, string>({
			query: (id) => ({ url: `/finances/months/${id}/list` }),
			providesTags: (_r, _e, id) => [
				{ type: 'FinanceWeeklyMonth', id: `list-${id}` },
				'FinanceWeeklyEntry',
			],
		}),

		getPaymentsRegistry: builder.query<FinanceRegistryResponse, FinanceRegistryQuery>({
			query: (params) => {
				const cleaned: Record<string, string | number> = {}
				for (const [k, v] of Object.entries(params)) {
					if (v !== undefined && v !== null && v !== '') cleaned[k] = v as string | number
				}
				return { url: '/finances/entries', params: cleaned }
			},
			providesTags: ['FinanceWeeklyEntry'],
		}),

		getFinanceProjectsSummary: builder.query<FinanceProjectSummary[], void>({
			query: () => ({ url: '/finances/projects/summary' }),
			providesTags: ['FinanceWeeklyMonth'],
		}),

		getFinanceAnalytics: builder.query<FinanceAnalyticsResponse, FinanceAnalyticsQuery>({
			query: (params) => {
				const cleaned: Record<string, string | number> = {}
				for (const [k, v] of Object.entries(params)) {
					if (v !== undefined && v !== null && v !== '') cleaned[k] = v as string | number
				}
				return { url: '/finances/analytics', params: cleaned }
			},
			providesTags: ['FinanceWeeklyEntry'],
		}),

		upsertWeeklyEntry: builder.mutation<FinanceGridEntry, UpsertEntryPayload>({
			query: (body) => ({
				url: '/finances/weekly-entries/upsert',
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['FinanceWeeklyEntry', 'FinanceWeeklyMonth'],
		}),

		deleteWeeklyEntry: builder.mutation<{ ok: true }, string>({
			query: (id) => ({
				url: `/finances/weekly-entries/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FinanceWeeklyEntry', 'FinanceWeeklyMonth'],
		}),

		getProjectPaymentRules: builder.query<PaymentRule[], string>({
			query: (projectId) => ({
				url: `/projects/${projectId}/payment-rules`,
			}),
			providesTags: (_r, _e, projectId) => [{ type: 'ProjectPaymentRule', id: projectId }],
		}),

		getCurrentProjectPaymentRule: builder.query<PaymentRule | null, string>({
			query: (projectId) => ({
				url: `/projects/${projectId}/payment-rules/current`,
			}),
			providesTags: (_r, _e, projectId) => [
				{ type: 'ProjectPaymentRule', id: `current-${projectId}` },
			],
		}),

		createProjectPaymentRule: builder.mutation<
			PaymentRule,
			{ projectId: string; body: UpsertPaymentRulePayload }
		>({
			query: ({ projectId, body }) => ({
				url: `/projects/${projectId}/payment-rules`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, arg) => [
				{ type: 'ProjectPaymentRule', id: arg.projectId },
				{ type: 'ProjectPaymentRule', id: `current-${arg.projectId}` },
				'FinanceWeeklyMonth',
			],
		}),
	}),
})

export const {
	useGetFiscalMonthsQuery,
	useGetCurrentFiscalMonthQuery,
	useGetMonthOverviewQuery,
	useGetMonthListQuery,
	useGetPaymentsRegistryQuery,
	useGetFinanceProjectsSummaryQuery,
	useGetFinanceAnalyticsQuery,
	useUpsertWeeklyEntryMutation,
	useDeleteWeeklyEntryMutation,
	useGetProjectPaymentRulesQuery,
	useGetCurrentProjectPaymentRuleQuery,
	useCreateProjectPaymentRuleMutation,
} = financeWeeklyApi
