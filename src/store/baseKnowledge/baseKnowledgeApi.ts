import { baseApi } from '../../api/baseApi'

export interface BaseKnowledgeItem {
	id: string
	title: string
	description: string
	category: string
	userId: string
	createdAt: string
	updatedAt: string
}

export interface CreateBaseKnowledgeDto {
	title: string
	description: string
	category: string
}

export interface UpdateBaseKnowledgeDto {
	title: string
	description: string
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
			query: ({ page, limit }) => ({ url: '/base-knowledge', params: { page, limit } }),
			providesTags: ['BaseKnowledge'],
		}),

		getBaseKnowledgeItem: builder.query<BaseKnowledgeItem, string>({
			query: (id) => ({ url: `/base-knowledge/${id}` }),
			providesTags: ['BaseKnowledge'],
		}),

		createBaseKnowledge: builder.mutation<BaseKnowledgeItem, CreateBaseKnowledgeDto>({
			query: (body) => ({ url: '/base-knowledge', method: 'POST', body }),
			invalidatesTags: ['BaseKnowledge'],
		}),

		updateBaseKnowledge: builder.mutation<
			BaseKnowledgeItem,
			{ id: string; body: UpdateBaseKnowledgeDto }
		>({
			query: ({ id, body }) => ({ url: `/base-knowledge/${id}`, method: 'PUT', body }),
			invalidatesTags: ['BaseKnowledge'],
		}),

		deleteBaseKnowledge: builder.mutation<void, string>({
			query: (id) => ({ url: `/base-knowledge/${id}`, method: 'DELETE' }),
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
