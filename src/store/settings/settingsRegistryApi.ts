import { baseApi } from '../../api/baseApi'

export type RegistryType =
	| 'boolean'
	| 'number'
	| 'string'
	| 'select'
	| 'duration_minutes'
	| 'duration_seconds'
	| 'percentage'
	| 'weekdays'
	| 'currency'

export type RegistrySection =
	| 'general'
	| 'scanner_alerts'
	| 'client_invoicing'
	| 'people_time_off'
	| 'payroll_compensation'
	| 'credentials_security'
	| 'phone_alerts'
	| 'phone_defaults'
	| 'portfolio'
	| 'integrations'

export interface SettingsEntry {
	key: string
	label: string
	description: string
	type: RegistryType
	value: unknown
	source: 'db' | 'default'
	canEdit: boolean
	readOnly: boolean
	dangerous: boolean
	options?: Array<{ value: string; label: string }>
	min?: number
	max?: number
	step?: number
	unit?: string
	effectHint?: string
	updatedAt?: string | null
	updatedBy?: string | null
}

export interface SettingsSection {
	key: RegistrySection
	title: string
	description: string
	order: number
	ownerOnly: boolean
	entries: SettingsEntry[]
}

export interface SettingsStatus {
	scanner: {
		ingestionEnabled: boolean
		analysisEnabled: boolean
	}
	vibeWorker: {
		configured: boolean
		lastEventReceivedAt: string | null
		lastEventId: string | null
	}
	jobPosts: {
		lastProcessedAt: string | null
		lastStatus: string | null
		lastScore: number | null
	}
	discord: {
		configured: boolean
		alertsEnabled: boolean
		scoreThreshold: number
		usedBy?: string[]
	}
	vault: {
		activeSessions: number
	}
}

export const settingsRegistryApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getSettingsSections: builder.query<SettingsSection[], void>({
			query: () => ({ url: '/settings-registry/sections' }),
			providesTags: ['Setting'],
		}),
		updateSettingsSection: builder.mutation<
			SettingsSection,
			{ section: RegistrySection; values: Record<string, unknown> }
		>({
			query: (body) => ({
				url: '/settings-registry/sections',
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['Setting'],
		}),
		getSettingsStatus: builder.query<SettingsStatus, void>({
			query: () => ({ url: '/settings-registry/status' }),
			providesTags: ['Setting'],
		}),
		testDiscord: builder.mutation<{ ok: true }, void>({
			query: () => ({
				url: '/settings-registry/integrations/discord/test',
				method: 'POST',
			}),
		}),
		endAllVaultSessions: builder.mutation<
			{ endedSessionCount: number },
			void
		>({
			query: () => ({
				url: '/settings-registry/vault/sessions/end-all',
				method: 'POST',
			}),
		}),
		testPhoneAlertPing: builder.mutation<
			{ success: boolean; message?: string },
			void
		>({
			query: () => ({
				url: '/phone-numbers/maintenance/alerts/test',
				method: 'POST',
			}),
		}),
	}),
})

export const {
	useGetSettingsSectionsQuery,
	useUpdateSettingsSectionMutation,
	useGetSettingsStatusQuery,
	useTestDiscordMutation,
	useEndAllVaultSessionsMutation,
	useTestPhoneAlertPingMutation,
} = settingsRegistryApi
