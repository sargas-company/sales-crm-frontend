import { baseApi } from '../../api/baseApi'
import type { ProposalItem } from './types/definition'

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	decision?: string
	createdAt: string
}

export const proposalsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProposalById: builder.query<ProposalItem, string>({
			query: (id) => ({ url: `/proposals/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Proposal', id }],
		}),

		getChatHistory: builder.query<ChatMessage[], string>({
			query: (id) => ({ url: `/proposals/${id}/chat` }),
			providesTags: (_, __, id) => [{ type: 'ProposalChat', id }],
		}),
	}),
})

export const { useGetProposalByIdQuery, useGetChatHistoryQuery } = proposalsApi
