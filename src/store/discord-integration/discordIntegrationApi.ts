import { baseApi } from '../../api/baseApi'

export type DiscordProfileName = 'TEST' | 'PRODUCTION'

export type DiscordPreviewJob =
	| 'REPORT'
	| 'LATE_REPORT'
	| 'BIRTHDAY'
	| 'ABSENCES'
	| 'REMINDER_18'
	| 'DAILY_DIGEST_19'
	| 'WEEKLY_DIGEST'

export type VerifyChannelKey =
	| 'pmsChannelId'
	| 'generalChannelId'
	| 'salesChannelId'
	| 'opsChannelId'

export interface DiscordProfileView {
	id: string
	name: DiscordProfileName
	active: boolean
	guildId: string | null
	pmsChannelId: string | null
	generalChannelId: string | null
	salesChannelId: string | null
	opsChannelId: string | null
	managerRoleId: string | null
	reportsEnabled: boolean
	birthdaysEnabled: boolean
	absencesEnabled: boolean
	weeklyEnabled: boolean
	cutoffHour: number
	reminderAt: string
	dailyDigestAt: string
	weeklyDigestDay: number
	weeklyDigestAt: string
	birthdayAt: string
	absencesAt: string
	timezone: string
	lastVerifiedAt: string | null
	lastVerificationError: string | null
	lastSuccessAt: string | null
	lastFailureAt: string | null
	lastFailureMessage: string | null
	configured: boolean
	envStatus: { appIdSet: boolean; publicKeySet: boolean; botTokenSet: boolean }
	createdAt: string
	updatedAt: string
}

export interface UpdateDiscordProfileBody {
	guildId?: string | null
	pmsChannelId?: string | null
	generalChannelId?: string | null
	salesChannelId?: string | null
	opsChannelId?: string | null
	managerRoleId?: string | null
	reportsEnabled?: boolean
	birthdaysEnabled?: boolean
	absencesEnabled?: boolean
	weeklyEnabled?: boolean
	cutoffHour?: number
	reminderAt?: string
	dailyDigestAt?: string
	weeklyDigestDay?: number
	weeklyDigestAt?: string
	birthdayAt?: string
	absencesAt?: string
	timezone?: string
}

export interface DiscordVerifyResult {
	profileName: DiscordProfileName
	guild: { configured: boolean; ok: boolean; name?: string; error?: string }
	channels: Record<
		VerifyChannelKey,
		{ configured: boolean; ok: boolean; name?: string; error?: string }
	>
	role: { configured: boolean; ok: boolean; name?: string; error?: string }
	botInGuild: { ok: boolean; roleCount?: number; error?: string }
	checkedAt: string
}

export const discordIntegrationApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listDiscordProfiles: builder.query<DiscordProfileView[], void>({
			query: () => ({ url: '/discord-integration/profiles' }),
			providesTags: (res) =>
				res
					? [
							...res.map((p) => ({ type: 'DiscordProfile' as const, id: p.name })),
							{ type: 'DiscordProfile' as const, id: 'LIST' },
						]
					: [{ type: 'DiscordProfile' as const, id: 'LIST' }],
		}),
		updateDiscordProfile: builder.mutation<
			DiscordProfileView,
			{ name: DiscordProfileName; body: UpdateDiscordProfileBody }
		>({
			query: ({ name, body }) => ({
				url: `/discord-integration/profiles/${name}`,
				method: 'PATCH',
				data: body,
			}),
			invalidatesTags: (_r, _e, { name }) => [
				{ type: 'DiscordProfile', id: name },
				{ type: 'DiscordProfile', id: 'LIST' },
			],
		}),
		activateDiscordProfile: builder.mutation<DiscordProfileView, DiscordProfileName>({
			query: (name) => ({
				url: `/discord-integration/profiles/${name}/activate`,
				method: 'POST',
			}),
			invalidatesTags: [{ type: 'DiscordProfile', id: 'LIST' }],
		}),
		verifyDiscordProfile: builder.mutation<DiscordVerifyResult, DiscordProfileName>({
			query: (name) => ({
				url: `/discord-integration/profiles/${name}/verify`,
				method: 'POST',
			}),
			invalidatesTags: (_r, _e, name) => [{ type: 'DiscordProfile', id: name }],
		}),
		sendDiscordTest: builder.mutation<{ ok: true; messageId: string }, DiscordProfileName>({
			query: (name) => ({
				url: `/discord-integration/profiles/${name}/send-test`,
				method: 'POST',
			}),
		}),
		sendDiscordPreview: builder.mutation<
			{ ok: true; messageId: string; channel: VerifyChannelKey },
			{ name: DiscordProfileName; job: DiscordPreviewJob }
		>({
			query: ({ name, job }) => ({
				url: `/discord-integration/profiles/${name}/send-preview?job=${job}`,
				method: 'POST',
			}),
		}),
	}),
})

export const {
	useListDiscordProfilesQuery,
	useUpdateDiscordProfileMutation,
	useActivateDiscordProfileMutation,
	useVerifyDiscordProfileMutation,
	useSendDiscordTestMutation,
	useSendDiscordPreviewMutation,
} = discordIntegrationApi
