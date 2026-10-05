import { baseApi } from '../../api/baseApi'
import type { ProjectStatus } from '../projects/projectsApi'

export type ProjectReportSource = 'MANUAL' | 'DISCORD'

export interface ProjectReportItem {
	id: string
	projectId: string
	// MANUAL rows always carry an Employee author; DISCORD rows never do.
	employeeId: string | null
	reportDate: string
	hours: number
	content: string
	source: ProjectReportSource
	discordUserId: string | null
	discordUsername: string | null
	createdAt: string
	updatedAt: string
	project: {
		id: string
		name: string
		status: ProjectStatus
	}
	// Null when `source === 'DISCORD'`.
	employee: {
		id: string
		firstName: string
		lastName: string
		positions: string[]
		userId: string | null
	} | null
}

export interface ProjectReportPage {
	data: ProjectReportItem[]
	total: number
}

export type ProjectReportSortBy = 'reportDate' | 'createdAt' | 'updatedAt' | 'hours'

export type ProjectReportSortDirection = 'asc' | 'desc'

export interface ProjectReportListParams {
	page: number
	limit: number
	sortBy?: ProjectReportSortBy
	sortDirection?: ProjectReportSortDirection
	search?: string
	projectId?: string
	employeeId?: string
	from?: string
	to?: string
}

export interface CreateProjectReportBody {
	projectId: string
	employeeId: string
	reportDate: string
	hours: number
	content: string
}

export interface UpdateProjectReportBody {
	reportDate?: string
	hours?: number
	content?: string
}

export const projectReportsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProjectReports: builder.query<ProjectReportPage, ProjectReportListParams>({
			query: ({ page, limit, sortBy, sortDirection, search, projectId, employeeId, from, to }) => ({
				url: '/project-reports',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					projectId: projectId || undefined,
					employeeId: employeeId || undefined,
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
