import { useMemo } from 'react'
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import styled from 'styled-components'
import { AutoAwesomeOutlined } from '@mui/icons-material'

import { useGetAiSpendQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import {
	KpiCell,
	KpiHeader,
	KpiPanel,
	KpiStrip,
} from '../../../page/analytics/kpi.styled'
import { HeatmapTooltip } from '../../../page/analytics/heatmap.styled'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { T } from '../_shared/tokens'
import type { SalesDateRangeKey } from '../../../store/sales-analytics/types/filters'

const PERIOD_LABEL: Record<SalesDateRangeKey, string> = {
	today: 'Today',
	'7d': 'Last 7 days',
	'30d': 'Last 30 days',
	custom: 'Custom period',
}

// Price typography — big integer portion, muted smaller sign + cents.
// Keeps numeric scanning fast ("$12.34" reads as "12" first).
const Money = ({ value, className }: { value: number; className?: string }) => {
	if (value > 0 && value < 0.01) {
		return (
			<span className={className}>
				<span className='m-sub'>&lt;&nbsp;</span>
				<span className='m-sign'>$</span>
				<span className='m-int'>0</span>
				<span className='m-frac'>.01</span>
			</span>
		)
	}
	const rounded = Math.round(value * 100) / 100
	const int = Math.trunc(rounded).toLocaleString()
	const frac = String(Math.round((rounded - Math.trunc(rounded)) * 100)).padStart(2, '0')
	return (
		<span className={className}>
			<span className='m-sign'>$</span>
			<span className='m-int'>{int}</span>
			<span className='m-frac'>.{frac}</span>
		</span>
	)
}

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

// Custom Tooltip for the "Spend per day" chart — reuses the heatmap
// tooltip's visual language (same shell, same type scale, same
// shadow) so the two blocks on the page feel like one family.
const SpendTooltip = ({ active, payload }: TooltipProps<number, string>) => {
	if (!active || !payload || payload.length === 0) return null
	const row = payload[0].payload as { day: string; usd: number; calls: number }
	const avg = row.calls > 0 ? row.usd / row.calls : 0
	return (
		<SpendTooltipBox role='tooltip'>
			<div className='ht-head'>
				<span className='ht-day'>Day</span>
				<span className='ht-hours'>{row.day}</span>
			</div>
			<div className='ht-total'>
				<Money value={row.usd} className='sptt-money' />
				<span className='ht-total-label'>spent</span>
			</div>
			<div className='ht-grid'>
				<div className='ht-item'>
					<span className='ht-item-label'>Calls</span>
					<span className='ht-item-value'>{row.calls}</span>
				</div>
				<div className='ht-item'>
					<span className='ht-item-label'>Avg $/call</span>
					<Money value={avg} className='ht-item-value sptt-money-sm' />
				</div>
			</div>
		</SpendTooltipBox>
	)
}

const AiSpendBlock = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetAiSpendQuery(filters)

	const chartData = useMemo(
		() =>
			(data?.perDay ?? []).map((row) => ({
				day: row.day.slice(5),
				usd: Number(row.usd.toFixed(4)),
				calls: row.calls,
			})),
		[data?.perDay],
	)

	if (isLoading || !data) {
		return <SkeletonBlock height={320} radius={18} />
	}
	if (isError) {
		return (
			<ErrorState
				title='AI spend unavailable'
				description='Could not load Claude usage ledger.'
				onRetry={() => refetch()}
			/>
		)
	}

	const avgCost = data.totalCalls > 0 ? data.totalUsd / data.totalCalls : 0
	const hasRows = data.totalCalls > 0

	return (
		<KpiPanel>
			<KpiHeader>
				<span className='kpi-kicker'>AI spend</span>
				<span className='kpi-period'>
					<span className='kpi-period-dot' aria-hidden='true' />
					{PERIOD_LABEL[filters.dateRange]}
				</span>
			</KpiHeader>

			<KpiStrip>
				<KpiCell>
					<div className='kpi-label'>Total spent</div>
					<KpiMoney value={data.totalUsd} className='kpi-value' />
					<div className='kpi-caption'>pricing v{data.pricingVersion}</div>
				</KpiCell>
				<KpiCell>
					<div className='kpi-label'>Calls</div>
					<div className='kpi-value'>{data.totalCalls.toLocaleString()}</div>
					<div className='kpi-caption'>gate + evaluator</div>
				</KpiCell>
				<KpiCell>
					<div className='kpi-label'>Avg $/call</div>
					<KpiMoney value={avgCost} className='kpi-value' />
					<div className='kpi-caption'>mean across period</div>
				</KpiCell>
				<KpiCell>
					<div className='kpi-label'>Input tokens</div>
					<div className='kpi-value'>{compactNumber.format(data.totalTokens.input)}</div>
					<div className='kpi-caption'>
						cache r/w: {compactNumber.format(data.totalTokens.cacheRead)} /{' '}
						{compactNumber.format(data.totalTokens.cacheWrite)}
					</div>
				</KpiCell>
				<KpiCell>
					<div className='kpi-label'>Output tokens</div>
					<div className='kpi-value'>{compactNumber.format(data.totalTokens.output)}</div>
					<div className='kpi-caption'>generated by Claude</div>
				</KpiCell>
			</KpiStrip>

			{/* "Spend per day" is only meaningful for 7d/30d — for the
			    today window it's a single bar that just repeats the
			    Total spent KPI above, so we hide it then. When there
			    are no calls at all, show the empty-state card. */}
			{!hasRows ? (
				<ChartWrap>
					<EmptyState
						title='No AI calls in this period yet'
						icon={<AutoAwesomeOutlined style={{ fontSize: 28 }} />}
					/>
				</ChartWrap>
			) : chartData.length > 1 ? (
				<ChartWrap>
					<ChartHeader>
						<span className='chart-title'>Spend per day</span>
						<span className='chart-sub'>USD, daily buckets</span>
					</ChartHeader>
					<ResponsiveContainer width='100%' height={220}>
						<BarChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray='3 3' stroke={T.divider} vertical={false} />
							<XAxis
								dataKey='day'
								stroke={T.divider}
								tick={{ fill: T.textSecondary, fontSize: 12, fontWeight: 600 }}
								tickLine={false}
								axisLine={{ stroke: T.divider }}
								dy={6}
							/>
							<YAxis
								stroke={T.divider}
								tick={{ fill: T.textSecondary, fontSize: 12, fontWeight: 600 }}
								tickLine={false}
								axisLine={{ stroke: T.divider }}
								tickFormatter={(v: number) => `$${v.toFixed(2)}`}
								width={56}
							/>
							<Tooltip cursor={false} content={<SpendTooltip />} />
							<Bar
								dataKey='usd'
								fill={T.primary}
								radius={[6, 6, 0, 0]}
								maxBarSize={48}
								isAnimationActive
								animationDuration={1100}
								animationEasing='ease-out'
							/>
						</BarChart>
					</ResponsiveContainer>
				</ChartWrap>
			) : null}

			<BreakdownGrid>
				<Breakdown>
					<div className='bd-title'>By model</div>
					{data.perModel.length === 0 ? (
						<div className='bd-empty'>—</div>
					) : (
						data.perModel.map((row) => (
							<div key={row.key} className='bd-row'>
								<span className='bd-key'>{row.key}</span>
								<Money value={row.usd} className='bd-usd' />
								<span className='bd-calls'>{row.calls} calls</span>
							</div>
						))
					)}
				</Breakdown>
				<Breakdown>
					<div className='bd-title'>By operation</div>
					{data.perOperation.length === 0 ? (
						<div className='bd-empty'>—</div>
					) : (
						data.perOperation.map((row) => (
							<div key={row.key} className='bd-row'>
								<span className='bd-key'>{row.key}</span>
								<Money value={row.usd} className='bd-usd' />
								<span className='bd-calls'>{row.calls} calls</span>
							</div>
						))
					)}
				</Breakdown>
			</BreakdownGrid>
		</KpiPanel>
	)
}

