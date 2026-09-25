import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
	ContractTypeFilter,
	ManualRelevanceFilter,
	NotificationStatusFilter,
	SalesDateRangeKey,
	SalesFilters,
} from '../../../store/sales-analytics/types/filters'
import { DEFAULT_DATE_RANGE, DEFAULT_TIMEZONE } from '../../../store/sales-analytics/config'

const DATE_RANGE_KEYS: readonly SalesDateRangeKey[] = ['today', '7d', '30d', 'custom']
const CONTRACT_TYPES: readonly ContractTypeFilter[] = ['fixed', 'hourly', 'unknown']
const RELEVANCE: readonly ManualRelevanceFilter[] = [
	'relevant',
	'not_relevant',
	'very_relevant',
	'unrated',
]
const NOTIFICATIONS: readonly NotificationStatusFilter[] = [
	'sent',
	'failed',
	'not_required',
	'pending',
]

const parseEnum = <T extends string>(raw: string | null, allowed: readonly T[]): T | undefined => {
	if (raw && (allowed as readonly string[]).includes(raw)) return raw as T
	return undefined
}

const parseList = (raw: string | null): string[] | undefined =>
	raw ? raw.split(',').filter(Boolean) : undefined

const parseNum = (raw: string | null): number | undefined => {
	if (!raw) return undefined
	const n = Number(raw)
	return Number.isFinite(n) ? n : undefined
}

const parseDateRange = (raw: string | null): SalesDateRangeKey =>
	parseEnum(raw, DATE_RANGE_KEYS) ?? DEFAULT_DATE_RANGE

export type FilterPatch = Partial<SalesFilters>

const applyPatch = (prev: URLSearchParams, patch: FilterPatch): URLSearchParams => {
	const p = new URLSearchParams(prev)
	const set = (key: string, val: string | number | undefined | null) => {
		if (val === undefined || val === null || val === '') p.delete(key)
		else p.set(key, String(val))
	}
	const setList = (key: string, val: string[] | undefined) => {
		if (!val || val.length === 0) p.delete(key)
		else p.set(key, val.join(','))
	}
	if ('dateRange' in patch) {
		if (patch.dateRange && patch.dateRange !== DEFAULT_DATE_RANGE) p.set('range', patch.dateRange)
		else p.delete('range')
		if (patch.dateRange !== 'custom') {
			p.delete('from')
			p.delete('to')
		}
	}
	if ('customFrom' in patch) set('from', patch.customFrom)
	if ('customTo' in patch) set('to', patch.customTo)
	if ('scoreMin' in patch) set('smin', patch.scoreMin)
	if ('scoreMax' in patch) set('smax', patch.scoreMax)
	if ('technology' in patch) setList('tech', patch.technology)
	if ('direction' in patch) setList('dir', patch.direction)
	if ('platformId' in patch) setList('plat', patch.platformId)
	if ('contractType' in patch) set('ct', patch.contractType)
	if ('budgetBucket' in patch) set('bud', patch.budgetBucket)
	if ('clientCountry' in patch) setList('cco', patch.clientCountry)
	if ('clientQuality' in patch) setList('cq', patch.clientQuality)
	if ('manualRelevance' in patch) set('rel', patch.manualRelevance)
	if ('notificationStatus' in patch) set('nst', patch.notificationStatus)
	return p
}

export interface UseSalesFilters {
	filters: SalesFilters
	setFilter: (patch: FilterPatch) => void
	setDateRange: (next: SalesDateRangeKey) => void
	resetFilters: () => void
	activeCount: number
	isDefault: boolean
}

export const useSalesFilters = (): UseSalesFilters => {
	const [searchParams, setSearchParams] = useSearchParams()

	const filters = useMemo<SalesFilters>(
		() => ({
			dateRange: parseDateRange(searchParams.get('range')),
			customFrom: searchParams.get('from') ?? undefined,
			customTo: searchParams.get('to') ?? undefined,
			timezone: searchParams.get('tz') ?? DEFAULT_TIMEZONE,
			scoreMin: parseNum(searchParams.get('smin')),
			scoreMax: parseNum(searchParams.get('smax')),
			technology: parseList(searchParams.get('tech')),
			direction: parseList(searchParams.get('dir')),
			platformId: parseList(searchParams.get('plat')),
			contractType: parseEnum(searchParams.get('ct'), CONTRACT_TYPES),
			budgetBucket: searchParams.get('bud') ?? undefined,
			clientCountry: parseList(searchParams.get('cco')),
			clientQuality: parseList(searchParams.get('cq')),
			manualRelevance: parseEnum(searchParams.get('rel'), RELEVANCE),
			notificationStatus: parseEnum(searchParams.get('nst'), NOTIFICATIONS),
		}),
		[searchParams]
	)

	const setFilter = useCallback(
		(patch: FilterPatch) => {
			setSearchParams((prev) => applyPatch(prev, patch), { replace: true })
		},
		[setSearchParams]
	)

	const setDateRange = useCallback(
		(next: SalesDateRangeKey) => setFilter({ dateRange: next }),
		[setFilter]
	)

	const resetFilters = useCallback(() => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams()
				const tab = prev.get('tab')
				if (tab) next.set('tab', tab)
				return next
			},
			{ replace: true }
		)
	}, [setSearchParams])

	const activeCount =
		(filters.scoreMin != null || filters.scoreMax != null ? 1 : 0) +
		(filters.technology?.length ? 1 : 0) +
		(filters.direction?.length ? 1 : 0) +
		(filters.platformId?.length ? 1 : 0) +
		(filters.contractType ? 1 : 0) +
		(filters.budgetBucket ? 1 : 0) +
		(filters.clientCountry?.length ? 1 : 0) +
		(filters.clientQuality?.length ? 1 : 0) +
		(filters.manualRelevance ? 1 : 0) +
		(filters.notificationStatus ? 1 : 0)

	const isDefault =
		filters.dateRange === DEFAULT_DATE_RANGE &&
		!filters.customFrom &&
		!filters.customTo &&
		activeCount === 0

	return { filters, setFilter, setDateRange, resetFilters, activeCount, isDefault }
}
