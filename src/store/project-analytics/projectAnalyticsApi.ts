import { baseApi } from '../../api/baseApi'

export type ProjectStatus =
	| 'planned'
	| 'active'
	| 'paused'
	| 'completed'
	| 'archived'

export type Aggregation = 'week' | 'month'

export interface ProjectAnalyticsKPI {
	active: number
	paused: number
	archived: number
	reportsCount: number
	trackedHours: number
	reportAuthors: number
	assignedToActive: number
}

export interface ProjectAnalyticsHoursBucket {
	period: string
	periodStart: string
	total: number
	perProject: Record<string, number>
}

export interface ProjectAnalyticsHoursSeries {
	projects: Array<{ id: string; name: string }>
	buckets: ProjectAnalyticsHoursBucket[]
}

export interface ProjectAnalyticsReportsBucket {
	period: string
	periodStart: string
	count: number
	hours: number
}

export interface ProjectAnalyticsStatusBucket {
	period: string
	periodStart: string
	statusCounts: Record<ProjectStatus, number>
}

export interface ProjectAnalyticsWorkloadRow {
	id: string
	name: string
	status: ProjectStatus
	hours: number
	reports: number
	reportAuthors: number
	lastReport: string | null
	share: number
}

export interface ProjectAnalyticsOverview {
	range: { from: string; to: string; aggregation: Aggregation }
	statuses: ProjectStatus[]
	kpi: ProjectAnalyticsKPI
	hoursSeries: ProjectAnalyticsHoursSeries
	reportsSeries: ProjectAnalyticsReportsBucket[]
	statusOverTime: ProjectAnalyticsStatusBucket[]
	workload: ProjectAnalyticsWorkloadRow[]
}

export interface ProjectAnalyticsQuery {
	from?: string
	to?: string
	projectId?: string
	status?: ProjectStatus
	aggregation?: Aggregation
}

export const projectAnalyticsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProjectAnalyticsOverview: builder.query<
			ProjectAnalyticsOverview,
			ProjectAnalyticsQuery
		>({
			query: (params) => ({
				url: '/analytics/projects/overview',
				params,
			}),
			providesTags: ['ProjectAnalytics'],
		}),
	}),
})

export const { useGetProjectAnalyticsOverviewQuery } = projectAnalyticsApi
