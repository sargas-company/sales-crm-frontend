import type { EmergingAlertConfig, TaxonomyCandidate } from '../types/candidates'
import type { ManualRelevance, ManualRelevanceEntry } from '../types/feedback'
import { cloneBaselineCandidates } from './fixtures/candidates'
import { DEFAULT_EMERGING_ALERT_CONFIG } from '../config'

type FeedbackMap = Map<string, ManualRelevanceEntry>
type CandidateMap = Map<string, TaxonomyCandidate>

interface MockMutableState {
	feedback: FeedbackMap
	candidates: CandidateMap
	alertConfig: EmergingAlertConfig
	version: number
}

const listeners = new Set<() => void>()

const buildInitial = (): MockMutableState => {
	const candidates = new Map<string, TaxonomyCandidate>()
	for (const c of cloneBaselineCandidates()) candidates.set(c.id, c)
	return {
		feedback: new Map(),
		candidates,
		alertConfig: { ...DEFAULT_EMERGING_ALERT_CONFIG },
		version: 0,
	}
}

let state = buildInitial()

const bump = () => {
	state.version += 1
	for (const l of listeners) l()
}

export const subscribeMockState = (fn: () => void): (() => void) => {
	listeners.add(fn)
	return () => listeners.delete(fn)
}

export const getMockState = (): MockMutableState => state

export const setRelevance = (postId: string, rating: ManualRelevance | null): void => {
	if (rating === null) {
		state.feedback.delete(postId)
	} else {
		state.feedback.set(postId, {
			postId,
			rating,
			updatedAt: new Date().toISOString(),
			userId: 'demo-user',
		})
	}
	bump()
}

export const updateCandidate = (
	id: string,
	patch: Partial<TaxonomyCandidate>
): TaxonomyCandidate | null => {
	const cur = state.candidates.get(id)
	if (!cur) return null
	const next: TaxonomyCandidate = { ...cur, ...patch, updatedAt: new Date().toISOString() }
	state.candidates.set(id, next)
	bump()
	return next
}

export const setAlertConfig = (patch: Partial<EmergingAlertConfig>): EmergingAlertConfig => {
	state.alertConfig = { ...state.alertConfig, ...patch }
	bump()
	return state.alertConfig
}

export const resetMockState = (): void => {
	state = buildInitial()
	bump()
}
