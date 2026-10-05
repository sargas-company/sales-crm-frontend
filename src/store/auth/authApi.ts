import { baseApi } from '../../api/baseApi'
import type { AuthRole } from './authSlice'

interface TokenPair {
	accessToken: string
	refreshToken: string
}

interface LoginRequest {
	email: string
	password: string
}

export interface MeResponse {
	id: string
	email: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	role: AuthRole | null
	permissions: string[]
}

export const authApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation<TokenPair, LoginRequest>({
			query: (credentials) => ({
				url: '/auth/login',
				method: 'POST',
				body: credentials,
			}),
		}),

		logoutUser: builder.mutation<void, void>({
			query: () => ({
				url: '/auth/logout',
				method: 'POST',
			}),
		}),

		// Loads the caller's identity, role and permissions from the
		// backend on every call (spec §3.1). Cached by RTK Query keyed
		// on `undefined`; callers use `refetch()` (login / refresh /
		// mount of a permission-gated route) to force a re-read.
		getMe: builder.query<MeResponse, void>({
			query: () => ({
				url: '/auth/me',
				method: 'GET',
			}),
		}),

		/** Edit own first/last name. Email + role stay immutable. */
		updateMe: builder.mutation<
			MeResponse,
			{ firstName?: string; lastName?: string }
		>({
			query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(authApi.util.updateQueryData('getMe', undefined, () => data))
				} catch {
					/* keep old */
				}
			},
		}),

		uploadAvatar: builder.mutation<MeResponse, File>({
			query: (file) => {
				const form = new FormData()
				form.append('file', file)
				return {
					url: '/auth/me/avatar',
					method: 'POST',
					body: form,
				}
			},
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(authApi.util.updateQueryData('getMe', undefined, () => data))
				} catch {
					/* keep old */
				}
			},
		}),

		removeAvatar: builder.mutation<MeResponse, void>({
			query: () => ({ url: '/auth/me/avatar', method: 'DELETE' }),
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(authApi.util.updateQueryData('getMe', undefined, () => data))
				} catch {
					/* keep old */
				}
			},
		}),

		/** Set the current user's avatar to one of the preset options. */
		setAvatarPreset: builder.mutation<MeResponse, { id: string }>({
			query: (body) => ({
				url: '/auth/me/avatar/preset',
				method: 'PATCH',
				body,
			}),
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(authApi.util.updateQueryData('getMe', undefined, () => data))
				} catch {
					/* keep old */
				}
			},
		}),
	}),
})

export const {
	useLoginMutation,
	useLogoutUserMutation,
	useGetMeQuery,
	useLazyGetMeQuery,
	useUpdateMeMutation,
	useUploadAvatarMutation,
	useRemoveAvatarMutation,
	useSetAvatarPresetMutation,
} = authApi
