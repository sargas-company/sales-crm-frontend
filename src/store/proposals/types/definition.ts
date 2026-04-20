import type { AccountItem } from '../../accounts/accountsApi'
import type { PlatformItem } from '../../platforms/platformsApi'

export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Replied'

export type ProposalType = 'Bid' | 'Invite' | 'DirectMessage'

export interface ProposalUser {
	id: string
	email: string
	firstName: string
	lastName: string
}

export interface ProposalChat {
	id: string
	proposalId: string
	leadId: string | null
	createdAt: string
}

export interface ProposalItem {
	number: number
	id: string
	title: string
	jobUrl: string | null
	status: ProposalStatus
	proposalType: ProposalType
	boosted: boolean
	connects: number
	boostedConnects: number
	createdAt: string
	updatedAt: string
	sentAt: string | null
	coverLetter: string
	vacancy: string | null
	userId: string
	accountId: string
	platformId: string
	user: ProposalUser
	account: AccountItem
	platform: PlatformItem
	lead?: { id: string } | null
	chat: ProposalChat | null
}

export interface ProposalPage {
	data: ProposalItem[]
	total: number
}

export interface ProposalListParams {
	page: number
	limit: number
}

// Legacy — kept for backward compatibility with proposalsSlice (mock data)
export type ProposalList = ProposalItem

export interface ProposalState {
	data: Array<ProposalList>
	allData: Array<ProposalList>
	total: number
}
