import type { MockJobPost, ClientTier } from '../../types/jobPost'
import type { SalesFilters } from '../../types/filters'
import type { AnalyticsWindow } from '../../utils/periods'
import { POSTS } from '../fixtures/dataset'
import { windowFor } from '../../utils/periods'
import { FIXED_BUDGET_BUCKETS, HOURLY_BUDGET_BUCKETS } from '../../config'

export const inWindow = (post: MockJobPost, w: AnalyticsWindow): boolean => {
	const ts = new Date(post.receivedAt).getTime()
	return ts >= w.fromMs && ts <= w.toMs
}

export const clientTier = (p: MockJobPost): ClientTier => {
	if (!p.clientPaymentVerified) return 'unverified'
	const spent = p.clientTotalSpent ?? 0
	const rating = p.clientRating ?? 0
	const hires = p.clientJobsPosted ?? 0
	if (spent >= 50000 && rating >= 4.6 && hires >= 15) return 'elite'
	if (spent >= 10000 && rating >= 4.3) return 'strong'
	if (spent >= 1000 || hires >= 3) return 'standard'
	return 'new'
}

export const CLIENT_TIER_META: Record<ClientTier, { label: string; rule: string }> = {
	elite: {
		label: 'Elite',
		rule: 'Verified · spent ≥ $50k · rating ≥ 4.6 · ≥ 15 jobs posted',
	},
	strong: { label: 'Strong', rule: 'Verified · spent ≥ $10k · rating ≥ 4.3' },
	standard: { label: 'Standard', rule: 'Verified · spent ≥ $1k or ≥ 3 jobs posted' },
	new: { label: 'New', rule: 'Verified · limited history' },
	unverified: { label: 'Unverified', rule: 'Payment method not verified' },
}

const parseBudgetBucket = (
	key: string
): { kind: 'fixed' | 'hourly'; min: number; max: number | null } | null => {
	for (const b of FIXED_BUDGET_BUCKETS) {
		if (`fixed:${b.key}` === key) return { kind: 'fixed', min: b.min, max: b.max }
	}
	for (const b of HOURLY_BUDGET_BUCKETS) {
		if (`hourly:${b.key}` === key) return { kind: 'hourly', min: b.min, max: b.max }
	}
	return null
}

const matchesBudget = (p: MockJobPost, key: string): boolean => {
	const b = parseBudgetBucket(key)
	if (!b) return true
	if (b.kind === 'fixed') {
		if (p.contractType !== 'fixed' || p.fixedBudget == null) return false
		if (b.max == null) return p.fixedBudget >= b.min
		return p.fixedBudget >= b.min && p.fixedBudget <= b.max
	}
	if (p.contractType !== 'hourly' || p.hourlyRateMax == null) return false
	if (b.max == null) return p.hourlyRateMax >= b.min
	return p.hourlyRateMax >= b.min && p.hourlyRateMax <= b.max
}

const matchesFilters = (
	post: MockJobPost,
	filters: SalesFilters,
	feedback?: Map<string, string>
): boolean => {
	if (filters.scoreMin != null && post.score < filters.scoreMin) return false
	if (filters.scoreMax != null && post.score > filters.scoreMax) return false
	if (filters.technology?.length && !filters.technology.some((t) => post.technologies.includes(t)))
		return false
	if (filters.direction?.length && !filters.direction.some((d) => post.directions.includes(d)))
		return false
	if (filters.platformId?.length && !filters.platformId.includes(post.platformId)) return false
	if (filters.contractType && post.contractType !== filters.contractType) return false
	if (filters.budgetBucket && !matchesBudget(post, filters.budgetBucket)) return false
	if (filters.clientCountry?.length && !filters.clientCountry.includes(post.clientCountry))
		return false
	if (filters.clientQuality?.length) {
		const tier = clientTier(post)
		if (!filters.clientQuality.includes(tier)) return false
	}
	if (filters.notificationStatus && post.notificationStatus !== filters.notificationStatus)
		return false
	if (filters.manualRelevance) {
		const rating = feedback?.get(post.id)
		if (filters.manualRelevance === 'unrated') {
			if (rating) return false
		} else if (rating !== filters.manualRelevance) {
			return false
		}
	}
	return true
}

export interface FilteredPostSet {
	posts: MockJobPost[]
	window: AnalyticsWindow
	previousPosts: MockJobPost[]
}

export const filteredPosts = (
	filters: SalesFilters,
	feedback: Map<string, string>,
	nowMs: number = Date.now()
): FilteredPostSet => {
	const win = windowFor(filters, nowMs)
	const prev = {
		fromMs: win.fromMs - win.sizeMs,
		toMs: win.fromMs,
		sizeMs: win.sizeMs,
		label: win.label,
	}
	const posts = POSTS.filter((p) => inWindow(p, win) && matchesFilters(p, filters, feedback))
	const previousPosts = POSTS.filter(
		(p) => inWindow(p, prev) && matchesFilters(p, filters, feedback)
	)
	return { posts, previousPosts, window: win }
}

export const budgetLabel = (p: MockJobPost): string => {
	if (p.contractType === 'fixed' && p.fixedBudget != null)
		return `$${p.fixedBudget.toLocaleString()}`
	if (p.contractType === 'hourly' && (p.hourlyRateMin != null || p.hourlyRateMax != null)) {
		if (
			p.hourlyRateMin != null &&
			p.hourlyRateMax != null &&
			p.hourlyRateMin !== p.hourlyRateMax
		) {
			return `$${p.hourlyRateMin}–${p.hourlyRateMax}/h`
		}
		return `$${p.hourlyRateMax ?? p.hourlyRateMin}/h`
	}
	return '—'
}
