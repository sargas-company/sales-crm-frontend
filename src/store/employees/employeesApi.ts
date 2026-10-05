import { baseApi } from '../../api/baseApi'

export type EmployeeStatus = 'active' | 'inactive'

export interface EmployeeItem {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string | null
	positions: string[]
	status: EmployeeStatus
	hiredAt: string | null
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
}

export interface CreateEmployeeBody {
	firstName: string
	lastName: string
	email: string
	phone?: string
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
			query: ({ page, limit, sortBy, sortDirection, search, status }) => ({
				url: '/employees',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					status: status || undefined,
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
