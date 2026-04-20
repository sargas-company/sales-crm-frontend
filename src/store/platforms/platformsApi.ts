import { baseApi } from '../../api/baseApi'

export interface PlatformItem {
	id: string
	title: string
	slug: string
	imageUrl: string | null
	createdAt: string
	updatedAt: string
}

export interface CreatePlatformBody {
	title: string
	slug: string
	imageUrl?: string
}

export interface UpdatePlatformBody {
	title?: string
	slug?: string
	imageUrl?: string
}

export const platformsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPlatforms: builder.query<PlatformItem[], void>({
			query: () => ({ url: '/platforms' }),
			providesTags: ['Platform'],
		}),

		getPlatformById: builder.query<PlatformItem, string>({
			query: (id) => ({ url: `/platforms/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Platform', id }],
		}),

		createPlatform: builder.mutation<PlatformItem, CreatePlatformBody>({
			query: (body) => ({ url: '/platforms', method: 'POST', body }),
			invalidatesTags: ['Platform'],
		}),

		updatePlatform: builder.mutation<PlatformItem, { id: string; body: UpdatePlatformBody }>({
			query: ({ id, body }) => ({ url: `/platforms/${id}`, method: 'PUT', body }),
			invalidatesTags: (_, __, { id }) => ['Platform', { type: 'Platform', id }],
		}),

		deletePlatform: builder.mutation<void, string>({
			query: (id) => ({ url: `/platforms/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Platform'],
		}),
	}),
})

export const {
	useGetPlatformsQuery,
	useGetPlatformByIdQuery,
	useCreatePlatformMutation,
	useUpdatePlatformMutation,
	useDeletePlatformMutation,
} = platformsApi
