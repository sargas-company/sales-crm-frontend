import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SectionCard from '../_shared/SectionCard'
import { useGetOpportunityHeatmapQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { T } from '../_shared/tokens'
import {
	HeatmapChartWrap,
	HeatmapLegend,
	HeatmapSvg,
	HeatmapTooltip,
	MetricSwitcher,
	Recommendations,
} from '../../../page/analytics/heatmap.styled'
import type { HeatmapDailyCell, HeatmapMetric } from '../../../store/sales-analytics/types/aggregates'
import { WEEKDAY_LABELS, partsInZone } from '../../../store/sales-analytics/utils/timezone'
import { DEFAULT_TIMEZONE } from '../../../store/sales-analytics/config'

const MONTH_SHORT = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
] as const

const parseIsoDate = (iso: string): { day: number; month: number } => {
	const parts = iso.split('-')
	return { day: parseInt(parts[2] ?? '0', 10), month: parseInt(parts[1] ?? '1', 10) }
}

const FULL_WEEKDAY_LABELS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday',
] as const

const METRIC_OPTIONS: { key: HeatmapMetric; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'qualified', label: 'Qualified 50+' },
	{ key: 'hot', label: 'Hot 75+' },
	{ key: 'qualifiedRate', label: 'Qual. rate' },
	{ key: 'averageScore', label: 'Avg score' },
]

const CELL_W = 40
const CELL_H = 32
const CELL_GAP = 3
const LEFT_PAD = 48
const TOP_PAD = 26

const heatColor = (v: number, max: number): string => {
	if (max <= 0 || v <= 0) return T.subtleBg
	const t = Math.min(1, v / max)
	const start = { r: 224, g: 242, b: 254 }
	const end = { r: 3, g: 105, b: 161 }
	const r = Math.round(start.r + (end.r - start.r) * t)
	const g = Math.round(start.g + (end.g - start.g) * t)
	const b = Math.round(start.b + (end.b - start.b) * t)
	return `rgb(${r}, ${g}, ${b})`
}

interface HeatCell {
	weekdayIndex: number
	hour: number
	total: number
	qualified: number
	hot: number
	qualifiedRate: number
	averageScore: number
}

const cellValue = (cell: HeatCell, metric: HeatmapMetric): number => {
	if (metric === 'all') return cell.total
	if (metric === 'qualified') return cell.qualified
	if (metric === 'hot') return cell.hot
	if (metric === 'qualifiedRate') return cell.qualifiedRate
	return cell.averageScore
}

interface HoverState {
	cell: HeatCell
	x: number
	y: number
	flipX: boolean
}

const TOOLTIP_W = 240

const HOUR_BANDS: { key: string; label: string; from: number; to: number }[] = [
	{ key: 'morning', label: 'Morning', from: 6, to: 12 },
	{ key: 'afternoon', label: 'Afternoon', from: 12, to: 18 },
	{ key: 'evening', label: 'Evening', from: 18, to: 24 },
	{ key: 'night', label: 'Night', from: 0, to: 6 },
]

const fmtHour = (h: number): string => `${String(h).padStart(2, '0')}:00`

interface Recommendation {
	key: string
	tone: 'blue' | 'purple' | 'amber'
	label: string
	primary: string
	hint: string
}

const buildRecommendations = (cells: HeatCell[]): Recommendation[] => {
	const activeCells = cells.filter((c) => c.total > 0)
	if (activeCells.length === 0) return []

	// 1. Peak slot: cell with highest qualified count (fallback to total)
	const peakCell = [...activeCells].sort((a, b) => {
		if (b.qualified !== a.qualified) return b.qualified - a.qualified
		return b.total - a.total
	})[0]

	// 2. Best weekday by qualified count
	const byWeekday = new Map<number, { qualified: number; total: number }>()
	for (const c of activeCells) {
		const cur = byWeekday.get(c.weekdayIndex) ?? { qualified: 0, total: 0 }
		byWeekday.set(c.weekdayIndex, {
			qualified: cur.qualified + c.qualified,
			total: cur.total + c.total,
		})
	}
	const bestWeekday = [...byWeekday.entries()].sort(
		(a, b) => b[1].qualified - a[1].qualified || b[1].total - a[1].total
	)[0]

	// 3. Best hour band by qualified rate (require some sample)
	const bandStats = HOUR_BANDS.map((band) => {
		let qualified = 0
		let total = 0
		for (const c of activeCells) {
			const h = c.hour
			const inBand =
				band.from <= band.to ? h >= band.from && h < band.to : h >= band.from || h < band.to
			if (inBand) {
				qualified += c.qualified
				total += c.total
			}
		}
		const rate = total > 0 ? Math.round((qualified / total) * 100) : 0
		return { ...band, qualified, total, rate }
	}).filter((b) => b.total > 0)
	const bestBand = [...bandStats].sort(
		(a, b) => b.rate - a.rate || b.qualified - a.qualified
	)[0]

	const recs: Recommendation[] = []

	if (peakCell) {
		recs.push({
			key: 'peak',
			tone: 'amber',
			label: 'Peak window',
			primary: `${FULL_WEEKDAY_LABELS[peakCell.weekdayIndex]} ${fmtHour(peakCell.hour)}–${fmtHour(
				(peakCell.hour + 1) % 24
			)}`,
			hint: `${peakCell.qualified} qualified · ${peakCell.total} total posts`,
		})
	}

	if (bestWeekday) {
		const [wd, stats] = bestWeekday
		recs.push({
			key: 'weekday',
			tone: 'blue',
			label: 'Strongest day',
			primary: `${FULL_WEEKDAY_LABELS[wd]}s`,
			hint: `${stats.qualified} qualified across ${stats.total} posts`,
		})
	}

	if (bestBand) {
		recs.push({
			key: 'band',
			tone: 'purple',
			label: 'Best time band',
			primary: `${bestBand.label} · ${fmtHour(bestBand.from)}–${
				bestBand.to === 24 ? '00:00' : fmtHour(bestBand.to)
			}`,
			hint: `${bestBand.rate}% qualification rate`,
		})
	}

	return recs
}

