import { baseApi } from '../../api/baseApi'
import type {
	ClientRequestItem,
	ClientRequestPage,
	ClientRequestListParams,
	ClientRequestSignedFile,
	UpdateClientRequestBody,
} from './types/definition'

export const clientRequestsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getClientRequestList: builder.query<ClientRequestPage, ClientRequestListParams>({
			query: ({ page, limit, sortBy, sortDirection, search }) => ({
				url: '/client-requests',
				params: { page, limit, sortBy, sortDirection, search: search || undefined },
			}),
			providesTags: ['ClientRequest'],
		}),

		getClientRequestById: builder.query<ClientRequestItem, string>({
			query: (id) => ({ url: `/client-requests/${id}` }),
			providesTags: (_, __, id) => [{ type: 'ClientRequest', id }],
		}),

		updateClientRequest: builder.mutation<
			ClientRequestItem,
			{ id: string; body: UpdateClientRequestBody }
		>({
			query: ({ id, body }) => ({ url: `/client-requests/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_, __, { id }) => ['ClientRequest', { type: 'ClientRequest', id }],
		}),

		deleteClientRequest: builder.mutation<void, string>({
			query: (id) => ({ url: `/client-requests/${id}`, method: 'DELETE' }),
			invalidatesTags: ['ClientRequest'],
		}),

		bulkDeleteClientRequests: builder.mutation<{ deleted: number }, string[]>({
			query: (ids) => ({
				url: '/client-requests/bulk-delete',
				method: 'POST',
				body: { ids },
			}),
			// Cascade removes dependent ClientCalls; invalidate both tag sets
			// so any live Client Calls table also refetches.
			invalidatesTags: ['ClientRequest', 'ClientCall'],
		}),

		getClientRequestFiles: builder.query<ClientRequestSignedFile[], string>({
			query: (id) => ({ url: `/client-requests/${id}/files` }),
		}),
	}),
})

export const {
	useGetClientRequestListQuery,
	useGetClientRequestByIdQuery,
	useUpdateClientRequestMutation,
	useDeleteClientRequestMutation,
	useBulkDeleteClientRequestsMutation,
	useGetClientRequestFilesQuery,
} = clientRequestsApi
