import { useMemo } from 'react'
import { Bolt } from '@mui/icons-material'
import SectionCard from '../../components/sales-analytics/_shared/SectionCard'
import { WebhookCard, ScannerVisualState } from './webhookCard.styled'
import type { ScannerHealth, ScannerStatus } from '../../store/sales-analytics/types/scanner'

interface Props {
	data: ScannerHealth
}

const statusToVisual = (s: ScannerStatus): ScannerVisualState => s

const formatAgoShort = (iso: string | null): { value: string; suffix: string } => {
	if (!iso) return { value: '—', suffix: '' }
	const diff = Math.max(0, Date.now() - new Date(iso).getTime())
	if (diff < 60_000) return { value: 'just now', suffix: '' }
	if (diff < 60 * 60_000) return { value: `${Math.floor(diff / 60_000)}`, suffix: 'min ago' }
	if (diff < 24 * 60 * 60_000)
		return { value: `${Math.floor(diff / (60 * 60_000))}`, suffix: 'h ago' }
	return { value: `${Math.floor(diff / (24 * 60 * 60_000))}`, suffix: 'd ago' }
}

const hourOfDay = () => {
	const d = new Date()
	return d.getHours() + d.getMinutes() / 60
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

const ScannerStatusCard = ({ data }: Props) => {
	const last = useMemo(() => formatAgoShort(data.lastEventAt), [data.lastEventAt])

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
						<span className='wh-hero-num'>{last.value}</span>
						{last.suffix && <span className='wh-hero-suffix'>{last.suffix}</span>}
					</div>
				</div>

				{/* Pinterest-style hero widgets */}
				<div className='wh-hero-tiles'>
					<LastHourTile value={data.receivedLastHour} />
					<TodayTile value={data.receivedToday} />
					<AnalyzedTile
						analyzed={data.analyzedInPeriod}
						received={data.receivedToday}
					/>
					<AlertsTile
						alerts={data.discordAlertsInPeriod}
						analyzed={data.analyzedInPeriod}
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
}: {
	label: string
	value: number | string
	unit: string
	caption?: string
}) => (
	<div className='hw-body'>
		<span className='hw-label'>{label}</span>
		<div className='hw-num-row'>
			<span className='hw-num'>{typeof value === 'number' ? value.toLocaleString() : value}</span>
			<span className='hw-unit'>{unit}</span>
		</div>
		{caption && <span className='hw-caption'>{caption}</span>}
	</div>
)

const LastHourTile = ({ value }: { value: number }) => {
	const bars = seededBars(value * 31 + 7, 14, 80)
	bars[bars.length - 1] = Math.max(bars[bars.length - 1], 90)
	const maxBar = Math.max(...bars)

	return (
		<div className='hw-tile'>
			<div className='hw-bg' aria-hidden='true'>
				<Bolt />
			</div>
			<HeroBody label='Last hour' value={value} unit='events' caption='in the past 60 min' />
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

const TodayTile = ({ value }: { value: number }) => {
	const hr = useMemo(() => hourOfDay(), [value])
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

const AnalyzedTile = ({ analyzed, received }: { analyzed: number; received: number }) => {
	const total = Math.max(received, analyzed)
	const coverage = total > 0 ? Math.round((analyzed / total) * 100) : 100

	return (
		<div className={`hw-tile hw-tile-teal hw-tone-${toneForPct(coverage)}`}>
			<HeroBody label='Analyzed' value={analyzed} unit='posts today' />
			<PercentBar pct={coverage} caption='of received' />
		</div>
	)
}

const AlertsTile = ({ alerts, analyzed }: { alerts: number; analyzed: number }) => {
	const signalRate = analyzed > 0 ? Math.round((alerts / analyzed) * 100) : 0

	return (
		<div className={`hw-tile hw-tile-rose hw-tone-${toneForPct(signalRate)}`}>
			<HeroBody label='Discord alerts' value={alerts} unit='sent today' />
			<PercentBar pct={signalRate} caption='signal rate' />
		</div>
	)
}

const PercentBar = ({ pct, caption }: { pct: number; caption: string }) => (
	<div className='hw-pct' aria-hidden='true'>
		<div className='hw-pct-num'>
			{pct}
			<span className='hw-pct-sign'>%</span>
			<span className='hw-pct-caption'>{caption}</span>
		</div>
		<div className='hw-pct-track'>
			<span className='hw-pct-fill' style={{ width: `${Math.max(4, pct)}%` }}>
				<span className='hw-pct-shine' />
			</span>
		</div>
	</div>
)

export default ScannerStatusCard
