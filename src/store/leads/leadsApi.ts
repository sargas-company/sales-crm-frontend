import { baseApi } from '../../api/baseApi'
import type { LeadItem, LeadPage, LeadListParams } from './types/definition'

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeadList: builder.query<LeadPage, LeadListParams>({
      query: ({ page, limit }) => ({ url: '/leads', params: { page, limit } }),
      providesTags: ['Lead'],
    }),

    getLeadById: builder.query<LeadItem, string>({
      query: (id) => ({ url: `/leads/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Lead', id }],
    }),

    updateLead: builder.mutation<LeadItem, { id: string; body: Partial<LeadItem> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => ['Lead', { type: 'Lead', id }],
    }),

    deleteLead: builder.mutation<void, string>({
      query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Lead'],
    }),
  }),
})

export const {
  useGetLeadListQuery,
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} = leadsApi
