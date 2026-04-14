import { baseApi } from '../../api/baseApi'
import { setCredentials, logout } from './authSlice'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface LoginRequest {
  email: string
  password: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TokenPair, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials(data))
        } catch {}
      },
    }),

    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled
        } finally {
          // Always clear local state even if request fails
          dispatch(logout())
        }
      },
    }),
  }),
})

export const { useLoginMutation, useLogoutUserMutation } = authApi
