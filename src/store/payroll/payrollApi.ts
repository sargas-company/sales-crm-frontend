import { baseApi } from '../../api/baseApi'

export type RateType = 'HOURLY' | 'MONTHLY'
export type PayrollStatus = 'DRAFT' | 'PAID'

export type PayrollSortBy =
	| 'employee'
	| 'baseSalary'
	| 'totalAccrued'
	| 'companyCost'
	| 'remainingToPay'
	| 'bonusAmount'
	| 'payoneerFee'
	| 'status'
	| 'createdAt'

export type PayrollSortDirection = 'asc' | 'desc'

export interface PayrollEmployeeRef {
	id: string
	firstName: string
	lastName: string
	status: 'active' | 'inactive'
	positions: string[]
}

export interface PayrollEntry {
	id: string
	employeeId: string
	year: number
	month: number
	rateType: RateType
	rate: string
	hours: string | null
	baseSalary: string
	tax: string
	salaryWithTax: string
	bonusPercent: string
	fixedBonus: string
	bonusAmount: string
	advance: string
	totalAccrued: string
	remainingToPay: string
	payoneerFee: string
	companyCost: string
	note: string | null
	status: PayrollStatus
	paidAt: string | null
	createdAt: string
	updatedAt: string
	employee: PayrollEmployeeRef
}

export interface PayrollListParams {
	year: number
	month: number
	sortBy?: PayrollSortBy
	sortDirection?: PayrollSortDirection
	search?: string
	status?: PayrollStatus
}

export interface PayrollSummary {
	year: number
	month: number
	count: number
	draftCount: number
	paidCount: number
	baseSalaries: string
	taxes: string
	bonuses: string
	totalAccrued: string
	payoneerFees: string
	companyCost: string
	outstanding: string
}

export interface CreatePayrollBody {
	employeeId: string
	year: number
	month: number
	rateType: RateType
	rate: number
	hours?: number
	bonusPercent?: number
	fixedBonus?: number
	advance?: number
	note?: string
}

export type UpdatePayrollBody = Partial<
	Omit<CreatePayrollBody, 'employeeId' | 'year' | 'month'>
>

export const payrollApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPayroll: builder.query<{ data: PayrollEntry[] }, PayrollListParams>({
			query: ({ year, month, sortBy, sortDirection, search, status }) => ({
				url: '/payroll',
				params: {
					year,
					month,
					sortBy,
					sortDirection,
					search: search || undefined,
					status: status || undefined,
				},
			}),
			providesTags: ['Payroll'],
		}),
		getPayrollSummary: builder.query<PayrollSummary, { year: number; month: number }>({
			query: ({ year, month }) => ({
				url: '/payroll/summary',
				params: { year, month },
			}),
			providesTags: ['Payroll'],
		}),
		getPayrollById: builder.query<PayrollEntry, string>({
			query: (id) => ({ url: `/payroll/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'Payroll', id }],
		}),
		createPayroll: builder.mutation<PayrollEntry, CreatePayrollBody>({
			query: (body) => ({ url: '/payroll', method: 'POST', body }),
			invalidatesTags: ['Payroll', 'CompensationAnalytics'],
		}),
		updatePayroll: builder.mutation<
			PayrollEntry,
			{ id: string; body: UpdatePayrollBody }
		>({
			query: ({ id, body }) => ({ url: `/payroll/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['Payroll', 'CompensationAnalytics'],
		}),
		markPayrollPaid: builder.mutation<PayrollEntry, string>({
			query: (id) => ({ url: `/payroll/${id}/mark-paid`, method: 'POST' }),
			invalidatesTags: ['Payroll', 'CompensationAnalytics'],
		}),
		reopenPayroll: builder.mutation<PayrollEntry, string>({
			query: (id) => ({ url: `/payroll/${id}/reopen`, method: 'POST' }),
			invalidatesTags: ['Payroll', 'CompensationAnalytics'],
		}),
		deletePayroll: builder.mutation<void, string>({
			query: (id) => ({ url: `/payroll/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Payroll', 'CompensationAnalytics'],
		}),
	}),
})

export const {
	useGetPayrollQuery,
	useGetPayrollSummaryQuery,
	useGetPayrollByIdQuery,
	useCreatePayrollMutation,
	useUpdatePayrollMutation,
	useMarkPayrollPaidMutation,
	useReopenPayrollMutation,
	useDeletePayrollMutation,
} = payrollApi
