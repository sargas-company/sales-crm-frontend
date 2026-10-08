import { baseApi } from '../../api/baseApi'

export type ApiClientStatus = 'ACTIVE' | 'ON_HOLD' | 'FORMER'

export interface ClientItem {
	id: string
	firstName: string
	lastName: string | null
	company: string | null
	email: string | null
	phone: string | null
	source: string | null
	profileUrl: string | null
	status: ApiClientStatus
	clientSince: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

export interface ClientPage {
	data: ClientItem[]
	total: number
}

export type ClientSortBy =
	| 'firstName'
	| 'company'
	| 'email'
	| 'phone'
	| 'status'
	| 'clientSince'
	| 'updatedAt'
	| 'createdAt'

export type ClientSortDirection = 'asc' | 'desc'

export interface ClientListParams {
	page: number
	limit: number
	sortBy?: ClientSortBy
	sortDirection?: ClientSortDirection
	search?: string
	status?: ApiClientStatus
	source?: string
	clientSinceFrom?: string
	clientSinceTo?: string
}

export interface CreateClientBody {
	firstName: string
	lastName?: string | null
	company?: string | null
	email?: string | null
	phone?: string | null
	source?: string | null
	profileUrl?: string | null
	status?: ApiClientStatus
	clientSince?: string | null
	notes?: string | null
}

export type UpdateClientBody = Partial<CreateClientBody>

export interface ClientActivityEvent {
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

export const clientsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getClients: builder.query<ClientPage, ClientListParams>({
			query: (params) => ({
				url: '/clients',
				params: {
					page: params.page,
					limit: params.limit,
					sortBy: params.sortBy,
					sortDirection: params.sortDirection,
					search: params.search || undefined,
					status: params.status || undefined,
					source: params.source || undefined,
					clientSinceFrom: params.clientSinceFrom || undefined,
					clientSinceTo: params.clientSinceTo || undefined,
				},
			}),
			providesTags: ['Client'],
		}),

		getClientById: builder.query<ClientItem, string>({
			query: (id) => ({ url: `/clients/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Client', id }],
		}),

		getClientActivity: builder.query<ClientActivityEvent[], string>({
			query: (id) => ({ url: `/clients/${id}/activity` }),
			providesTags: (_, __, id) => [{ type: 'ClientActivity', id }],
		}),

		getClientDuplicates: builder.query<
			ClientItem[],
			{ email?: string; phone?: string; excludeId?: string }
		>({
			query: (params) => ({
				url: '/clients/duplicates',
				params: {
					email: params.email || undefined,
					phone: params.phone || undefined,
					excludeId: params.excludeId || undefined,
				},
			}),
		}),

		createClient: builder.mutation<ClientItem, CreateClientBody>({
			query: (body) => ({ url: '/clients', method: 'POST', body }),
			invalidatesTags: ['Client'],
		}),

		updateClient: builder.mutation<
			ClientItem,
			{ id: string; body: UpdateClientBody }
		>({
			query: ({ id, body }) => ({
				url: `/clients/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_, __, { id }) => [
				'Client',
				{ type: 'Client', id },
				{ type: 'ClientActivity', id },
			],
		}),

		deleteClient: builder.mutation<void, string>({
			query: (id) => ({ url: `/clients/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Client'],
		}),
	}),
})

export const {
	useGetClientsQuery,
	useGetClientByIdQuery,
	useGetClientActivityQuery,
	useGetClientDuplicatesQuery,
	useCreateClientMutation,
	useUpdateClientMutation,
	useDeleteClientMutation,
} = clientsApi
