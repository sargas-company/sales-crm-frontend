import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { API_BASE_URL, baseApi } from '../api/baseApi'
import type { AppDispatch, RootState } from '../store/store'
import type { SalesFilters } from '../store/sales-analytics/types/filters'
import type {
	AiSpendSummary,
	SalesOverviewSummary,
} from '../store/sales-analytics/types/aggregates'

interface QueueStatsPayload {
	analysisEnabled: boolean
	totalNew: number
	backlog: number
	pending: number
	failed: number
	inQueue: number | null
	running: number | null
	redisAvailable: boolean
	queueWaiting: number | null
	queueDelayed: number | null
	queueActive: number | null
	queuePaused: number | null
	queuePrioritized: number | null
	lastUpdated: string
}

interface ScannerPayload {
	status: unknown
	lastEventAt: string | null
	receivedLastHour: number
	receivedToday: number
	analyzedInPeriod: number
	discordAlertsInPeriod: number
	discordDeliveryErrors: number
	[k: string]: unknown
}

interface TickFrame {
	at: string
	queueStats: QueueStatsPayload | { error: string; message: string }
	scanner: ScannerPayload | { error: string; message: string }
	salesOverview?: SalesOverviewSummary | { error: string; message: string }
	aiSpend?: AiSpendSummary | { error: string; message: string }
}

interface Options {
	/** Pause SSE on this page (false). Default true. */
	enabled?: boolean
	/** Current filters — propagated to the stream URL so the server
	 * sends `salesOverview` / `aiSpend` scoped to the same window the
	 * UI is showing. Changing filters triggers a reconnect so the new
	 * window is reflected on the next frame. */
	filters?: SalesFilters
	/** Called when a tick is received, after the Redux caches are patched. */
	onTick?: (frame: TickFrame) => void
	/** Fallback polling interval while SSE is disconnected. */
	fallbackPollMs?: number
}

/** Serialise filters to URL query params the same way the REST
 * endpoints do, so backend parsing is identical. */
const filtersToQueryString = (filters: SalesFilters | undefined): string => {
	if (!filters) return ''
	const params = new URLSearchParams()
	if (filters.dateRange) params.set('dateRange', filters.dateRange)
	if (filters.customFrom) params.set('customFrom', filters.customFrom)
	if (filters.customTo) params.set('customTo', filters.customTo)
	if (filters.timezone) params.set('timezone', filters.timezone)
	if (filters.scoreMin != null) params.set('scoreMin', String(filters.scoreMin))
	if (filters.scoreMax != null) params.set('scoreMax', String(filters.scoreMax))
	if (filters.technology?.length) params.set('technology', filters.technology.join(','))
	if (filters.direction?.length) params.set('direction', filters.direction.join(','))
	if (filters.platformId?.length) params.set('platformId', filters.platformId.join(','))
	if (filters.contractType) params.set('contractType', filters.contractType)
	if (filters.budgetBucket) params.set('budgetBucket', filters.budgetBucket)
	if (filters.clientCountry?.length)
		params.set('clientCountry', filters.clientCountry.join(','))
	if (filters.clientQuality?.length)
		params.set('clientQuality', filters.clientQuality.join(','))
	if (filters.notificationStatus) params.set('notificationStatus', filters.notificationStatus)
	const str = params.toString()
	return str ? `?${str}` : ''
}

interface Status {
	connected: boolean
	reconnectAttempts: number
}

/**
 * Opens one authorised SSE connection to `/analytics/stream` and
 * patches the RTK Query caches it feeds — `getJobPostQueueStats`
 * and `getScannerHealth({period:'today'})` — on every coalesced
 * tick. Keeps existing filters, periods and timezone untouched by
 * only writing to those two caches by key.
 *
 * Auth: uses a `fetch()` stream so we can send `Authorization: Bearer`
 * without putting the access token in the URL (per project rules).
 *
 * Resilience:
 *   • on disconnect, falls back to polling every `fallbackPollMs`
 *     (default 5 s) with exponentially-backed-off reconnect attempts
 *     up to 30 s;
 *   • one shared stream per mounted component tree — don't call
 *     this hook from several widgets, mount it at the Overview tab
 *     level and let the two caches propagate downwards;
 *   • heartbeat-aware: a `ping` keeps the connection warm but is
 *     ignored by the caches so no re-renders happen for ping ticks;
 *   • cleans up `AbortController` + reconnect timers + the fallback
 *     polling timer on unmount.
 */
