import { baseApi } from '../../api/baseApi'

export type UpworkReferenceCategory =
	| 'title_phrase'
	| 'suggestion'
	| 'related_query'
	| 'green_skill'
	| 'job_skill'
	| 'client_phrase'
	| 'requirement'
	| 'product_type'
	| 'hire_list_skill'
	| 'fact'

export const UPWORK_REFERENCE_CATEGORIES: UpworkReferenceCategory[] = [
	'title_phrase',
	'suggestion',
	'related_query',
	'green_skill',
	'job_skill',
	'client_phrase',
	'requirement',
	'product_type',
	'hire_list_skill',
	'fact',
]

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
	| 'contract'
	| 'video'
	| 'other'

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
	'contract',
	'video',
	'other',
]

export interface UpworkProfile {
	id: string
	firstName: string
	lastName: string | null
	title: string | null
	url: string | null
	note: string | null
	active: boolean
	createdAt: string
	updatedAt: string
}

export const upworkProfileName = (
	p: Pick<UpworkProfile, 'firstName' | 'lastName'>,
): string => `${p.firstName} ${p.lastName ?? ''}`.trim()

export interface UpworkReferenceData {
	id: string
	profileId: string | null
	category: UpworkReferenceCategory
	value: string
	parentId: string | null
	order: number | null
	frequency: number | null
	note: string | null
	collectedDate: string
	active: boolean
	createdAt: string
	updatedAt: string
	profile?: {
		id: string
		firstName: string
		lastName: string | null
		title: string | null
	} | null
	parent?: {
		id: string
		value: string
		category: UpworkReferenceCategory
	} | null
}

export interface UpworkChangeLogRefLink {
	referenceData: {
		id: string
		category: UpworkReferenceCategory
		value: string
		profileId: string | null
	}
}

export interface UpworkChangeLog {
	id: string
	date: string
	profileId: string
	section: UpworkChangeLogSection
	item: string | null
	summary: string
	reason: string | null
	before: string
	after: string
	createdAt: string
	updatedAt: string
	profile: {
		id: string
		firstName: string
		lastName: string | null
		title: string | null
	}
	references: UpworkChangeLogRefLink[]
}

export interface UpworkSnapshotPosition {
	id: string
	snapshotId: string
	referenceDataId: string
	position: number
	referenceData: {
		id: string
		value: string
		category: UpworkReferenceCategory
	}
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
		byReferenceId: Record<string, number>
	}>
	titlePhrases: Array<{ id: string; value: string }>
	changeLogMarkers: Array<{ date: string; section: string; summary: string }>
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

		/* Reference data */
		listUpworkReferences: builder.query<
			UpworkReferenceData[],
			{
				profileId?: string
				category?: UpworkReferenceCategory
				active?: boolean
				sortByFrequency?: boolean
			}
		>({
			query: (params) => ({
				url: '/upwork/reference-data',
				method: 'GET',
				params,
			}),
			providesTags: ['UpworkReference'],
		}),
		createUpworkReference: builder.mutation<
			UpworkReferenceData,
			{
				profileId?: string
				category: UpworkReferenceCategory
				value: string
				parentId?: string
				order?: number
				frequency?: number
				note?: string
				collectedDate: string
				active?: boolean
			}
		>({
			query: (body) => ({
				url: '/upwork/reference-data',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['UpworkReference'],
		}),
		bulkAddUpworkReferences: builder.mutation<
			{ added: number },
			{
				profileId?: string
				category: UpworkReferenceCategory
				collectedDate: string
				values: string[]
			}
		>({
			query: (body) => ({
				url: '/upwork/reference-data/bulk-add',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['UpworkReference'],
		}),
		updateUpworkReference: builder.mutation<
			UpworkReferenceData,
			{ id: string; patch: Partial<UpworkReferenceData> }
		>({
			query: ({ id, patch }) => ({
				url: `/upwork/reference-data/${id}`,
				method: 'PATCH',
				body: patch,
			}),
			invalidatesTags: ['UpworkReference'],
		}),
		archiveUpworkReference: builder.mutation<UpworkReferenceData, string>({
			query: (id) => ({
				url: `/upwork/reference-data/${id}/archive`,
				method: 'POST',
			}),
			invalidatesTags: ['UpworkReference'],
		}),
		bulkDeleteUpworkReferences: builder.mutation<
			{ deleted: number },
			{ ids: string[] }
		>({
			query: (body) => ({
				url: '/upwork/reference-data/bulk-delete',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['UpworkReference'],
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
				item?: string
				summary: string
				reason?: string
				before: string
				after: string
				referenceIds?: string[]
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
					item: string
					summary: string
					reason: string
					before: string
					after: string
					referenceIds: string[]
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
			{ profileId: string; from?: string; to?: string }
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
				positions?: Array<{ referenceDataId: string; position: number }>
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
					positions: Array<{ referenceDataId: string; position: number }>
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
	useListUpworkReferencesQuery,
	useCreateUpworkReferenceMutation,
	useBulkAddUpworkReferencesMutation,
	useUpdateUpworkReferenceMutation,
	useArchiveUpworkReferenceMutation,
	useBulkDeleteUpworkReferencesMutation,
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
