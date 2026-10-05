import { baseApi } from '../../api/baseApi'

export type TimeOffType = 'VACATION' | 'SICK_LEAVE' | 'UNPAID_LEAVE'

export interface TimeOffItem {
	id: string
	employeeId: string
	type: TimeOffType
	startDate: string
	endDate: string
	workingDays: number
	note: string | null
	createdById: string
	createdAt: string
	updatedAt: string
	employee: {
		id: string
		firstName: string
		lastName: string
		status: 'active' | 'inactive'
		positions: string[]
	}
	createdBy: {
		id: string
		firstName: string
		lastName: string
		email: string
	}
}

export interface TimeOffPage {
	data: TimeOffItem[]
	total: number
}

export type TimeOffSortBy =
	| 'startDate'
	| 'endDate'
	| 'type'
	| 'workingDays'
	| 'createdAt'
	| 'updatedAt'

export type TimeOffSortDirection = 'asc' | 'desc'

export interface TimeOffListParams {
	page: number
	limit: number
	sortBy?: TimeOffSortBy
	sortDirection?: TimeOffSortDirection
	search?: string
	type?: TimeOffType
	employeeId?: string
	year?: number
	from?: string
	to?: string
}

export interface CreateTimeOffBody {
	employeeId: string
	type: TimeOffType
	startDate: string
	endDate: string
	note?: string
}

export type UpdateTimeOffBody = Partial<CreateTimeOffBody>

export interface TimeOffSummary {
	year: number
	outToday: number
	upcomingIn30Days: number
	vacationDaysThisYear: number
	sickDaysThisYear: number
}

export interface CalendarEmployee {
	id: string
	firstName: string
	lastName: string
	status: 'active' | 'inactive'
	positions: string[]
}

export interface CalendarRecord {
	id: string
	employeeId: string
	type: TimeOffType
	startDate: string
	endDate: string
	continuesLeft: boolean
	continuesRight: boolean
	note: string | null
}

export interface CalendarData {
	year: number
	month: number
	daysInMonth: number
	employees: CalendarEmployee[]
	records: CalendarRecord[]
}

export interface BalanceRow {
	employee: CalendarEmployee
	vacationUsed: number
	vacationRemaining: number
	sickUsed: number
	sickRemaining: number
	unpaidDays: number
	nextAbsence: {
		type: TimeOffType
		startDate: string
		endDate: string
	} | null
}

export interface BalancesData {
	year: number
	allowances: { vacation: number; sickLeave: number }
	employees: BalanceRow[]
}

export const timeOffApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getTimeOffList: builder.query<TimeOffPage, TimeOffListParams>({
			query: ({ page, limit, sortBy, sortDirection, search, type, employeeId, year, from, to }) => ({
				url: '/time-off',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					type: type || undefined,
					employeeId: employeeId || undefined,
					year: year ?? undefined,
					from: from || undefined,
					to: to || undefined,
				},
			}),
			providesTags: ['TimeOff'],
		}),
		getTimeOffById: builder.query<TimeOffItem, string>({
			query: (id) => ({ url: `/time-off/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'TimeOff', id }],
		}),
		getTimeOffSummary: builder.query<TimeOffSummary, { year?: number }>({
			query: (arg) => ({
				url: '/time-off/summary',
				params: arg.year ? { year: arg.year } : {},
			}),
			providesTags: ['TimeOff'],
		}),
		getTimeOffCalendar: builder.query<
			CalendarData,
			{ year: number; month: number; search?: string }
		>({
			query: ({ year, month, search }) => ({
				url: '/time-off/calendar',
				params: { year, month, search: search || undefined },
			}),
			providesTags: ['TimeOff'],
		}),
		getTimeOffBalances: builder.query<BalancesData, { year: number }>({
			query: ({ year }) => ({ url: '/time-off/balances', params: { year } }),
			providesTags: ['TimeOff'],
		}),
		createTimeOff: builder.mutation<TimeOffItem, CreateTimeOffBody>({
			query: (body) => ({ url: '/time-off', method: 'POST', body }),
			invalidatesTags: ['TimeOff'],
		}),
		updateTimeOff: builder.mutation<
			TimeOffItem,
			{ id: string; body: UpdateTimeOffBody }
		>({
			query: ({ id, body }) => ({ url: `/time-off/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_r, _e, { id }) => ['TimeOff', { type: 'TimeOff', id }],
		}),
		deleteTimeOff: builder.mutation<void, string>({
			query: (id) => ({ url: `/time-off/${id}`, method: 'DELETE' }),
			invalidatesTags: ['TimeOff'],
		}),
	}),
})

export const {
	useGetTimeOffListQuery,
	useGetTimeOffByIdQuery,
	useGetTimeOffSummaryQuery,
	useGetTimeOffCalendarQuery,
	useGetTimeOffBalancesQuery,
	useCreateTimeOffMutation,
	useUpdateTimeOffMutation,
	useDeleteTimeOffMutation,
} = timeOffApi
