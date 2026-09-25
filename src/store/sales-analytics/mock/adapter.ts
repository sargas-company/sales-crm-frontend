import type { JobPostAnalyticsPage, JobPostsQuery, SalesAnalyticsRepository } from '../repository'
import type { ScannerHealth, ScannerHealthFilters } from '../types/scanner'
import type { SalesFilters } from '../types/filters'
import type {
	ActionableInsights,
	BidPlaybook,
	BudgetBreakdownData,
	ClientQualityData,
	CoverageWindows,
	DemandInsightsData,
	DirectionRow,
	EmergingOverview,
	EmergingSignalDetail,
	EmergingSignalRow,
	FiltersOptions,
	HeatmapData,
	HeatmapMetric,
	RecentHighScorePostsData,
	SalesOverviewSummary,
	ScoreDistributionData,
	TechnologyCombinationRow,
	TechnologyRow,
	TimePatternsData,
} from '../types/aggregates'
import type {
	CandidateActionPayload,
	EmergingAlertConfig,
	TaxonomyCandidate,
} from '../types/candidates'
import type { FeedbackMetrics, RelevanceFeedbackPayload } from '../types/feedback'
import type { CanonicalTaxonomy } from '../types/taxonomy'
import type { MockJobPost } from '../types/jobPost'
import { API_BASE_URL } from '../../../api/baseApi'
import { scannerFixture } from './fixtures/scanner'
import { POSTS } from './fixtures/dataset'
import { CANONICAL_DIRECTIONS, CANONICAL_TECHNOLOGIES, ALIAS_MAP } from './fixtures/taxonomy'
import { MOCK_PLATFORMS, MOCK_COUNTRIES } from './fixtures/platforms'
import { FIXED_BUDGET_BUCKETS, HOURLY_BUDGET_BUCKETS } from '../config'
import {
	getMockState,
	setRelevance,
	updateCandidate,
	setAlertConfig,
	resetMockState as resetState,
} from './state'
import {
	salesOverview,
	opportunityHeatmap,
	coverageWindows,
	actionableInsights,
	recentHighScorePosts,
} from './selectors/overview'
import {
	directionsBreakdown,
	scoreDistribution,
	technologiesBreakdown,
	technologyCombinations,
	timePatterns,
} from './selectors/market'
import {
	bidPlaybooks,
	budgetBreakdown,
	clientQuality,
	demandInsights,
} from './selectors/marketExtended'
import { allEmerging, emergingDetail, emergingOverview } from './selectors/emerging'
import { feedbackMetrics } from './selectors/feedback'
import { CLIENT_TIER_META, filteredPosts } from './selectors/posts'

const WEBHOOK_PATH = '/webhooks/vibeworker'

