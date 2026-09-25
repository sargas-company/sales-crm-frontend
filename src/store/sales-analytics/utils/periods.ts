import type { SalesFilters } from '../types/filters'

export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

export interface AnalyticsWindow {
	fromMs: number
	toMs: number
	sizeMs: number
	label: string
}

export function windowFor(filters: SalesFilters, nowMs: number = Date.now()): AnalyticsWindow {
	switch (filters.dateRange) {
		case 'today':
			return { fromMs: nowMs - DAY_MS, toMs: nowMs, sizeMs: DAY_MS, label: 'Today' }
		case '30d':
			return {
				fromMs: nowMs - 30 * DAY_MS,
				toMs: nowMs,
				sizeMs: 30 * DAY_MS,
				label: 'Last 30 days',
			}
		case 'custom': {
			const from = filters.customFrom
				? new Date(filters.customFrom).getTime()
				: nowMs - 7 * DAY_MS
			const to = filters.customTo ? new Date(filters.customTo).getTime() : nowMs
			return { fromMs: from, toMs: to, sizeMs: Math.max(1, to - from), label: 'Custom' }
		}
		case '7d':
		default:
			return {
				fromMs: nowMs - 7 * DAY_MS,
				toMs: nowMs,
				sizeMs: 7 * DAY_MS,
				label: 'Last 7 days',
			}
	}
}

export function previousWindow(w: AnalyticsWindow): AnalyticsWindow {
	return {
		fromMs: w.fromMs - w.sizeMs,
		toMs: w.fromMs,
		sizeMs: w.sizeMs,
		label: `Prev ${w.label.toLowerCase()}`,
	}
}
