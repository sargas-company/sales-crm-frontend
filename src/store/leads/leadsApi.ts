import { baseApi } from '../../api/baseApi'
import type { LeadItem, LeadPage, LeadListParams, CreateLeadBody } from './types/definition'

export interface LeadActivityEvent {
	id: string
	action: string
	actorUserId: string | null
	actorName: string | null
	actorEmail: string | null
	changes: Record<string, unknown> | null
	metadata: Record<string, unknown> | null
	severity: 'INFO' | 'WARNING' | 'CRITICAL'
	result: 'SUCCESS' | 'DENIED' | 'FAILED'
	occurredAt: string
}

export const leadsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getLeadList: builder.query<LeadPage, LeadListParams>({
			query: (params) => ({
				url: '/leads',
				params: {
					page: params.page,
					limit: params.limit,
					sortBy: params.sortBy,
					sortDirection: params.sortDirection,
					search: params.search || undefined,
					status:
						params.status && params.status.length > 0
							? params.status.join(',')
							: undefined,
					temperature:
						params.temperature && params.temperature.length > 0
							? params.temperature.join(',')
							: undefined,
					source: params.source || undefined,
					createdFrom: params.createdFrom || undefined,
					createdTo: params.createdTo || undefined,
				},
			}),
			providesTags: ['Lead'],
		}),

		getLeadById: builder.query<LeadItem, string>({
			query: (id) => ({ url: `/leads/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Lead', id }],
		}),

		getLeadActivity: builder.query<LeadActivityEvent[], string>({
			query: (id) => ({ url: `/leads/${id}/activity` }),
			providesTags: (_, __, id) => [{ type: 'LeadActivity', id }],
		}),

		updateLead: builder.mutation<LeadItem, { id: string; body: Partial<LeadItem> }>({
			query: ({ id, body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_, __, { id }) => [
				'Lead',
				{ type: 'Lead', id },
				{ type: 'LeadActivity', id },
			],
		}),

		deleteLead: builder.mutation<void, string>({
			query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Lead'],
		}),

		createLead: builder.mutation<LeadItem, CreateLeadBody>({
			query: (body) => ({ url: '/leads', method: 'POST', body }),
			invalidatesTags: ['Lead'],
		}),
	}),
})

export const {
	useGetLeadListQuery,
	useGetLeadByIdQuery,
	useGetLeadActivityQuery,
	useUpdateLeadMutation,
	useDeleteLeadMutation,
	useCreateLeadMutation,
} = leadsApi
