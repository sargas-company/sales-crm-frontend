import { baseApi } from '../../api/baseApi'

export interface PhoneService {
	id: string
	name: string
	slug: string
	createdAt: string
	updatedAt: string
	bindingsCount: number
}

export interface CreatePhoneServiceBody {
	name: string
	slug: string
}

export interface UpdatePhoneServiceBody {
	name?: string
	slug?: string
}

export const phoneServicesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listPhoneServices: builder.query<PhoneService[], { q?: string } | void>({
			query: (params) => ({ url: '/phone-services', params: params ?? {} }),
			providesTags: ['PhoneService'],
		}),
		getPhoneService: builder.query<PhoneService, string>({
			query: (id) => ({ url: `/phone-services/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'PhoneService', id }],
		}),
		createPhoneService: builder.mutation<PhoneService, CreatePhoneServiceBody>({
			query: (body) => ({ url: '/phone-services', method: 'POST', body }),
			invalidatesTags: ['PhoneService'],
		}),
		updatePhoneService: builder.mutation<
			PhoneService,
			{ id: string; body: UpdatePhoneServiceBody }
		>({
			query: ({ id, body }) => ({
				url: `/phone-services/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['PhoneService', 'PhoneBinding', 'PhoneNumber'],
		}),
		removePhoneService: builder.mutation<void, string>({
			query: (id) => ({ url: `/phone-services/${id}`, method: 'DELETE' }),
			invalidatesTags: ['PhoneService'],
		}),
	}),
})

export const {
	useListPhoneServicesQuery,
	useGetPhoneServiceQuery,
	useCreatePhoneServiceMutation,
	useUpdatePhoneServiceMutation,
	useRemovePhoneServiceMutation,
} = phoneServicesApi

/**
 * Progressive slugifier for the name field. Mirrors the regex used
 * server-side in the catalogue migration: lowercase → collapse any
 * non [a-z0-9_] run into "_" → trim leading non-letters.
 */
export const slugifyServiceName = (input: string): string =>
	input
		.toLowerCase()
		.replace(/[^a-z0-9_]+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
		.replace(/^[^a-z]+/, '')
