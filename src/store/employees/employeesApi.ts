import { baseApi } from '../../api/baseApi'

/** Lifecycle states:
 *  - ACTIVE     — on a project / currently working
 *  - BENCH      — hired, idle between projects
 *  - TERMINATED — left / fired; kept for history + final payroll */
export type EmployeeStatus = 'ACTIVE' | 'BENCH' | 'TERMINATED'
export type EmployeeRateType = 'HOURLY' | 'MONTHLY'

/** Current compensation rate as surfaced by the list endpoint. One
 *  row max — the most recent EmployeeCompensationRate whose
 *  effectiveDate has already arrived. `rate` is a decimal string
 *  (Prisma Decimal serialises to string); callers that need a number
 *  should parse it client-side. */
export interface EmployeeCurrentRate {
	rate: string
	rateType: EmployeeRateType
	effectiveDate: string
}

/** Positions reference the Position catalogue through an implicit
 *  many-to-many; the backend returns the attached rows ordered by
 *  title. Empty array ⇒ no positions assigned. */
export interface EmployeePosition {
	id: string
	title: string
	slug: string
}

export interface EmployeeItem {
	id: string
	firstName: string
	lastName: string
	/** Nullable — Employee record is a directory entry and can exist
	 *  without an email (contractor, early hire). */
	email: string | null
	phone: string | null
	positions: EmployeePosition[]
	status: EmployeeStatus
	hiredAt: string | null
	/** Set when status transitions to TERMINATED; null otherwise. */
	terminatedAt: string | null
	/** DiceBear preset URL assigned at create-time; null for legacy
	 *  rows before the backfill ran. */
	avatarUrl: string | null
	userId: string | null
	user: {
		id: string
		email: string
		firstName: string
		lastName: string
	} | null
	dateOfBirth: string | null
	createdAt: string
	updatedAt: string
	/** 0 or 1 element. Empty array ⇒ no current salary set, render 0. */
	compensationRates?: EmployeeCurrentRate[]
}

export interface EmployeePage {
	data: EmployeeItem[]
	total: number
}

export type EmployeeSortBy =
	| 'firstName'
	| 'lastName'
	| 'email'
	| 'status'
	| 'hiredAt'
	| 'createdAt'
	| 'updatedAt'

export type EmployeeSortDirection = 'asc' | 'desc'

export interface EmployeeListParams {
	page: number
	limit: number
	sortBy?: EmployeeSortBy
	sortDirection?: EmployeeSortDirection
	search?: string
	status?: EmployeeStatus
	/** Position catalogue UUID; matches employees whose positions
	 *  include this id. */
	position?: string
	/** 1..12 calendar month; matches employees whose dateOfBirth
	 *  falls in this month (year-agnostic). */
	birthdayMonth?: number
	/** YYYY-MM — filters to employees who were active at any point
	 *  during that calendar month. Used by Monthly Run to form the
	 *  payable list (includes mid-month terminations and rehires). */
	activeInMonth?: string
}

export interface CreateEmployeeBody {
	firstName: string
	lastName: string
	email: string
	phone?: string
	/** Position catalogue UUIDs the backend will `connect` on create. */
	positions?: string[]
	status?: EmployeeStatus
	hiredAt?: string
	userId?: string
	dateOfBirth?: string | null
}

export type UpdateEmployeeBody = Partial<CreateEmployeeBody>

export const employeesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getEmployees: builder.query<EmployeePage, EmployeeListParams>({
			query: ({
				page,
				limit,
				sortBy,
				sortDirection,
				search,
				status,
				position,
				birthdayMonth,
				activeInMonth,
			}) => ({
				url: '/employees',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					status: status || undefined,
					position: position || undefined,
					birthdayMonth: birthdayMonth ?? undefined,
					activeInMonth: activeInMonth || undefined,
				},
			}),
			providesTags: ['Employee'],
		}),
		getEmployeeById: builder.query<EmployeeItem, string>({
			query: (id) => ({ url: `/employees/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
		}),
		createEmployee: builder.mutation<EmployeeItem, CreateEmployeeBody>({
			query: (body) => ({ url: '/employees', method: 'POST', body }),
			invalidatesTags: ['Employee'],
		}),
		updateEmployee: builder.mutation<
			EmployeeItem,
			{ id: string; body: UpdateEmployeeBody }
		>({
			query: ({ id, body }) => ({ url: `/employees/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_r, _e, { id }) => ['Employee', { type: 'Employee', id }],
		}),
		deleteEmployee: builder.mutation<void, string>({
			query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Employee'],
		}),
	}),
})

export const {
	useGetEmployeesQuery,
	useGetEmployeeByIdQuery,
	useCreateEmployeeMutation,
	useUpdateEmployeeMutation,
	useDeleteEmployeeMutation,
} = employeesApi
