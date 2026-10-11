import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { API_BASE_URL, baseApi } from '../api/baseApi'
import type { AppDispatch, RootState } from '../store/store'

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
}

interface Options {
	/** Pause SSE on this page (false). Default true. */
	enabled?: boolean
	/** Called when a tick is received, after the Redux caches are patched. */
	onTick?: (frame: TickFrame) => void
	/** Fallback polling interval while SSE is disconnected. */
	fallbackPollMs?: number
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
	const { enabled = true, onTick, fallbackPollMs = 5_000 } = options
	const dispatch = useDispatch<AppDispatch>()
	const token = useSelector((s: RootState) => s.auth.accessToken)
	const statusRef = useRef<Status>({ connected: false, reconnectAttempts: 0 })

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
			onTick?.(frame)
		}

		const startFallbackPoll = () => {
			if (pollTimer) return
			pollTimer = setInterval(() => {
				// Trigger a refetch on each of the two caches via tag
				// invalidation. RTK Query dedupes concurrent requests.
				dispatch(baseApi.util.invalidateTags(['QueueStats', 'ScannerHealth']))
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
				const res = await fetch(`${API_BASE_URL}/analytics/stream`, {
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
	}, [enabled, token, dispatch, onTick, fallbackPollMs])

	return statusRef.current
}
