import { baseApi } from '../../api/baseApi'
import type { ClientRequestItem, ClientRequestPage, ClientRequestListParams, UpdateClientRequestBody } from './types/definition'

export const clientRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClientRequestList: builder.query<ClientRequestPage, ClientRequestListParams>({
      query: ({ page, limit }) => ({ url: '/client-requests', params: { page, limit } }),
      providesTags: ['ClientRequest'],
    }),

    getClientRequestById: builder.query<ClientRequestItem, string>({
      query: (id) => ({ url: `/client-requests/${id}` }),
      providesTags: (_, __, id) => [{ type: 'ClientRequest', id }],
    }),

    updateClientRequest: builder.mutation<ClientRequestItem, { id: string; body: UpdateClientRequestBody }>({
      query: ({ id, body }) => ({ url: `/client-requests/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => ['ClientRequest', { type: 'ClientRequest', id }],
    }),

    deleteClientRequest: builder.mutation<void, string>({
      query: (id) => ({ url: `/client-requests/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ClientRequest'],
    }),
  }),
})

export const {
  useGetClientRequestListQuery,
  useGetClientRequestByIdQuery,
  useUpdateClientRequestMutation,
  useDeleteClientRequestMutation,
} = clientRequestsApi
