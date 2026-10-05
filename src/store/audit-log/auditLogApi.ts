import { baseApi } from '../../api/baseApi'

export type AuditResult = 'SUCCESS' | 'DENIED' | 'FAILED'
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AuditActorType = 'USER' | 'SYSTEM'

export type AuditDomain =
	| 'AUTH'
	| 'CREDENTIALS'
	| 'FINANCE'
	| 'RBAC'
	| 'SETTINGS'
	| 'EMPLOYEES'
	| 'PROJECTS'
	| 'CRM'

export type AuditCategory =
	| 'all'
	| 'access'
	| 'financial'
	| 'data'
	| 'sensitive'

export interface AuditEvent {
	id: string
	actorUserId: string | null
	actorType: AuditActorType
	actorEmail: string | null
	actorName: string | null
	domain: AuditDomain | string
	action: string
	targetType: string | null
	targetId: string | null
	targetLabel: string | null
	targetHref: string | null
	result: AuditResult
	severity: AuditSeverity
	changes: Record<string, unknown> | null
	metadata: Record<string, unknown> | null
	ip: string | null
	userAgent: string | null
	requestId: string | null
	occurredAt: string
}

export interface AuditListQuery {
	category?: AuditCategory
	domain?: string
	action?: string
	result?: AuditResult
	severity?: AuditSeverity
	actorUserId?: string
	targetType?: string
	targetId?: string
	q?: string
	from?: string
	to?: string
	sort?: 'asc' | 'desc'
	page?: number
	limit?: number
}

export interface AuditListResponse {
	data: AuditEvent[]
	total: number
	page: number
	limit: number
}

export interface AuditSummary {
	total: number
	sensitive: number
	financial: number
	failedOrDenied: number
	roleChanges: number
	critical: number
}

export interface AuditActor {
	actorUserId: string
	actorEmail: string | null
	actorName: string | null
}

export const auditLogApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listAuditLog: builder.query<AuditListResponse, AuditListQuery>({
			query: (params) => ({ url: '/audit-log/events', params }),
			providesTags: ['AuditEvent'],
		}),
		getAuditEvent: builder.query<AuditEvent, string>({
			query: (id) => ({ url: `/audit-log/events/${id}` }),
			providesTags: (_r, _e, id) => [{ type: 'AuditEvent', id }],
		}),
		getAuditSummary: builder.query<AuditSummary, { from?: string; to?: string }>({
			query: (params) => ({ url: '/audit-log/summary', params }),
			providesTags: ['AuditEvent'],
		}),
		getAuditActors: builder.query<{ data: AuditActor[] }, void>({
			query: () => ({ url: '/audit-log/actors' }),
			providesTags: ['AuditEvent'],
		}),
		getProfileAuditTimeline: builder.query<
			{ data: AuditEvent[] },
			string
		>({
			query: (profileId) => ({
				url: `/audit-log/profiles/${profileId}`,
			}),
			providesTags: (_r, _e, id) => [
				{ type: 'AuditEvent', id: `profile:${id}` },
			],
		}),
	}),
})

export const {
	useListAuditLogQuery,
	useGetAuditEventQuery,
	useGetAuditSummaryQuery,
	useGetAuditActorsQuery,
	useGetProfileAuditTimelineQuery,
} = auditLogApi
