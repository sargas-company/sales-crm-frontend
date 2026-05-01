import { baseApi } from '../../api/baseApi'

export interface BaseKnowledgeItem {
	id: string
	title: string
	content: string
	category: string
	createdAt: string
	updatedAt: string
}

export interface IngestResult {
	documentId: string
}

export interface CreateBaseKnowledgeDto {
	title?: string
	content: string
	category?: string
}

export interface UpdateBaseKnowledgeDto {
	title: string
	content: string
	category: string
}

export interface BaseKnowledgePage {
	data: BaseKnowledgeItem[]
	total: number
}

export interface BaseKnowledgeListParams {
	page: number
	limit: number
}

export const baseKnowledgeApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getBaseKnowledgeList: builder.query<BaseKnowledgePage, BaseKnowledgeListParams>({
			query: ({ page, limit }) => ({ url: '/knowledge', params: { page, limit } }),
			providesTags: ['BaseKnowledge'],
		}),

		getBaseKnowledgeItem: builder.query<BaseKnowledgeItem, string>({
			query: (id) => ({ url: `/knowledge/${id}` }),
			providesTags: ['BaseKnowledge'],
		}),

		createBaseKnowledge: builder.mutation<IngestResult, CreateBaseKnowledgeDto>({
			query: (body) => ({ url: '/knowledge/ingest', method: 'POST', body }),
			invalidatesTags: ['BaseKnowledge'],
		}),

		updateBaseKnowledge: builder.mutation<
			BaseKnowledgeItem,
			{ id: string; body: UpdateBaseKnowledgeDto }
		>({
			query: ({ id, body }) => ({ url: `/knowledge/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['BaseKnowledge'],
		}),

		deleteBaseKnowledge: builder.mutation<void, string>({
			query: (id) => ({ url: `/knowledge/${id}`, method: 'DELETE' }),
			invalidatesTags: ['BaseKnowledge'],
		}),
	}),
})

export const {
	useGetBaseKnowledgeListQuery,
	useGetBaseKnowledgeItemQuery,
	useCreateBaseKnowledgeMutation,
	useUpdateBaseKnowledgeMutation,
	useDeleteBaseKnowledgeMutation,
} = baseKnowledgeApi
