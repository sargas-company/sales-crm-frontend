import { baseApi } from '../../api/baseApi'
import type { ProjectStatus } from '../projects/projectsApi'

export type ProjectReportSource = 'MANUAL' | 'DISCORD'

/**
 * Snapshot of one project team member at the moment the report
 * was filed. Immutable after create — team changes afterwards do
 * NOT update this list. The relation to `Employee` is nullable so
 * a hard-deleted employee still shows up with their snapshot name.
 */
export interface ProjectReportContributor {
	id: string
	employeeId: string | null
	firstNameSnapshot: string
	lastNameSnapshot: string
	employee: {
		id: string
		firstName: string
		lastName: string
	} | null
}

export interface ProjectReportItem {
	id: string
	projectId: string
	reportDate: string
	hours: number
	content: string
	// Technical submitter metadata — not surfaced as "author" anywhere
	// in the UI. The business team record is `contributors`.
	source: ProjectReportSource
	createdAt: string
	updatedAt: string
	project: {
		id: string
		name: string
		status: ProjectStatus
	}
	contributors: ProjectReportContributor[]
}

export interface ProjectReportPage {
	data: ProjectReportItem[]
	total: number
}

export type ProjectReportSortBy =
	| 'reportDate'
	| 'createdAt'
	| 'updatedAt'
	| 'hours'
	| 'source'

export type ProjectReportSortDirection = 'asc' | 'desc'

export interface ProjectReportListParams {
	page: number
	limit: number
	sortBy?: ProjectReportSortBy
	sortDirection?: ProjectReportSortDirection
	search?: string
	projectId?: string
	from?: string
	to?: string
}

export interface CreateProjectReportBody {
	projectId: string
	reportDate: string
	hours: number
	content: string
}

export interface UpdateProjectReportBody {
	hours?: number
	content?: string
}

export const projectReportsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProjectReports: builder.query<ProjectReportPage, ProjectReportListParams>({
			query: ({ page, limit, sortBy, sortDirection, search, projectId, from, to }) => ({
				url: '/project-reports',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					projectId: projectId || undefined,
					from: from || undefined,
					to: to || undefined,
				},
			}),
			providesTags: ['ProjectReport'],
		}),
		getProjectReportById: builder.query<ProjectReportItem, string>({
			query: (id) => ({ url: `/project-reports/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'ProjectReport', id }],
		}),
		createProjectReport: builder.mutation<ProjectReportItem, CreateProjectReportBody>({
			query: (body) => ({ url: '/project-reports', method: 'POST', body }),
			invalidatesTags: ['ProjectReport', 'Project'],
		}),
		updateProjectReport: builder.mutation<
			ProjectReportItem,
			{ id: string; body: UpdateProjectReportBody }
		>({
			query: ({ id, body }) => ({ url: `/project-reports/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_r, _e, { id }) => [
				'ProjectReport',
				'Project',
				{ type: 'ProjectReport', id },
			],
		}),
		deleteProjectReport: builder.mutation<void, string>({
			query: (id) => ({ url: `/project-reports/${id}`, method: 'DELETE' }),
			invalidatesTags: ['ProjectReport', 'Project'],
		}),
	}),
})

export const {
	useGetProjectReportsQuery,
	useGetProjectReportByIdQuery,
	useCreateProjectReportMutation,
	useUpdateProjectReportMutation,
	useDeleteProjectReportMutation,
} = projectReportsApi
