import { useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts'

import SectionCard from '../../../components/sales-analytics/_shared/SectionCard'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import {
	Crumbs,
	PageHead,
	ShellCard,
	ShellInner,
	ViewFade,
} from '../salesAnalytics.styled'
import {
	KpiCell,
	KpiHeader,
	KpiPanel,
	KpiStrip,
} from '../kpi.styled'
import {
	BottomSlot,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
} from '../../../components/_shared/filters/freshPaperFilters'

import {
	upworkProfileName,
	useGetUpworkAnalyticsQuery,
	useListUpworkProfilesQuery,
	useListUpworkSnapshotsQuery,
} from '../../../store/upwork/upworkApi'

const Root = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`
const InnerStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: 20px;
`

const SmallMultiples = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const MiniHead = styled.div`
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin: 2px 2px 2px 46px;
	.lbl {
		font-size: 11px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		color: ${T.textSecondary};
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
	}
`

interface MarkerSpec {
	date: string
	section: string
	summary: string
}
interface MiniChartProps {
	label: string
	color: string
	data: Array<Record<string, string | number>>
	dataKey: string
	markers: MarkerSpec[]
	showX: boolean
}

const MiniChart = ({
	label,
	color,
	data,
	dataKey,
	markers,
	showX,
}: MiniChartProps) => (
	<div>
		<MiniHead>
			<span className='dot' style={{ background: color }} />
			<span className='lbl'>{label}</span>
		</MiniHead>
		<ResponsiveContainer width='100%' height={showX ? 130 : 110}>
			<BarChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 0 }}>
				<CartesianGrid
					strokeDasharray='3 3'
					stroke={T.divider}
					vertical={false}
				/>
				<XAxis
					dataKey='weekStart'
					stroke={T.divider}
					tick={
						showX
							? { fill: T.textSecondary, fontSize: 11, fontWeight: 600 }
							: false
					}
					tickLine={false}
					axisLine={{ stroke: T.divider }}
					height={showX ? 24 : 0}
					dy={showX ? 6 : 0}
				/>
				<YAxis
					stroke={T.divider}
					tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 600 }}
					tickLine={false}
					axisLine={{ stroke: T.divider }}
					width={42}
					allowDecimals={false}
				/>
				<RechartsTooltip cursor={false} content={<BarTipContent />} />
				<Bar
					dataKey={dataKey}
					fill={color}
					radius={[6, 6, 0, 0]}
					maxBarSize={32}
					isAnimationActive
				/>
				{markers.map((m, i) => (
					<ReferenceLine
						key={`${m.date}-${i}`}
						x={weekStartIso(m.date)}
						stroke={T.textMuted}
						strokeDasharray='4 4'
					/>
				))}
			</BarChart>
		</ResponsiveContainer>
	</div>
)

/* Mirror of HeatmapTooltip's entry animation — same keyframe, same
 * timing, so the Upwork page tooltips feel identical to the Sales
 * analytics ones. */
const upworkTooltipIn = keyframes`
	from { opacity: 0; transform: translateY(-4px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

/* Mirror of HeatmapTooltip's visual language — same box, same
 * typography, same entry animation. Flags/countries live only in
 * the heatmap; here we render a hero number + optional 2-col grid. */
const BarTooltip = styled.div`
	min-width: 210px;
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.06),
		0 16px 40px -14px rgba(15, 23, 42, 0.24);
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	transform-origin: top left;
	animation: ${upworkTooltipIn} 160ms ${T.ease} both;
	will-change: transform, opacity;

	.ht-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.ht-day {
		font-size: 11px;
		font-weight: 800;
		color: ${T.textSecondary};
		letter-spacing: 1px;
		text-transform: uppercase;
	}
	.ht-hours {
		font-size: 12.5px;
		font-weight: 700;
		color: ${T.textStrong};
		font-variant-numeric: tabular-nums;
	}
	.ht-total {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}
	.ht-total-num {
		font-size: 26px;
		font-weight: 800;
		color: ${T.textStrong};
		letter-spacing: -0.8px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.ht-total-label {
		font-size: 12.5px;
		font-weight: 500;
		color: ${T.textMuted};
	}
	.ht-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px 14px;
		padding-top: 10px;
		border-top: 1px solid ${T.divider};
	}
	.ht-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.ht-item-label {
		font-size: 11px;
		font-weight: 600;
		color: ${T.textMuted};
		letter-spacing: 0.2px;
	}
	.ht-item-value {
		font-size: 15px;
		font-weight: 700;
		color: ${T.textPrimary};
		font-variant-numeric: tabular-nums;
	}