const feedbackAsMap = (): Map<string, string> => {
	const map = new Map<string, string>()
	for (const [k, v] of getMockState().feedback) map.set(k, v.rating)
	return map
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const canonicalCandidatesToTaxonomy = (): CanonicalTaxonomy => {
	const additional: typeof CANONICAL_TECHNOLOGIES = []
	const additionalDir: typeof CANONICAL_DIRECTIONS = []
	for (const c of getMockState().candidates.values()) {
		if (c.status === 'approved' && !c.mergedIntoTaxonomyItemId) {
			const now = new Date().toISOString()
			const base = {
				id: `${c.proposedType}-${c.id}`,
				name: c.proposedName,
				slug: c.proposedName.toLowerCase().replace(/[^\w]+/g, '-'),
				status: 'active' as const,
				aliases: [],
				createdAt: c.createdAt,
				updatedAt: now,
				type: c.proposedType as 'technology' | 'direction',
			}
			if (c.proposedType === 'technology') additional.push(base)
			else if (c.proposedType === 'direction') additionalDir.push(base)
		}
	}
	return {
		technologies: [...CANONICAL_TECHNOLOGIES, ...additional],
		directions: [...CANONICAL_DIRECTIONS, ...additionalDir],
		aliases: ALIAS_MAP,
	}
}

const applyCandidateAction = (payload: CandidateActionPayload): TaxonomyCandidate | null => {
	switch (payload.action) {
		case 'approve_technology':
			return updateCandidate(payload.candidateId, {
				status: 'approved',
				proposedType: 'technology',
			})
		case 'approve_direction':
			return updateCandidate(payload.candidateId, {
				status: 'approved',
				proposedType: 'direction',
			})
		case 'keep_signal':
			return updateCandidate(payload.candidateId, { status: 'approved', proposedType: 'signal' })
		case 'merge':
			return updateCandidate(payload.candidateId, {
				status: 'merged',
				mergedIntoTaxonomyItemId: payload.targetTaxonomyItemId,
			})
		case 'alias':
			return updateCandidate(payload.candidateId, {
				status: 'merged',
				mergedIntoTaxonomyItemId: payload.targetTaxonomyItemId,
			})
		case 'watch':
			return updateCandidate(payload.candidateId, { status: 'watching' })
		case 'reject':
			return updateCandidate(payload.candidateId, { status: 'rejected' })
		case 'ignore':
			return updateCandidate(payload.candidateId, { status: 'ignored' })
	}
}

export const mockAdapter: SalesAnalyticsRepository = {
	dataSource: 'mock',

	async getScannerHealth({ period }: ScannerHealthFilters): Promise<ScannerHealth> {
		const fx = scannerFixture
		const now = Date.now()
		const counts = fx.periodCounts[period]
		return {
			status: fx.status,
			endpoint: `${API_BASE_URL}${WEBHOOK_PATH}`,
			lastEventAt: new Date(now - fx.lastEventOffsetMs).toISOString(),
			lastAnalyzedAt: new Date(now - fx.lastAnalyzedOffsetMs).toISOString(),
			receivedLastHour: fx.receivedLastHour,
			receivedToday: fx.receivedToday,
			processingRatePerHour: fx.processingRatePerHour,
			medianProcessingLatencyMs: fx.medianProcessingLatencyMs,
			dataFreshnessSeconds: fx.dataFreshnessSeconds,
			webhookErrors: fx.webhookErrors,
			analyzerErrors: fx.analyzerErrors,
			discordDeliveryErrors: fx.discordDeliveryErrors,
			duplicates: fx.duplicates,
			period,
			receivedInPeriod: counts.received,
			analyzedInPeriod: counts.analyzed,
			discordAlertsInPeriod: counts.discordAlerts,
			duplicatesInPeriod: counts.duplicates,
			errorsInPeriod: counts.errors,
		}
	},

	async getFiltersOptions(): Promise<FiltersOptions> {
		const countries = new Set<string>()
		for (const p of POSTS) countries.add(p.clientCountry)
		for (const c of MOCK_COUNTRIES) countries.add(c)
		return {
			technologies: CANONICAL_TECHNOLOGIES.map((t) => t.name),
			directions: CANONICAL_DIRECTIONS.map((d) => d.name),
			platforms: MOCK_PLATFORMS.map((p) => ({ id: p.id, name: p.name })),
			clientCountries: Array.from(countries).sort(),
			budgetBuckets: [
				...FIXED_BUDGET_BUCKETS.map((b) => ({
					key: `fixed:${b.key}`,
					label: `Fixed · ${b.label}`,
				})),
				...HOURLY_BUDGET_BUCKETS.map((b) => ({
					key: `hourly:${b.key}`,
					label: `Hourly · ${b.label}`,
				})),
			],
			clientTiers: (['elite', 'strong', 'standard', 'new', 'unverified'] as const).map((t) => ({
				key: t,
				label: CLIENT_TIER_META[t].label,
			})),
		}
	},

	async getSalesOverview(filters: SalesFilters): Promise<SalesOverviewSummary> {
		return salesOverview(filters, feedbackAsMap())
	},

	async getOpportunityHeatmap(filters: SalesFilters, metric: HeatmapMetric): Promise<HeatmapData> {
		return opportunityHeatmap(filters, feedbackAsMap(), metric)
	},

	async getCoverageWindows(filters: SalesFilters): Promise<CoverageWindows> {
		return coverageWindows(filters, feedbackAsMap())
	},

	async getActionableInsights(filters: SalesFilters): Promise<ActionableInsights> {
		return actionableInsights(filters, feedbackAsMap())
	},

	async getRecentHighScorePosts(
		filters: SalesFilters,
		limit: number
	): Promise<RecentHighScorePostsData> {
		return recentHighScorePosts(filters, feedbackAsMap(), limit)
	},

	async getTimePatterns(filters: SalesFilters): Promise<TimePatternsData> {
		return timePatterns(filters, feedbackAsMap())
	},

	async getScoreDistribution(filters: SalesFilters): Promise<ScoreDistributionData> {
		return scoreDistribution(filters, feedbackAsMap())
	},

	async getDirectionsBreakdown(filters: SalesFilters): Promise<DirectionRow[]> {
		return directionsBreakdown(filters, feedbackAsMap())
	},

	async getTechnologiesBreakdown(filters: SalesFilters): Promise<TechnologyRow[]> {
		return technologiesBreakdown(filters, feedbackAsMap())
	},

	async getTechnologyCombinations(filters: SalesFilters): Promise<TechnologyCombinationRow[]> {
		return technologyCombinations(filters, feedbackAsMap())
	},

	async getBudgetBreakdown(filters: SalesFilters): Promise<BudgetBreakdownData> {
		return budgetBreakdown(filters, feedbackAsMap())
	},

	async getClientQualityBreakdown(filters: SalesFilters): Promise<ClientQualityData> {
		return clientQuality(filters, feedbackAsMap())
	},

	async getDemandInsights(filters: SalesFilters): Promise<DemandInsightsData> {
		return demandInsights(filters, feedbackAsMap())
	},

	async getBidPlaybooks(filters: SalesFilters): Promise<BidPlaybook[]> {
		return bidPlaybooks(filters, feedbackAsMap())
	},

	async getJobPostsPage({ filters, page, limit }: JobPostsQuery): Promise<JobPostAnalyticsPage> {
		const { posts } = filteredPosts(filters, feedbackAsMap())
		const sorted = posts.slice().sort((a, b) => b.score - a.score)
		const start = Math.max(0, (page - 1) * limit)
		return {
			items: sorted.slice(start, start + limit),
			total: sorted.length,
			page,
			limit,
		}
	},

	async getJobPostById(id: string): Promise<MockJobPost | null> {
		return POSTS.find((p) => p.id === id) ?? null
	},

	async getCanonicalTaxonomy(): Promise<CanonicalTaxonomy> {
		return canonicalCandidatesToTaxonomy()
	},

	async getEmergingOverview(filters: SalesFilters): Promise<EmergingOverview> {
		return emergingOverview(
			filters,
			feedbackAsMap(),
			Array.from(getMockState().candidates.values())
		)
	},

	async getEmergingList(_filters: SalesFilters): Promise<EmergingSignalRow[]> {
		return allEmerging(Array.from(getMockState().candidates.values()))
	},

	async getEmergingDetail(id: string): Promise<EmergingSignalDetail | null> {
		return emergingDetail(id, Array.from(getMockState().candidates.values()))
	},

	async getEmergingAlertConfig(): Promise<EmergingAlertConfig> {
		return getMockState().alertConfig
	},

	async setRelevanceFeedback(payload: RelevanceFeedbackPayload): Promise<void> {
		await wait(60)
		setRelevance(payload.postId, payload.rating)
	},

	async getFeedbackMetrics(filters: SalesFilters): Promise<FeedbackMetrics> {
		return feedbackMetrics(filters, feedbackAsMap())
	},

	async runCandidateAction(payload: CandidateActionPayload): Promise<TaxonomyCandidate | null> {
		await wait(80)
		return applyCandidateAction(payload)
	},

	async setEmergingAlertConfig(patch: Partial<EmergingAlertConfig>): Promise<EmergingAlertConfig> {
		return setAlertConfig(patch)
	},

	async resetMockState(): Promise<void> {
		resetState()
	},
}
