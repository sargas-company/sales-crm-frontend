import { baseApi } from '../../api/baseApi'

export const telegramApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		startTelegramAuth: builder.mutation<void, void>({
			query: () => ({ url: '/telegram/auth/start', method: 'POST' }),
		}),

		verifyTelegramAuth: builder.mutation<void, { code: string }>({
			query: (body) => ({ url: '/telegram/auth/verify', method: 'POST', body }),
			invalidatesTags: ['Setting'],
		}),

		logoutTelegramAuth: builder.mutation<void, void>({
			query: () => ({ url: '/telegram/auth/logout', method: 'POST' }),
			invalidatesTags: ['Setting'],
		}),
	}),
})

export const {
	useStartTelegramAuthMutation,
	useVerifyTelegramAuthMutation,
	useLogoutTelegramAuthMutation,
} = telegramApi
