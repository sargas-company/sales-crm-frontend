import { baseApi } from '../../api/baseApi'

export type LinkedInAccountType = 'PERSONAL' | 'COMPANY'

export interface LinkedInAccount {
	id: string
	displayName: string
	type: LinkedInAccountType
	profileUrl: string
	employeeId: string | null
	avatarUrl: string | null
	isActive: boolean
	note: string | null
	createdAt: string
	updatedAt: string
	employee?: {
		id: string
		firstName: string
		lastName: string
		positions: string[]
	} | null
	_count?: { posts: number }
}

export interface CreateLinkedInAccountBody {
	displayName: string
	type: LinkedInAccountType
	profileUrl: string
	employeeId?: string
	avatarUrl?: string
	isActive?: boolean
	note?: string
}

export type UpdateLinkedInAccountBody = Partial<CreateLinkedInAccountBody>

export type LinkedInAccountSortBy =
	| 'displayName'
	| 'type'
	| 'isActive'
	| 'createdAt'
	| 'updatedAt'

export interface ListLinkedInAccountsQuery {
	page?: number
	limit?: number
	search?: string
	type?: LinkedInAccountType
	status?: 'active' | 'inactive' | 'all'
	sortBy?: LinkedInAccountSortBy
	sortDir?: 'asc' | 'desc'
}

export interface LinkedInAccountListResponse {
	data: LinkedInAccount[]
	total: number
	page: number
	limit: number
}

export const linkedInAccountsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getLinkedInAccounts: builder.query<
			LinkedInAccountListResponse,
			ListLinkedInAccountsQuery
		>({
			query: (params) => ({ url: '/linkedin/accounts', params }),
			providesTags: (result) =>
				result
					? [
							...result.data.map((a) => ({
								type: 'LinkedInAccount' as const,
								id: a.id,
							})),
							{ type: 'LinkedInAccount' as const, id: 'LIST' },
						]
					: [{ type: 'LinkedInAccount' as const, id: 'LIST' }],
		}),
		getLinkedInAccountById: builder.query<LinkedInAccount, string>({
			query: (id) => ({ url: `/linkedin/accounts/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'LinkedInAccount', id }],
		}),
		createLinkedInAccount: builder.mutation<
			LinkedInAccount,
			CreateLinkedInAccountBody
		>({
			query: (body) => ({ url: '/linkedin/accounts', method: 'POST', body }),
			invalidatesTags: [{ type: 'LinkedInAccount', id: 'LIST' }],
		}),
		updateLinkedInAccount: builder.mutation<
			LinkedInAccount,
			{ id: string; body: UpdateLinkedInAccountBody }
		>({
			query: ({ id, body }) => ({
				url: `/linkedin/accounts/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_r, _e, { id }) => [
				{ type: 'LinkedInAccount', id },
				{ type: 'LinkedInAccount', id: 'LIST' },
			],
		}),
		deleteLinkedInAccount: builder.mutation<void, string>({
			query: (id) => ({ url: `/linkedin/accounts/${id}`, method: 'DELETE' }),
			invalidatesTags: [{ type: 'LinkedInAccount', id: 'LIST' }],
		}),
	}),
})

export const {
	useGetLinkedInAccountsQuery,
	useGetLinkedInAccountByIdQuery,
	useCreateLinkedInAccountMutation,
	useUpdateLinkedInAccountMutation,
	useDeleteLinkedInAccountMutation,
} = linkedInAccountsApi
