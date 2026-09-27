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
	}),
})

export const { useLoginMutation, useLogoutUserMutation, useGetMeQuery, useLazyGetMeQuery } = authApi
