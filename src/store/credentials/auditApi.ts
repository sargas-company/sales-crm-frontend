import { baseApi } from '../../api/baseApi'

export type AuditResult = 'SUCCESS' | 'DENIED' | 'FAILED'

export interface AuditEvent {
	id: string
	actorUserId: string | null
	domain: string
	action: string
	targetType: string | null
	targetId: string | null
	targetLabel: string | null
	result: AuditResult
	metadata: Record<string, unknown> | null
	ip: string | null
	userAgent: string | null
	requestId: string | null
	occurredAt: string
}

interface ListQuery {
	domain?: string
	action?: string
	result?: AuditResult
	actorUserId?: string
	targetType?: string
	targetId?: string
	from?: string
	to?: string
	page?: number
	limit?: number
}

interface Paginated<T> {
	data: T[]
	total: number
	page: number
	limit: number
}

export const auditApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listAuditEvents: builder.query<Paginated<AuditEvent>, ListQuery>({
			query: (params) => ({ url: '/audit-events', params }),
			providesTags: ['AuditEvent'],
		}),
	}),
})

export const { useListAuditEventsQuery } = auditApi
