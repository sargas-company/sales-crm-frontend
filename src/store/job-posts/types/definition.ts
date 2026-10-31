export type JobPostStatus =
	| 'NEW'
	| 'PROCESSING'
	| 'PROCESSED'
	| 'FAILED'
	| 'SKIPPED'
export type JobPostDecision = 'approve' | 'maybe' | 'decline'
export type JobPostPriority = 'high' | 'medium' | 'low'
export type JobPostEnqueueState = 'BACKLOG' | 'PENDING' | 'ENQUEUED'

/**
 * Shape of the `aiResponse` JSON column on `JobPost`. The backend
 * (job-post-processor) writes two optional branches:
 *   • `gatekeeper` — stage-1 cheap-model decision (always set once
 *     the post has been touched; `fit:false` means the post was
 *     declined before full evaluation).
 *   • `evaluation` — stage-2 full Claude evaluation. Present only
 *     when the gate accepted the post.
 *
 * All top-level snake_case fields below are LEGACY (pre-v2 shape).
 * They stay optional so historical rows and fixtures continue to
 * typecheck; new code reads from `evaluation.*` first.
 */
export interface JobPostAiResponse {
	gatekeeper?: {
		fit: boolean
		confidence: number
		reason: string
	}
	evaluation?: {
		shortSummary?: string
		reasons?: string[]
		redFlags?: string[]
		hardStop?: boolean
		hardStopReason?: string
		subscores?: Record<string, number>
	}
	// Legacy top-level fields (pre-v2 envelope). Kept optional for
	// backward compat with any historical rows that still carry them.
	decision?: string
	match_score?: number
	priority?: string
	hard_stop?: boolean
	hard_stop_reason?: string
	subscores?: Record<string, number>
	reasons?: string[]
	red_flags?: string[]
	short_summary?: string
}

export interface JobPostItem {
	id: string
	chatId: string
	messageId: number
	status: JobPostStatus
	enqueueState?: JobPostEnqueueState | null
	decision: JobPostDecision | null
	matchScore: number | null
	priority: JobPostPriority | null
	createdAt: string
	processedAt: string | null
	title: string | null
	jobUrl: string | null
	scanner: string | null
	location: string | null
	budget: string | null
	totalSpent: number | null
	avgRatePaid: number | null
	hireRate: number | null
	hSkillsKeywords: string[]
	/** Phase A — normalised fields; fall back to legacy flat columns. */
	budgetType?: string | null
	budgetMin?: number | null
	budgetMax?: number | null
	budgetCurrency?: string | null
	postedAt?: string | null
	country?: string | null
	city?: string | null
	clientPaymentVerified?: boolean | null
	clientRating?: number | null
	clientHires?: number | null
	/** Phase A — fields present on findOne, surfaced in the preview sidebar. */
	contractType?: string | null
	duration?: string | null
	hoursPerWeek?: string | null
	experienceLevel?: string | null
	connectsRequired?: number | null
	categories?: string[]
	questions?: unknown
	clientJobsPosted?: number | null
	clientReviewCount?: number | null
	clientRankLabel?: string | null
	clientRankScore?: number | null
	clientLocationRestriction?: string | null
	rawText?: string
	rawPayload?: Record<string, unknown>
	aiResponse?: JobPostAiResponse
	proposal?: { id: string } | null
	viewedAt?: string | null
}

export interface JobPostMeta {
	total: number
	limit: number
	offset: number
}

export interface JobPostPage {
	data: JobPostItem[]
	meta: JobPostMeta
}

export type JobPostSortBy =
	| 'createdAt'
	| 'matchScore'
	| 'title'
	| 'status'
	| 'budget'
	| 'location'
	| 'totalSpent'
	| 'avgRatePaid'
	| 'hireRate'
	| 'scanner'
	| 'processedAt'

export type JobPostSortDirection = 'asc' | 'desc'

export type JobPostGate = 'pass' | 'reject'

export interface JobPostListParams {
	limit: number
	offset: number
	decision?: JobPostDecision
	priority?: JobPostPriority
	gate?: JobPostGate
	status?: JobPostStatus
	minScore?: number
	maxScore?: number
	createdFrom?: string
	createdTo?: string
	sortBy?: JobPostSortBy
	sortDirection?: JobPostSortDirection
	search?: string
	viewed?: 'viewed' | 'unviewed'
	country?: string
}

export interface CreateJobPostBody {
	title: string
	jobUrl?: string
	location?: string
	budget?: string
	rawText?: string
}
