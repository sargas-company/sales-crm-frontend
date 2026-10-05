import { baseApi } from '../../api/baseApi'

export type LinkedInIdeaStatus = 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'ARCHIVED'
export type LinkedInIdeaPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type LinkedInPostFormat =
	| 'TEXT'
	| 'IMAGE'
	| 'VIDEO'
	| 'DOCUMENT'
	| 'LINK'
	| 'POLL'

export interface LinkedInIdeaPostSummary {
	id: string
	internalTitle: string
	status: string
	publishedAt: string | null
	scheduledAt: string | null
}

export interface LinkedInIdea {
	id: string
	title: string
	content: string
	hook: string | null
	targetAudience: string | null
	contentPillar: string | null
	suggestedFormat: LinkedInPostFormat | null
	language: string
	priority: LinkedInIdeaPriority
	status: LinkedInIdeaStatus
	tags: string[]
	referenceLinks: string[]
	attachments: unknown
	ownerId: string | null
	plannedDate: string | null
	note: string | null
	createdAt: string
	updatedAt: string
	owner?: {
		id: string
		firstName: string
		lastName: string
		positions: string[]
	} | null
	posts?: LinkedInIdeaPostSummary[]
	_count?: { posts: number }
}

export interface CreateLinkedInIdeaBody {
	title: string
	content: string
	hook?: string
	targetAudience?: string
	contentPillar?: string
	suggestedFormat?: LinkedInPostFormat
	language?: string
	priority?: LinkedInIdeaPriority
	status?: LinkedInIdeaStatus
	tags?: string[]
	referenceLinks?: string[]
	attachments?: Array<{ url: string; name?: string; type?: string }>
	ownerId?: string
	plannedDate?: string
	note?: string
}

export type UpdateLinkedInIdeaBody = Partial<CreateLinkedInIdeaBody>

export type LinkedInIdeaSortBy =
	| 'title'
	| 'status'
	| 'priority'
	| 'plannedDate'
	| 'createdAt'
	| 'updatedAt'

export interface ListLinkedInIdeasQuery {
	page?: number
	limit?: number
	search?: string
	status?: LinkedInIdeaStatus
	priority?: LinkedInIdeaPriority
	language?: string
	sortBy?: LinkedInIdeaSortBy
	sortDir?: 'asc' | 'desc'
}

export interface LinkedInIdeaListResponse {
	data: LinkedInIdea[]
	total: number
	page: number
	limit: number
}

export const linkedInIdeasApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getLinkedInIdeas: builder.query<
			LinkedInIdeaListResponse,
			ListLinkedInIdeasQuery
		>({
			query: (params) => ({ url: '/linkedin/ideas', params }),
			providesTags: (result) =>
				result
					? [
							...result.data.map((i) => ({
								type: 'LinkedInIdea' as const,
								id: i.id,
							})),
							{ type: 'LinkedInIdea' as const, id: 'LIST' },
						]
					: [{ type: 'LinkedInIdea' as const, id: 'LIST' }],
		}),
		getLinkedInIdeaById: builder.query<LinkedInIdea, string>({
			query: (id) => ({ url: `/linkedin/ideas/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'LinkedInIdea', id }],
		}),
		createLinkedInIdea: builder.mutation<LinkedInIdea, CreateLinkedInIdeaBody>({
			query: (body) => ({ url: '/linkedin/ideas', method: 'POST', body }),
			invalidatesTags: [{ type: 'LinkedInIdea', id: 'LIST' }],
		}),
		updateLinkedInIdea: builder.mutation<
			LinkedInIdea,
			{ id: string; body: UpdateLinkedInIdeaBody }
		>({
			query: ({ id, body }) => ({
				url: `/linkedin/ideas/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_r, _e, { id }) => [
				{ type: 'LinkedInIdea', id },
				{ type: 'LinkedInIdea', id: 'LIST' },
			],
		}),
		deleteLinkedInIdea: builder.mutation<void, string>({
			query: (id) => ({ url: `/linkedin/ideas/${id}`, method: 'DELETE' }),
			invalidatesTags: [{ type: 'LinkedInIdea', id: 'LIST' }],
		}),
	}),
})

export const {
	useGetLinkedInIdeasQuery,
	useGetLinkedInIdeaByIdQuery,
	useCreateLinkedInIdeaMutation,
	useUpdateLinkedInIdeaMutation,
	useDeleteLinkedInIdeaMutation,
} = linkedInIdeasApi
