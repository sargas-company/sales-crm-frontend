import { baseApi } from '../../api/baseApi'

export type UpworkChangeLogSection =
	| 'title'
	| 'overview'
	| 'skills'
	| 'portfolio'
	| 'project_catalog'
	| 'consultation'
	| 'certificate'
	| 'employment_history'
	| 'other_experience'

export const UPWORK_CHANGELOG_SECTIONS: UpworkChangeLogSection[] = [
	'title',
	'overview',
	'skills',
	'portfolio',
	'project_catalog',
	'consultation',
	'certificate',
	'employment_history',
	'other_experience',
]

/* Section labels — human-readable text for every section (enum
 * keys read fine with `_` → ` `, kept explicit for clarity). */
export const UPWORK_SECTION_LABEL: Record<UpworkChangeLogSection, string> = {
	title: 'title',
	overview: 'overview',
	skills: 'skills',
	portfolio: 'portfolio',
	project_catalog: 'project catalog',
	consultation: 'consultation',
	certificate: 'certificate',
	employment_history: 'employment history',
	other_experience: 'other experience',
}

export type UpworkProfileTier = 'primary' | 'secondary'

export const UPWORK_PROFILE_TIERS: UpworkProfileTier[] = ['primary', 'secondary']

export const UPWORK_PROFILE_TIER_LABEL: Record<UpworkProfileTier, string> = {
	primary: 'Primary',
	secondary: 'Secondary',
}

export interface UpworkProfile {
	id: string
	firstName: string
	lastName: string | null
	tier: UpworkProfileTier
	url: string | null
	note: string | null
	active: boolean
	createdAt: string
	updatedAt: string
}

export const upworkProfileName = (
	p: Pick<UpworkProfile, 'firstName' | 'lastName'>,
): string => `${p.firstName} ${p.lastName ?? ''}`.trim()

export interface UpworkChangeLog {
	id: string
	date: string
	profileId: string
	section: UpworkChangeLogSection
	note: string
	createdAt: string
	updatedAt: string
	profile: {
		id: string
		firstName: string
		lastName: string | null
	}
}

export interface UpworkSnapshotPosition {
	id: string
	phrase: string
	position: number
}

export interface UpworkSnapshot {
	id: string
	date: string
	profileId: string
	views: number
	invites: number
	directMessages: number
	createdAt: string
	updatedAt: string
	positions: UpworkSnapshotPosition[]
}

export interface UpworkReminder {
	key: string
	label: string
	severity: 'info' | 'warn'
	days: number
	context?: string
}

export interface UpworkAnalytics {
	profile: { id: string; name: string }
	weekly: Array<{
		weekStart: string
		views: number
		invites: number
		directMessages: number
	}>
	positionsWeekly: Array<{
		weekStart: string
		byPhrase: Record<string, number>
	}>
	titlePhrases: string[]
	changeLogMarkers: Array<{ date: string; section: string; note: string }>
	viewsPerInvite4w: {
		value: number | null
		warn: boolean
		threshold: number
		views: number
		invites: number
	}
}

