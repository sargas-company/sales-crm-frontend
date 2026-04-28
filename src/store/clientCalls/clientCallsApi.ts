import { baseApi } from '../../api/baseApi'
import type {
	ClientCallItem,
	ClientCallPage,
	ClientCallListParams,
	CreateClientCallBody,
	UpdateClientCallBody,
} from './types/definition'

export const clientCallsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getClientCallList: builder.query<ClientCallPage, ClientCallListParams>({
			query: ({ page, limit }) => ({ url: '/client-calls', params: { page, limit } }),
			providesTags: ['ClientCall'],
		}),

		getClientCallById: builder.query<ClientCallItem, string>({
			query: (id) => ({ url: `/client-calls/${id}` }),
			providesTags: (_, __, id) => [{ type: 'ClientCall', id }],
		}),

		createClientCall: builder.mutation<ClientCallItem, CreateClientCallBody>({
			query: (body) => ({ url: '/client-calls', method: 'POST', body }),
			invalidatesTags: ['ClientCall'],
		}),

		updateClientCall: builder.mutation<ClientCallItem, { id: string; body: UpdateClientCallBody }>({
			query: ({ id, body }) => ({ url: `/client-calls/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_, __, { id }) => ['ClientCall', { type: 'ClientCall', id }],
		}),

		deleteClientCall: builder.mutation<void, string>({
			query: (id) => ({ url: `/client-calls/${id}`, method: 'DELETE' }),
			invalidatesTags: ['ClientCall'],
		}),
	}),
})

export const {
	useGetClientCallListQuery,
	useGetClientCallByIdQuery,
	useCreateClientCallMutation,
	useUpdateClientCallMutation,
	useDeleteClientCallMutation,
} = clientCallsApi
