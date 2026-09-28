import type { SalesDateRangeKey } from './types/filters'

export const QUALIFIED_THRESHOLD = 50
export const HOT_THRESHOLD = 75

export const DEFAULT_TIMEZONE = 'Europe/Kyiv'
export const DEFAULT_DATE_RANGE: SalesDateRangeKey = 'today'

export const SCORE_BUCKETS: {
	label: string
	min: number
	max: number
	color: string
}[] = [
	{ label: '0–24', min: 0, max: 24, color: '#ef4444' },
	{ label: '25–49', min: 25, max: 49, color: '#f59e0b' },
	{ label: '50–74', min: 50, max: 74, color: '#3b82f6' },
	{ label: '75–89', min: 75, max: 89, color: '#6366f1' },
	{ label: '90–100', min: 90, max: 100, color: '#10b981' },
]

export const FIXED_BUDGET_BUCKETS: {
	key: string
	label: string
	min: number
	max: number | null
}[] = [
	{ key: 'lt_1k', label: '< $1k', min: 0, max: 999 },
	{ key: '1k_3k', label: '$1k–3k', min: 1000, max: 3000 },
	{ key: '3k_75k', label: '$3k–7.5k', min: 3001, max: 7500 },
	{ key: '75k_15k', label: '$7.5k–15k', min: 7501, max: 15000 },
	{ key: 'gt_15k', label: '$15k+', min: 15001, max: null },
]

export const HOURLY_BUDGET_BUCKETS: {
	key: string
	label: string
	min: number
	max: number | null
}[] = [
	{ key: 'lt_25', label: '< $25/h', min: 0, max: 24 },
	{ key: '25_40', label: '$25–40/h', min: 25, max: 40 },
	{ key: '40_60', label: '$40–60/h', min: 41, max: 60 },
	{ key: 'gt_60', label: '$60+/h', min: 61, max: null },
]

export const DEFAULT_EMERGING_ALERT_CONFIG = {
	minPosts: 5,
	minUniqueClients: 3,
	minAverageScore: 60,
	observationDays: 7,
	minSargasFit: 70,
	cooldownDays: 3,
}
