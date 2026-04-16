import { baseApi } from '../../api/baseApi'

export interface PlatformItem {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const platformsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatforms: builder.query<PlatformItem[], void>({
      query: () => ({ url: '/platforms' }),
      providesTags: ['Platform'],
    }),
  }),
})

export const { useGetPlatformsQuery } = platformsApi
