export type ScannerStatus = 'running' | 'delayed' | 'down' | 'idle'

export type ScannerHealthPeriod = 'today' | '7d' | '30d'

export interface ScannerHealth {
	status: ScannerStatus
	endpoint: string

	lastEventAt: string | null
	lastAnalyzedAt: string | null

	receivedLastHour: number
	receivedToday: number
	processingRatePerHour: number

	medianProcessingLatencyMs: number | null
	dataFreshnessSeconds: number | null

	webhookErrors: number
	analyzerErrors: number
	discordDeliveryErrors: number
	duplicates: number

	period: ScannerHealthPeriod
	receivedInPeriod: number
	analyzedInPeriod: number
	discordAlertsInPeriod: number
	duplicatesInPeriod: number
	errorsInPeriod: number
}

export interface ScannerHealthFilters {
	period: ScannerHealthPeriod
}
