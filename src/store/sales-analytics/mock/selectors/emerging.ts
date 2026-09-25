import type {
	EmergingOverview,
	EmergingSignalDetail,
	EmergingSignalRow,
} from '../../types/aggregates'
import type { SalesFilters } from '../../types/filters'
import type { TaxonomyCandidate } from '../../types/candidates'
import { HOT_THRESHOLD, QUALIFIED_THRESHOLD } from '../../config'
import { safeAvg, trendPct, confidenceFor } from '../../utils/growth'
import { filteredPosts } from './posts'
import { POSTS } from '../fixtures/dataset'
import { CANONICAL_DIRECTIONS, CANONICAL_TECHNOLOGIES } from '../fixtures/taxonomy'
import { partsInZone } from '../../utils/timezone'

const daysBetween = (a: string, b: string): number =>
	Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)

const candidateRow = (c: TaxonomyCandidate, posts: typeof POSTS): EmergingSignalRow => {
	const evidence = posts.filter((p) => c.evidencePostIds.includes(p.id))
	const avgBudget = (() => {
		const vals = evidence
			.map((p) => (p.contractType === 'fixed' ? p.fixedBudget : p.hourlyRateMax) ?? null)
			.filter((v): v is number => v != null)
		return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
	})()
	return {
		id: c.id,
		name: c.proposedName,
		proposedType: c.proposedType,
		status: c.status,
		firstSeenAt: c.firstSeenAt,
		lastSeenAt: c.lastSeenAt,
		postCount: c.uniquePostCount,
		uniqueClientCount: c.uniqueClientCount,
		qualifiedCount: c.qualifiedPostCount,
		hotCount: c.hotPostCount,
		averageScore: c.averagePostScore ?? 0,
		averageBudget: avgBudget,
		growthPct: c.scoreBreakdown.demandGrowth
			? Math.round(c.scoreBreakdown.demandGrowth - 40)
			: null,
		sargasFit: c.sargasFit ?? 0,
		confidence: c.confidence ?? 0,
		relatedTaxonomy: c.relatedTaxonomyItemIds,
		newToDataset:
			daysBetween(c.firstSeenAt, new Date().toISOString()) <= 14 && c.uniquePostCount <= 8,
	}
}

export const emergingOverview = (
	filters: SalesFilters,
	feedback: Map<string, string>,
	candidates: TaxonomyCandidate[]
): EmergingOverview => {
	const rows = candidates.map((c) => candidateRow(c, POSTS))
	const active = rows.filter((r) => r.status === 'candidate' || r.status === 'watching')
	const topEmerging = active
		.slice()
		.sort((a, b) => b.sargasFit - a.sargasFit)
		.slice(0, 6)
	const growingTechnologies = active
		.filter((r) => r.proposedType === 'technology' || r.proposedType === 'signal')
		.slice(0, 6)
	const growingDirections = active
		.filter((r) => r.proposedType === 'direction' || r.proposedType === 'signal')
		.slice(0, 6)
	const newToDataset = active.filter((r) => r.newToDataset).slice(0, 6)
	const growingInData = active
		.slice()
		.sort((a, b) => (b.growthPct ?? -1) - (a.growthPct ?? -1))
		.slice(0, 6)
	return {
		topEmerging,
		growingTechnologies,
		growingDirections,
		newToDataset,
		growingInData,
		total: candidates.length,
	}
}

export const allEmerging = (candidates: TaxonomyCandidate[]): EmergingSignalRow[] =>
	candidates.map((c) => candidateRow(c, POSTS))

