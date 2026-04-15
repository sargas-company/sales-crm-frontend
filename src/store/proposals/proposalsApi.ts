import { baseApi } from '../../api/baseApi'
import type { ProposalItem, ProposalPage, ProposalListParams } from './types/definition'

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  decision?: string;
  createdAt: string;
}

export const proposalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProposalList: builder.query<ProposalPage, ProposalListParams>({
      query: ({ page, limit }) => ({ url: '/proposals', params: { page, limit } }),
      providesTags: ['Proposal'],
    }),

    getProposalById: builder.query<ProposalItem, string>({
      query: (id) => ({ url: `/proposals/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Proposal', id }],
    }),

    createProposal: builder.mutation<ProposalItem, Partial<ProposalItem>>({
      query: (body) => ({ url: '/proposals', method: 'POST', body }),
      invalidatesTags: ['Proposal'],
    }),

    updateProposal: builder.mutation<ProposalItem, { id: string; body: Partial<ProposalItem> }>({
      query: ({ id, body }) => ({ url: `/proposals/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => ['Proposal', { type: 'Proposal', id }],
    }),

    deleteProposal: builder.mutation<void, string>({
      query: (id) => ({ url: `/proposals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Proposal'],
    }),

    getChatHistory: builder.query<ChatMessage[], string>({
      query: (id) => ({ url: `/proposals/${id}/chat` }),
      providesTags: (_, __, id) => [{ type: 'ProposalChat', id }],
    }),

    sendChatMessage: builder.mutation<ChatMessage[], { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/proposals/${id}/chat`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'ProposalChat', id }],
    }),
  }),
})

export const {
  useGetProposalListQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useDeleteProposalMutation,
  useGetChatHistoryQuery,
  useSendChatMessageMutation,
} = proposalsApi
