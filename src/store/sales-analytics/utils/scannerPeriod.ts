import type { SalesFilters } from '../types/filters'
import type { ScannerHealthPeriod } from '../types/scanner'

/**
 * Maps the shared SalesFilters date range down to the period-only argument
 * accepted by getScannerHealth. Operational scanner status is global and
 * must NOT depend on market filters (score, direction, technology, budget,
 * client). Only the period buckets the counters.
 */
export const salesFiltersToScannerPeriod = (filters: SalesFilters): ScannerHealthPeriod => {
	switch (filters.dateRange) {
		case 'today':
			return 'today'
		case '30d':
			return '30d'
		case '7d':
		case 'custom':
		default:
			return '7d'
	}
}
