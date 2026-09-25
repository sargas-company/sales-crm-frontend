import type { MockJobPost } from '../../types/jobPost'
import type {
	BidPlaybook,
	BudgetBreakdownData,
	BudgetBucketRow,
	ClientQualityData,
	ClientQualityRow,
	DemandInsightRow,
	DemandInsightsData,
} from '../../types/aggregates'
import type { SalesFilters } from '../../types/filters'
import { FIXED_BUDGET_BUCKETS, HOURLY_BUDGET_BUCKETS, QUALIFIED_THRESHOLD } from '../../config'
import { sharePct, trendPct } from '../../utils/growth'
import { CLIENT_TIER_META, clientTier, filteredPosts } from './posts'
import { PLAYBOOK_DEFS } from '../fixtures/playbooks'

const bucketRow = (
	kind: 'fixed' | 'hourly',
	key: string,
	label: string,
	posts: MockJobPost[]
): BudgetBucketRow => {
	const total = posts.length
	const qual = posts.filter((p) => p.score >= QUALIFIED_THRESHOLD).length
	const avgScore = total ? Math.round(posts.reduce((s, p) => s + p.score, 0) / total) : 0
	const dirCounts = new Map<string, number>()
	const techCounts = new Map<string, number>()
	for (const p of posts) {
		for (const d of p.directions) dirCounts.set(d, (dirCounts.get(d) ?? 0) + 1)
		for (const t of p.technologies) techCounts.set(t, (techCounts.get(t) ?? 0) + 1)
	}
	const topN = (m: Map<string, number>, n: number) =>
		Array.from(m.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, n)
			.map(([k]) => k)
	return {
		key,
		label,
		kind,
		total,
		qualified: qual,
		qualifiedRate: total ? Math.round((qual / total) * 100) : 0,
		averageScore: avgScore,
		topDirections: topN(dirCounts, 2),
		topTechnologies: topN(techCounts, 3),
	}
}

export const budgetBreakdown = (
	filters: SalesFilters,
	feedback: Map<string, string>
): BudgetBreakdownData => {
	const { posts } = filteredPosts(filters, feedback)
	const fixed = posts.filter((p) => p.contractType === 'fixed')
	const hourly = posts.filter((p) => p.contractType === 'hourly')
	const unknown = posts.filter((p) => p.contractType === 'unknown')
	const fixedRows = FIXED_BUDGET_BUCKETS.map((b) => {
		const inB = fixed.filter((p) => {
			if (p.fixedBudget == null) return false
			if (b.max == null) return p.fixedBudget >= b.min
			return p.fixedBudget >= b.min && p.fixedBudget <= b.max
		})
		return bucketRow('fixed', b.key, b.label, inB)
	})
	const hourlyRows = HOURLY_BUDGET_BUCKETS.map((b) => {
		const inB = hourly.filter((p) => {
			if (p.hourlyRateMax == null) return false
			if (b.max == null) return p.hourlyRateMax >= b.min
			return p.hourlyRateMax >= b.min && p.hourlyRateMax <= b.max
		})
		return bucketRow('hourly', b.key, b.label, inB)
	})
	const unknownFixed = fixed.filter((p) => p.fixedBudget == null).length
	const unknownHourly = hourly.filter((p) => p.hourlyRateMax == null).length
	return {
		fixed: fixedRows,
		hourly: hourlyRows,
		unknownFixed,
		unknownHourly,
		contractTypeSplit: { fixed: fixed.length, hourly: hourly.length, unknown: unknown.length },
	}
}

export const clientQuality = (
	filters: SalesFilters,
	feedback: Map<string, string>
): ClientQualityData => {
	const { posts } = filteredPosts(filters, feedback)
	const tiers: ClientQualityRow['tier'][] = ['elite', 'strong', 'standard', 'new', 'unverified']
	const rows: ClientQualityRow[] = tiers.map((tier) => {
		const inTier = posts.filter((p) => clientTier(p) === tier)
		const qual = inTier.filter((p) => p.score >= QUALIFIED_THRESHOLD).length
		const avgBudget = (() => {
			const vals = inTier
				.map((p) => (p.contractType === 'fixed' ? p.fixedBudget : p.hourlyRateMax) ?? null)
				.filter((v): v is number => v != null)
			if (!vals.length) return null
			return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
		})()
		const countryCounts = new Map<string, number>()
		const dirCounts = new Map<string, number>()
		for (const p of inTier) {
			countryCounts.set(p.clientCountry, (countryCounts.get(p.clientCountry) ?? 0) + 1)
			for (const d of p.directions) dirCounts.set(d, (dirCounts.get(d) ?? 0) + 1)
		}
		const topCountries = Array.from(countryCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 3)
			.map(([country, count]) => ({ country, count }))
		const topDirections = Array.from(dirCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 3)
			.map(([k]) => k)
		return {
			tier,
			label: CLIENT_TIER_META[tier].label,
			description: CLIENT_TIER_META[tier].rule,
			total: inTier.length,
			qualified: qual,
			qualifiedRate: inTier.length ? Math.round((qual / inTier.length) * 100) : 0,
			averageScore: inTier.length
				? Math.round(inTier.reduce((s, p) => s + p.score, 0) / inTier.length)
				: 0,
			averageBudget: avgBudget,
			topCountries,
			topDirections,
		}
	})
	return {
		rows,
		tierRules: tiers.map((t) => ({
			tier: t,
			label: CLIENT_TIER_META[t].label,
			rule: CLIENT_TIER_META[t].rule,
		})),
	}
}

