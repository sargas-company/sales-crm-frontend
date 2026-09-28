import { baseApi } from '../../api/baseApi'
import type { ProposalItem } from './types/definition'

export const proposalsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProposalById: builder.query<ProposalItem, string>({
			query: (id) => ({ url: `/proposals/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Proposal', id }],
		}),
	}),
})

export const { useGetProposalByIdQuery } = proposalsApi
