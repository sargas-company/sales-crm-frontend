import type { ClientTier, JobPostAnalyticsSummary, NotificationStatus } from './jobPost'
import type { EmergingScoreBreakdown, TaxonomyCandidateStatus } from './candidates'
import type { TaxonomyType } from './taxonomy'

export interface KpiValue {
	current: number
	previous: number
	trendPct: number | null
	confidence: 'high' | 'medium' | 'low'
}

export interface SalesOverviewSummary {
	period: string
	received: KpiValue
	qualified: KpiValue
	hot: KpiValue
	qualifiedRate: KpiValue
	averageScore: KpiValue
}

export type HeatmapMetric = 'all' | 'qualified' | 'hot' | 'qualifiedRate' | 'averageScore'

export interface HeatmapCell {
	weekdayIndex: number
	hour: number
	total: number
	qualified: number
	hot: number
	averageScore: number
	qualifiedRate: number
}

export interface HeatmapDailyCell {
	date: string
	weekdayIndex: number
	hour: number
	total: number
	qualified: number
	hot: number
	averageScore: number
	qualifiedRate: number
}

export interface HeatmapData {
	timezone: string
	metric: HeatmapMetric
	cells: HeatmapCell[]
	dailyCells?: HeatmapDailyCell[]
	sampleSize: number
	maxValue: number
	dailyMaxValue?: number
}

export interface CoverageWindow {
	weekdayRangeLabel: string
	hourRangeLabel: string
	qualifiedPerHour: number
	sampleSize: number
	confidence: 'high' | 'medium' | 'low'
}

export interface CoverageWindows {
	windows: CoverageWindow[]
	periodLabel: string
	timezone: string
}

export interface InsightItem {
	id: string
	kind: 'temporal' | 'demand' | 'budget' | 'client' | 'combo'
	message: string
	sampleSize: number
	periodLabel: string
	filterHint?: Record<string, string | number>
	relatedPostIds: string[]
}

export interface ActionableInsights {
	items: InsightItem[]
}

export interface RecentHighScorePostsData {
	items: JobPostAnalyticsSummary[]
	total: number
}

export interface TimePatternPoint {
	label: string
	value: number
	qualified?: number
	hot?: number
	qualifiedRate?: number
}

export interface TimePatternsData {
	byHour: TimePatternPoint[]
	byWeekday: TimePatternPoint[]
	qualifiedRateByHour: TimePatternPoint[]
	hotByWeekday: TimePatternPoint[]
	weeklyTrend: TimePatternPoint[]
	previousWeeklyTrend: TimePatternPoint[]
	sampleSize: number
	periodLabel: string
	previousPeriodLabel: string
	timezone: string
}

export interface ScoreBucketRow {
	label: string
	min: number
	max: number
	color: string
	count: number
	share: number
	relevant: number
	notRelevant: number
	veryRelevant: number
	unrated: number
}

export interface ScoreDistributionData {
	buckets: ScoreBucketRow[]
	total: number
	hasFeedback: boolean
}

export interface DirectionRow {
	name: string
	slug: string
	total: number
	qualified: number
	hot: number
	qualifiedRate: number
	averageScore: number
	medianBudget: number | null
	averageBudget: number | null
	trendPct: number | null
}

export interface TechnologyRow extends DirectionRow {
	mentions: number
}

export interface TechnologyCombinationRow {
	pair: [string, string]
	total: number
	qualified: number
	averageScore: number
	trendPct: number | null
	representativePostIds: string[]
}

export interface BudgetBucketRow {
	key: string
	label: string
	kind: 'fixed' | 'hourly'
	total: number
	qualified: number
	qualifiedRate: number
	averageScore: number
	topDirections: string[]
	topTechnologies: string[]
}

export interface BudgetBreakdownData {
	fixed: BudgetBucketRow[]
	hourly: BudgetBucketRow[]
	unknownFixed: number
	unknownHourly: number
	contractTypeSplit: { fixed: number; hourly: number; unknown: number }
}

export interface ClientQualityRow {
	tier: ClientTier
	label: string
	description: string
	total: number
	qualified: number
	qualifiedRate: number
	averageScore: number
	averageBudget: number | null
	topCountries: Array<{ country: string; count: number }>
	topDirections: string[]
}

export interface ClientQualityData {
	rows: ClientQualityRow[]
	tierRules: Array<{ tier: ClientTier; label: string; rule: string }>
}

export interface DemandInsightRow {
	kind: 'goal' | 'painPoint' | 'deliverable' | 'requirement' | 'concern' | 'integration'
	label: string
	count: number
	share: number
	trendPct: number | null
	relatedDirections: string[]
	relatedTechnologies: string[]
	representativePostIds: string[]
}

export interface DemandInsightsData {
	rows: DemandInsightRow[]
}

export interface BidPlaybook {
	id: string
	cluster: string
	targetPattern: string
	typicalGoals: string[]
	typicalPainPoints: string[]
	openingAngle: string
	proofPoints: string[]
	technicalEmphasis: string[]
	discoveryQuestions: string[]
	avoid: string[]
	representativePostIds: string[]
	sampleSize: number
	periodLabel: string
}

export interface EmergingSignalRow {
	id: string
	name: string
	proposedType: TaxonomyType
	status: TaxonomyCandidateStatus
	firstSeenAt: string
	lastSeenAt: string
	postCount: number
	uniqueClientCount?: number
	qualifiedCount: number
	hotCount: number
	averageScore: number
	averageBudget: number | null
	growthPct: number | null
	sargasFit: number
	confidence: number
	relatedTaxonomy: string[]
	newToDataset: boolean
}

export interface EmergingOverview {
	topEmerging: EmergingSignalRow[]
	growingTechnologies: EmergingSignalRow[]
	growingDirections: EmergingSignalRow[]
	newToDataset: EmergingSignalRow[]
	growingInData: EmergingSignalRow[]
	total: number
}

export interface EmergingSignalDetail {
	id: string
	name: string
	proposedType: TaxonomyType
	status: TaxonomyCandidateStatus
	definition: string
	whyEmerging: string
	timeline: Array<{ weekLabel: string; count: number }>
	previousPeriodComparison: {
		currentCount: number
		previousCount: number
		growthPct: number | null
	}
	representativePostIds: string[]
	recurringRequirements: string[]
	relatedTechnologies: string[]
	clientProfile: { topCountries: string[]; averageRating: number | null }
	budgetProfile: { averageBudget: number | null; medianBudget: number | null }
	overlapWithTaxonomy: string[]
	scoreBreakdown: EmergingScoreBreakdown
	sampleConfidence: 'high' | 'medium' | 'low'
	sargasFit: number
	relatedTaxonomyItemIds: string[]
	mergedIntoTaxonomyItemId?: string
	notificationStatusSummary?: Record<NotificationStatus, number>
}

export interface FiltersOptions {
	technologies: string[]
	directions: string[]
	platforms: Array<{ id: string; name: string }>
	clientCountries: string[]
	budgetBuckets: Array<{ key: string; label: string }>
	clientTiers: Array<{ key: ClientTier; label: string }>
}