const DEMAND_KINDS: Array<{ key: DemandInsightRow['kind']; field: keyof MockJobPost }> = [
	{ key: 'goal', field: 'goals' },
	{ key: 'painPoint', field: 'painPoints' },
	{ key: 'deliverable', field: 'deliverables' },
	{ key: 'requirement', field: 'requirements' },
	{ key: 'concern', field: 'concerns' },
	{ key: 'integration', field: 'integrations' },
]

export const demandInsights = (
	filters: SalesFilters,
	feedback: Map<string, string>
): DemandInsightsData => {
	const { posts, previousPosts } = filteredPosts(filters, feedback)
	const rows: DemandInsightRow[] = []
	const totalRelevant = posts.filter((p) => p.score >= QUALIFIED_THRESHOLD).length || posts.length
	for (const { key, field } of DEMAND_KINDS) {
		const counts = new Map<string, MockJobPost[]>()
		for (const p of posts) {
			const vs = (p[field] as string[] | undefined) ?? []
			for (const v of vs) {
				if (!counts.has(v)) counts.set(v, [])
				counts.get(v)!.push(p)
			}
		}
		const prevCounts = new Map<string, number>()
		for (const p of previousPosts) {
			const vs = (p[field] as string[] | undefined) ?? []
			for (const v of vs) prevCounts.set(v, (prevCounts.get(v) ?? 0) + 1)
		}
		for (const [label, ps] of counts) {
			if (ps.length < 2) continue
			const dirCounts = new Map<string, number>()
			const techCounts = new Map<string, number>()
			for (const p of ps) {
				for (const d of p.directions) dirCounts.set(d, (dirCounts.get(d) ?? 0) + 1)
				for (const t of p.technologies) techCounts.set(t, (techCounts.get(t) ?? 0) + 1)
			}
			const top = (m: Map<string, number>, n: number) =>
				Array.from(m.entries())
					.sort(([, a], [, b]) => b - a)
					.slice(0, n)
					.map(([k]) => k)
			rows.push({
				kind: key,
				label,
				count: ps.length,
				share: sharePct(ps.length, totalRelevant),
				trendPct: trendPct(ps.length, prevCounts.get(label) ?? 0),
				relatedDirections: top(dirCounts, 2),
				relatedTechnologies: top(techCounts, 3),
				representativePostIds: ps
					.slice()
					.sort((x, y) => y.score - x.score)
					.slice(0, 5)
					.map((p) => p.id),
			})
		}
	}
	rows.sort((a, b) => b.count - a.count)
	return { rows }
}

export const bidPlaybooks = (
	filters: SalesFilters,
	feedback: Map<string, string>
): BidPlaybook[] => {
	const { posts, window } = filteredPosts(filters, feedback)
	return PLAYBOOK_DEFS.map((pb) => {
		const matches = posts.filter(pb.match)
		const goalCounts = new Map<string, number>()
		const painCounts = new Map<string, number>()
		for (const p of matches) {
			for (const g of p.goals ?? []) goalCounts.set(g, (goalCounts.get(g) ?? 0) + 1)
			for (const pp of p.painPoints ?? []) painCounts.set(pp, (painCounts.get(pp) ?? 0) + 1)
		}
		const top = (m: Map<string, number>, n: number, fallback: string[]): string[] => {
			const entries = Array.from(m.entries())
				.sort(([, a], [, b]) => b - a)
				.slice(0, n)
				.map(([k]) => k)
			return entries.length ? entries : fallback.slice(0, n)
		}
		return {
			id: pb.id,
			cluster: pb.cluster,
			targetPattern: pb.targetPattern,
			typicalGoals: top(goalCounts, 3, pb.fallbackGoals),
			typicalPainPoints: top(painCounts, 3, pb.fallbackPainPoints),
			openingAngle: pb.openingAngle,
			proofPoints: pb.proofPoints,
			technicalEmphasis: pb.technicalEmphasis,
			discoveryQuestions: pb.discoveryQuestions,
			avoid: pb.avoid,
			representativePostIds: matches
				.slice()
				.sort((a, b) => b.score - a.score)
				.slice(0, 5)
				.map((p) => p.id),
			sampleSize: matches.length,
			periodLabel: window.label,
		}
	})
}
