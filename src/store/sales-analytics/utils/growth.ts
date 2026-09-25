export function trendPct(current: number, previous: number): number | null {
	if (previous <= 0) {
		if (current > 0) return null
		return 0
	}
	return Math.round(((current - previous) / previous) * 100)
}

export function confidenceFor(sample: number, minSample = 5): 'high' | 'medium' | 'low' {
	if (sample >= minSample * 4) return 'high'
	if (sample >= minSample) return 'medium'
	return 'low'
}

export function safeAvg(sum: number, n: number): number {
	if (n <= 0) return 0
	return Math.round((sum / n) * 10) / 10
}

export function sharePct(count: number, total: number): number {
	if (total <= 0) return 0
	return Math.round((count / total) * 1000) / 10
}
