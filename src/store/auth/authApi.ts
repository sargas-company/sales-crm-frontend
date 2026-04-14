import { baseApi } from '../../api/baseApi'

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
    }),

    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
})

export const { useLoginMutation, useLogoutUserMutation } = authApi