`

interface BarTipPayloadItem {
	dataKey?: string
	value?: number
}
interface BarTipProps {
	active?: boolean
	label?: string
	payload?: BarTipPayloadItem[]
}
const BAR_TIP_LABELS: Record<string, string> = {
	views: 'Views',
	invites: 'Invites',
	directMessages: 'Direct messages',
}
const BAR_TIP_UNITS: Record<string, string> = {
	views: 'views',
	invites: 'invites',
	directMessages: 'direct messages',
}
const BarTipContent = ({ active, label, payload }: BarTipProps) => {
	if (!active || !payload || payload.length === 0) return null
	const [hero, ...rest] = payload
	const heroKey = hero.dataKey ?? ''
	return (
		<BarTooltip role='tooltip'>
			<div className='ht-head'>
				<span className='ht-day'>{label}</span>
				<span className='ht-hours'>
					{BAR_TIP_LABELS[heroKey] ?? heroKey}
				</span>
			</div>
			<div className='ht-total'>
				<span className='ht-total-num'>
					{(hero.value ?? 0).toLocaleString()}
				</span>
				<span className='ht-total-label'>{BAR_TIP_UNITS[heroKey] ?? ''}</span>
			</div>
			{rest.length > 0 && (
				<div className='ht-grid'>
					{rest.map((p) => (
						<div className='ht-item' key={p.dataKey}>
							<span className='ht-item-label'>
								{BAR_TIP_LABELS[p.dataKey ?? ''] ?? p.dataKey}
							</span>
							<span className='ht-item-value'>
								{(p.value ?? 0).toLocaleString()}
							</span>
						</div>
					))}
				</div>
			)}
		</BarTooltip>
	)
}
const ChartWrap = styled.div`
	padding: 10px 6px 0;
	.recharts-cartesian-axis-tick-value {
		font-feature-settings: 'ss01' on, 'ss02' on;
	}
`
const ChartHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 6px;
	.chart-title {
		font-size: 12.5px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: 0.2px;
		text-transform: uppercase;
	}
	.chart-sub {
		font-size: 11px;
		color: ${T.textSecondary};
	}
`
const LegendRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin: 4px 0 10px;
`
const LegendItem = styled.span<{ $c: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 11.5px;
	color: ${T.textSecondary};
	font-weight: 600;
	&::before {
		content: '';
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: ${(p) => p.$c};
	}
`
const EmptyChart = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 300px;
	color: ${T.textMuted};
	font-size: 13px;
`
const VpiCaption = styled.span`
	font-family: 'Fraunces', Georgia, serif;
	font-style: italic;
	font-size: 13px;
	color: ${T.textSecondary};
	flex: 1;
	margin-left: 16px;
	margin-right: auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const SumBarWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 6px 2px 2px;
`
const SumBar = styled.div`
	display: flex;
	gap: 2px;
	height: 18px;
	border-radius: 999px;
	overflow: hidden;
	background: ${T.subtleBg};
`
const SumSeg = styled.div<{ $w: number; $c: string }>`
	flex: ${(p) => p.$w} 0 0;
	background: ${(p) => p.$c};
	transition: flex 400ms ${T.ease};
`
const SumLegend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px 18px;
`
const SumLegendRow = styled.div<{ $c: string }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: ${T.textSecondary};
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: ${(p) => p.$c};
	}
	.sec {
		font-weight: 700;
		color: ${T.textStrong};
	}
	.n {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 600;
	}
