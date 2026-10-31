import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
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
	InlineField,
	InlineSelect,
} from '../../../components/_shared/filters/freshPaperFilters'
import DatePickerPill from '../../finance-weekly/DatePickerPill'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../filters/filters.styled'
import { CalendarTodayOutlined } from '@mui/icons-material'

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
	note: string
}
interface LabelRenderProps {
	x?: number | string
	y?: number | string
	width?: number | string
	height?: number | string
	value?: number | string
}

const toNum = (v: number | string | undefined): number | null => {
	if (v == null) return null
	const n = typeof v === 'number' ? v : Number(v)
	return Number.isFinite(n) ? n : null
}

/* Floating number with a short tick connecting it to the bar top. */
const TickLabel = (props: LabelRenderProps & { tone: string }) => {
	const x = toNum(props.x)
	const y = toNum(props.y)
	const width = toNum(props.width)
	const n = toNum(props.value)
	if (n == null || n <= 0 || x == null || y == null || width == null)
		return <g />
	const cx = x + width / 2
	const tickTop = y - 12
	return (
		<g>
			<line
				x1={cx}
				y1={y - 2}
				x2={cx}
				y2={tickTop}
				stroke={props.tone}
				strokeWidth={1.5}
				strokeLinecap='round'
				opacity={0.4}
			/>
			<text
				x={cx}
				y={tickTop - 5}
				textAnchor='middle'
				fill={T.textStrong}
				fontSize={15}
				fontWeight={800}
				fontFamily='Bricolage Grotesque, Inter, sans-serif'
				style={{ letterSpacing: '-0.4px' }}
			>
				{n.toLocaleString()}
			</text>
		</g>
	)
}

interface MiniChartProps {
	label: string
	color: string
	data: Array<Record<string, string | number>>
	dataKey: string
	markers: MarkerSpec[]
	showX: boolean
	kind?: 'bar' | 'area'
	showTooltip?: boolean
}

/* Compact MMM-D label for short ranges, MMM-only for long ones.
 * Keeps 1-year sparklines readable (12 month ticks instead of 52
 * weekly ones). */
const formatWeekTick = (iso: string, total: number): string => {
	if (!iso) return ''
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return iso
	return d.toLocaleDateString('en-US', {
		month: 'short',
		...(total <= 24 ? { day: 'numeric' as const } : {}),
	})
}

/* How many ticks to skip between labels — scales from "show all"
 * for tiny windows to "~12 ticks" for a full year. */
const calcTickInterval = (n: number): number | 'preserveStartEnd' => {
	if (n <= 10) return 0
	if (n <= 20) return 1
	if (n <= 40) return 3
	return Math.max(3, Math.floor(n / 12))
}

