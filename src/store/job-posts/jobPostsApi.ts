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
				status,
				minScore,
				maxScore,
				createdFrom,
				createdTo,
				sortBy,
				sortDirection,
				search,
			}) => ({
				url: '/job-posts',
				params: {
					limit,
					offset,
					decision,
					priority,
					status,
					minScore,
					maxScore,
					createdFrom,
					createdTo,
					sortBy,
					sortDirection,
					search: search || undefined,
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
							draft.viewedAt = nowIso
						})
					)
				)

				try {
					const { data } = await queryFulfilled
					dispatch(
						jobPostsApi.util.updateQueryData('getJobPostById', id, (draft) => {
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
	useGetJobPostByIdQuery,
	useConvertJobPostToProposalMutation,
	useDeleteJobPostMutation,
	useMarkJobPostViewedMutation,
} = jobPostsApi
