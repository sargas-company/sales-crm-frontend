import type { MockJobPost, JobPostAnalyticsSummary } from '../../types/jobPost'
import type {
	ActionableInsights,
	CoverageWindows,
	HeatmapCell,
	HeatmapData,
	HeatmapDailyCell,
	HeatmapMetric,
	InsightItem,
	RecentHighScorePostsData,
	SalesOverviewSummary,
	KpiValue,
} from '../../types/aggregates'
import type { SalesFilters } from '../../types/filters'
import { HOT_THRESHOLD, QUALIFIED_THRESHOLD, DEFAULT_TIMEZONE } from '../../config'
import { confidenceFor, safeAvg, sharePct, trendPct } from '../../utils/growth'
import { partsInZone, WEEKDAY_LABELS } from '../../utils/timezone'
import { budgetLabel, clientTier, filteredPosts } from './posts'

const qualifiedCount = (posts: MockJobPost[]): number =>
	posts.filter((p) => p.score >= QUALIFIED_THRESHOLD).length

const hotCount = (posts: MockJobPost[]): number =>
	posts.filter((p) => p.score >= HOT_THRESHOLD).length

const averageScore = (posts: MockJobPost[]): number => {
	if (posts.length === 0) return 0
	const sum = posts.reduce((s, p) => s + p.score, 0)
	return Math.round(sum / posts.length)
}

const kpi = (current: number, previous: number): KpiValue => ({
	current,
	previous,
	trendPct: trendPct(current, previous),
	confidence: confidenceFor(Math.max(current, previous), 5),
})

export const salesOverview = (
	filters: SalesFilters,
	feedback: Map<string, string>
): SalesOverviewSummary => {
	const { posts, previousPosts, window } = filteredPosts(filters, feedback)
	const analyzed = posts.filter((p) => p.analysisStatus === 'completed')
	const prevAnalyzed = previousPosts.filter((p) => p.analysisStatus === 'completed')
	const qCur = qualifiedCount(analyzed)
	const qPrev = qualifiedCount(prevAnalyzed)
	const rateCur = analyzed.length > 0 ? Math.round((qCur / analyzed.length) * 100) : 0
	const ratePrev = prevAnalyzed.length > 0 ? Math.round((qPrev / prevAnalyzed.length) * 100) : 0
	return {
		period: window.label,
		received: kpi(posts.length, previousPosts.length),
		qualified: kpi(qCur, qPrev),
		hot: kpi(hotCount(analyzed), hotCount(prevAnalyzed)),
		qualifiedRate: kpi(rateCur, ratePrev),
		averageScore: kpi(averageScore(analyzed), averageScore(prevAnalyzed)),
	}
}

const emptyCells = (): HeatmapCell[] => {
	const cells: HeatmapCell[] = []
	for (let w = 0; w < 7; w++) {
		for (let h = 0; h < 24; h++) {
			cells.push({
				weekdayIndex: w,
				hour: h,
				total: 0,
				qualified: 0,
				hot: 0,
				averageScore: 0,
				qualifiedRate: 0,
			})
		}
	}
	return cells
}

const bucketScoreSum = (): Map<string, { sum: number; count: number }> => new Map()

const metricValue = (
	c: { total: number; qualified: number; hot: number; qualifiedRate: number; averageScore: number },
	metric: HeatmapMetric
): number => {
	if (metric === 'all') return c.total
	if (metric === 'qualified') return c.qualified
	if (metric === 'hot') return c.hot
	if (metric === 'qualifiedRate') return c.qualifiedRate
	return c.averageScore
}

