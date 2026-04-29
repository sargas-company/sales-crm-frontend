import { baseApi } from '../../api/baseApi'
import type { SettingItem, SettingSection, UpdateSettingDto } from './types/definition'

export const settingsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getSettings: builder.query<SettingSection[], void>({
			query: () => ({ url: '/settings' }),
			providesTags: ['Setting'],
		}),

		getSettingByKey: builder.query<SettingItem, string>({
			query: (key) => ({ url: `/settings/${key}` }),
			providesTags: (_, __, key) => [{ type: 'Setting', id: key }],
		}),

		updateSetting: builder.mutation<void, { key: string; body: UpdateSettingDto }>({
			query: ({ key, body }) => ({ url: `/settings/${key}`, method: 'PATCH', body }),
			invalidatesTags: ['Setting'],
		}),
	}),
})

export const {
	useGetSettingsQuery,
	useGetSettingByKeyQuery,
	useUpdateSettingMutation,
} = settingsApi
