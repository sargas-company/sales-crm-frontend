export type ClientCallStatus = 'scheduled' | 'cancelled' | 'completed'
export type ClientCallClientType = 'lead' | 'client_request'

export interface ClientCallLead {
	id: string
	firstName: string | null
	lastName: string | null
	companyName: string | null
}

export interface ClientCallClientRequest {
	id: string
	name: string
	company: string
}

export interface ClientCallCreatedBy {
	id: string
	firstName: string
	lastName: string
}

export interface ClientCallItem {
	id: string
	clientType: ClientCallClientType
	leadId: string | null
	clientRequestId: string | null
	createdById: string
	callTitle: string
	meetingUrl: string | null
	scheduledAt: string
	clientTimezone: string
	duration: number
	status: ClientCallStatus
	notes: string | null
	summary: string | null
	transcriptUrl: string | null
	aiSummary: string | null
	createdAt: string
	updatedAt: string
	clientDateTime: string
	kyivDateTime: string
	lead: ClientCallLead | null
	clientRequest: ClientCallClientRequest | null
	createdBy: ClientCallCreatedBy
}

export interface ClientCallPage {
	data: ClientCallItem[]
	total: number
}

export interface ClientCallListParams {
	page: number
	limit: number
}

export type CreateClientCallBody = {
	clientType: ClientCallClientType
	leadId?: string
	clientRequestId?: string
	callTitle: string
	meetingUrl?: string
	scheduledAt: string
	clientTimezone: string
	duration: number
}

export type UpdateClientCallBody = Partial<{
	callTitle: string
	meetingUrl: string
	scheduledAt: string
	clientTimezone: string
	duration: number
	status: ClientCallStatus
	notes: string
	summary: string
	transcriptUrl: string
	aiSummary: string
}>
