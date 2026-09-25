import type { MockJobPost } from '../../types/jobPost'
import type {
	DirectionRow,
	ScoreBucketRow,
	ScoreDistributionData,
	TechnologyCombinationRow,
	TechnologyRow,
	TimePatternPoint,
	TimePatternsData,
} from '../../types/aggregates'
import type { SalesFilters } from '../../types/filters'
import { DEFAULT_TIMEZONE, HOT_THRESHOLD, QUALIFIED_THRESHOLD, SCORE_BUCKETS } from '../../config'
import { partsInZone, WEEKDAY_LABELS, isoWeekStartLabel } from '../../utils/timezone'
import { safeAvg, sharePct, trendPct } from '../../utils/growth'
import { filteredPosts } from './posts'
import { CANONICAL_DIRECTIONS, CANONICAL_TECHNOLOGIES } from '../fixtures/taxonomy'

const zeros = (n: number): number[] => Array.from({ length: n }, () => 0)

export const timePatterns = (
	filters: SalesFilters,
	feedback: Map<string, string>
): TimePatternsData => {
	const { posts, previousPosts, window } = filteredPosts(filters, feedback)
	const tz = filters.timezone ?? DEFAULT_TIMEZONE
	const byHour = zeros(24)
	const byWeekday = zeros(7)
	const qualifiedByHour = zeros(24)
	const totalByHour = zeros(24)
	const hotByWeekday = zeros(7)
	for (const p of posts) {
		const { weekdayIndex, hour } = partsInZone(new Date(p.receivedAt), tz)
		byHour[hour] = (byHour[hour] ?? 0) + 1
		byWeekday[weekdayIndex] = (byWeekday[weekdayIndex] ?? 0) + 1
		totalByHour[hour] = (totalByHour[hour] ?? 0) + 1
		if (p.score >= QUALIFIED_THRESHOLD) qualifiedByHour[hour] = (qualifiedByHour[hour] ?? 0) + 1
		if (p.score >= HOT_THRESHOLD)
			hotByWeekday[weekdayIndex] = (hotByWeekday[weekdayIndex] ?? 0) + 1
	}
	const byHourP: TimePatternPoint[] = byHour.map((v, i) => ({
		label: `${String(i).padStart(2, '0')}:00`,
		value: v,
	}))
	const byWeekdayP: TimePatternPoint[] = byWeekday.map((v, i) => ({
		label: WEEKDAY_LABELS[i]!,
		value: v,
	}))
	const qRateByHour: TimePatternPoint[] = qualifiedByHour.map((q, i) => ({
		label: `${String(i).padStart(2, '0')}:00`,
		value: (totalByHour[i] ?? 0) > 0 ? Math.round((q / (totalByHour[i] ?? 1)) * 100) : 0,
		qualified: q,
	}))
	const hotByWeekdayP: TimePatternPoint[] = hotByWeekday.map((v, i) => ({
		label: WEEKDAY_LABELS[i]!,
		value: v,
	}))
	const weekAgg = (list: MockJobPost[]): TimePatternPoint[] => {
		const map = new Map<string, number>()
		for (const p of list) {
			const label = isoWeekStartLabel(new Date(p.receivedAt), tz)
			map.set(label, (map.get(label) ?? 0) + 1)
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([label, value]) => ({ label, value }))
	}
	return {
		byHour: byHourP,
		byWeekday: byWeekdayP,
		qualifiedRateByHour: qRateByHour,
		hotByWeekday: hotByWeekdayP,
		weeklyTrend: weekAgg(posts),
		previousWeeklyTrend: weekAgg(previousPosts),
		sampleSize: posts.length,
		periodLabel: window.label,
		previousPeriodLabel: `Prev ${window.label.toLowerCase()}`,
		timezone: tz,
	}
}

export const scoreDistribution = (
	filters: SalesFilters,
	feedback: Map<string, string>
): ScoreDistributionData => {
	const { posts } = filteredPosts(filters, feedback)
	const analyzed = posts.filter((p) => p.analysisStatus === 'completed')
	const total = analyzed.length
	const hasFeedback = feedback.size > 0
	const buckets: ScoreBucketRow[] = SCORE_BUCKETS.map((b) => {
		const inBucket = analyzed.filter((p) => p.score >= b.min && p.score <= b.max)
		let rel = 0
		let not = 0
		let very = 0
		let un = 0
		for (const p of inBucket) {
			const f = feedback.get(p.id)
			if (f === 'relevant') rel += 1
			else if (f === 'not_relevant') not += 1
			else if (f === 'very_relevant') very += 1
			else un += 1
		}
		return {
			label: b.label,
			min: b.min,
			max: b.max,
			color: b.color,
			count: inBucket.length,
			share: sharePct(inBucket.length, total),
			relevant: rel,
			notRelevant: not,
			veryRelevant: very,
			unrated: un,
		}
	})
	return { buckets, total, hasFeedback }
}