const buildDailyCells = (
	posts: MockJobPost[],
	timezone: string,
	fromMs: number,
	toMs: number
): HeatmapDailyCell[] => {
	const dayMs = 24 * 60 * 60 * 1000
	const fmt = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
	const dateKey = (ms: number): string => fmt.format(new Date(ms))

	const daySet = new Set<string>()
	const dayList: { date: string; weekdayIndex: number }[] = []
	for (let ms = fromMs; ms <= toMs; ms += dayMs) {
		const key = dateKey(ms)
		if (daySet.has(key)) continue
		daySet.add(key)
		const { weekdayIndex } = partsInZone(new Date(ms), timezone)
		dayList.push({ date: key, weekdayIndex })
	}

	const cells: HeatmapDailyCell[] = []
	const cellIndex = new Map<string, HeatmapDailyCell>()
	for (const d of dayList) {
		for (let h = 0; h < 24; h++) {
			const cell: HeatmapDailyCell = {
				date: d.date,
				weekdayIndex: d.weekdayIndex,
				hour: h,
				total: 0,
				qualified: 0,
				hot: 0,
				averageScore: 0,
				qualifiedRate: 0,
			}
			cells.push(cell)
			cellIndex.set(`${d.date}:${h}`, cell)
		}
	}

	const sums = new Map<string, { sum: number; count: number }>()
	for (const p of posts) {
		const date = dateKey(new Date(p.receivedAt).getTime())
		const { hour } = partsInZone(new Date(p.receivedAt), timezone)
		const cell = cellIndex.get(`${date}:${hour}`)
		if (!cell) continue
		cell.total += 1
		if (p.score >= QUALIFIED_THRESHOLD) cell.qualified += 1
		if (p.score >= HOT_THRESHOLD) cell.hot += 1
		const key = `${date}:${hour}`
		const cur = sums.get(key) ?? { sum: 0, count: 0 }
		cur.sum += p.score
		cur.count += 1
		sums.set(key, cur)
	}
	for (const cell of cells) {
		const s = sums.get(`${cell.date}:${cell.hour}`)
		cell.averageScore = s && s.count > 0 ? Math.round(s.sum / s.count) : 0
		cell.qualifiedRate = cell.total > 0 ? Math.round((cell.qualified / cell.total) * 100) : 0
	}
	return cells
}

export const opportunityHeatmap = (
	filters: SalesFilters,
	feedback: Map<string, string>,
	metric: HeatmapMetric
): HeatmapData => {
	const { posts, window } = filteredPosts(filters, feedback)
	const cells = emptyCells()
	const sums = bucketScoreSum()
	const timezone = filters.timezone ?? DEFAULT_TIMEZONE
	for (const p of posts) {
		const { weekdayIndex, hour } = partsInZone(new Date(p.receivedAt), timezone)
		const idx = weekdayIndex * 24 + hour
		const cell = cells[idx]!
		cell.total += 1
		if (p.score >= QUALIFIED_THRESHOLD) cell.qualified += 1
		if (p.score >= HOT_THRESHOLD) cell.hot += 1
		const key = `${weekdayIndex}:${hour}`
		const cur = sums.get(key) ?? { sum: 0, count: 0 }
		cur.sum += p.score
		cur.count += 1
		sums.set(key, cur)
	}
	for (const cell of cells) {
		const key = `${cell.weekdayIndex}:${cell.hour}`
		const s = sums.get(key)
		cell.averageScore = s && s.count > 0 ? Math.round(s.sum / s.count) : 0
		cell.qualifiedRate = cell.total > 0 ? Math.round((cell.qualified / cell.total) * 100) : 0
	}
	const maxValue = cells.reduce((m, c) => Math.max(m, metricValue(c, metric)), 0)

	let dailyCells: HeatmapDailyCell[] | undefined
	let dailyMaxValue: number | undefined
	if (filters.dateRange === '30d') {
		dailyCells = buildDailyCells(posts, timezone, window.fromMs, window.toMs)
		dailyMaxValue = dailyCells.reduce((m, c) => Math.max(m, metricValue(c, metric)), 0)
	}

	return {
		timezone,
		metric,
		cells,
		dailyCells,
		sampleSize: posts.length,
		maxValue,
		dailyMaxValue,
	}
}

