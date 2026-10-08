import { baseApi } from '../../api/baseApi'
import type { LinkedInPostFormat } from '../linkedin-ideas/linkedInIdeasApi'

export type LinkedInPostStatus =
	| 'DRAFT'
	| 'READY'
	| 'SCHEDULED'
	| 'PUBLISHED'
	| 'ARCHIVED'

export interface LinkedInPost {
	id: string
	internalTitle: string
	accountId: string
	ideaId: string | null
	authorId: string | null
	body: string
	hook: string | null
	firstComment: string | null
	hashtags: string[]
	format: LinkedInPostFormat
	language: string
	targetAudience: string | null
	contentPillar: string | null
	attachments: unknown
	externalLink: string | null
	status: LinkedInPostStatus
	scheduledAt: string | null
	publishedAt: string | null
	linkedInUrl: string | null
	note: string | null
	impressions: number
	reactions: number
	comments: number
	reposts: number
	clicks: number
	followersGained: number
	leadsGenerated: number
	createdAt: string
	updatedAt: string
	engagementRate: number
	account?: {
		id: string
		displayName: string
		type: 'PERSONAL' | 'COMPANY'
		avatarUrl: string | null
		profileUrl: string
	}
	idea?: { id: string; title: string } | null
	author?: {
		id: string
		firstName: string
		lastName: string
		positions: string[]
	} | null
}

export interface CreateLinkedInPostBody {
	internalTitle: string
	accountId: string
	ideaId?: string
	authorId?: string
	body: string
	hook?: string
	firstComment?: string
	hashtags?: string[]
	format?: LinkedInPostFormat
	language?: string
	targetAudience?: string
	contentPillar?: string
	attachments?: Array<{ url: string; name?: string; type?: string }>
	externalLink?: string
	status?: LinkedInPostStatus
	scheduledAt?: string
	publishedAt?: string
	linkedInUrl?: string
	note?: string
	impressions?: number
	reactions?: number
	comments?: number
	reposts?: number
	clicks?: number
	followersGained?: number
	leadsGenerated?: number
}

export type UpdateLinkedInPostBody = Partial<CreateLinkedInPostBody>

export type LinkedInPostSortBy =
	| 'internalTitle'
	| 'status'
	| 'format'
	| 'scheduledAt'
	| 'publishedAt'
	| 'impressions'
	| 'createdAt'
	| 'updatedAt'

export interface ListLinkedInPostsQuery {
	page?: number
	limit?: number
	search?: string
	accountId?: string
	status?: LinkedInPostStatus
	format?: LinkedInPostFormat
	language?: string
	rangeStart?: string
	rangeEnd?: string
	sortBy?: LinkedInPostSortBy
	sortDir?: 'asc' | 'desc'
}

export interface LinkedInPostListResponse {
	data: LinkedInPost[]
	total: number
	page: number
	limit: number
}

export const linkedInPostsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getLinkedInPosts: builder.query<
			LinkedInPostListResponse,
			ListLinkedInPostsQuery
		>({
			query: (params) => ({ url: '/linkedin/posts', params }),
			providesTags: (result) =>
				result
					? [
							...result.data.map((p) => ({
								type: 'LinkedInPost' as const,
								id: p.id,
							})),
							{ type: 'LinkedInPost' as const, id: 'LIST' },
						]
					: [{ type: 'LinkedInPost' as const, id: 'LIST' }],
		}),
		getLinkedInPostById: builder.query<LinkedInPost, string>({
			query: (id) => ({ url: `/linkedin/posts/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'LinkedInPost', id }],
		}),
		createLinkedInPost: builder.mutation<LinkedInPost, CreateLinkedInPostBody>({
			query: (body) => ({ url: '/linkedin/posts', method: 'POST', body }),
			invalidatesTags: [
				{ type: 'LinkedInPost', id: 'LIST' },
				{ type: 'LinkedInIdea', id: 'LIST' },
			],
		}),
		updateLinkedInPost: builder.mutation<
			LinkedInPost,
			{ id: string; body: UpdateLinkedInPostBody }
		>({
			query: ({ id, body }) => ({
				url: `/linkedin/posts/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: (_r, _e, { id }) => [
				{ type: 'LinkedInPost', id },
				{ type: 'LinkedInPost', id: 'LIST' },
			],
		}),
		deleteLinkedInPost: builder.mutation<void, string>({
			query: (id) => ({ url: `/linkedin/posts/${id}`, method: 'DELETE' }),
			invalidatesTags: [{ type: 'LinkedInPost', id: 'LIST' }],
		}),
		bulkDeleteLinkedInPosts: builder.mutation<{ deleted: number }, string[]>({
			query: (ids) => ({
				url: '/linkedin/posts/bulk-delete',
				method: 'POST',
				body: { ids },
			}),
			invalidatesTags: [{ type: 'LinkedInPost', id: 'LIST' }],
		}),
	}),
})

export const {
	useGetLinkedInPostsQuery,
	useGetLinkedInPostByIdQuery,
	useCreateLinkedInPostMutation,
	useUpdateLinkedInPostMutation,
	useDeleteLinkedInPostMutation,
	useBulkDeleteLinkedInPostsMutation,
} = linkedInPostsApi
