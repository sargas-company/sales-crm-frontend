import type { TaxonomyType } from './taxonomy'

export type TaxonomyCandidateStatus =
	| 'candidate'
	| 'watching'
	| 'approved'
	| 'merged'
	| 'rejected'
	| 'ignored'

export interface EmergingScoreBreakdown {
	sargasFit: number
	demandGrowth: number
	postQuality: number
	budgetQuality?: number
	clientQuality?: number
	novelty: number
	competition?: number
	confidence: number
}

export interface TaxonomyCandidate {
	id: string
	proposedName: string
	normalizedName: string
	proposedType: TaxonomyType
	description?: string
	status: TaxonomyCandidateStatus
	confidence?: number
	sargasFit?: number
	fitScore?: number
	firstSeenAt: string
	lastSeenAt: string
	mentionCount: number
	uniquePostCount: number
	uniqueClientCount?: number
	qualifiedPostCount: number
	hotPostCount: number
	averagePostScore?: number
	relatedTaxonomyItemIds: string[]
	mergedIntoTaxonomyItemId?: string
	evidencePostIds: string[]
	scoreBreakdown: EmergingScoreBreakdown
	definition?: string
	whyEmerging?: string
	requirements?: string[]
	createdAt: string
	updatedAt: string
}

export type CandidateActionType =
	| 'approve_technology'
	| 'approve_direction'
	| 'keep_signal'
	| 'merge'
	| 'alias'
	| 'watch'
	| 'reject'
	| 'ignore'

export interface CandidateActionPayload {
	candidateId: string
	action: CandidateActionType
	targetTaxonomyItemId?: string
}

export interface EmergingAlertConfig {
	minPosts: number
	minUniqueClients: number
	minAverageScore: number
	observationDays: number
	minSargasFit: number
	cooldownDays: number
}
