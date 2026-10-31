import { baseApi } from '../../api/baseApi'
import type { JobPostItem, JobPostPage, JobPostListParams } from './types/definition'

type ApiPatch = ReturnType<ReturnType<typeof baseApi.util.updateQueryData>>

export const jobPostsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getJobPostList: builder.query<JobPostPage, JobPostListParams>({
			query: ({
				limit,
				offset,
				decision,
				priority,
				gate,
				status,
				minScore,
				maxScore,
				createdFrom,
				createdTo,
				sortBy,
				sortDirection,
				search,
				viewed,
				country,
			}) => ({
				url: '/job-posts',
				params: {
					limit,
					offset,
					decision,
					priority,
					gate,
					status,
					minScore,
					maxScore,
					createdFrom,
					createdTo,
					sortBy,
					sortDirection,
					search: search || undefined,
					viewed,
					country: country || undefined,
				},
			}),
			providesTags: ['JobPost'],
		}),

		getJobPostById: builder.query<JobPostItem, string>({
			query: (id) => ({ url: `/job-posts/${id}` }),
			providesTags: (_, __, id) => [{ type: 'JobPost', id }],
		}),

		convertJobPostToProposal: builder.mutation<unknown, string>({
			query: (id) => ({
				url: `/job-posts/${id}/to-proposal`,
				method: 'POST',
				body: { proposalType: 'Bid', boosted: false, connects: 0, boostedConnects: 0 },
			}),
		}),

		deleteJobPost: builder.mutation<void, string>({
			query: (id) => ({ url: `/job-posts/${id}`, method: 'DELETE' }),
			invalidatesTags: ['JobPost'],
		}),

		bulkDeleteJobPosts: builder.mutation<{ deleted: number }, string[]>({
			query: (ids) => ({
				url: '/job-posts/bulk-delete',
				method: 'POST',
				body: { ids },
			}),
			invalidatesTags: ['JobPost'],
		}),

		bulkAnalyzeJobPosts: builder.mutation<{ requeued: number }, string[]>({
			query: (ids) => ({
				url: '/job-posts/analyze',
				method: 'POST',
				body: { ids },
			}),
			invalidatesTags: ['JobPost'],
		}),

		bulkSkipJobPosts: builder.mutation<{ skipped: number }, string[]>({
			query: (ids) => ({
				url: '/job-posts/skip',
				method: 'POST',
				body: { ids },
			}),
			invalidatesTags: ['JobPost'],
		}),

		getJobPostCitySuggestions: builder.query<
			Array<{ city: string; country: string | null }>,
			{ q?: string; limit?: number }
		>({
			query: ({ q, limit }) => ({
				url: '/job-posts/city-suggestions',
				params: {
					...(q ? { q } : {}),
					...(limit ? { limit } : {}),
				},
			}),
		}),

		getJobPostAnalysisPreview: builder.query<
			{
				strategy: 'all' | 'recent' | 'new_posts_only' | 'cancel'
				snapshotAt: string
				toAnalyse: number
				toSkip: number
				totalBacklog: number
				costUsd: { min: number; max: number }
				assumptions: {
					pricingPerMTok: {
						haiku: { inputPerMTok: number; outputPerMTok: number }
						sonnet: { inputPerMTok: number; outputPerMTok: number }
					}
					avgTokens: {
						haiku: { input: number; output: number }
						sonnet: { input: number; output: number }
					}
					note: string
					usedUsageHistory: boolean
				}
			},
			{ strategy: 'all' | 'recent' | 'new_posts_only'; hours?: number }
		>({
			query: ({ strategy, hours }) => ({
				url: '/job-posts/analysis-preview',
				params: { strategy, ...(hours != null ? { hours } : {}) },
			}),
			// Not cached under a tag — the panel refetches whenever the
			// user flips strategy/period in the modal.
		}),

		enableJobPostAnalysis: builder.mutation<
			{
				strategy: 'all' | 'recent' | 'new_posts_only' | 'cancel'
				snapshotAt: string
				enqueued: number
				skipped: number
				analysisEnabled: boolean
			},
			{
				strategy: 'all' | 'recent' | 'new_posts_only' | 'cancel'
				recent?: { hours: number }
			}
		>({
			query: (body) => ({
				url: '/job-posts/enable-analysis',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['JobPost'],
		}),

		getJobPostNeighbor: builder.query<
			{ id: string | null },
			{
				id: string
				direction: 'prev' | 'next'
				params: Omit<JobPostListParams, 'limit' | 'offset'>
			}
		>({
			query: ({ id, direction, params }) => ({
				url: `/job-posts/${id}/neighbor`,
				params: { direction, ...params },
			}),
		}),

		getJobPostQueueStats: builder.query<
			{
				analysisEnabled: boolean
				/** Every status=NEW row — backlog + pending + enqueued + legacy. */
				totalNew: number
				/** status=NEW with enqueueState in {BACKLOG, NULL} — awaiting operator decision. */
				backlog: number
				/** status=NEW with enqueueState=PENDING — approved, waiting for next reconcile tick. */
				pending: number
				failed: number
				/** waiting + delayed + paused + prioritized in Redis, or null when Redis is unavailable. */
				inQueue: number | null
				/** BullMQ active jobs, or null when Redis is unavailable. */
				running: number | null
				redisAvailable: boolean
				queueWaiting: number | null
				queueDelayed: number | null
				queueActive: number | null
				queuePaused: number | null
				queuePrioritized: number | null
				lastUpdated: string
			},
			void
		>({
			query: () => ({ url: '/job-posts/queue-stats' }),
			providesTags: ['QueueStats'],
		}),

		/* Per-user "I opened this post" marker. Optimistic patch — we
		 * update every active list cache and the single-item cache for
		 * this id so the viewed dot shows up immediately on click. We do
		 * NOT invalidate the `JobPost` tag (that would refetch the whole
		 * list on every row click). */
		markJobPostViewed: builder.mutation<{ viewedAt: string }, string>({
			query: (id) => ({ url: `/job-posts/${id}/view`, method: 'POST' }),
			async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
				const nowIso = new Date().toISOString()
				const patches: ApiPatch[] = []

				/* Patch every active list-query cache that already provided
				 * the `JobPost` tag. Each cache entry is keyed by the exact
				 * JobPostListParams used to issue it, so we iterate and
				 * patch any entry whose data contains this post. */
				const invalidated = jobPostsApi.util.selectInvalidatedBy(
					getState() as Parameters<typeof jobPostsApi.util.selectInvalidatedBy>[0],
					[{ type: 'JobPost' }]
				)
				for (const entry of invalidated) {
					if (entry.endpointName !== 'getJobPostList') continue
					patches.push(
						dispatch(
							jobPostsApi.util.updateQueryData(
								'getJobPostList',
								entry.originalArgs as JobPostListParams,
								(draft) => {
									if (!draft || !Array.isArray(draft.data)) return
									const row = draft.data.find((r) => r.id === id)
									if (row) row.viewedAt = nowIso
								}
							)
						)
					)
				}

				patches.push(
					dispatch(
						jobPostsApi.util.updateQueryData('getJobPostById', id, (draft) => {
							if (!draft) return
							draft.viewedAt = nowIso
						})
					)
				)

				try {
					const { data } = await queryFulfilled
					dispatch(
						jobPostsApi.util.updateQueryData('getJobPostById', id, (draft) => {
							if (!draft) return
							draft.viewedAt = data.viewedAt
						})
					)
				} catch {
					patches.forEach((p) => p.undo())
				}
			},
		}),
	}),
})

export const {
	useGetJobPostListQuery,
	useLazyGetJobPostListQuery,
	useGetJobPostByIdQuery,
	useConvertJobPostToProposalMutation,
	useDeleteJobPostMutation,
	useBulkDeleteJobPostsMutation,
	useBulkAnalyzeJobPostsMutation,
	useBulkSkipJobPostsMutation,
	useEnableJobPostAnalysisMutation,
	useGetJobPostAnalysisPreviewQuery,
	useGetJobPostCitySuggestionsQuery,
	useGetJobPostQueueStatsQuery,
	useLazyGetJobPostNeighborQuery,
	useMarkJobPostViewedMutation,
} = jobPostsApi