export const emergingDetail = (
	candidateId: string,
	candidates: TaxonomyCandidate[]
): EmergingSignalDetail | null => {
	const c = candidates.find((x) => x.id === candidateId)
	if (!c) return null
	const evidence = POSTS.filter((p) => c.evidencePostIds.includes(p.id))
	const requirementCounts = new Map<string, number>()
	const techCounts = new Map<string, number>()
	const countryCounts = new Map<string, number>()
	let ratingSum = 0
	let ratingN = 0
	const budgets: number[] = []
	for (const p of evidence) {
		for (const r of p.requirements ?? [])
			requirementCounts.set(r, (requirementCounts.get(r) ?? 0) + 1)
		for (const t of p.technologies) techCounts.set(t, (techCounts.get(t) ?? 0) + 1)
		countryCounts.set(p.clientCountry, (countryCounts.get(p.clientCountry) ?? 0) + 1)
		if (p.clientRating != null) {
			ratingSum += p.clientRating
			ratingN += 1
		}
		const bv = p.contractType === 'fixed' ? p.fixedBudget : p.hourlyRateMax
		if (bv != null) budgets.push(bv)
	}
	const timelineMap = new Map<string, number>()
	for (const p of evidence) {
		const w = partsInZone(new Date(p.receivedAt)).weekLabel.slice(0, 7)
		timelineMap.set(w, (timelineMap.get(w) ?? 0) + 1)
	}
	const timeline = Array.from(timelineMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([weekLabel, count]) => ({ weekLabel, count }))
	const half = Math.max(1, Math.floor(evidence.length / 2))
	const currentCount = evidence.slice(0, half).length
	const previousCount = evidence.slice(half).length
	const growth = trendPct(currentCount, previousCount)
	const overlapWithTaxonomy: string[] = []
	for (const t of CANONICAL_TECHNOLOGIES)
		if (c.proposedName.toLowerCase().includes(t.name.toLowerCase()))
			overlapWithTaxonomy.push(t.name)
	for (const d of CANONICAL_DIRECTIONS)
		if (c.proposedName.toLowerCase().includes(d.name.toLowerCase()))
			overlapWithTaxonomy.push(d.name)
	const notif = evidence.reduce(
		(acc, p) => {
			acc[p.notificationStatus] = (acc[p.notificationStatus] ?? 0) + 1
			return acc
		},
		{} as Record<string, number>
	)
	const medBudget = budgets.length
		? (budgets.slice().sort((a, b) => a - b)[Math.floor(budgets.length / 2)] ?? null)
		: null
	const avgBudget = budgets.length
		? Math.round(budgets.reduce((s, v) => s + v, 0) / budgets.length)
		: null
	return {
		id: c.id,
		name: c.proposedName,
		proposedType: c.proposedType,
		status: c.status,
		definition: c.definition ?? c.description ?? c.proposedName,
		whyEmerging:
			c.whyEmerging ??
			'Growing repeated mentions in our dataset that do not fit existing canonical taxonomy.',
		timeline,
		previousPeriodComparison: {
			currentCount,
			previousCount,
			growthPct: growth,
		},
		representativePostIds: evidence
			.slice()
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map((p) => p.id),
		recurringRequirements: Array.from(requirementCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([k]) => k),
		relatedTechnologies: Array.from(techCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([k]) => k),
		clientProfile: {
			topCountries: Array.from(countryCounts.entries())
				.sort(([, a], [, b]) => b - a)
				.slice(0, 3)
				.map(([k]) => k),
			averageRating: ratingN ? safeAvg(ratingSum, ratingN) : null,
		},
		budgetProfile: { averageBudget: avgBudget, medianBudget: medBudget },
		overlapWithTaxonomy,
		scoreBreakdown: c.scoreBreakdown,
		sampleConfidence: confidenceFor(c.uniquePostCount, 3),
		sargasFit: c.sargasFit ?? 0,
		relatedTaxonomyItemIds: c.relatedTaxonomyItemIds,
		mergedIntoTaxonomyItemId: c.mergedIntoTaxonomyItemId,
		notificationStatusSummary: notif as EmergingSignalDetail['notificationStatusSummary'],
	}
}

export const _unusedFiltersHint = (_: SalesFilters) => null
