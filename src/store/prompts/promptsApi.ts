import { baseApi } from '../../api/baseApi'
import type {
	PromptItem,
	PromptPage,
	PromptListParams,
	CreatePromptDto,
	UpdatePromptDto,
} from './types/definition'

export const promptsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPromptList: builder.query<PromptPage, PromptListParams>({
			query: ({ page, limit, type, isActive }) => ({
				url: '/prompts',
				params: {
					page,
					limit,
					...(type !== undefined && { type }),
					...(isActive !== undefined && { isActive }),
				},
			}),
			providesTags: ['Prompt'],
		}),

		getPromptById: builder.query<PromptItem, string>({
			query: (id) => ({ url: `/prompts/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Prompt', id }],
		}),

		createPrompt: builder.mutation<PromptItem, CreatePromptDto>({
			query: (body) => ({ url: '/prompts', method: 'POST', body }),
			invalidatesTags: ['Prompt'],
		}),

		updatePrompt: builder.mutation<PromptItem, { id: string; body: UpdatePromptDto }>({
			query: ({ id, body }) => ({ url: `/prompts/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['Prompt'],
		}),

		activatePrompt: builder.mutation<PromptItem, string>({
			query: (id) => ({ url: `/prompts/${id}/activate`, method: 'PATCH' }),
			invalidatesTags: ['Prompt'],
		}),

		deletePrompt: builder.mutation<void, string>({
			query: (id) => ({ url: `/prompts/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Prompt'],
		}),
	}),
})

export const {
	useGetPromptListQuery,
	useGetPromptByIdQuery,
	useCreatePromptMutation,
	useUpdatePromptMutation,
	useActivatePromptMutation,
	useDeletePromptMutation,
} = promptsApi