const MiniChart = ({
	label,
	color,
	data,
	dataKey,
	markers,
	showX,
	kind = 'bar',
	showTooltip = true,
}: MiniChartProps) => {
	const gradId = `mini-grad-${label.replace(/\s+/g, '-').toLowerCase()}`
	const points = data.length

	const commonAxes = (
		<>
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
				height={showX ? 28 : 0}
				dy={showX ? 6 : 0}
				interval={calcTickInterval(points)}
				minTickGap={12}
				tickFormatter={(iso: string) => formatWeekTick(iso, points)}
			/>
			<YAxis
				stroke={T.divider}
				tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 600 }}
				tickLine={false}
				axisLine={{ stroke: T.divider }}
				width={42}
				allowDecimals={false}
				domain={kind === 'area' ? ['auto', 'auto'] : [0, 'auto']}
			/>
			{showTooltip && (
				<RechartsTooltip
					cursor={
						kind === 'area'
							? { stroke: T.divider, strokeDasharray: '3 4' }
							: false
					}
					content={<BarTipContent />}
				/>
			)}
			{markers.map((m, i) => (
				<ReferenceLine
					key={`${m.date}-${i}`}
					x={weekStartIso(m.date)}
					stroke={T.textMuted}
					strokeDasharray='4 4'
				/>
			))}
		</>
	)

	return (
		<div>
			<MiniHead>
				<span className='dot' style={{ background: color }} />
				<span className='lbl'>{label}</span>
			</MiniHead>
			<ResponsiveContainer width='100%' height={showX ? 260 : 220}>
				{kind === 'area' ? (
					<AreaChart
						data={data}
						margin={{ left: 4, right: 12, top: 10, bottom: 0 }}
					>
						<defs>
							<linearGradient id={gradId} x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor={color} stopOpacity={0.35} />
								<stop offset='100%' stopColor={color} stopOpacity={0} />
							</linearGradient>
						</defs>
						{commonAxes}
						<Area
							type='monotone'
							dataKey={dataKey}
							stroke={color}
							strokeWidth={2.5}
							fill={`url(#${gradId})`}
							activeDot={{
								r: 5,
								fill: color,
								stroke: '#fff',
								strokeWidth: 2,
							}}
							isAnimationActive
							animationDuration={700}
							animationEasing='ease-out'
						/>
					</AreaChart>
				) : (
					<BarChart
						data={data}
						margin={{ left: 4, right: 12, top: 30, bottom: 0 }}
					>
						{commonAxes}
						<Bar
							dataKey={dataKey}
							fill={color}
							radius={[6, 6, 0, 0]}
							maxBarSize={32}
							isAnimationActive
							animationDuration={700}
						>
							<LabelList
								dataKey={dataKey}
								position='top'
								content={(props) => (
									<TickLabel {...props} tone={color} />
								)}
							/>
						</Bar>
					</BarChart>
				)}
			</ResponsiveContainer>
		</div>
	)
}

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
	position: 'Position',
}
const BAR_TIP_UNITS: Record<string, string> = {
	views: 'views',
	invites: 'invites',
	directMessages: 'direct messages',
	position: 'avg rank',
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

function fmtDelta(d: number, decimals = 0): string {
	if (d === 0) return '±0'
	const sign = d > 0 ? '+' : '−'
	const n = Math.abs(d)
	return `${sign}${decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString()}`
}

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
	type RangeKey = '7d' | '30d' | '90d' | '180d' | '1y' | 'custom'
	const [range, setRange] = useState<RangeKey>('90d')
	const [customFrom, setCustomFrom] = useState<string>('')
	const [customTo, setCustomTo] = useState<string>('')

	/* Auto-select the first active profile the moment it arrives so the
	 * dashboard isn't a blank screen on first open. User can still pick
	 * a different one from the dropdown. */
	useEffect(() => {
		if (!profileId && activeProfiles.length) setProfileId(activeProfiles[0].id)
	}, [profileId, activeProfiles])

	const { from, to } = useMemo(() => {
		if (range === 'custom' && (customFrom || customTo)) {
			return { from: customFrom || undefined, to: customTo || undefined }
		}
		const toD = new Date()
		const fromD = new Date()
		const days =
			range === '7d'
				? 7
				: range === '30d'
					? 30
					: range === '90d'
						? 90
						: range === '180d'
							? 180
							: range === '1y'
								? 365
								: 90
		fromD.setDate(fromD.getDate() - days)
		return {
			from: fromD.toISOString().slice(0, 10),
			to: toD.toISOString().slice(0, 10),
		}
	}, [range, customFrom, customTo])

	/* Sliding orange tape indicator for the Range pills. */
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{
		left: number
		width: number
		opacity: number
	}>({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>(
			'[data-active="true"]',
		)
		if (el) {
			setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
		}
	}, [range])

	const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '90d', label: '90 days' },
		{ value: '180d', label: '180 days' },
		{ value: '1y', label: '1 year' },
	]
	const activeRangeLabel =
		range === 'custom'
			? 'Custom'
			: RANGE_OPTIONS.find((o) => o.value === range)?.label ?? '—'

	const { data: analytics } = useGetUpworkAnalyticsQuery(
		{ profileId, from, to },
		{ skip: !profileId },
	)
	const { data: snapshots = [] } = useListUpworkSnapshotsQuery(
		{ profileId, from, to },
		{ skip: !profileId },
	)

	const selectedProfile = profiles.find((p) => p.id === profileId) ?? null
	const isSecondary = selectedProfile?.tier === 'secondary'

	/* Totals in the selected period — sum across in-range snapshots. */
	const periodTotals = useMemo(() => {
		return snapshots.reduce(
			(acc, s) => ({
				views: acc.views + s.views,
				invites: acc.invites + s.invites,
				directMessages: acc.directMessages + s.directMessages,
			}),
			{ views: 0, invites: 0, directMessages: 0 },
		)
	}, [snapshots])

	/* Weekly-average position series + latest value, used by the
	 * Position card's big number + sparkline. Lower is better; a
	 * value of zero is impossible as a real Upwork rank, so treat
	 * anything ≤ 0 as missing (filter it out). */
	const positionSeries = useMemo(() => {
		if (!analytics) return [] as Array<{ weekStart: string; position: number }>
		return analytics.positionsWeekly
			.map((w) => {
				const nums = Object.values(w.byPhrase).filter((n) => n > 0)
				if (!nums.length) return null
				const avg = nums.reduce((a, b) => a + b, 0) / nums.length
				return { weekStart: w.weekStart, position: avg }
			})
			.filter((x): x is { weekStart: string; position: number } => x != null)
	}, [analytics])
	const currentPosition = positionSeries.at(-1)?.position ?? null

	/* Keyed on all filter inputs. Passing this as a React `key` to
	 * each AnimatedNumber / MiniChart forces a remount on any
	 * filter change, which restarts recharts' entry animation and
	 * the KPI counters even when the underlying value happens to
	 * match the previous one. */
	const resetKey = `${profileId}-${range}-${customFrom}-${customTo}`

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

					<FiltersBlock role='region' aria-label='Analytics filters'>
						<SingleRow>
							<LeadInline>
								<div className='filter-lead'>
									<span className='lead-icon'>
										<CalendarTodayOutlined />
									</span>
									<div className='lead-text'>
										<span className='top'>Range</span>
										<span className='bot'>{activeRangeLabel}</span>
									</div>
								</div>

								<TapePills ref={pillsRef} role='tablist' aria-label='Date range'>
									<TapeIndicator
										style={{
											transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
											width: `${ind.width}px`,
											opacity: ind.opacity,
										}}
									/>
									{RANGE_OPTIONS.map((opt) => (
										<TapePill
											key={opt.value}
											type='button'
											role='tab'
											data-active={range === opt.value || undefined}
											aria-selected={range === opt.value}
											$active={range === opt.value}
											onClick={() => {
												setRange(opt.value)
												setCustomFrom('')
												setCustomTo('')
											}}
										>
											{opt.label}
										</TapePill>
									))}
								</TapePills>
							</LeadInline>

							<RangeGroup aria-label='Custom date range'>
								<BottomSlot>
									<DatePickerPill
										label='From'
										value={customFrom}
										onChange={(v) => {
											setCustomFrom(v)
											if (v || customTo) setRange('custom')
										}}
										accent='orange'
										size='lg'
										placeholder='Any'
									/>
								</BottomSlot>

								<RangeDash aria-hidden='true'>—</RangeDash>

								<BottomSlot>
									<DatePickerPill
										label='To'
										value={customTo}
										onChange={(v) => {
											setCustomTo(v)
											if (v || customFrom) setRange('custom')
										}}
										accent='orange'
										size='lg'
										placeholder='Any'
									/>
								</BottomSlot>
							</RangeGroup>

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
						</SingleRow>
					</FiltersBlock>

					<InnerStack>

				{!profileId && (
					<SectionCard>
						<EmptyChart>Pick a profile to see analytics.</EmptyChart>
					</SectionCard>
				)}

				{profileId && (
					<KpiPanel>
						<KpiHeader>
							<span className='kpi-kicker'>Totals in period</span>
						</KpiHeader>
						<KpiStrip>
							<KpiCell>
								<div className='kpi-label'>Views</div>
								<div className='kpi-value'>
									<AnimatedNumber
										key={resetKey}
										value={periodTotals.views}
									/>
								</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Invites</div>
								<div className='kpi-value'>
									<AnimatedNumber
										key={resetKey}
										value={periodTotals.invites}
									/>
								</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Direct messages</div>
								<div className='kpi-value'>
									<AnimatedNumber
										key={resetKey}
										value={periodTotals.directMessages}
									/>
								</div>
							</KpiCell>
							<KpiCell>
								<div className='kpi-label'>Position</div>
								<div className='kpi-value'>
									{currentPosition == null ? (
										'—'
									) : (
										<AnimatedNumber
											key={resetKey}
											value={currentPosition}
										/>
									)}
								</div>
								<PositionCaption>current</PositionCaption>
							</KpiCell>
						</KpiStrip>
					</KpiPanel>
				)}

				{profileId && analytics && (
					<SectionCard
						title='Weekly trends'
						hint='Four independent charts — each metric gets its own Y-axis so small-magnitude series are not flat-lined by big ones. Dashed verticals mark change-log entries.'
					>
						<ChartWrap>
							{analytics.weekly.length === 0 ? (
								<EmptyChart>No snapshots in this range yet.</EmptyChart>
							) : (
								<SmallMultiples>
									<MiniChart
										key={`views-${resetKey}`}
										label='Views'
										color='#334155'
										data={analytics.weekly}
										dataKey='views'
										markers={analytics.changeLogMarkers}
										showX
										showTooltip={false}
									/>
									<MiniChart
										key={`invites-${resetKey}`}
										label='Invites'
										color='#e85d2f'
										data={analytics.weekly}
										dataKey='invites'
										markers={analytics.changeLogMarkers}
										showX
										showTooltip={false}
									/>
									<MiniChart
										key={`dms-${resetKey}`}
										label='Direct messages'
										color='#2563eb'
										data={analytics.weekly}
										dataKey='directMessages'
										markers={analytics.changeLogMarkers}
										showX
										showTooltip={false}
									/>
									<MiniChart
										key={`position-${resetKey}`}
										label='Position · avg rank'
										color='#2563eb'
										data={positionSeries}
										dataKey='position'
										markers={analytics.changeLogMarkers}
										showX
										kind='area'
									/>
								</SmallMultiples>
							)}
						</ChartWrap>
					</SectionCard>
				)}

					</InnerStack>
				</ShellInner>
			</ShellCard>
		</ViewFade>
	)
}


