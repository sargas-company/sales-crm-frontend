import type { ScannerHealthPeriod, ScannerStatus } from '../../types/scanner'

interface PeriodCounts {
	received: number
	analyzed: number
	discordAlerts: number
	duplicates: number
	errors: number
}

export interface ScannerFixture {
	status: ScannerStatus
	lastEventOffsetMs: number
	lastAnalyzedOffsetMs: number
	receivedLastHour: number
	receivedToday: number
	processingRatePerHour: number
	medianProcessingLatencyMs: number
	dataFreshnessSeconds: number
	webhookErrors: number
	analyzerErrors: number
	discordDeliveryErrors: number
	duplicates: number
	periodCounts: Record<ScannerHealthPeriod, PeriodCounts>
}

const MIN = 60 * 1000

export const scannerFixture: ScannerFixture = {
	status: 'running',
	lastEventOffsetMs: 4 * MIN,
	lastAnalyzedOffsetMs: 5 * MIN,
	receivedLastHour: 12,
	receivedToday: 84,
	processingRatePerHour: 11,
	medianProcessingLatencyMs: 2400,
	dataFreshnessSeconds: 240,
	webhookErrors: 0,
	analyzerErrors: 1,
	discordDeliveryErrors: 0,
	duplicates: 3,
	periodCounts: {
		today: { received: 84, analyzed: 82, discordAlerts: 14, duplicates: 3, errors: 1 },
		'7d': { received: 612, analyzed: 574, discordAlerts: 96, duplicates: 21, errors: 4 },
		'30d': { received: 2650, analyzed: 2480, discordAlerts: 412, duplicates: 89, errors: 12 },
	},
}
