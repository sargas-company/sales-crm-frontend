export type ScannerStatus = 'running' | 'delayed' | 'down' | 'idle'

export type ScannerHealthPeriod = 'today' | '7d' | '30d'

export interface ScannerHealth {
	status: ScannerStatus
	endpoint: string

	lastEventAt: string | null
	lastAnalyzedAt: string | null

	/** IANA timezone the backend uses for every `today` / `last-hour`
	 *  bucket. Frontend reads this to compute the day boundary in the
	 *  same timezone instead of the browser's local one. */
	timezone: string

	receivedLastHour: number
	receivedToday: number
	/** Posts whose `processedAt` falls in today's window — includes
	 *  yesterday's backlog analysed today. */
	analyzedToday: number
	/** Posts received-today AND analysed-today — a bounded subset of
	 *  `receivedToday` suitable for a "share analysed today" bar. */
	analyzedOfTodaysReceived: number
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