const budgetValue = (p: MockJobPost): number | null => {
	if (p.contractType === 'fixed' && p.fixedBudget != null) return p.fixedBudget
	if (p.contractType === 'hourly' && p.hourlyRateMax != null) return p.hourlyRateMax
	return null
}

const summarizeBucket = (posts: MockJobPost[]): { avg: number; med: number | null } => {
	const vals = posts.map(budgetValue).filter((v): v is number => v != null)
	if (!vals.length) return { avg: 0, med: null }
	const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
	const sorted = vals.slice().sort((a, b) => a - b)
	const med = sorted[Math.floor(sorted.length / 2)] ?? null
	return { avg, med }
}

export const directionsBreakdown = (
	filters: SalesFilters,
	feedback: Map<string, string>
): DirectionRow[] => {
	const { posts, previousPosts } = filteredPosts(filters, feedback)
	const names = CANONICAL_DIRECTIONS.map((d) => d.name)
	return names
		.map((name) => {
			const cur = posts.filter((p) => p.directions.includes(name))
			const prev = previousPosts.filter((p) => p.directions.includes(name))
			const qual = cur.filter((p) => p.score >= QUALIFIED_THRESHOLD).length
			const hot = cur.filter((p) => p.score >= HOT_THRESHOLD).length
			const sum = summarizeBucket(cur)
			return {
				name,
				slug: name.toLowerCase().replace(/[^\w]+/g, '-'),
				total: cur.length,
				qualified: qual,
				hot,
				qualifiedRate: cur.length ? Math.round((qual / cur.length) * 100) : 0,
				averageScore: cur.length
					? Math.round(cur.reduce((s, p) => s + p.score, 0) / cur.length)
					: 0,
				medianBudget: sum.med,
				averageBudget: cur.length ? sum.avg : null,
				trendPct: trendPct(cur.length, prev.length),
			}
		})
		.sort((a, b) => b.total - a.total)
}

export const technologiesBreakdown = (
	filters: SalesFilters,
	feedback: Map<string, string>
): TechnologyRow[] => {
	const { posts, previousPosts } = filteredPosts(filters, feedback)
	const names = CANONICAL_TECHNOLOGIES.map((t) => t.name)
	return names
		.map((name) => {
			const cur = posts.filter((p) => p.technologies.includes(name))
			const prev = previousPosts.filter((p) => p.technologies.includes(name))
			const qual = cur.filter((p) => p.score >= QUALIFIED_THRESHOLD).length
			const hot = cur.filter((p) => p.score >= HOT_THRESHOLD).length
			const sum = summarizeBucket(cur)
			const mentions = posts.reduce(
				(s, p) => s + p.technologies.filter((t) => t === name).length,
				0
			)
			return {
				name,
				slug: name.toLowerCase().replace(/[^\w]+/g, '-'),
				mentions,
				total: cur.length,
				qualified: qual,
				hot,
				qualifiedRate: cur.length ? Math.round((qual / cur.length) * 100) : 0,
				averageScore: cur.length
					? Math.round(cur.reduce((s, p) => s + p.score, 0) / cur.length)
					: 0,
				medianBudget: sum.med,
				averageBudget: cur.length ? sum.avg : null,
				trendPct: trendPct(cur.length, prev.length),
			}
		})
		.sort((a, b) => b.total - a.total)
}

const CANDIDATE_COMBOS: Array<[string, string]> = [
	['Next.js', 'Node.js'],
	['n8n', 'OpenAI'],
	['React', 'Python'],
	['Marketplace Development', 'Stripe'],
	['SaaS Development', 'AI Integration'],
	['Next.js', 'OpenAI'],
	['Supabase', 'Next.js'],
	['Node.js', 'PostgreSQL'],
]

const isDirection = (name: string) => CANONICAL_DIRECTIONS.some((d) => d.name === name)

const postHas = (p: MockJobPost, name: string) =>
	isDirection(name) ? p.directions.includes(name) : p.technologies.includes(name)

export const technologyCombinations = (
	filters: SalesFilters,
	feedback: Map<string, string>
): TechnologyCombinationRow[] => {
	const { posts, previousPosts } = filteredPosts(filters, feedback)
	return CANDIDATE_COMBOS.map(([a, b]) => {
		const cur = posts.filter((p) => postHas(p, a) && postHas(p, b))
		const prev = previousPosts.filter((p) => postHas(p, a) && postHas(p, b))
		const qual = cur.filter((p) => p.score >= QUALIFIED_THRESHOLD).length
		return {
			pair: [a, b] as [string, string],
			total: cur.length,
			qualified: qual,
			averageScore:
				cur.length > 0 ? Math.round(cur.reduce((s, p) => s + p.score, 0) / cur.length) : 0,
			trendPct: trendPct(cur.length, prev.length),
			representativePostIds: cur
				.slice()
				.sort((x, y) => y.score - x.score)
				.slice(0, 3)
				.map((p) => p.id),
		}
	})
		.filter((c) => c.total > 0)
		.sort((x, y) => y.total - x.total)
}

export { safeAvg, sharePct }
