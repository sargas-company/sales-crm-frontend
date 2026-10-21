import { baseApi } from '../../api/baseApi'

export interface PositionItem {
	id: string
	title: string
	slug: string
	createdAt: string
	updatedAt: string
}

export interface CreatePositionBody {
	title: string
	slug: string
}

export interface UpdatePositionBody {
	title?: string
	slug?: string
}

export const positionsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPositions: builder.query<PositionItem[], void>({
			query: () => ({ url: '/positions' }),
			providesTags: ['Position'],
		}),

		getPositionById: builder.query<PositionItem, string>({
			query: (id) => ({ url: `/positions/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Position', id }],
		}),

		createPosition: builder.mutation<PositionItem, CreatePositionBody>({
			query: (body) => ({ url: '/positions', method: 'POST', body }),
			invalidatesTags: ['Position'],
		}),

		updatePosition: builder.mutation<PositionItem, { id: string; body: UpdatePositionBody }>({
			query: ({ id, body }) => ({ url: `/positions/${id}`, method: 'PUT', body }),
			invalidatesTags: (_, __, { id }) => ['Position', { type: 'Position', id }],
		}),

		deletePosition: builder.mutation<void, string>({
			query: (id) => ({ url: `/positions/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Position'],
		}),
	}),
})

export const {
	useGetPositionsQuery,
	useGetPositionByIdQuery,
	useCreatePositionMutation,
	useUpdatePositionMutation,
	useDeletePositionMutation,
} = positionsApi
