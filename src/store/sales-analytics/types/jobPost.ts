export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type NotificationStatus = 'not_required' | 'pending' | 'sent' | 'failed'
export type ContractType = 'fixed' | 'hourly' | 'unknown'

export interface ScoreBreakdown {
	technicalFit?: number
	serviceFit?: number
	budgetFit?: number
	clientQuality?: number
	clarity?: number
	risk?: number
}

export interface RawAnalyzerPayload {
	rawModelResponse: string
	rawExtractedTerms: string[]
	rawScores: Record<string, number>
	fingerprint: string
}

export interface MockJobPost {
	id: string
	externalId: string

	platformId: string
	platformName: string
	accountId?: string

	title: string
	description: string
	originalUrl?: string

	publishedAt: string
	receivedAt: string
	analyzedAt: string
	notifiedAt?: string

	analysisStatus: AnalysisStatus
	notificationStatus: NotificationStatus

	score: number
	scoreBreakdown: ScoreBreakdown
	scoreReasons: string[]
	scoringVersion: string
	promptVersion: string
	modelVersion: string

	contractType: ContractType
	fixedBudget?: number
	hourlyRateMin?: number
	hourlyRateMax?: number
	currency: string
	duration?: string
	workload?: string

	directions: string[]
	technologies: string[]
	unknownTerms?: string[]

	clientCountry: string
	clientPaymentVerified: boolean
	clientTotalSpent?: number
	clientHireRate?: number
	clientRating?: number
	clientJobsPosted?: number
	clientProposalCountAtScan?: number

	goals?: string[]
	painPoints?: string[]
	deliverables?: string[]
	requirements?: string[]
	concerns?: string[]
	integrations?: string[]

	rawPayload?: RawAnalyzerPayload
}

export type ClientTier = 'elite' | 'strong' | 'standard' | 'new' | 'unverified'

export interface JobPostAnalyticsSummary {
	id: string
	title: string
	score: number
	directions: string[]
	technologies: string[]
	budgetLabel: string
	clientCountry: string
	clientTier: ClientTier
	notificationStatus: NotificationStatus
	receivedAt: string
	originalUrl?: string
}
