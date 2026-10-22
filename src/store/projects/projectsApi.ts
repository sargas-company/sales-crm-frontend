import { baseApi } from '../../api/baseApi'
import type { EmployeeStatus } from '../employees/employeesApi'
import type { ProjectReportSource } from '../project-reports/projectReportsApi'

export type ProjectStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived'

export type ProjectType = 'HOURLY' | 'FIXED' | 'RETAINER'

export interface ProjectMemberItem {
	projectId: string
	employeeId: string
	assignedAt: string
	employee: {
		id: string
		firstName: string
		lastName: string
		positions: { id: string; title: string; slug: string }[]
		status: EmployeeStatus
	}
}

export interface ProjectRecentReport {
	id: string
	reportDate: string
	hours: number
	content: string
	createdAt: string
	updatedAt: string
	source: ProjectReportSource
	// MANUAL rows carry an Employee author; DISCORD rows carry a
	// Discord username instead and leave `employee` null.
	employeeId: string | null
	employee: {
		id: string
		firstName: string
		lastName: string
	} | null
	discordUserId: string | null
	discordUsername: string | null
}

export interface ProjectItem {
	id: string
	name: string
	clientId: string | null
	client: {
		id: string
		firstName: string
		lastName: string
		type: 'client' | 'contractor'
	} | null
	crmClientId: string | null
	crmClient: {
		id: string
		firstName: string
		lastName: string | null
		company: string | null
		status: 'ACTIVE' | 'ON_HOLD' | 'FORMER'
	} | null
	status: ProjectStatus
	description: string | null
	startDate: string | null
	endDate: string | null
	members: ProjectMemberItem[]
	reports?: ProjectRecentReport[]
	discordChannelId: string | null
	type: ProjectType | null
	rate: string | null
	rateCurrency: string | null
	hoursBudget: number | null
	createdAt: string
	updatedAt: string
}

export interface ProjectPage {
	data: ProjectItem[]
	total: number
}

export type ProjectSortBy = 'name' | 'status' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'

export type ProjectSortDirection = 'asc' | 'desc'

export interface ProjectListParams {
	page: number
	limit: number
	sortBy?: ProjectSortBy
	sortDirection?: ProjectSortDirection
	search?: string
	status?: ProjectStatus
	clientId?: string
	crmClientId?: string
}

export interface CreateProjectBody {
	name: string
	// Legacy — Counterparty FK. Nullable / optional; the new flow
	// drives `crmClientId` → Client instead.
	clientId?: string
	crmClientId?: string
	status?: ProjectStatus
	description?: string
	memberIds?: string[]
	discordChannelId?: string | null
	// Billing shape (all optional; see schema comments)
	type?: ProjectType
	rate?: number
	rateCurrency?: string
	hoursBudget?: number
}

export type UpdateProjectBody = Partial<CreateProjectBody>

export const projectsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getProjects: builder.query<ProjectPage, ProjectListParams>({
			query: ({
				page,
				limit,
				sortBy,
				sortDirection,
				search,
				status,
				clientId,
				crmClientId,
			}) => ({
				url: '/projects',
				params: {
					page,
					limit,
					sortBy,
					sortDirection,
					search: search || undefined,
					status: status || undefined,
					clientId: clientId || undefined,
					crmClientId: crmClientId || undefined,
				},
			}),
			providesTags: ['Project'],
		}),
		getProjectById: builder.query<ProjectItem, string>({
			query: (id) => ({ url: `/projects/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'Project', id }],
		}),
		createProject: builder.mutation<ProjectItem, CreateProjectBody>({
			query: (body) => ({ url: '/projects', method: 'POST', body }),
			invalidatesTags: ['Project'],
		}),
		updateProject: builder.mutation<ProjectItem, { id: string; body: UpdateProjectBody }>({
			query: ({ id, body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_r, _e, { id }) => ['Project', { type: 'Project', id }],
		}),
		deleteProject: builder.mutation<void, string>({
			query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Project'],
		}),
	}),
})

export const {
	useGetProjectsQuery,
	useGetProjectByIdQuery,
	useCreateProjectMutation,
	useUpdateProjectMutation,
	useDeleteProjectMutation,
} = projectsApi