`
const LatestCard = styled.div`
	display: flex;
	gap: 18px;
	align-items: center;
	padding: 18px 22px;
	margin: 18px 0 22px;
	border-radius: 16px;
	background: linear-gradient(
		135deg,
		rgba(3, 105, 161, 0.08) 0%,
		rgba(124, 58, 237, 0.08) 100%
	);
	border: 1px solid ${T.border};
	.dot {
		width: 54px;
		height: 54px;
		border-radius: 14px;
		background: linear-gradient(135deg, #0369a1 0%, #7c3aed 100%);
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'Bricolage Grotesque', sans-serif;
		font-size: 22px;
		font-weight: 800;
		flex: 0 0 auto;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.k {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: ${T.textSecondary};
		font-weight: 700;
	}
	.sum {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 20px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
		line-height: 1.25;
	}
	.meta {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12px;
		color: ${T.textSecondary};
	}
`
const SectionTitle = styled.h2`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 22px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.5px;
	margin: 0 0 8px;
`

const CHART_COLORS = [
	'#0369a1',
	'#7c3aed',
	'#d97706',
	'#c94b4b',
	'#16a34a',
	'#0284c7',
	'#a855f7',
	'#059669',
]

const todayIso = () => new Date().toISOString().slice(0, 10)

const SNAP_PAGE_SIZE = 10

interface SnapshotFormState {
	id?: string
	date: string
	views: number
	invites: number
	directMessages: number
	positions: Record<string, number>
}

const emptyForm = (): SnapshotFormState => ({
	date: todayIso(),
	views: 0,
	invites: 0,
	directMessages: 0,
	positions: {},
})

/* Monday-of-week ISO date (UTC) — matches backend aggregation. */
function weekStartIso(iso: string): string {
	const d = new Date(iso + 'T00:00:00Z')
	const dow = d.getUTCDay()
	const diff = dow === 0 ? -6 : 1 - dow
	d.setUTCDate(d.getUTCDate() + diff)
	return d.toISOString().slice(0, 10)
}

const UpworkAnalyticsPage = () => {
	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = profiles.filter((p) => p.active)

	const [profileId, setProfileId] = useState<string>('')
	const [range, setRange] = useState<'30d' | '90d' | '180d'>('90d')

	/* Auto-select the first active profile the moment it arrives so the
	 * dashboard isn't a blank screen on first open. User can still pick
	 * a different one from the dropdown. */
	useEffect(() => {
		if (!profileId && activeProfiles.length) setProfileId(activeProfiles[0].id)
	}, [profileId, activeProfiles])

	const { from, to } = useMemo(() => {
		const toD = new Date()
		const fromD = new Date()
		const days = range === '30d' ? 30 : range === '90d' ? 90 : 180
		fromD.setDate(fromD.getDate() - days)
		return { from: fromD.toISOString().slice(0, 10), to: toD.toISOString().slice(0, 10) }
	}, [range])

	const { data: analytics } = useGetUpworkAnalyticsQuery(
		{ profileId, from, to },
		{ skip: !profileId },
	)
	const { data: snapshots = [] } = useListUpworkSnapshotsQuery(
		{ profileId, from, to },
		{ skip: !profileId },
	)
	/* Aggregate change-log markers into a section-distribution bar.
	 * Colors mirror the per-section palette elsewhere in the module. */
	const sectionActivity = useMemo(() => {
		if (!analytics) return [] as Array<{ section: string; count: number; color: string }>
		const counts = new Map<string, number>()
		for (const m of analytics.changeLogMarkers) {
			counts.set(m.section, (counts.get(m.section) ?? 0) + 1)
		}
		const palette: Record<string, string> = {
			title: '#0369a1',
			overview: '#7c3aed',
			skills: '#16a34a',
			portfolio: '#d97706',
			project_catalog: '#c94b4b',
			consultation: '#0ea5e9',
			certificate: '#059669',
			employment_history: '#a855f7',
			other_experience: '#eab308',
			contract: '#dc2626',
			video: '#f97316',
			other: '#64748b',
		}
		return Array.from(counts.entries())
			.map(([section, count]) => ({
				section,
				count,
				color: palette[section] ?? '#64748b',
			}))
			.sort((a, b) => b.count - a.count)
	}, [analytics])

	const latestChange = useMemo(() => {
		if (!analytics || analytics.changeLogMarkers.length === 0) return null
		return [...analytics.changeLogMarkers].sort((a, b) =>
			a.date < b.date ? 1 : -1,
		)[0]
	}, [analytics])

	const totalSectionCount = sectionActivity.reduce((s, r) => s + r.count, 0)
	const vpi = analytics?.viewsPerInvite4w
	const vpiValue = vpi?.value
	const vpiWarn = !!vpi?.warn

	return (
		<ViewFade>
			<ShellCard>
				<ShellInner>
					<Crumbs>
						<span className='crumb-dot' aria-hidden='true' />
						<span className='current'>Upwork analytics</span>
					</Crumbs>
					<PageHead>
						<div className='title'>
							<h1>Upwork</h1>
							<p>
								Weekly views + invites with change-log markers, positions per title
								phrase (lower is better), and a 4-week views-per-invite reading.
							</p>
						</div>
						<div className='title-right' aria-hidden='true'>
							<span className='hand-line'>signals, not noise</span>
							<span className='hand-flourish'>
								<svg viewBox='0 0 120 20' width='120' height='20'>
									<path
										d='M2 12 C 28 2, 60 22, 96 6'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
									/>
									<path
										d='M88 4 L 98 6 L 92 14'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							</span>
						</div>
					</PageHead>

					{profileId && latestChange && (
						<LatestCard>
							<span className='dot'>★</span>
							<div className='body'>
								<span className='k'>
									Latest change · {latestChange.section.replace(/_/g, ' ')}
								</span>
								<span className='sum'>{latestChange.summary}</span>
								<span className='meta'>{latestChange.date}</span>
							</div>
						</LatestCard>
					)}

					<FreshFiltersWrap role='region' aria-label='Analytics filters'>
						<BottomSlot>
							<InlineField>
								<span className='l'>Profile</span>
								<InlineSelect
									value={profileId}
									onChange={(e) => setProfileId(e.target.value)}
								>
									<option value=''>— pick a profile</option>
									{activeProfiles.map((p) => (
										<option key={p.id} value={p.id}>
											{upworkProfileName(p)}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>
						<BottomSlot>
							<InlineField>
								<span className='l'>Range</span>
								<InlineSelect
									value={range}
									onChange={(e) =>
										setRange((e.target.value as '30d' | '90d' | '180d') ?? '90d')
									}
								>
									<option value='30d'>Last 30 days</option>
									<option value='90d'>Last 90 days</option>
									<option value='180d'>Last 180 days</option>
								</InlineSelect>
							</InlineField>
						</BottomSlot>
						<div className='filter-spacer' style={{ flex: 1 }} />
					</FreshFiltersWrap>

					<InnerStack>

				{!profileId && (
					<SectionCard>
						<EmptyChart>Pick a profile to see analytics.</EmptyChart>
					</SectionCard>
				)}

				{profileId && (
					<KpiPanel>
						<KpiHeader>
							<span className='kpi-kicker'>At a glance</span>
							{vpiWarn && (
								<VpiCaption>
									views-per-invite is above {vpi?.threshold ?? 50} — profile is
									being seen but not messaged. Likely a title / hero copy issue.
								</VpiCaption>
							)}
							<span className='kpi-period'>
								<span className='kpi-period-dot' aria-hidden='true' />
								{range === '30d' ? 'Last 30d' : range === '90d' ? 'Last 90d' : 'Last 180d'}
							</span>
						</KpiHeader>
						<KpiStrip>
							<KpiCell>
								<div className='kpi-label'>Views / invite · 4w</div>
								<div className='kpi-value' style={{ color: vpiWarn ? T.error : undefined }}>
									{vpiValue == null ? '—' : vpiValue.toFixed(1)}
								</div>
								<div className='kpi-caption'>
									threshold {vpi?.threshold ?? 50}
									{vpiWarn ? ' · above threshold' : ''}
								</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Views (4w)</div>
								<div className='kpi-value'>{(vpi?.views ?? 0).toLocaleString()}</div>
								<div className='kpi-caption'>Σ across last 28 days</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Invites (4w)</div>
								<div className='kpi-value'>{(vpi?.invites ?? 0).toLocaleString()}</div>
								<div className='kpi-caption'>Σ across last 28 days</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Snapshots</div>
								<div className='kpi-value'>{snapshots.length.toLocaleString()}</div>
								<div className='kpi-caption'>in selected range</div>
							</KpiCell>
						</KpiStrip>
					</KpiPanel>
				)}

				{profileId && sectionActivity.length > 0 && (
					<SectionCard
						title='Change-log activity by section'
						hint={`${totalSectionCount} entries in the selected range.`}
					>
						<SumBarWrap>
							<SumBar>
								{sectionActivity.map((s) => (
									<SumSeg key={s.section} $w={s.count} $c={s.color} title={`${s.section}: ${s.count}`} />
								))}
							</SumBar>
							<SumLegend>
								{sectionActivity.map((s) => (
									<SumLegendRow key={s.section} $c={s.color}>
										<span className='dot' />
										<span className='sec'>{s.section.replace(/_/g, ' ').toUpperCase()}</span>
										<span className='n'>{s.count}</span>
									</SumLegendRow>
								))}
							</SumLegend>
						</SumBarWrap>
					</SectionCard>
				)}

				{profileId && analytics && (
					<SectionCard
						title='Weekly trends'
						hint='Three independent charts — each metric gets its own Y-axis, so small-magnitude series are not flat-lined by big ones.'
					>
						<ChartWrap>
							<ChartHeader>
								<span className='chart-title'>WEEKLY TOTALS</span>
								<span className='chart-sub'>
									dashed vertical = change-log entry
								</span>
							</ChartHeader>
							{analytics.weekly.length === 0 ? (
								<EmptyChart>No snapshots in this range yet.</EmptyChart>
							) : (
								<SmallMultiples>
									<MiniChart
										label='Views'
										color='#0369a1'
										data={analytics.weekly}
										dataKey='views'
										markers={analytics.changeLogMarkers}
										showX={false}
									/>
									<MiniChart
										label='Invites'
										color='#d97706'
										data={analytics.weekly}
										dataKey='invites'
										markers={analytics.changeLogMarkers}
										showX={false}
									/>
									<MiniChart
										label='Direct messages'
										color='#16a34a'
										data={analytics.weekly}
										dataKey='directMessages'
										markers={analytics.changeLogMarkers}
										showX
									/>
								</SmallMultiples>
							)}
						</ChartWrap>
					</SectionCard>
				)}

				{profileId && snapshots.length > 0 && (
					<SectionCard
						title='Recent daily snapshots'
						hint='Last 15 days — raw per-day numbers. Edit individual rows from the Snapshots page.'
					>
						<ChartWrap>
							<LegendRow>
								<LegendItem $c='#0369a1'>Views</LegendItem>
								<LegendItem $c='#d97706'>Invites</LegendItem>
								<LegendItem $c='#16a34a'>Direct messages</LegendItem>
							</LegendRow>
							<ResponsiveContainer width='100%' height={280}>
								<BarChart
									data={[...snapshots]
										.sort((a, b) => (a.date < b.date ? -1 : 1))
										.slice(-15)
										.map((s) => ({
											date: s.date.slice(5, 10),
											views: s.views,
											invites: s.invites,
											directMessages: s.directMessages,
										}))}
									margin={{ left: 4, right: 12 }}
								>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke={T.divider}
										vertical={false}
									/>
									<XAxis
										dataKey='date'
										stroke={T.divider}
										tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 600 }}
										tickLine={false}
										axisLine={{ stroke: T.divider }}
										dy={6}
									/>
									<YAxis
										yAxisId='left'
										orientation='left'
										stroke={T.divider}
										tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 600 }}
										tickLine={false}
										axisLine={{ stroke: T.divider }}
										width={44}
									/>
									<YAxis
										yAxisId='right'
										orientation='right'
										allowDecimals={false}
										stroke={T.divider}
										tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 600 }}
										tickLine={false}
										axisLine={{ stroke: T.divider }}
										width={38}
									/>
									<RechartsTooltip cursor={false} content={<BarTipContent />} />
									<Bar
										yAxisId='left'
										dataKey='views'
										fill='#0369a1'
										radius={[6, 6, 0, 0]}
										maxBarSize={28}
									/>
									<Bar
										yAxisId='right'
										dataKey='invites'
										fill='#d97706'
										radius={[6, 6, 0, 0]}
										maxBarSize={28}
									/>
									<Bar
										yAxisId='right'
										dataKey='directMessages'
										fill='#16a34a'
										radius={[6, 6, 0, 0]}
										maxBarSize={28}
									/>
								</BarChart>
							</ResponsiveContainer>
						</ChartWrap>
					</SectionCard>
				)}
					</InnerStack>
				</ShellInner>
			</ShellCard>
		</ViewFade>
	)
}


export default UpworkAnalyticsPage