export const coverageWindows = (
	filters: SalesFilters,
	feedback: Map<string, string>
): CoverageWindows => {
	const heat = opportunityHeatmap(filters, feedback, 'qualified')
	const timezone = filters.timezone ?? DEFAULT_TIMEZONE
	const { window } = filteredPosts(filters, feedback)
	const spans = 3
	const bandLength = 4
	const scored: {
		weekdayIndex: number
		startHour: number
		endHour: number
		qualified: number
		total: number
	}[] = []
	for (let w = 0; w < 7; w++) {
		for (let h = 0; h <= 24 - bandLength; h++) {
			let qualified = 0
			let total = 0
			for (let k = 0; k < bandLength; k++) {
				const cell = heat.cells[w * 24 + h + k]!
				qualified += cell.qualified
				total += cell.total
			}
			scored.push({ weekdayIndex: w, startHour: h, endHour: h + bandLength, qualified, total })
		}
	}
	scored.sort((a, b) => b.qualified - a.qualified || b.total - a.total)
	const windows: CoverageWindows['windows'] = []
	const usedWeekdays = new Set<number>()
	for (const c of scored) {
		if (windows.length >= spans) break
		if (usedWeekdays.has(c.weekdayIndex)) continue
		if (c.qualified === 0) break
		usedWeekdays.add(c.weekdayIndex)
		const qph = Math.round((c.qualified / bandLength) * 10) / 10
		windows.push({
			weekdayRangeLabel: WEEKDAY_LABELS[c.weekdayIndex]!,
			hourRangeLabel: `${String(c.startHour).padStart(2, '0')}:00–${String(c.endHour).padStart(2, '0')}:00`,
			qualifiedPerHour: qph,
			sampleSize: c.qualified,
			confidence: confidenceFor(c.qualified, 3),
		})
	}
	return { windows, periodLabel: window.label, timezone }
}

export const recentHighScorePosts = (
	filters: SalesFilters,
	feedback: Map<string, string>,
	limit = 6
): RecentHighScorePostsData => {
	const { posts } = filteredPosts(filters, feedback)
	const qualified = posts.filter((p) => p.score >= QUALIFIED_THRESHOLD)
	const sorted = qualified
		.slice()
		.sort(
			(a, b) =>
				b.score - a.score || new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
		)
	const items: JobPostAnalyticsSummary[] = sorted.slice(0, limit).map((p) => ({
		id: p.id,
		title: p.title,
		score: p.score,
		directions: p.directions,
		technologies: p.technologies.slice(0, 3),
		budgetLabel: budgetLabel(p),
		clientCountry: p.clientCountry,
		clientTier: clientTier(p),
		notificationStatus: p.notificationStatus,
		receivedAt: p.receivedAt,
		originalUrl: p.originalUrl,
	}))
	return { items, total: qualified.length }
}

const topWindow = (
	heat: HeatmapData
): { weekday: number; startHour: number; endHour: number; qualified: number } | null => {
	let best = null as null | {
		weekday: number
		startHour: number
		endHour: number
		qualified: number
	}
	for (let w = 0; w < 7; w++) {
		for (let h = 0; h <= 20; h++) {
			let q = 0
			for (let k = 0; k < 4; k++) q += heat.cells[w * 24 + h + k]!.qualified
			if (!best || q > best.qualified)
				best = { weekday: w, startHour: h, endHour: h + 4, qualified: q }
		}
	}
	return best && best.qualified > 0 ? best : null
}

const countBy = <T>(items: T[], key: (v: T) => string): Map<string, number> => {
	const m = new Map<string, number>()
	for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1)
	return m
}