const PositionCaption = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 1.4px;
	text-transform: uppercase;
	color: ${T.textMuted};
	margin-top: 4px;
`

/* Smooth count-up on value change (rAF, ease-out cubic). Null is
 * rendered as a dash; `decimals` controls display precision —
 * integers are shown via toLocaleString(), decimals via toFixed(). */
const AnimatedNumber = ({
	value,
	decimals = 0,
	duration = 700,
}: {
	value: number | null
	decimals?: number
	duration?: number
}) => {
	/* Initialise at 0 so even the first render tweens up to the
	 * target — gives the whole KPI strip a dashboard-reveal feel on
	 * mount and whenever the selected profile / range changes. */
	const [display, setDisplay] = useState<number | null>(value == null ? null : 0)
	const prevRef = useRef<number | null>(value == null ? null : 0)
	useEffect(() => {
		if (value == null) {
			setDisplay(null)
			prevRef.current = null
			return
		}
		const from = prevRef.current ?? 0
		const to = value
		if (from === to) {
			setDisplay(to)
			return
		}
		const start = performance.now()
		let raf = 0
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / duration)
			const eased = 1 - Math.pow(1 - p, 3)
			setDisplay(from + (to - from) * eased)
			if (p < 1) raf = requestAnimationFrame(tick)
			else prevRef.current = to
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [value, duration])
	if (display == null) return <>—</>
	return (
		<>
			{decimals > 0
				? display.toFixed(decimals)
				: Math.round(display).toLocaleString()}
		</>
	)
}

export default UpworkAnalyticsPage

/* ─── Filter block — mirrored from job-posts list ──────────────── */

const FiltersBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const SingleRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 12px 16px;
	min-height: 56px;
`

