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

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<AccountItem[], void>({
      query: () => ({ url: '/accounts' }),
      providesTags: ['Account'],
    }),
  }),
})

export const { useGetAccountsQuery } = accountsApi
