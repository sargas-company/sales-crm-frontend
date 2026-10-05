export type SalesDateRangeKey = 'today' | '7d' | '30d' | 'custom'

export type NotificationStatusFilter = 'sent' | 'failed' | 'not_required' | 'pending'

export type ContractTypeFilter = 'fixed' | 'hourly' | 'unknown'

/**
 * Full future filter contract. Later phases will add UI controls for the
 * currently unused fields; the type is defined up front so downstream
 * endpoints and adapters can accept a stable shape.
 */
export interface SalesFilters {
	dateRange: SalesDateRangeKey
	customFrom?: string
	customTo?: string
	timezone?: string

	scoreMin?: number
	scoreMax?: number

	technology?: string[]
	direction?: string[]
	platformId?: string[]
	contractType?: ContractTypeFilter
	budgetBucket?: string
	clientCountry?: string[]
	clientQuality?: string[]
	notificationStatus?: NotificationStatusFilter
}
