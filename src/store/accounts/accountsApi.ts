import { baseApi } from '../../api/baseApi'
import type { PlatformItem } from '../platforms/platformsApi'

export interface AccountItem {
  id: string;
  firstName: string;
  lastName: string;
  platformId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  platform: PlatformItem;
}

export interface CreateAccountBody {
  firstName: string;
  lastName: string;
  platformId: string;
}

export interface UpdateAccountBody {
  firstName?: string;
  lastName?: string;
  platformId?: string;
}

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<AccountItem[], void>({
      query: () => ({ url: '/accounts' }),
      providesTags: ['Account'],
    }),

    getAccountById: builder.query<AccountItem, string>({
      query: (id) => ({ url: `/accounts/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Account', id }],
    }),

    createAccount: builder.mutation<AccountItem, CreateAccountBody>({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),

    updateAccount: builder.mutation<AccountItem, { id: string; body: UpdateAccountBody }>({
      query: ({ id, body }) => ({ url: `/accounts/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => ['Account', { type: 'Account', id }],
    }),

    deleteAccount: builder.mutation<void, string>({
      query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Account'],
    }),
  }),
})

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApi
