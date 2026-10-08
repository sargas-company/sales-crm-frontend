export type LeadStatus =
	| 'Conversation Ongoing'
	| 'Trial'
	| 'Hold'
	| 'Archived'
	| 'Contract Offer'
	| 'Accept Contract'
	| 'Start Contract'

export type ClientType = 'Company' | 'Individual'

// API types
export type ApiLeadStatus =
	| 'NEW'
	| 'CONTACTED'
	| 'IN_CONVERSATION'
	| 'ON_HOLD'
	| 'WON'
	| 'LOST'

export type ApiLeadTemperature = 'COLD' | 'WARM' | 'HOT'

export type ApiClientType = 'individual' | 'company'

export interface LeadProposal {
	id: string
	title: string
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
	createdFrom?: string
	createdTo?: string
}

export type AvatarColor = 'error' | 'info' | 'warning' | 'success'

export type AccountName = 'Dmytro Sarafaniuk' | 'Artem Kovalenko' | 'Vadym Petrenko'

export type Platform = 'Upwork' | 'LinkedIn'

export type LeadType = 'Bid' | 'Invite' | 'Direct Message'

export type BoostedStatus = 'Boosted' | 'Not Boosted' | 'Boosted Outbid'

export interface LeadList {
	id: number
	jobId: string
	name: string
	clientType: ClientType
	rate: number
	location: string
	repliedAt: string
	acceptedAt: string
	holdOnAt: string
	status: LeadStatus
	// legacy fields
	account: AccountName
	platform: Platform
	leadType: LeadType
	boosted: BoostedStatus
	connects: number
	coverLetter: string
	createdAt: string
	sentAt: string
	address: string
	company: string
	companyEmail: string
	country: string
	contact: string
	service: string
	total: number
	avatar: string | undefined
	avatarColor?: AvatarColor
	balance: string | 0
	dueDate: string
}

export interface LeadState {
	data: Array<LeadList>
	allData: Array<LeadList>
	total: number
}
