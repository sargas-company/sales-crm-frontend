import type { FeedbackMetrics } from '../../types/feedback'
import type { SalesFilters } from '../../types/filters'
import { QUALIFIED_THRESHOLD, SCORE_BUCKETS } from '../../config'
import { filteredPosts } from './posts'

export const feedbackMetrics = (
	filters: SalesFilters,
	feedback: Map<string, string>
): FeedbackMetrics => {
	const { posts } = filteredPosts(filters, feedback)
	const analyzed = posts.filter((p) => p.analysisStatus === 'completed')
	const rated = analyzed.filter((p) => feedback.get(p.id))
	const coverage = analyzed.length ? Math.round((rated.length / analyzed.length) * 100) : 0
	const alerts = analyzed.filter((p) => p.notificationStatus === 'sent')
	const usefulAlerts = alerts.filter((p) => {
		const f = feedback.get(p.id)
		return f === 'relevant' || f === 'very_relevant'
	}).length
	const ratedAlerts = alerts.filter((p) => feedback.get(p.id)).length
	const usefulAlertRate = ratedAlerts ? Math.round((usefulAlerts / ratedAlerts) * 100) : 0
	const highScoreFalsePositives = analyzed.filter(
		(p) => p.score >= 75 && feedback.get(p.id) === 'not_relevant'
	).length
	const relevantBelowThreshold = analyzed.filter(
		(p) =>
			p.score < QUALIFIED_THRESHOLD &&
			(feedback.get(p.id) === 'relevant' || feedback.get(p.id) === 'very_relevant')
	).length
	const perBucket = SCORE_BUCKETS.map((b) => {
		const inB = analyzed.filter((p) => p.score >= b.min && p.score <= b.max)
		let rel = 0
		let not = 0
		let very = 0
		let un = 0
		for (const p of inB) {
			const f = feedback.get(p.id)
			if (f === 'relevant') rel += 1
			else if (f === 'not_relevant') not += 1
			else if (f === 'very_relevant') very += 1
			else un += 1
		}
		return { bucket: b.label, relevant: rel, notRelevant: not, veryRelevant: very, unrated: un }
	})
	return {
		feedbackCoverage: coverage,
		usefulAlertRate,
		highScoreFalsePositives,
		relevantBelowThreshold,
		perBucket,
	}
}
