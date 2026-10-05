import { baseApi } from '../../api/baseApi'

export interface PaymentSource {
	id: string
	name: string
	description: string | null
	currency: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface CreatePaymentSourceBody {
	name: string
	description?: string
	currency?: string
	isActive?: boolean
}

export type UpdatePaymentSourceBody = Partial<CreatePaymentSourceBody>

export const paymentSourcesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPaymentSources: builder.query<PaymentSource[], void>({
			query: () => ({ url: '/payment-sources' }),
			providesTags: ['PaymentSource'],
		}),
		getPaymentSourceById: builder.query<PaymentSource, string>({
			query: (id) => ({ url: `/payment-sources/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'PaymentSource', id }],
		}),
		createPaymentSource: builder.mutation<PaymentSource, CreatePaymentSourceBody>({
			query: (body) => ({ url: '/payment-sources', method: 'POST', body }),
			invalidatesTags: ['PaymentSource'],
		}),
		updatePaymentSource: builder.mutation<
			PaymentSource,
			{ id: string; body: UpdatePaymentSourceBody }
		>({
			query: ({ id, body }) => ({
				url: `/payment-sources/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['PaymentSource'],
		}),
		deletePaymentSource: builder.mutation<void, string>({
			query: (id) => ({ url: `/payment-sources/${id}`, method: 'DELETE' }),
			invalidatesTags: ['PaymentSource'],
		}),
	}),
})

export const {
	useGetPaymentSourcesQuery,
	useGetPaymentSourceByIdQuery,
	useCreatePaymentSourceMutation,
	useUpdatePaymentSourceMutation,
	useDeletePaymentSourceMutation,
} = paymentSourcesApi
