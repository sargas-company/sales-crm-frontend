import { useEffect, useMemo, useState, type ReactNode } from 'react'
import SectionCard from '../../components/sales-analytics/_shared/SectionCard'
import { WebhookCard, ScannerVisualState } from './webhookCard.styled'
import type { ScannerHealth, ScannerStatus } from '../../store/sales-analytics/types/scanner'
import { baseApi } from '../../api/baseApi'
import { useDispatch } from 'react-redux'

interface Props {
	data: ScannerHealth
	/**
	 * Optional slot rendered between the blue "Last event received"
	 * hero and the orange hero tiles row. Job Posts' AI pipeline
	 * block sits here on the Overview tab.
	 */
	middleSlot?: ReactNode
}

const statusToVisual = (s: ScannerStatus): ScannerVisualState => s

const formatAgoShort = (
	iso: string | null,
	now: number = Date.now(),
): { value: string; suffix: string } => {
	if (!iso) return { value: '—', suffix: '' }
	const diff = Math.max(0, now - new Date(iso).getTime())
	if (diff < 60_000) return { value: 'just now', suffix: '' }
	if (diff < 60 * 60_000) return { value: `${Math.floor(diff / 60_000)}`, suffix: 'min ago' }
	if (diff < 24 * 60 * 60_000)
		return { value: `${Math.floor(diff / (60 * 60_000))}`, suffix: 'h ago' }
	return { value: `${Math.floor(diff / (24 * 60 * 60_000))}`, suffix: 'd ago' }
}

const hourOfDay = (now: Date = new Date(), timezone?: string): number => {
	if (!timezone) return now.getHours() + now.getMinutes() / 60
	try {
		const fmt = new Intl.DateTimeFormat('en-GB', {
			timeZone: timezone,
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		})
		const parts = fmt.formatToParts(now)
		const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
		const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
		return h + m / 60
	} catch {
		return now.getHours() + now.getMinutes() / 60
	}
}

/**
 * YYYY-MM-DD in the given IANA timezone. Used as the day key for
 * boundary detection — browser-local `toDateString()` would roll
 * over at a different wall-clock moment than the backend's today
 * window.
 */
function dayKeyIn(timezone: string, at: Date = new Date()): string {
	try {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).format(at)
	} catch {
		return at.toISOString().slice(0, 10)
	}
}

/**
 * Returns a `now` timestamp that ticks every minute. Also:
 *   • **invalidates ScannerHealth every minute** — this is what
 *     slides the 60-minute `receivedLastHour` window so a card
 *     that hasn't received an SSE tick for a while still reflects
 *     the correct "events in the past hour" number after the
 *     oldest event ages out;
 *   • **detects a day boundary in the backend's timezone** (not
 *     the browser's) and triggers an extra invalidation so Today /
 *     Analyzed / Discord alerts reset at the same wall-clock moment
 *     the backend starts counting the new day.
 */
function useMinuteTicker(timezone: string): number {
	const [now, setNow] = useState(() => Date.now())
	const dispatch = useDispatch()
	useEffect(() => {
		// Align the first fire with the next whole minute so all
		// cards tick together and we don't skew the sparkline.
		const first = 60_000 - (Date.now() % 60_000)
		let interval: ReturnType<typeof setInterval> | null = null
		let lastDay = dayKeyIn(timezone)
		const tick = () => {
			const nextMs = Date.now()
			setNow(nextMs)
			// Sliding 60-minute window: trigger a refetch every
			// minute so events falling out of the window are
			// reflected without waiting for a new SSE tick.
			dispatch(baseApi.util.invalidateTags(['ScannerHealth']))
			const nextDay = dayKeyIn(timezone)
			if (nextDay !== lastDay) {
				lastDay = nextDay
				// Day boundary already covered by the per-minute
				// invalidation above; explicit log/branch kept for
				// clarity if we later add a day-change hook.
			}
		}
		const start = setTimeout(() => {
			tick()
			interval = setInterval(tick, 60_000)
		}, first)
		return () => {
			clearTimeout(start)
			if (interval) clearInterval(interval)
		}
	}, [dispatch, timezone])
	return now
}

// mulberry32 for deterministic sparkline shape (based on value)
const seededBars = (seed: number, n: number, max = 100): number[] => {
	let a = seed || 1
	const out: number[] = []
	for (let i = 0; i < n; i++) {
		a |= 0
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		out.push(20 + ((t ^ (t >>> 14)) >>> 0) % max)
	}
	return out
}