export function useAnalyticsStream(options: Options = {}): Status {
	const { enabled = true, filters, onTick, fallbackPollMs = 5_000 } = options
	const dispatch = useDispatch<AppDispatch>()
	const token = useSelector((s: RootState) => s.auth.accessToken)
	const statusRef = useRef<Status>({ connected: false, reconnectAttempts: 0 })

	/* Stable string for the useEffect dep array so filter changes
	 * trigger a reconnect but reference equality churn doesn't. */
	const queryString = useMemo(() => filtersToQueryString(filters), [filters])

	useEffect(() => {
		if (!enabled || !token) return
		let aborted = false
		let abortCtl: AbortController | null = null
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null
		let pollTimer: ReturnType<typeof setInterval> | null = null
		let attempt = 0

		const stopFallbackPoll = () => {
			if (pollTimer) {
				clearInterval(pollTimer)
				pollTimer = null
			}
		}

		const applyTick = (frame: TickFrame) => {
			if (frame.queueStats && !('error' in frame.queueStats)) {
				const queueStats = frame.queueStats as QueueStatsPayload
				dispatch(
					baseApi.util.updateQueryData(
						'getJobPostQueueStats' as never,
						undefined as never,
						(() => queueStats) as never,
					),
				)
			}
			if (frame.scanner && !('error' in frame.scanner)) {
				const scanner = frame.scanner as ScannerPayload
				dispatch(
					baseApi.util.updateQueryData(
						'getScannerHealth' as never,
						{ period: 'today' } as never,
						(() => scanner) as never,
					),
				)
			}
			if (frame.salesOverview && !('error' in frame.salesOverview) && filters) {
				const salesOverview = frame.salesOverview as SalesOverviewSummary
				dispatch(
					baseApi.util.updateQueryData(
						'getSalesOverview' as never,
						filters as never,
						(() => salesOverview) as never,
					),
				)
			}
			if (frame.aiSpend && !('error' in frame.aiSpend) && filters) {
				const aiSpend = frame.aiSpend as AiSpendSummary
				dispatch(
					baseApi.util.updateQueryData(
						'getAiSpend' as never,
						filters as never,
						(() => aiSpend) as never,
					),
				)
			}
			onTick?.(frame)
		}

		const startFallbackPoll = () => {
			if (pollTimer) return
			pollTimer = setInterval(() => {
				// Trigger a refetch on each of the live caches via tag
				// invalidation. RTK Query dedupes concurrent requests.
				dispatch(
					baseApi.util.invalidateTags([
						'QueueStats',
						'ScannerHealth',
						'SalesFeedback',
						'AiSpend',
					]),
				)
			}, fallbackPollMs)
		}

		const scheduleReconnect = () => {
			if (aborted) return
			attempt += 1
			statusRef.current.reconnectAttempts = attempt
			const delay = Math.min(30_000, 500 * 2 ** Math.min(attempt, 6))
			reconnectTimer = setTimeout(connect, delay)
		}

		const connect = async () => {
			if (aborted) return
			stopFallbackPoll()
			abortCtl = new AbortController()
			try {
				const res = await fetch(`${API_BASE_URL}/analytics/stream${queryString}`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: 'text/event-stream',
					},
					credentials: 'include',
					signal: abortCtl.signal,
				})
				if (!res.ok || !res.body) throw new Error(`stream HTTP ${res.status}`)
				statusRef.current.connected = true
				attempt = 0
				statusRef.current.reconnectAttempts = 0
				const reader = res.body.getReader()
				const decoder = new TextDecoder()
				let buffer = ''
				while (!aborted) {
					const { value, done } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })
					let frameEnd = buffer.indexOf('\n\n')
					while (frameEnd !== -1) {
						const rawFrame = buffer.slice(0, frameEnd)
						buffer = buffer.slice(frameEnd + 2)
						frameEnd = buffer.indexOf('\n\n')
						// Parse `event: <name>\ndata: <json>` SSE blocks.
						let eventType = 'message'
						const dataLines: string[] = []
						for (const line of rawFrame.split('\n')) {
							if (line.startsWith(':')) continue
							const colon = line.indexOf(':')
							if (colon < 0) continue
							const key = line.slice(0, colon)
							const value = line.slice(colon + 1).replace(/^ /, '')
							if (key === 'event') eventType = value
							else if (key === 'data') dataLines.push(value)
						}
						if (dataLines.length === 0) continue
						const dataStr = dataLines.join('\n')
						if (eventType === 'ping') continue
						try {
							const payload = JSON.parse(dataStr) as TickFrame
							applyTick(payload)
						} catch {
							// Malformed frame — skip; stream continues.
						}
					}
				}
				statusRef.current.connected = false
				if (!aborted) {
					// Server closed stream (hooks / proxy). Reconnect
					// after short delay; fall back to polling in the
					// meantime so the UI still updates.
					startFallbackPoll()
					scheduleReconnect()
				}
			} catch (err) {
				statusRef.current.connected = false
				if (aborted) return
				// AbortError is expected on unmount; everything else
				// gets a reconnect + polling fallback.
				if ((err as { name?: string })?.name !== 'AbortError') {
					startFallbackPoll()
					scheduleReconnect()
				}
			}
		}

		connect()

		return () => {
			aborted = true
			abortCtl?.abort()
			if (reconnectTimer) clearTimeout(reconnectTimer)
			stopFallbackPoll()
			statusRef.current.connected = false
		}
	}, [enabled, token, dispatch, onTick, fallbackPollMs, queryString, filters])

	return statusRef.current
}
