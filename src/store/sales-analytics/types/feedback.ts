export type ManualRelevance = 'relevant' | 'not_relevant' | 'very_relevant'

export interface ManualRelevanceEntry {
	postId: string
	rating: ManualRelevance
	updatedAt: string
	userId: string
	comment?: string
}

export interface RelevanceFeedbackPayload {
	postId: string
	rating: ManualRelevance | null
}

export interface FeedbackMetrics {
	feedbackCoverage: number
	usefulAlertRate: number
	highScoreFalsePositives: number
	relevantBelowThreshold: number
	perBucket: Array<{
		bucket: string
		relevant: number
		notRelevant: number
		veryRelevant: number
		unrated: number
	}>
}