const ScannerStatusCard = ({ data, middleSlot }: Props) => {
	const now = useMinuteTicker(data.timezone)
	const last = useMemo(() => formatAgoShort(data.lastEventAt, now), [data.lastEventAt, now])
	const timezone = data.timezone

	return (
		<SectionCard padding='0'>
			<WebhookCard state={statusToVisual(data.status)}>
				<div className='wh-head'>
					<div className='wh-brand'>
						<div className='wh-logo' aria-hidden='true'>
							V
						</div>
						<div>
							<div className='wh-name'>
								Vibeworker
								<span className='wh-name-sub'>webhook</span>
							</div>
							<div className='wh-hint'>Scanner status &amp; ingestion health</div>
						</div>
					</div>
				</div>

				{/* HERO — always deep-blue, big last-event card */}
				<div className='wh-hero'>
					<div className='wh-hero-left'>
						<span className='wh-hero-live'>
							<span className='wh-hero-live-dot' />
							Live
						</span>
						<span className='wh-hero-label'>Last event received</span>
					</div>
					<div className='wh-hero-value'>
						<span className={`wh-hero-num${last.suffix ? '' : ' is-text'}`}>
							{last.value}
						</span>
						{last.suffix && <span className='wh-hero-suffix'>{last.suffix}</span>}
					</div>
				</div>

				{middleSlot ? <div className='wh-middle-slot'>{middleSlot}</div> : null}

				{/* Pinterest-style hero widgets */}
				<div className='wh-hero-tiles'>
					<LastHourTile
						value={data.receivedLastHour}
						dayTotal={data.receivedToday}
						now={now}
						timezone={timezone}
					/>
					<TodayTile value={data.receivedToday} now={now} timezone={timezone} />
					<AnalyzedTile
						analyzedToday={data.analyzedToday}
						analyzedOfTodaysReceived={data.analyzedOfTodaysReceived}
						receivedToday={data.receivedToday}
					/>
					<DiscordAlertsTile
						sent={data.discordAlertsInPeriod}
						failed={data.discordDeliveryErrors}
					/>
				</div>
			</WebhookCard>
		</SectionCard>
	)
}

const HeroBody = ({
	label,
	value,
	unit,
	caption,
	trend,
	trendTag,
}: {
	label: string
	value: number | string
	unit: string
	caption?: string
	trend?: number | null
	trendTag?: string
}) => (
	<div className='hw-body'>
		<span className='hw-label'>{label}</span>
		<div className='hw-num-row'>
			<span className='hw-num'>
				{typeof value === 'number' ? value.toLocaleString() : value}
			</span>
			<span className='hw-unit'>{unit}</span>
			{trend !== undefined && trend !== null && (
				<span className='hw-trend-stack'>
					<span
						className={`hw-trend ${
							trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
						}`}
					>
						<span className='hw-trend-arrow' aria-hidden='true'>
							{trend > 0 ? '↑' : trend < 0 ? '↓' : '·'}
						</span>
						{Math.abs(trend)}%
					</span>
					{trendTag && <span className='hw-trend-tag'>{trendTag}</span>}
				</span>
			)}
		</div>
		{caption && <span className='hw-caption'>{caption}</span>}
	</div>
)

const LastHourTile = ({
	value,
	dayTotal,
	now,
	timezone,
}: {
	value: number
	dayTotal: number
	now: number
	timezone: string
}) => {
	const bars = seededBars(value * 31 + 7, 14, 80)
	bars[bars.length - 1] = Math.max(bars[bars.length - 1], 90)
	const maxBar = Math.max(...bars)

	// vs daily-average: last hour vs (dayTotal / hoursElapsedToday).
	// `now` ticks every minute via useMinuteTicker and hoursElapsed
	// is computed in the backend's timezone so the comparison stays
	// consistent with how `dayTotal` was bucketed.
	const hoursElapsed = Math.max(1, hourOfDay(new Date(now), timezone))
	const avgPerHour = dayTotal / hoursElapsed
	const trend =
		avgPerHour > 0 ? Math.round(((value - avgPerHour) / avgPerHour) * 100) : null

	return (
		<div className='hw-tile'>
			<HeroBody
				label='Last hour'
				value={value}
				unit='events'
				caption='in the past 60 min'
				trend={trend}
				trendTag='vs daily avg'
			/>
			<div className='hw-spark' aria-hidden='true'>
				{bars.map((b, i) => (
					<span
						key={i}
						className={`hw-bar ${i === bars.length - 1 ? 'now' : ''}`}
						style={{ height: `${Math.round((b / maxBar) * 100)}%` }}
					/>
				))}
			</div>
		</div>
	)
}