export default AiSpendBlock

// Mirrors KpiCell .kpi-value metrics but renders the `$` sign and
// the cents fraction at roughly half the size so the number itself
// leads visually. 34px matches the shared KpiCell scale.
const KpiMoney = styled(Money)`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	color: ${T.textStrong};
	line-height: 1;
	font-variant-numeric: tabular-nums;

	.m-sign {
		font-size: 18px;
		font-weight: 600;
		color: ${T.textSecondary};
		margin-right: 2px;
		letter-spacing: 0;
		align-self: flex-start;
		padding-top: 3px;
	}
	.m-int {
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -1.3px;
	}
	.m-frac {
		font-size: 18px;
		font-weight: 600;
		color: ${T.textSecondary};
		letter-spacing: -0.2px;
	}
	.m-sub {
		font-size: 16px;
		font-weight: 500;
		color: ${T.textSecondary};
	}
`

// Shares the heatmap tooltip's visual language. We extend the
// heatmap base so a future tweak to that family propagates to both
// blocks; the only override here is `position: static` because
// recharts positions the Tooltip container itself.
const SpendTooltipBox = styled(HeatmapTooltip)`
	position: static;
	pointer-events: none;

	/* Hero money in the tooltip — lighter than ht-total-num (which
	 * is 800), with the $ sign and the cents clearly subordinate to
	 * the integer part. */
	.sptt-money {
		display: inline-flex;
		align-items: baseline;
		gap: 1px;
		color: ${T.textStrong};
		line-height: 1;
		font-variant-numeric: tabular-nums;

		.m-sign {
			font-size: 13px;
			font-weight: 500;
			color: ${T.textSecondary};
			letter-spacing: 0;
			align-self: flex-start;
			padding-top: 3px;
			margin-right: 1px;
		}
		.m-int {
			font-size: 22px;
			font-weight: 600;
			letter-spacing: -0.5px;
		}
		.m-frac {
			font-size: 13px;
			font-weight: 500;
			color: ${T.textSecondary};
			letter-spacing: 0;
		}
		.m-sub {
			font-size: 12px;
			font-weight: 500;
			color: ${T.textSecondary};
		}
	}

	/* Avg $/call in the grid — same shape but one notch down so it
	 * doesn't fight with the hero line above. */
	.sptt-money-sm {
		.m-sign {
			font-size: 10.5px;
			padding-top: 2px;
		}
		.m-int {
			font-size: 15px;
			font-weight: 600;
			letter-spacing: -0.3px;
		}
		.m-frac {
			font-size: 10.5px;
		}
		.m-sub {
			font-size: 10px;
		}
	}
`

