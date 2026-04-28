export type JobPostStatus = 'NEW' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
export type JobPostDecision = 'approve' | 'maybe' | 'decline'
export type JobPostPriority = 'high' | 'medium' | 'low'

export interface JobPostAiResponse {
	decision: string
	match_score: number
	priority: string
	hard_stop: boolean
	hard_stop_reason: string
	subscores: Record<string, number>
	reasons: string[]
	red_flags: string[]
	short_summary: string
}

export interface JobPostItem {
	id: string
	chatId: string
	messageId: number
	status: JobPostStatus
	decision: JobPostDecision | null
	matchScore: number | null
	priority: JobPostPriority | null
	createdAt: string
	processedAt: string | null
	title: string | null
	jobUrl: string | null
	scanner: string | null
	gigRadarScore: number | null
	location: string | null
	budget: string | null
	totalSpent: number | null
	avgRatePaid: number | null
	hireRate: number | null
	hSkillsKeywords: string[]
	rawText?: string
	rawPayload?: Record<string, unknown>
	aiResponse?: JobPostAiResponse
	proposal?: { id: string } | null
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

export interface JobPostListParams {
	limit: number
	offset: number
	decision?: JobPostDecision
	priority?: JobPostPriority
	sortBy?: 'createdAt' | 'matchScore'
}