export const upworkApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		/* Profiles */
		listUpworkProfiles: builder.query<UpworkProfile[], void>({
			query: () => ({ url: '/upwork/profiles', method: 'GET' }),
			providesTags: ['UpworkProfile'],
		}),
		getUpworkProfile: builder.query<UpworkProfile, string>({
			query: (id) => ({ url: `/upwork/profiles/${id}`, method: 'GET' }),
			providesTags: ['UpworkProfile'],
		}),
		createUpworkProfile: builder.mutation<
			UpworkProfile,
			Omit<UpworkProfile, 'id' | 'createdAt' | 'updatedAt'>
		>({
			query: (body) => ({ url: '/upwork/profiles', method: 'POST', body }),
			invalidatesTags: ['UpworkProfile'],
		}),
		updateUpworkProfile: builder.mutation<
			UpworkProfile,
			{ id: string; patch: Partial<UpworkProfile> }
		>({
			query: ({ id, patch }) => ({
				url: `/upwork/profiles/${id}`,
				method: 'PATCH',
				body: patch,
			}),
			invalidatesTags: ['UpworkProfile'],
		}),
		deleteUpworkProfile: builder.mutation<void, string>({
			query: (id) => ({ url: `/upwork/profiles/${id}`, method: 'DELETE' }),
			invalidatesTags: ['UpworkProfile'],
		}),

		/* Change log */
		listUpworkChangeLog: builder.query<
			UpworkChangeLog[],
			{
				profileId?: string
				section?: UpworkChangeLogSection
				from?: string
				to?: string
			}
		>({
			query: (params) => ({ url: '/upwork/change-log', method: 'GET', params }),
			providesTags: ['UpworkChangeLog'],
		}),
		getUpworkChangeLog: builder.query<UpworkChangeLog, string>({
			query: (id) => ({ url: `/upwork/change-log/${id}`, method: 'GET' }),
			providesTags: ['UpworkChangeLog'],
		}),
		createUpworkChangeLog: builder.mutation<
			UpworkChangeLog,
			{
				date: string
				profileId: string
				section: UpworkChangeLogSection
				note: string
			}
		>({
			query: (body) => ({
				url: '/upwork/change-log',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['UpworkChangeLog', 'UpworkReminders'],
		}),
		updateUpworkChangeLog: builder.mutation<
			UpworkChangeLog,
			{
				id: string
				patch: Partial<{
					date: string
					profileId: string
					section: UpworkChangeLogSection
					note: string
				}>
			}
		>({
			query: ({ id, patch }) => ({
				url: `/upwork/change-log/${id}`,
				method: 'PATCH',
				body: patch,
			}),
			invalidatesTags: ['UpworkChangeLog', 'UpworkReminders'],
		}),
		deleteUpworkChangeLog: builder.mutation<void, string>({
			query: (id) => ({ url: `/upwork/change-log/${id}`, method: 'DELETE' }),
			invalidatesTags: ['UpworkChangeLog', 'UpworkReminders'],
		}),

		/* Snapshots */
		listUpworkSnapshots: builder.query<
			UpworkSnapshot[],
			{ profileId?: string; from?: string; to?: string }
		>({
			query: (params) => ({
				url: '/upwork/snapshots',
				method: 'GET',
				params,
			}),
			providesTags: ['UpworkSnapshot'],
		}),
		createUpworkSnapshot: builder.mutation<
			UpworkSnapshot,
			{
				date: string
				profileId: string
				views: number
				invites: number
				directMessages: number
				positions?: Array<{ phrase: string; position: number }>
			}
		>({
			query: (body) => ({
				url: '/upwork/snapshots',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['UpworkSnapshot', 'UpworkReminders', 'UpworkAnalytics'],
		}),
		updateUpworkSnapshot: builder.mutation<
			UpworkSnapshot,
			{
				id: string
				patch: Partial<{
					date: string
					views: number
					invites: number
					directMessages: number
					positions: Array<{ phrase: string; position: number }>
				}>
			}
		>({
			query: ({ id, patch }) => ({
				url: `/upwork/snapshots/${id}`,
				method: 'PATCH',
				body: patch,
			}),
			invalidatesTags: ['UpworkSnapshot', 'UpworkAnalytics'],
		}),
		deleteUpworkSnapshot: builder.mutation<void, string>({
			query: (id) => ({ url: `/upwork/snapshots/${id}`, method: 'DELETE' }),
			invalidatesTags: ['UpworkSnapshot', 'UpworkAnalytics'],
		}),

		/* Reminders */
		getUpworkReminders: builder.query<UpworkReminder[], string>({
			query: (profileId) => ({
				url: '/upwork/reminders',
				method: 'GET',
				params: { profileId },
			}),
			providesTags: ['UpworkReminders'],
		}),

		/* Analytics */
		getUpworkAnalytics: builder.query<
			UpworkAnalytics,
			{ profileId: string; from?: string; to?: string }
		>({
			query: (params) => ({
				url: '/upwork/analytics',
				method: 'GET',
				params,
			}),
			providesTags: ['UpworkAnalytics'],
		}),
	}),
})

export const {
	useListUpworkProfilesQuery,
	useGetUpworkProfileQuery,
	useCreateUpworkProfileMutation,
	useUpdateUpworkProfileMutation,
	useDeleteUpworkProfileMutation,
	useListUpworkChangeLogQuery,
	useGetUpworkChangeLogQuery,
	useCreateUpworkChangeLogMutation,
	useUpdateUpworkChangeLogMutation,
	useDeleteUpworkChangeLogMutation,
	useListUpworkSnapshotsQuery,
	useCreateUpworkSnapshotMutation,
	useUpdateUpworkSnapshotMutation,
	useDeleteUpworkSnapshotMutation,
	useGetUpworkRemindersQuery,
	useGetUpworkAnalyticsQuery,
} = upworkApi