export const actionableInsights = (
	filters: SalesFilters,
	feedback: Map<string, string>
): ActionableInsights => {
	const { posts, previousPosts, window } = filteredPosts(filters, feedback)
	const analyzed = posts.filter((p) => p.analysisStatus === 'completed')
	const hot = analyzed.filter((p) => p.score >= HOT_THRESHOLD)
	const insights: InsightItem[] = []
	if (analyzed.length >= 5) {
		const heat = opportunityHeatmap(filters, feedback, 'hot')
		const t = topWindow(heat)
		if (t) {
			const share =
				hot.length > 0 ? Math.round((t.qualified / Math.max(hot.length, 1)) * 100) : 0
			if (share > 0) {
				insights.push({
					id: 'insight-window',
					kind: 'temporal',
					message: `${share}% of hot posts arrived ${WEEKDAY_LABELS[t.weekday]} ${String(t.startHour).padStart(2, '0')}:00–${String(t.endHour).padStart(2, '0')}:00.`,
					sampleSize: t.qualified,
					periodLabel: window.label,
					relatedPostIds: hot.slice(0, 5).map((p) => p.id),
				})
			}
		}
	}
	const techNow = countBy(
		analyzed.filter((p) => p.score >= QUALIFIED_THRESHOLD).flatMap((p) => p.technologies),
		(t) => t
	)
	const techPrev = countBy(
		previousPosts.filter((p) => p.score >= QUALIFIED_THRESHOLD).flatMap((p) => p.technologies),
		(t) => t
	)
	const growingCombo = Array.from(techNow.entries())
		.map(([t, n]) => ({
			tech: t,
			n,
			prev: techPrev.get(t) ?? 0,
			trend: trendPct(n, techPrev.get(t) ?? 0),
		}))
		.filter((x) => x.n >= 3 && x.trend != null && x.trend > 0)
		.sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0))
	if (growingCombo[0]) {
		const g = growingCombo[0]
		insights.push({
			id: 'insight-tech-growth',
			kind: 'demand',
			message: `${g.tech} demand increased ${g.trend}% vs the previous period.`,
			sampleSize: g.n,
			periodLabel: window.label,
			filterHint: { technology: g.tech },
			relatedPostIds: analyzed
				.filter((p) => p.technologies.includes(g.tech))
				.slice(0, 5)
				.map((p) => p.id),
		})
	}
	const marketplace = analyzed.filter((p) => p.directions.includes('Marketplace Development'))
	const mainten = analyzed.filter((p) => p.directions.includes('Maintenance'))
	if (marketplace.length >= 3 && mainten.length >= 2) {
		const mAvg = safeAvg(
			marketplace.reduce((s, p) => s + (p.fixedBudget ?? p.hourlyRateMax ?? 0), 0),
			marketplace.length
		)
		const nAvg = safeAvg(
			mainten.reduce((s, p) => s + (p.fixedBudget ?? p.hourlyRateMax ?? 0), 0),
			mainten.length
		)
		if (mAvg > nAvg) {
			insights.push({
				id: 'insight-budget-compare',
				kind: 'budget',
				message: `Marketplace posts show higher average budgets than maintenance work in this period.`,
				sampleSize: marketplace.length + mainten.length,
				periodLabel: window.label,
				filterHint: { direction: 'Marketplace Development' },
				relatedPostIds: marketplace.slice(0, 5).map((p) => p.id),
			})
		}
	}
	const rejected = analyzed.filter((p) => feedback.get(p.id) === 'not_relevant')
	if (rejected.length >= 3) {
		insights.push({
			id: 'insight-rejected',
			kind: 'demand',
			message: `${rejected.length} alerts marked "not relevant" this period — mostly ${
				countTop(rejected.flatMap((p) => p.directions))?.[0] ?? 'low-budget work'
			}.`,
			sampleSize: rejected.length,
			periodLabel: window.label,
			filterHint: { manualRelevance: 'not_relevant' },
			relatedPostIds: rejected.slice(0, 5).map((p) => p.id),
		})
	}
	const clarityAvg =
		analyzed.length > 0
			? Math.round(
					analyzed.reduce((s, p) => s + (p.scoreBreakdown.clarity ?? 0), 0) / analyzed.length
				)
			: 0
	if (analyzed.length >= 8 && clarityAvg < 60) {
		insights.push({
			id: 'insight-clarity',
			kind: 'demand',
			message: `Average job clarity is ${clarityAvg}/100 — most jobs need discovery before pricing.`,
			sampleSize: analyzed.length,
			periodLabel: window.label,
			relatedPostIds: analyzed.slice(0, 5).map((p) => p.id),
		})
	}
	return { items: insights.slice(0, 5) }
}

const countTop = (arr: string[]): [string, number] | null => {
	const m = countBy(arr, (v) => v)
	let best: [string, number] | null = null
	for (const [k, v] of m) {
		if (!best || v > best[1]) best = [k, v]
	}
	return best
}

export { safeAvg, sharePct }
