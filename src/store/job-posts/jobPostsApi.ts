import { baseApi } from '../../api/baseApi'
import type { JobPostItem, JobPostPage, JobPostListParams } from './types/definition'

export const jobPostsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getJobPostList: builder.query<JobPostPage, JobPostListParams>({
			query: ({ limit, offset, decision, priority, sortBy }) => ({
				url: '/job-posts',
				params: { limit, offset, decision, priority, sortBy },
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
	}),
})

export const { useGetJobPostListQuery, useGetJobPostByIdQuery, useConvertJobPostToProposalMutation } = jobPostsApi
