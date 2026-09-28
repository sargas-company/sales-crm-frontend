import { baseApi } from '../../api/baseApi'

export type CounterpartyType = 'client' | 'contractor'

export interface CounterpartyItem {
	id: string
	firstName: string
	lastName: string
	type: CounterpartyType
	info: string | null
	createdAt: string
	updatedAt: string
}

export interface CounterpartyPage {
	data: CounterpartyItem[]
	total: number
}

export type CounterpartySortBy = 'firstName' | 'type' | 'createdAt' | 'updatedAt'

export type CounterpartySortDirection = 'asc' | 'desc'

export interface CounterpartyListParams {
	page: number
	limit: number
	sortBy?: CounterpartySortBy
	sortDirection?: CounterpartySortDirection
	search?: string
}

export interface CreateCounterpartyBody {
	firstName: string
	lastName: string
	type: CounterpartyType
	info?: string
}

export interface UpdateCounterpartyBody {
	firstName?: string
	lastName?: string
	type?: CounterpartyType
	info?: string
}

export const counterpartiesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getCounterparties: builder.query<CounterpartyPage, CounterpartyListParams>({
			query: ({ page, limit, sortBy, sortDirection, search }) => ({
				url: '/counterparties',
				params: { page, limit, sortBy, sortDirection, search: search || undefined },
			}),
			providesTags: ['Counterparty'],
		}),

		getCounterpartyById: builder.query<CounterpartyItem, string>({
			query: (id) => ({ url: `/counterparties/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Counterparty', id }],
		}),

		createCounterparty: builder.mutation<CounterpartyItem, CreateCounterpartyBody>({
			query: (body) => ({ url: '/counterparties', method: 'POST', body }),
			invalidatesTags: ['Counterparty'],
		}),

		updateCounterparty: builder.mutation<
			CounterpartyItem,
			{ id: string; body: UpdateCounterpartyBody }
		>({
			query: ({ id, body }) => ({ url: `/counterparties/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_, __, { id }) => ['Counterparty', { type: 'Counterparty', id }],
		}),

		deleteCounterparty: builder.mutation<void, string>({
			query: (id) => ({ url: `/counterparties/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Counterparty'],
		}),
	}),
})

export const {
	useGetCounterpartiesQuery,
	useGetCounterpartyByIdQuery,
	useCreateCounterpartyMutation,
	useUpdateCounterpartyMutation,
	useDeleteCounterpartyMutation,
} = counterpartiesApi
