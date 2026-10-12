// API types
export type ApiLeadStatus =
	| 'NEW'
	| 'CONTACTED'
	| 'IN_CONVERSATION'
	| 'ON_HOLD'
	| 'WON'
	| 'LOST'
	| 'CLIENT'

export type ApiLeadTemperature = 'COLD' | 'WARM' | 'HOT'

export type ApiClientType = 'individual' | 'company'

export interface LeadProposal {
	id: string
	title: string
}

export interface LeadPlatformSummary {
	id: string
	title: string
	slug: string | null
	imageUrl: string | null
}

export interface LeadItem {
	id: string
	number: number
	proposalId: string | null
	proposal: LeadProposal | null
	firstName: string | null
	lastName: string | null
	companyName: string | null
	email: string | null
	phone: string | null
	source: string | null
	profileUrl: string | null
	temperature: ApiLeadTemperature | null
	notes: string | null
	status: ApiLeadStatus
	clientType: ApiClientType | null
	rate: number | null
	location: string | null
	platformId: string | null
	platform: LeadPlatformSummary | null
	repliedAt: string
	acceptedAt: string | null
	holdAt: string | null
	createdAt: string
	updatedAt: string
}

export type CreateLeadBody = {
	firstName?: string
	lastName?: string
	companyName?: string
	email?: string | null
	phone?: string | null
	source?: string | null
	profileUrl?: string | null
	temperature?: ApiLeadTemperature | null
	notes?: string | null
	status?: ApiLeadStatus
	clientType?: ApiClientType
	rate?: number
	location?: string
	platformId?: string | null
}

/** Strict PATCH body — mirrors the backend UpdateLeadDto: every field
 *  optional, `null` clears a nullable column. */
export type UpdateLeadBody = {
	firstName?: string | null
	lastName?: string | null
	companyName?: string | null
	email?: string | null
	phone?: string | null
	source?: string | null
	profileUrl?: string | null
	temperature?: ApiLeadTemperature | null
	notes?: string | null
	status?: ApiLeadStatus
	clientType?: ApiClientType | null
	rate?: number | null
	location?: string | null
	platformId?: string | null
}

/** Row shape of GET /leads/duplicates (service `select`). */
export interface LeadDuplicate {
	id: string
	firstName: string | null
	lastName: string | null
	companyName: string | null
	email: string | null
	phone: string | null
	status: ApiLeadStatus
}

export interface LeadPage {
	data: LeadItem[]
	total: number
}

export type LeadSortBy =
	| 'number'
	| 'firstName'
	| 'company'
	| 'clientType'
	| 'status'
	| 'temperature'
	| 'rate'
	| 'location'
	| 'email'
	| 'phone'
	| 'repliedAt'
	| 'updatedAt'
	| 'createdAt'

export type LeadSortDirection = 'asc' | 'desc'

export interface LeadListParams {
	page: number
	limit: number
	sortBy?: LeadSortBy
	sortDirection?: LeadSortDirection
	search?: string
	status?: ApiLeadStatus[]
	temperature?: ApiLeadTemperature[]
	source?: string
	location?: string
	createdFrom?: string
	createdTo?: string
}