const TodayTile = ({
	value,
	now,
	timezone,
}: {
	value: number
	now: number
	timezone: string
}) => {
	const hr = hourOfDay(new Date(now), timezone)
	const dayPct = Math.min(100, Math.round((hr / 24) * 100))
	const hLabel = Math.floor(hr)
	const mLabel = Math.floor((hr % 1) * 60)

	return (
		<div className='hw-tile hw-tile-purple'>
			<HeroBody label='Today' value={value} unit='events' />
			<div className='hw-day' aria-hidden='true'>
				<div className='hw-day-time'>
					{String(hLabel).padStart(2, '0')}
					<span className='hw-day-colon'>:</span>
					{String(mLabel).padStart(2, '0')}
					<span className='hw-day-caption'>current time</span>
				</div>
				<div className='hw-day-track'>
					<span className='hw-day-fill' style={{ width: `${dayPct}%` }}>
						<span className='hw-day-shine' />
					</span>
					<span className='hw-day-mark' style={{ left: '25%' }} />
					<span className='hw-day-mark' style={{ left: '50%' }} />
					<span className='hw-day-mark' style={{ left: '75%' }} />
				</div>
			</div>
		</div>
	)
}

const toneForPct = (pct: number): 'good' | 'ok' | 'warn' | 'bad' => {
	if (pct >= 70) return 'good'
	if (pct >= 40) return 'ok'
	if (pct >= 15) return 'warn'
	return 'bad'
}

const AnalyzedTile = ({
	analyzedToday,
	analyzedOfTodaysReceived,
	receivedToday,
}: {
	analyzedToday: number
	analyzedOfTodaysReceived: number
	receivedToday: number
}) => {
	// Big number is the ACTUAL AI throughput for today, so
	// processing yesterday's backlog shows up correctly. The %
	// below it uses a bounded numerator/denominator pair
	// (`analyzedOfTodaysReceived / receivedToday`) so it never
	// exceeds 100 % and never misrepresents yesterday's work as
	// over-100 % of today's intake.
	const hasSample = receivedToday > 0
	const pct = hasSample
		? Math.round((analyzedOfTodaysReceived / receivedToday) * 100)
		: null
	const yesterdayCarryover = Math.max(0, analyzedToday - analyzedOfTodaysReceived)
	const caption = !hasSample
		? yesterdayCarryover > 0
			? `${yesterdayCarryover} from yesterday`
			: 'no posts received yet today'
		: yesterdayCarryover > 0
			? `${analyzedOfTodaysReceived}/${receivedToday} today · +${yesterdayCarryover} backlog`
			: `${analyzedOfTodaysReceived}/${receivedToday} received today`

	return (
		<div
			className={`hw-tile hw-tile-teal hw-tone-${
				pct == null ? 'ok' : toneForPct(pct)
			}`}
		>
			<HeroBody label='Analyzed' value={analyzedToday} unit='posts today' />
			<PercentBar pct={pct} caption={caption} />
		</div>
	)
}

const DiscordAlertsTile = ({ sent, failed }: { sent: number; failed: number }) => {
	const attempted = sent + failed
	const hasSample = attempted > 0
	const deliveryRate = hasSample ? Math.round((sent / attempted) * 100) : null
	const caption = hasSample
		? failed > 0
			? `${failed} failed · today`
			: 'all delivered · today'
		: 'no alerts attempted today'
	return (
		<div
			className={`hw-tile hw-tile-rose hw-tone-${
				deliveryRate == null ? 'ok' : toneForPct(deliveryRate)
			}`}
		>
			<HeroBody label='Discord alerts' value={sent} unit='sent today' />
			<PercentBar pct={deliveryRate} caption={caption} />
		</div>
	)
}

const PercentBar = ({
	pct,
	caption,
}: {
	pct: number | null
	caption: string
}) => {
	const empty = pct == null
	return (
		<div className='hw-pct' aria-hidden='true'>
			<div className={`hw-pct-num${empty ? ' hw-pct-num--empty' : ''}`}>
				{empty ? <span className='hw-pct-empty-dash'>—</span> : pct}
				{!empty && <span className='hw-pct-sign'>%</span>}
				<span className='hw-pct-caption'>{caption}</span>
			</div>
			<div className='hw-pct-track'>
				{!empty && (
					<span
						className='hw-pct-fill'
						style={{ width: `${Math.max(4, pct as number)}%` }}
					>
						<span className='hw-pct-shine' />
					</span>
				)}
			</div>
		</div>
	)
}

export default ScannerStatusCard