const OpportunityHeatmap = () => {
	const { filters } = useSalesFilters()
	const [metric, setMetric] = useState<HeatmapMetric>('qualified')
	const [hover, setHover] = useState<HoverState | null>(null)
	const { data, isLoading, isError, refetch } = useGetOpportunityHeatmapQuery({
		filters,
		metric,
	})

	const todayWeekdayIndex = useMemo(
		() => partsInZone(new Date(), filters.timezone ?? DEFAULT_TIMEZONE).weekdayIndex,
		[filters.timezone]
	)
	const highlightRow = filters.dateRange === 'today' ? todayWeekdayIndex : null
	const isDailyView = filters.dateRange === '30d' && !!data?.dailyCells

	const dailyWrapRef = useRef<HTMLDivElement | null>(null)
	const [dailyWrapWidth, setDailyWrapWidth] = useState(0)
	useLayoutEffect(() => {
		const el = dailyWrapRef.current
		if (!el) return
		const measure = () => setDailyWrapWidth(el.clientWidth)
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [isDailyView])

	const handleEnter = (cell: HeatCell, e: React.MouseEvent) => {
		setHover({
			cell,
			x: e.clientX,
			y: e.clientY,
			flipX: e.clientX > window.innerWidth - TOOLTIP_W,
		})
	}
	const handleMove = (e: React.MouseEvent) => {
		if (!hover) return
		setHover({
			...hover,
			x: e.clientX,
			y: e.clientY,
			flipX: e.clientX > window.innerWidth - TOOLTIP_W,
		})
	}
	const handleLeave = () => setHover(null)

	const recommendations = useMemo(
		() => (data ? buildRecommendations(data.cells) : []),
		[data]
	)

	const dailySvg = useMemo(() => {
		if (!data || !data.dailyCells || data.dailyCells.length === 0) return null
		const dailyMax = data.dailyMaxValue ?? 0
		const dayMap = new Map<string, HeatmapDailyCell[]>()
		for (const c of data.dailyCells) {
			const list = dayMap.get(c.date) ?? []
			list.push(c)
			dayMap.set(c.date, list)
		}
		const days = Array.from(dayMap.keys()).sort()
		const dailyLeftPad = 96
		const rightPad = 4
		const usableWidth = Math.max(0, dailyWrapWidth - dailyLeftPad - rightPad)
		const cellW = usableWidth > 0
			? Math.max(CELL_W, Math.floor((usableWidth - 23 * CELL_GAP) / 24))
			: CELL_W
		const cellH = Math.min(cellW, Math.max(CELL_H, Math.round(cellW * 0.75)))
		const width = dailyLeftPad + 24 * (cellW + CELL_GAP) + rightPad
		const height = TOP_PAD + days.length * (cellH + CELL_GAP) + 20
		const nodes: JSX.Element[] = []

		for (let h = 0; h < 24; h++) {
			if (h % 3 === 0) {
				nodes.push(
					<text
						key={`d-hx-${h}`}
						x={dailyLeftPad + h * (cellW + CELL_GAP) + cellW / 2}
						y={TOP_PAD - 8}
						textAnchor='middle'
						fontSize={11}
						fontWeight={600}
						fill={T.textSecondary}
					>
						{String(h).padStart(2, '0')}
					</text>
				)
			}
		}

		days.forEach((iso, rowIdx) => {
			const rowCells = dayMap.get(iso) ?? []
			const first = rowCells[0]
			if (!first) return
			const { day, month } = parseIsoDate(iso)
			const label = `${WEEKDAY_LABELS[first.weekdayIndex]} · ${String(day).padStart(2, '0')} ${
				MONTH_SHORT[month - 1] ?? ''
			}`
			nodes.push(
				<text
					key={`d-wl-${iso}`}
					x={dailyLeftPad - 10}
					y={TOP_PAD + rowIdx * (cellH + CELL_GAP) + cellH * 0.65}
					textAnchor='end'
					fontSize={12}
					fontWeight={600}
					fill={T.textStrong}
				>
					{label}
				</text>
			)
			for (const cell of rowCells) {
				const v = cellValue(cell, metric)
				const isActive = cell.total > 0
				const x = dailyLeftPad + cell.hour * (cellW + CELL_GAP)
				const y = TOP_PAD + rowIdx * (cellH + CELL_GAP)
				nodes.push(
					<rect
						key={`d-c-${iso}-${cell.hour}`}
						className={`heat-cell ${isActive ? 'active' : ''}`}
						x={x}
						y={y}
						width={cellW}
						height={cellH}
						rx={4}
						ry={4}
						fill={heatColor(v, dailyMax)}
						tabIndex={isActive ? 0 : -1}
						role='img'
						aria-label={`${label} ${String(cell.hour).padStart(2, '0')}:00 · ${cell.total} posts, ${cell.qualified} qualified, ${cell.hot} hot, avg score ${cell.averageScore}, qualified rate ${cell.qualifiedRate}%`}
						onMouseEnter={isActive ? (e) => handleEnter(cell, e) : undefined}
						onMouseLeave={isActive ? handleLeave : undefined}
						onMouseMove={isActive ? handleMove : undefined}
					/>
				)
			}
		})
		return { nodes, width, height }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, metric, dailyWrapWidth])

	const svg = useMemo(() => {
		if (!data) return null
		const width = LEFT_PAD + 24 * (CELL_W + CELL_GAP)
		const height = TOP_PAD + 7 * (CELL_H + CELL_GAP) + 20
		const nodes: JSX.Element[] = []

		if (highlightRow !== null) {
			nodes.push(
				<rect
					key='today-row-bg'
					x={LEFT_PAD - 6}
					y={TOP_PAD + highlightRow * (CELL_H + CELL_GAP) - 4}
					width={width - LEFT_PAD + 12}
					height={CELL_H + 8}
					rx={8}
					ry={8}
					fill='rgba(2, 132, 199, 0.06)'
					stroke='rgba(2, 132, 199, 0.28)'
					strokeWidth={1}
					strokeDasharray='4 4'
				/>
			)
		}

		for (let h = 0; h < 24; h++) {
			if (h % 3 === 0) {
				nodes.push(
					<text
						key={`hx-${h}`}
						x={LEFT_PAD + h * (CELL_W + CELL_GAP) + CELL_W / 2}
						y={TOP_PAD - 8}
						textAnchor='middle'
						fontSize={11}
						fontWeight={600}
						fill={T.textSecondary}
					>
						{String(h).padStart(2, '0')}
					</text>
				)
			}
		}
		for (let w = 0; w < 7; w++) {
			const isHighlighted = w === highlightRow
			nodes.push(
				<text
					key={`wl-${w}`}
					x={LEFT_PAD - 10}
					y={TOP_PAD + w * (CELL_H + CELL_GAP) + CELL_H * 0.65}
					textAnchor='end'
					fontSize={12}
					fontWeight={isHighlighted ? 800 : 600}
					fill={isHighlighted ? '#0369a1' : T.textStrong}
				>
					{WEEKDAY_LABELS[w]}
				</text>
			)
		}
		for (const cell of data.cells) {
			const v = cellValue(cell, metric)
			const isActive = cell.total > 0
			const dimmed = highlightRow !== null && cell.weekdayIndex !== highlightRow
			const x = LEFT_PAD + cell.hour * (CELL_W + CELL_GAP)
			const y = TOP_PAD + cell.weekdayIndex * (CELL_H + CELL_GAP)
			nodes.push(
				<rect
					key={`c-${cell.weekdayIndex}-${cell.hour}`}
					className={`heat-cell ${isActive ? 'active' : ''}`}
					x={x}
					y={y}
					width={CELL_W}
					height={CELL_H}
					rx={4}
					ry={4}
					fill={heatColor(v, data.maxValue)}
					opacity={dimmed ? 0.35 : 1}
					tabIndex={isActive ? 0 : -1}
					role='img'
					aria-label={`${WEEKDAY_LABELS[cell.weekdayIndex]} ${String(cell.hour).padStart(
						2,
						'0'
					)}:00 · ${cell.total} posts, ${cell.qualified} qualified, ${cell.hot} hot, avg score ${cell.averageScore}, qualified rate ${cell.qualifiedRate}%`}
					onMouseEnter={isActive ? (e) => handleEnter(cell, e) : undefined}
					onMouseLeave={isActive ? handleLeave : undefined}
					onMouseMove={isActive ? handleMove : undefined}
				/>
			)
		}
		return { nodes, width, height }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, metric, highlightRow])

	return (
		<SectionCard
			title='Opportunity heatmap'
			hint={data ? `Timezone · ${data.timezone} · ${data.sampleSize} posts` : 'Loading…'}
			action={
				<MetricSwitcher role='tablist' aria-label='Heatmap metric'>
					{METRIC_OPTIONS.map((opt) => (
						<button
							key={opt.key}
							type='button'
							role='tab'
							aria-selected={metric === opt.key}
							className={metric === opt.key ? 'active' : ''}
							onClick={() => setMetric(opt.key)}
						>
							{opt.label}
						</button>
					))}
				</MetricSwitcher>
			}
		>
			<HeatmapChartWrap>
				{isLoading || !data ? (
					<SkeletonBlock height={220} />
				) : isError ? (
					<ErrorState onRetry={() => refetch()} />
				) : data.sampleSize === 0 ? (
					<EmptyState
						title='No posts in this period yet'
						description='The heatmap will populate as job posts arrive.'
					/>
				) : (
					<>
						{isDailyView && dailySvg ? (
							<div
								ref={dailyWrapRef}
								style={{
									maxHeight: 520,
									overflowY: 'auto',
									overflowX: 'hidden',
								}}
							>
								<HeatmapSvg
									viewBox={`0 0 ${dailySvg.width} ${dailySvg.height}`}
									preserveAspectRatio='xMinYMin meet'
									role='figure'
									aria-label='Posts by day and hour heatmap'
									style={{
										width: dailySvg.width,
										height: dailySvg.height,
										maxWidth: 'none',
									}}
								>
									{dailySvg.nodes}
								</HeatmapSvg>
							</div>
						) : (
							<HeatmapSvg
								viewBox={`0 0 ${svg!.width} ${svg!.height}`}
								role='figure'
								aria-label='Posts by weekday and hour heatmap'
							>
								{svg!.nodes}
							</HeatmapSvg>
						)}
						<HeatmapLegend aria-hidden='true'>
							<span>Low</span>
							<span className='legend-bar' />
							<span>High</span>
						</HeatmapLegend>
						{recommendations.length > 0 && (
							<Recommendations>
								<div className='rec-title'>Recommendations</div>
								<div className='rec-grid'>
									{recommendations.map((r) => (
										<div key={r.key} className={`rec-card tone-${r.tone}`}>
											<span className='rec-label'>{r.label}</span>
											<span className='rec-primary'>{r.primary}</span>
											<span className='rec-hint'>{r.hint}</span>
										</div>
									))}
								</div>
							</Recommendations>
						)}
					</>
				)}
			</HeatmapChartWrap>

			{hover &&
				createPortal(
					<HeatmapTooltip
						style={{
							left: hover.flipX ? undefined : hover.x + 14,
							right: hover.flipX ? window.innerWidth - hover.x + 14 : undefined,
							top: hover.y + 14,
						}}
						role='tooltip'
					>
						<div className='ht-head'>
							<span className='ht-day'>{WEEKDAY_LABELS[hover.cell.weekdayIndex]}</span>
							<span className='ht-hours'>
								{String(hover.cell.hour).padStart(2, '0')}:00–
								{String((hover.cell.hour + 1) % 24).padStart(2, '0')}:00
							</span>
						</div>
						<div className='ht-total'>
							<span className='ht-total-num'>{hover.cell.total}</span>
							<span className='ht-total-label'>posts</span>
						</div>
						<div className='ht-grid'>
							<div className='ht-item'>
								<span className='ht-item-label'>Qualified 50+</span>
								<span className='ht-item-value'>{hover.cell.qualified}</span>
							</div>
							<div className='ht-item'>
								<span className='ht-item-label'>Hot 75+</span>
								<span className='ht-item-value'>{hover.cell.hot}</span>
							</div>
							<div className='ht-item'>
								<span className='ht-item-label'>Qual. rate</span>
								<span className='ht-item-value'>{hover.cell.qualifiedRate}%</span>
							</div>
							<div className='ht-item'>
								<span className='ht-item-label'>Avg score</span>
								<span className='ht-item-value'>{hover.cell.averageScore}</span>
							</div>
						</div>
					</HeatmapTooltip>,
					document.body
				)}
		</SectionCard>
	)
}

export default OpportunityHeatmap