const LeadInline = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	min-width: 0;

	.filter-lead {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding-right: 22px;
		border-right: 1px solid rgba(36, 30, 22, 0.08);
	}
	.filter-lead .lead-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: #241e16;
		color: #fdfaf2;
		transition:
			transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
			background 220ms ease;
	}
	.filter-lead .lead-icon svg {
		font-size: 20px;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.filter-lead:hover .lead-icon {
		transform: rotate(-6deg) scale(1.08);
		background: #e85d2f;
	}
	.filter-lead .lead-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 78px;
	}
	.filter-lead .lead-text .top {
		font-family: 'Fraunces', 'Georgia', serif;
		font-variation-settings: 'opsz' 36;
		font-size: 17px;
		font-weight: 600;
		color: #241e16;
		letter-spacing: -0.2px;
	}
	.filter-lead .lead-text .bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
		color: #7d6e5d;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		margin-top: 3px;
		white-space: nowrap;
		transition: color 200ms ease;
	}
	.filter-lead:hover .lead-text .bot {
		color: #e85d2f;
	}
`

const RangeGroup = styled.div`
	display: inline-flex;
	align-items: flex-end;
	gap: 10px;
	padding: 4px 10px;
	border: 1px dashed rgba(36, 30, 22, 0.14);
	border-radius: 14px;
`

const RangeDash = styled.span`
	display: inline-flex;
	align-items: center;
	min-height: 42px;
	padding: 0 2px;
	color: #7d6e5d;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 16px;
	font-weight: 700;
	line-height: 1;
	user-select: none;
`
