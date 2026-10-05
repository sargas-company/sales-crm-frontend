import { baseApi } from '../../api/baseApi'

export type BackupType = 'DAILY' | 'PRE_MIGRATION' | 'PRE_SEED' | 'MANUAL'
export type BackupStatus =
	| 'RUNNING'
	| 'SUCCEEDED'
	| 'FAILED'
	| 'VERIFIED'

export interface BackupRun {
	id: string
	type: BackupType
	status: BackupStatus
	environment: string
	databaseName: string
	startedAt: string
	completedAt: string | null
	durationMs: number | null
	artifactKey: string | null
	manifestKey: string | null
	size: string | null
	checksum: string | null
	checksumAlgo: string | null
	pgVersion: string | null
	gitSha: string | null
	migrationName: string | null
	triggeredBy: string | null
	errorMessage: string | null
	lastVerifiedAt: string | null
}

interface Paginated<T> {
	data: T[]
	total: number
	page: number
	limit: number
}

export interface BackupSummary {
	last: BackupRun | null
	lastVerified: BackupRun | null
	lastFailed: BackupRun | null
	total: number
}

export const backupsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listBackups: builder.query<
			Paginated<BackupRun>,
			{ page?: number; limit?: number }
		>({
			query: (params) => ({ url: '/backups', params }),
			providesTags: ['BackupRun'],
		}),
		getBackupSummary: builder.query<BackupSummary, void>({
			query: () => ({ url: '/backups/summary' }),
			providesTags: ['BackupRun'],
		}),
		getBackupRun: builder.query<BackupRun, string>({
			query: (id) => ({ url: `/backups/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'BackupRun', id }],
		}),
	}),
})

export const {
	useListBackupsQuery,
	useGetBackupSummaryQuery,
	useGetBackupRunQuery,
} = backupsApi