const ChartWrap = styled('div')`
	padding: 18px 24px 22px;
	border-top: 1px solid ${T.divider};

	/* Slashed zeros on axis ticks so the chart shares the type
	 * personality of the hero KPIs above. Recharts renders ticks as
	 * SVG <text>; recharts-cartesian-axis-tick-value is the stable
	 * class name on each tick label. */
	.recharts-cartesian-axis-tick-value {
		font-feature-settings: 'ss01' on, 'ss02' on;
	}
`

const ChartHeader = styled('div')`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 10px;

	.chart-title {
		font-size: 12.5px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: 0.2px;
	}
	.chart-sub {
		font-size: 11px;
		color: ${T.textSecondary};
	}
`

const BreakdownGrid = styled('div')`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1px;
	background: ${T.divider};
	border-top: 1px solid ${T.divider};

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const Breakdown = styled('div')`
	background: ${T.cardBg};
	padding: 18px 24px 22px;

	.bd-title {
		font-size: 12px;
		font-weight: 800;
		color: ${T.textSecondary};
		letter-spacing: 1.3px;
		text-transform: uppercase;
		margin-bottom: 14px;
	}
	.bd-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: baseline;
		gap: 14px;
		padding: 9px 0;
		border-bottom: 1px dashed ${T.divider};
		font-size: 14px;

		&:last-child {
			border-bottom: none;
		}
	}
	.bd-key {
		font-weight: 600;
		color: ${T.textStrong};
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bd-usd {
		font-weight: 700;
		color: ${T.textStrong};
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'ss01' on, 'ss02' on;

		.m-int {
			font-size: 20px;
			font-weight: 700;
			letter-spacing: -0.5px;
		}
		.m-sign,
		.m-frac,
		.m-sub {
			font-size: 14px;
			font-weight: 600;
			color: ${T.textStrong};
		}
	}
	.bd-calls {
		color: ${T.textSecondary};
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		min-width: 72px;
		text-align: right;
	}
	.bd-empty {
		font-size: 14px;
		color: ${T.textMuted};
	}
`
