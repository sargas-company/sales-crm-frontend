import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { css, keyframes } from 'styled-components'
import {
	ExpandMoreRounded,
	FilterAltOutlined,
	DateRangeOutlined,
	TrendingUpRounded,
	TrendingDownRounded,
	WarningAmberRounded,
	CloseRounded,
	PaidOutlined,
	RocketLaunchOutlined,
	BalanceOutlined,
	QueryStatsOutlined,
	EmojiEventsOutlined,
	WorkOutlineOutlined,
	PeopleAltOutlined,
	CalendarMonthOutlined,
	TuneOutlined,
	RestartAltRounded,
	HourglassEmptyRounded,
	SearchOffRounded,
} from '@mui/icons-material'

import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import {
	ViewFade,
	ShellCard,
	ShellInner,
	Crumbs,
	PageHead,
} from '../analytics/salesAnalytics.styled'
import {
	useGetFinanceAnalyticsQuery,
	useGetFinanceProjectsSummaryQuery,
	type FinanceAnalyticsQuery,
} from '../../store/finance-weekly/financeWeeklyApi'
import { useGetCounterpartiesQuery } from '../../store/counterparties/counterpartiesApi'

type ScopePreset = 'thisMonth' | 'last3Months' | 'thisYear' | 'allTime' | 'custom'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({
	value: String(y),
	label: String(y),
}))
const SCOPE_OPTIONS = [
	{ value: 'thisMonth', label: 'This month' },
	{ value: 'last3Months', label: 'Last 3 months' },
	{ value: 'thisYear', label: 'This year' },
	{ value: 'allTime', label: 'All time' },
]

function formatMoney(v: number): string {
	if (!Number.isFinite(v)) return '$0'
	return v.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	})
}

function formatMoneyCompact(v: number): string {
	if (!Number.isFinite(v)) return '$0'
	const abs = Math.abs(v)
	if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
	if (abs >= 10_000) return `$${(v / 1000).toFixed(0)}k`
	if (abs >= 1000) return `$${(v / 1000).toFixed(1)}k`
	return `$${Math.round(v)}`
}

function useCountUp(target: number, duration = 700): number {
	const [display, setDisplay] = useState(0)
	const prev = useRef(0)
	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			prev.current = target
			setDisplay(target)
			return
		}
		const from = prev.current
		const to = target
		if (from === to) return
		let raf = 0
		const start = performance.now()
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const cur = from + (to - from) * eased
			setDisplay(cur)
			if (t < 1) raf = requestAnimationFrame(step)
			else prev.current = to
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])
	return display
}

const CountMoney = ({ value }: { value: number }) => {
	const v = useCountUp(value)
	return <>{formatMoney(v)}</>
}
const CountInt = ({ value }: { value: number }) => {
	const v = useCountUp(value)
	return <>{Math.round(v).toLocaleString('en-US')}</>
}

const FinancialAnalyticsPage = () => {
	const [year, setYear] = useState<number>(CURRENT_YEAR)
	const [scope, setScope] = useState<ScopePreset>('thisYear')
	const [projectId, setProjectId] = useState<string>('')
	const [clientId, setClientId] = useState<string>('')

	const queryArgs: FinanceAnalyticsQuery = useMemo(
		() => ({
			year,
			scope,
			projectId: projectId || undefined,
			clientId: clientId || undefined,
		}),
		[year, scope, projectId, clientId],
	)
	const { data, isLoading, isFetching } = useGetFinanceAnalyticsQuery(queryArgs)
	const { data: projectsSummary } = useGetFinanceProjectsSummaryQuery()
	const { data: counterparties } = useGetCounterpartiesQuery({ page: 1, limit: 500 })

	const clients = useMemo(
		() =>
			(counterparties?.data ?? [])
				.filter((c) => c.type === 'client')
				.map((c) => ({
					id: c.id,
					label:
						c.company && `${c.firstName} ${c.lastName}`.trim()
							? `${c.company} · ${c.firstName} ${c.lastName}`.trim()
							: c.company || `${c.firstName} ${c.lastName}`.trim(),
				})),
		[counterparties],
	)

	const snapshot = data?.snapshot
	const monthly = data?.monthly
	const monthlyPnl = data?.monthlyPnl
	const byProject = data?.byProject ?? []
	const byClient = data?.byClient ?? []
	const concentration = data?.concentration
	const pipeline = data?.pipeline
	const yr = data?.yearOverview

	const activeFiltersCount =
		(year !== CURRENT_YEAR ? 1 : 0) +
		(scope !== 'thisYear' ? 1 : 0) +
		(projectId ? 1 : 0) +
		(clientId ? 1 : 0)

	const resetFilters = () => {
		setYear(CURRENT_YEAR)
		setScope('thisYear')
		setProjectId('')
		setClientId('')
	}

	return (
		<>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='current'>Finance dashboard</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<h1>Finances</h1>
								<p>
									Cash flow, revenue mix and concentration — all built from your Payments
									data. Refreshes automatically when entries change.
								</p>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>money in motion</span>
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

						<FiltersRow data-theme='dark'>
							<FiltersLead>
								<FiltersLeadIcon>
									<FilterAltOutlined />
								</FiltersLeadIcon>
								<FiltersLeadText>
									<span className='top'>Filters</span>
									<span className='bot'>
										{activeFiltersCount === 0
											? 'Default view'
											: `${activeFiltersCount} active`}
									</span>
								</FiltersLeadText>
								<ResetLink
									type='button'
									onClick={resetFilters}
									disabled={activeFiltersCount === 0}
									data-active={activeFiltersCount > 0}
									title='Reset all filters'
									aria-label='Reset all filters'
								>
									<RestartAltRounded style={{ fontSize: 17 }} />
								</ResetLink>
							</FiltersLead>

							<FiltersGroups>
								<FilterGroup>
									<GroupLbl>
										<IconChip>
											<CalendarMonthOutlined />
										</IconChip>
										Year
									</GroupLbl>
									<AnimatedSegmented
										items={YEAR_OPTIONS}
										active={String(year)}
										onSelect={(v) => setYear(Number(v))}
									/>
								</FilterGroup>
								<FilterGroup>
									<GroupLbl>
										<IconChip>
											<DateRangeOutlined />
										</IconChip>
										Period
									</GroupLbl>
									<AnimatedSegmented
										items={SCOPE_OPTIONS}
										active={scope}
										onSelect={(v) => setScope(v as ScopePreset)}
									/>
								</FilterGroup>

								<Divider aria-hidden='true' />

								<FilterGroup>
									<GroupLbl>
										<IconChip>
											<WorkOutlineOutlined />
										</IconChip>
										Project
									</GroupLbl>
									<SelectPill $active={!!projectId}>
										<SelectText>
											{projectId
												? projectsSummary?.find((p) => p.id === projectId)?.name ??
													'Selected'
												: 'All projects'}
										</SelectText>
										<SelectChev>
											<ExpandMoreRounded style={{ fontSize: 16 }} />
										</SelectChev>
										<NativeSelect
											value={projectId}
											onChange={(e) => setProjectId(e.target.value)}
										>
											<option value=''>All projects</option>
											{(projectsSummary ?? []).map((p) => (
												<option key={p.id} value={p.id}>
													{p.name}
													{p.clientName ? ` — ${p.clientName}` : ''}
												</option>
											))}
										</NativeSelect>
									</SelectPill>
								</FilterGroup>
								<FilterGroup>
									<GroupLbl>
										<IconChip>
											<PeopleAltOutlined />
										</IconChip>
										Client
									</GroupLbl>
									<SelectPill $active={!!clientId}>
										<SelectText>
											{clientId
												? clients.find((c) => c.id === clientId)?.label ?? 'Selected'
												: 'All clients'}
										</SelectText>
										<SelectChev>
											<ExpandMoreRounded style={{ fontSize: 16 }} />
										</SelectChev>
										<NativeSelect
											value={clientId}
											onChange={(e) => setClientId(e.target.value)}
										>
											<option value=''>All clients</option>
											{clients.map((c) => (
												<option key={c.id} value={c.id}>
													{c.label}
												</option>
											))}
										</NativeSelect>
									</SelectPill>
								</FilterGroup>
							</FiltersGroups>

						</FiltersRow>

						<Snapshot>
							<Stat>
								<StatLbl>Received this month</StatLbl>
								<StatVal className='primary'>
									<CountMoney value={snapshot?.receivedThisMonth ?? 0} />
								</StatVal>
							</Stat>
							<Stat>
								<StatLbl>Pipeline this month</StatLbl>
								<StatVal>
									<CountMoney value={snapshot?.pipelineThisMonth ?? 0} />
								</StatVal>
								<StatHint>In transit + expected</StatHint>
							</Stat>
							<Stat>
								<StatLbl>Received YTD</StatLbl>
								<StatVal>
									<CountMoney value={snapshot?.receivedYtd ?? 0} />
								</StatVal>
								<StatHint>
									{yr?.year ?? year} · {yr?.paymentsCount ?? 0} payments
								</StatHint>
							</Stat>
							<Stat>
								<StatLbl>vs previous month</StatLbl>
								<DeltaRow>
									{snapshot?.deltaMoM == null ? (
										<span className='muted'>—</span>
									) : (
										<>
											{snapshot.deltaMoM >= 0 ? (
												<TrendingUpRounded className='up' />
											) : (
												<TrendingDownRounded className='down' />
											)}
											<span className={snapshot.deltaMoM >= 0 ? 'up' : 'down'}>
												{snapshot.deltaMoM >= 0 ? '+' : ''}
												{snapshot.deltaMoM.toFixed(1)}%
											</span>
										</>
									)}
								</DeltaRow>
								<StatHint>Prev · {formatMoney(snapshot?.prevMonthReceived ?? 0)}</StatHint>
							</Stat>
						</Snapshot>

						{/* ── 2. Revenue by project & client (columns) ─────── */}
						<TwoCol>
							<Panel>
								<PanelHead>
									<div>
										<PanelTitle>Revenue by project</PanelTitle>
										<PanelSub>{data?.filters.rangeLabel ?? '—'}</PanelSub>
									</div>
								</PanelHead>
								<Breakdown
									rows={byProject}
									emptyTitle='No project revenue yet'
									emptySub='Nothing received in this range. Try a wider period or check back after payments land.'
								/>
							</Panel>
							<Panel>
								<PanelHead>
									<div>
										<PanelTitle>Revenue by client</PanelTitle>
										<PanelSub>{data?.filters.rangeLabel ?? '—'}</PanelSub>
									</div>
									{concentration?.atRisk && (
										<RiskBadge title='Top client > 40% or top-3 > 70% of revenue'>
											<WarningAmberRounded style={{ fontSize: 16 }} />
											Concentration risk
										</RiskBadge>
									)}
								</PanelHead>
								<Breakdown
									rows={byClient}
									emptyTitle='No client revenue yet'
									emptySub='No payer is contributing to this range. Adjust the period, or a project without a client may be at play.'
								/>
								{concentration && byClient.length > 0 && (
									<ConcentrationFoot>
										Top client — <b>{concentration.topClientPercent.toFixed(1)}%</b>
										{' · '}
										Top 3 — <b>{concentration.topThreePercent.toFixed(1)}%</b>
									</ConcentrationFoot>
								)}
							</Panel>
						</TwoCol>

						{/* ── 3. Year overview (single row of cards) ──────── */}
						<YearSection>
							<YearHead>
								<div>
									<YearTitle>
										Year overview <span className='sep'>·</span>{' '}
										<span className='yr'>{yr?.year ?? year}</span>
									</YearTitle>
									<YearSub>
										Received-only. Independent of the Period filter.
									</YearSub>
								</div>
							</YearHead>

						{(() => {
							// Year-level derived metrics not on the backend response.
							const totalReceived = yr?.totalReceived ?? 0
							const paymentsCount = yr?.paymentsCount ?? 0
							const activeProjects = yr?.activeProjects ?? 0
							const activeClients = yr?.activeClients ?? 0

							// Run rate: annualise the pace so the year-end projection is
							// visible mid-year. For a past year we already have the final
							// total, so run rate collapses to it.
							const now = new Date()
							const yearNumber = yr?.year ?? year
							const isCurrentYear = yearNumber === now.getFullYear()
							const monthsElapsed = isCurrentYear
								? Math.max(1, now.getMonth() + 1 + now.getDate() / 30.42)
								: 12
							const runRate = isCurrentYear
								? (totalReceived / monthsElapsed) * 12
								: totalReceived

							// Median across months that actually had money. Ignores $0 rows
							// so early-year buckets don't drag it to zero.
							const monthlyReceivedList = (monthly?.months ?? [])
								.map((m) => m.received)
								.filter((v) => v > 0)
								.sort((a, b) => a - b)
							const medianMonthly = monthlyReceivedList.length
								? monthlyReceivedList.length % 2 === 1
									? monthlyReceivedList[(monthlyReceivedList.length - 1) / 2]
									: (monthlyReceivedList[monthlyReceivedList.length / 2 - 1] +
											monthlyReceivedList[monthlyReceivedList.length / 2]) /
										2
								: 0

							const perProject = activeProjects > 0 ? totalReceived / activeProjects : 0
							const perClient = activeClients > 0 ? totalReceived / activeClients : 0

							const avg = yr?.avgMonthly ?? 0
							const medianDelta = avg > 0 ? ((medianMonthly - avg) / avg) * 100 : 0
							return (
								<SnapshotWide>
									<YearStat className='hero'>
										<IconTile>
											<PaidOutlined />
										</IconTile>
										<StatLbl>Total received</StatLbl>
										<StatVal className='primary'>
											<CountMoney value={totalReceived} />
										</StatVal>
										<StatHint>
											{paymentsCount} {paymentsCount === 1 ? 'payment' : 'payments'}
										</StatHint>
									</YearStat>
									<YearStat>
										<IconTile>
											<RocketLaunchOutlined />
										</IconTile>
										<StatLbl>Run rate</StatLbl>
										<StatVal>
											<CountMoney value={runRate} />
										</StatVal>
										<StatHint>
											{isCurrentYear
												? `Annualised · ${monthsElapsed.toFixed(1)} mo elapsed`
												: 'Final year total'}
										</StatHint>
									</YearStat>
									<YearStat>
										<IconTile>
											<BalanceOutlined />
										</IconTile>
										<StatLbl>Avg monthly</StatLbl>
										<StatVal>
											<CountMoney value={avg} />
										</StatVal>
										<StatHint>Across active months</StatHint>
									</YearStat>
									<YearStat>
										<IconTile>
											<QueryStatsOutlined />
										</IconTile>
										<StatLbl>Median monthly</StatLbl>
										<StatVal>
											<CountMoney value={medianMonthly} />
										</StatVal>
										<StatHint>
											{medianDelta >= 0
												? 'Stable pace, median at or above avg'
												: 'One-off spike pulls avg above typical'}
										</StatHint>
									</YearStat>
									<YearStat className='amber'>
										<IconTile className='amber'>
											<EmojiEventsOutlined />
										</IconTile>
										<StatLbl>Best month</StatLbl>
										<StatVal>
											{yr?.bestMonth ? formatMoneyCompact(yr.bestMonth.total) : '—'}
										</StatVal>
										<StatHint>{yr?.bestMonth?.label ?? '—'}</StatHint>
									</YearStat>
									<YearStat>
										<IconTile>
											<WorkOutlineOutlined />
										</IconTile>
										<StatLbl>Avg / project</StatLbl>
										<StatVal>
											<CountMoney value={perProject} />
										</StatVal>
										<StatHint>
											{activeProjects} active {activeProjects === 1 ? 'project' : 'projects'}
										</StatHint>
									</YearStat>
									<YearStat>
										<IconTile>
											<PeopleAltOutlined />
										</IconTile>
										<StatLbl>Avg / client</StatLbl>
										<StatVal>
											<CountMoney value={perClient} />
										</StatVal>
										<StatHint>
											{activeClients} active {activeClients === 1 ? 'client' : 'clients'}
										</StatHint>
									</YearStat>
								</SnapshotWide>
							)
						})()}
						</YearSection>

						{/* ── 4. Monthly history ──────────────────────────── */}
						<Panel>
							<PanelHead>
								<div>
									<PanelTitle>Monthly received · {monthly?.year ?? year}</PanelTitle>
									<PanelSub>
										Bars are received revenue per fiscal month. Line shows the average.
									</PanelSub>
								</div>
								{!!monthly && monthly.average > 0 && (
									<AvgTag>
										Avg <strong>{formatMoneyCompact(monthly.average)}</strong>/mo
									</AvgTag>
								)}
							</PanelHead>
							{monthly && <MonthlyChart data={monthly.months} average={monthly.average} />}
						</Panel>

						{/* ── 4b. Monthly margin ────────────────────────── */}
						<Panel>
							<PanelHead>
								<div>
									<PanelTitle>Monthly margin · {monthlyPnl?.year ?? year}</PanelTitle>
									<PanelSub>
										Revenue minus salary cost per fiscal month (cash-basis).
									</PanelSub>
								</div>
								{monthlyPnl && (
									<AvgTag>
										YTD{' '}
										<strong>
											{monthlyPnl.totals.margin >= 0 ? '' : '−'}
											{formatMoneyCompact(Math.abs(monthlyPnl.totals.margin))}
										</strong>
										{monthlyPnl.totals.marginPercent !== null && (
											<>
												{' · '}
												<strong>{monthlyPnl.totals.marginPercent.toFixed(1)}%</strong>
											</>
										)}
									</AvgTag>
								)}
							</PanelHead>
							{monthlyPnl && (
								<MonthlyMarginRows data={monthlyPnl.months} />
							)}
						</Panel>

						{/* ── 5. Pipeline breakdown ───────────────────────── */}
			<Panel>
				<PanelHead>
					<div>
						<PanelTitle>Pipeline breakdown</PanelTitle>
						<PanelSub>
							Expected money not yet received. {data?.filters.rangeLabel ?? ''}
						</PanelSub>
					</div>
					<AvgTag>
						Total <strong>{formatMoneyCompact(pipeline?.totalPipeline ?? 0)}</strong>
					</AvgTag>
				</PanelHead>
				<PipelineFlow pipeline={pipeline} />
			</Panel>

						{(isLoading || isFetching) && <LoadingRibbon>Loading…</LoadingRibbon>}
					</ShellInner>
				</ShellCard>
			</ViewFade>

			</>
	)
}

export default FinancialAnalyticsPage

/* ═════════════ Sub-components ═════════════ */

interface FiltersPopoverProps {
	open: boolean
	onClose: () => void
	year: number
	onYearChange: (y: number) => void
	scope: ScopePreset
	onScopeChange: (s: ScopePreset) => void
	projectId: string
	onProjectChange: (id: string) => void
	projects: { id: string; name: string; clientName: string | null }[]
	clientId: string
	onClientChange: (id: string) => void
	clients: { id: string; label: string }[]
	activeCount: number
	onReset: () => void
}

const FiltersPopover = ({
	open,
	onClose,
	year,
	onYearChange,
	scope,
	onScopeChange,
	projectId,
	onProjectChange,
	projects,
	clientId,
	onClientChange,
	clients,
	activeCount,
	onReset,
}: FiltersPopoverProps) => {
	const backdropRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, onClose])

	useLayoutEffect(() => {
		if (open) {
			const prev = document.body.style.overflow
			document.body.style.overflow = 'hidden'
			return () => {
				document.body.style.overflow = prev
			}
		}
	}, [open])

	if (typeof document === 'undefined') return null

	return createPortal(
		<PopBackdrop
			ref={backdropRef}
			$open={open}
			aria-hidden={!open}
			onMouseDown={(e) => {
				if (e.target === backdropRef.current) onClose()
			}}
		>
			<PopSheet $open={open} role='dialog' aria-modal='true' aria-label='Filters'>
				<PopHead>
					<div>
						<h3>Filters</h3>
						<p>Slice the analytics by year, period, project or client.</p>
					</div>
					<PopClose type='button' onClick={onClose} aria-label='Close filters'>
						<CloseRounded />
					</PopClose>
				</PopHead>

				<PopBody>
					<PopGroup>
						<PopLbl>
							<DateRangeOutlined style={{ fontSize: 15 }} /> Year
						</PopLbl>
						<AnimatedSegmented
							items={YEAR_OPTIONS}
							active={String(year)}
							onSelect={(v) => onYearChange(Number(v))}
						/>
					</PopGroup>
					<PopGroup>
						<PopLbl>
							<FilterAltOutlined style={{ fontSize: 15 }} /> Period
						</PopLbl>
						<AnimatedSegmented
							items={SCOPE_OPTIONS}
							active={scope}
							onSelect={(v) => onScopeChange(v as ScopePreset)}
						/>
					</PopGroup>
					<PopGroup>
						<PopLbl>Project</PopLbl>
						<SelectPill>
							<SelectText>
								{projectId
									? projects.find((p) => p.id === projectId)?.name ?? 'Selected'
									: 'All projects'}
							</SelectText>
							<SelectChev>
								<ExpandMoreRounded style={{ fontSize: 16 }} />
							</SelectChev>
							<NativeSelect
								value={projectId}
								onChange={(e) => onProjectChange(e.target.value)}
							>
								<option value=''>All projects</option>
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
										{p.clientName ? ` — ${p.clientName}` : ''}
									</option>
								))}
							</NativeSelect>
						</SelectPill>
					</PopGroup>
					<PopGroup>
						<PopLbl>Client</PopLbl>
						<SelectPill>
							<SelectText>
								{clientId
									? clients.find((c) => c.id === clientId)?.label ?? 'Selected'
									: 'All clients'}
							</SelectText>
							<SelectChev>
								<ExpandMoreRounded style={{ fontSize: 16 }} />
							</SelectChev>
							<NativeSelect
								value={clientId}
								onChange={(e) => onClientChange(e.target.value)}
							>
								<option value=''>All clients</option>
								{clients.map((c) => (
									<option key={c.id} value={c.id}>
										{c.label}
									</option>
								))}
							</NativeSelect>
						</SelectPill>
					</PopGroup>
				</PopBody>

				<PopFoot>
					<button
						type='button'
						className='reset'
						onClick={onReset}
						disabled={activeCount === 0}
					>
						Reset all
					</button>
					<button type='button' className='apply' onClick={onClose}>
						Done
					</button>
				</PopFoot>
			</PopSheet>
		</PopBackdrop>,
		document.body,
	)
}

const PIPELINE_BUCKETS = [
	{ key: 'in_transit', label: 'In transit', hint: 'Money already sent', color: '#0369a1' },
	{
		key: 'expected_this_month',
		label: 'Expected this month',
		hint: 'Should arrive within the fiscal month',
		color: '#0284c7',
	},
	{ key: 'expected_later', label: 'Expected later', hint: 'Beyond this month', color: '#7c3aed' },
	{
		key: 'planned_invoice',
		label: 'Planned invoice',
		hint: 'Not yet invoiced',
		color: '#94a3b8',
	},
] as const

const PipelineFlow = ({
	pipeline,
}: {
	pipeline: import('../../store/finance-weekly/financeWeeklyApi').AnalyticsPipeline | undefined
}) => {
	if (!pipeline || pipeline.totalPipeline <= 0) {
		return (
			<EmptyState>
				<span className='ico'>
					<HourglassEmptyRounded />
				</span>
				<span className='title'>Pipeline is clear</span>
				<span className='sub'>
					Nothing in transit or expected for this range. All received or none scheduled yet.
				</span>
			</EmptyState>
		)
	}

	const buckets = PIPELINE_BUCKETS.map((b) => {
		const cell = pipeline[b.key as keyof typeof pipeline] as { total: number; count: number }
		return {
			...b,
			total: cell.total,
			count: cell.count,
			percent: pipeline.totalPipeline > 0 ? (cell.total / pipeline.totalPipeline) * 100 : 0,
		}
	})

	return (
		<PipelineWrap>
			<PipelineBar>
				{buckets
					.filter((b) => b.total > 0)
					.map((b) => (
						<PipelineSeg
							key={b.key}
							$color={b.color}
							$flex={b.total}
							title={`${b.label} · ${formatMoney(b.total)} · ${b.count} ${
								b.count === 1 ? 'entry' : 'entries'
							}`}
						>
							{b.percent >= 8 && <span className='pct'>{b.percent.toFixed(0)}%</span>}
						</PipelineSeg>
					))}
			</PipelineBar>

			<PipelineList>
				{buckets.map((b) => (
					<PipelineItem key={b.key} $color={b.color}>
						<span className='dot' aria-hidden='true' />
						<span>
							<span className='lbl'>{b.label}</span>
							<span className='meta'>
								{b.count} {b.count === 1 ? 'entry' : 'entries'} · {b.hint}
							</span>
						</span>
						<span className='val'>
							<span className='money'>
								<CountMoney value={b.total} />
							</span>
							<span className='pct'>{b.percent.toFixed(1)}%</span>
						</span>
					</PipelineItem>
				))}
			</PipelineList>
		</PipelineWrap>
	)
}

function niceCeil(v: number): number {
	if (v <= 0) return 1
	const pow = Math.pow(10, Math.floor(Math.log10(v)))
	const norm = v / pow
	let n: number
	if (norm <= 1) n = 1
	else if (norm <= 2) n = 2
	else if (norm <= 2.5) n = 2.5
	else if (norm <= 5) n = 5
	else n = 10
	return n * pow
}

const MonthlyMarginChart = ({
	data,
	avgMargin,
}: {
	data: Array<{
		monthId: string
		label: string
		sequenceInYear: number
		revenueReceived: number
		salaryCost: number
		margin: number
		marginPercent: number | null
	}>
	avgMargin: number
}) => {
	const [hover, setHover] = useState<number | null>(null)
	const hasAny = data.some((m) => m.revenueReceived > 0 || m.salaryCost > 0)
	if (!hasAny) {
		return (
			<EmptyState>
				<span className='ico'>
					<SearchOffRounded />
				</span>
				<span className='title'>No margin data yet</span>
				<span className='sub'>
					Nothing received and no payroll paid in this year. Numbers appear once
					both sides start showing up.
				</span>
			</EmptyState>
		)
	}
	const rawMax = Math.max(
		1,
		...data.map((m) => Math.max(m.revenueReceived, m.salaryCost)),
	)
	const max = niceCeil(rawMax)
	const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
	const avgPct = max > 0 && avgMargin > 0 ? (avgMargin / max) * 100 : 0
	const today = new Date()
	const currentMonthIdx = Math.min(data.length - 1, Math.max(0, today.getMonth()))
	return (
		<ChartWrap>
			<ChartGrid>
				<YAxis>
					{[...gridTicks].reverse().map((t, i) => (
						<span key={i}>{formatMoneyCompact(t)}</span>
					))}
				</YAxis>
				<Plot>
					{gridTicks.map((_, i) => (
						<GridLine key={i} style={{ bottom: `${(i / (gridTicks.length - 1)) * 100}%` }} />
					))}
					{avgMargin > 0 && (
						<AvgLine style={{ bottom: `${avgPct}%` }}>
							<span className='lbl'>Avg margin {formatMoneyCompact(avgMargin)}</span>
						</AvgLine>
					)}
					<Bars>
						{data.map((m, i) => {
							const revenuePct = (m.revenueReceived / max) * 100
							const salaryPct = (m.salaryCost / max) * 100
							const isCurrent = i === currentMonthIdx
							const hasAnyMoney = m.revenueReceived > 0 || m.salaryCost > 0
							const align: 'left' | 'center' | 'right' =
								i <= 1 ? 'left' : i >= data.length - 2 ? 'right' : 'center'
							const open = hasAnyMoney && hover === i
							const negative = m.margin < 0
							const maxBarPct = Math.max(revenuePct, salaryPct)
							return (
								<MonthCol key={m.monthId} $hover={hover === i}>
									<HoverCard
										data-open={open}
										data-align={align}
										aria-hidden={!open}
										style={{ bottom: `calc(${maxBarPct}% + 24px)` }}
									>
										<div className='hd'>
											{m.label}
											{isCurrent && <span className='cur-pill'>Current</span>}
										</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot rev' /> Revenue
											</span>
											<span className='v'>{formatMoney(m.revenueReceived)}</span>
										</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot sal' /> Salary
											</span>
											<span className='v'>{formatMoney(m.salaryCost)}</span>
										</div>
										<div className='sep' />
										<div className='rw total'>
											<span className='k'>Margin</span>
											<span className={`v ${negative ? 'neg' : 'pos'}`}>
												{negative ? '−' : ''}
												{formatMoney(Math.abs(m.margin))}
											</span>
										</div>
										{m.marginPercent !== null && (
											<div className='meta'>
												{m.marginPercent.toFixed(1)}% of revenue
											</div>
										)}
										<span className='arrow' aria-hidden='true' />
									</HoverCard>
									{hasAnyMoney && m.margin !== 0 && (
										<MarginTag
											$negative={negative}
											style={{ bottom: `calc(${maxBarPct}% + 6px)` }}
										>
											<span className='amt'>
												{negative ? '−' : '+'}
												{formatMoneyCompact(Math.abs(m.margin))}
											</span>
											{m.marginPercent !== null && (
												<span className='pct'>{m.marginPercent.toFixed(1)}%</span>
											)}
										</MarginTag>
									)}
									<MarginDualBar>
										<div className='bar rev' style={{ height: `${revenuePct}%` }} />
										<div className='bar sal' style={{ height: `${salaryPct}%` }} />
									</MarginDualBar>
									{hasAnyMoney && (
										<HoverZone
											style={{ height: `${maxBarPct}%` }}
											onMouseEnter={() => setHover(i)}
											onMouseLeave={() => setHover(null)}
										/>
									)}
									<MonthLbl $current={isCurrent}>{m.label.slice(0, 3)}</MonthLbl>
								</MonthCol>
							)
						})}
					</Bars>
				</Plot>
			</ChartGrid>
			<ChartLegend>
				<span className='item'>
					<span className='dot rev' /> Revenue
				</span>
				<span className='item'>
					<span className='dot sal' /> Salary
				</span>
				<span className='item'>
					<span className='dot mar' /> Margin
				</span>
			</ChartLegend>
		</ChartWrap>
	)
}

type PnlRow = {
	monthId: string
	label: string
	sequenceInYear: number
	revenueReceived: number
	salaryCost: number
	margin: number
	marginPercent: number | null
}

/* Variant B — stacked overlay: one wide bar per month, salary stacked
 * on top (from 0 up to salaryCost), revenue shown as the full column
 * height; the slice above the salary stack is the visible margin. */
const MonthlyMarginStacked = ({ data }: { data: PnlRow[] }) => {
	const [hover, setHover] = useState<number | null>(null)
	const hasAny = data.some((m) => m.revenueReceived > 0 || m.salaryCost > 0)
	if (!hasAny) {
		return (
			<EmptyState>
				<span className='ico'>
					<SearchOffRounded />
				</span>
				<span className='title'>No margin data yet</span>
				<span className='sub'>Numbers appear once both sides show up.</span>
			</EmptyState>
		)
	}
	const rawMax = Math.max(1, ...data.map((m) => Math.max(m.revenueReceived, m.salaryCost)))
	const max = niceCeil(rawMax)
	const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
	return (
		<ChartWrap>
			<ChartGrid>
				<YAxis>
					{[...gridTicks].reverse().map((t, i) => (
						<span key={i}>{formatMoneyCompact(t)}</span>
					))}
				</YAxis>
				<Plot>
					{gridTicks.map((_, i) => (
						<GridLine key={i} style={{ bottom: `${(i / (gridTicks.length - 1)) * 100}%` }} />
					))}
					<Bars>
						{data.map((m, i) => {
							const revenuePct = (m.revenueReceived / max) * 100
							const salaryPct = (m.salaryCost / max) * 100
							const marginSlice = Math.max(0, revenuePct - salaryPct)
							const negative = m.margin < 0
							const hasAnyMoney = m.revenueReceived > 0 || m.salaryCost > 0
							const open = hasAnyMoney && hover === i
							const align: 'left' | 'center' | 'right' =
								i <= 1 ? 'left' : i >= data.length - 2 ? 'right' : 'center'
							return (
								<MonthCol key={m.monthId} $hover={hover === i}>
									<HoverCard
										data-open={open}
										data-align={align}
										aria-hidden={!open}
										style={{ bottom: `calc(${revenuePct}% + 20px)` }}
									>
										<div className='hd'>{m.label}</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot rev' /> Revenue
											</span>
											<span className='v'>{formatMoney(m.revenueReceived)}</span>
										</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot sal' /> Salary
											</span>
											<span className='v'>{formatMoney(m.salaryCost)}</span>
										</div>
										<div className='sep' />
										<div className='rw total'>
											<span className='k'>Margin</span>
											<span className={`v ${negative ? 'neg' : 'pos'}`}>
												{negative ? '−' : ''}
												{formatMoney(Math.abs(m.margin))}
												{m.marginPercent !== null && ` · ${m.marginPercent.toFixed(1)}%`}
											</span>
										</div>
										<span className='arrow' aria-hidden='true' />
									</HoverCard>
									<StackedBarCol>
										{negative ? (
											<div
												className='bar sal full'
												style={{ height: `${salaryPct}%` }}
											/>
										) : (
											<>
												<div
													className='bar sal'
													style={{ height: `${salaryPct}%` }}
												/>
												{marginSlice > 0 && (
													<div
														className='bar margin'
														style={{ height: `${marginSlice}%` }}
													/>
												)}
											</>
										)}
									</StackedBarCol>
									{hasAnyMoney && (
										<HoverZone
											style={{ height: `${revenuePct}%` }}
											onMouseEnter={() => setHover(i)}
											onMouseLeave={() => setHover(null)}
										/>
									)}
									<MonthLbl $current={false}>{m.label.slice(0, 3)}</MonthLbl>
								</MonthCol>
							)
						})}
					</Bars>
				</Plot>
			</ChartGrid>
			<ChartLegend>
				<span className='item'>
					<span className='dot sal' /> Salary (base)
				</span>
				<span className='item'>
					<span className='dot rev' /> Margin on top
				</span>
			</ChartLegend>
		</ChartWrap>
	)
}

/* Variant C — diverging axis: zero line in the middle. Revenue goes
 * up from zero (blue), salary goes down from zero (orange). The
 * visible net is instantly readable. Margin pill floats near zero. */
const MonthlyMarginDiverging = ({ data }: { data: PnlRow[] }) => {
	const [hover, setHover] = useState<number | null>(null)
	const hasAny = data.some((m) => m.revenueReceived > 0 || m.salaryCost > 0)
	if (!hasAny) {
		return (
			<EmptyState>
				<span className='ico'>
					<SearchOffRounded />
				</span>
				<span className='title'>No margin data yet</span>
				<span className='sub'>Numbers appear once both sides show up.</span>
			</EmptyState>
		)
	}
	const rawMax = Math.max(1, ...data.map((m) => Math.max(m.revenueReceived, m.salaryCost)))
	const max = niceCeil(rawMax)
	return (
		<ChartWrap>
			<DivergingGrid>
				<DivergingYAxis>
					<span>{formatMoneyCompact(max)}</span>
					<span>0</span>
					<span>−{formatMoneyCompact(max)}</span>
				</DivergingYAxis>
				<DivergingPlot>
					<ZeroLine />
					<Bars>
						{data.map((m, i) => {
							const revenuePct = (m.revenueReceived / max) * 50
							const salaryPct = (m.salaryCost / max) * 50
							const negative = m.margin < 0
							const hasAnyMoney = m.revenueReceived > 0 || m.salaryCost > 0
							const open = hasAnyMoney && hover === i
							const align: 'left' | 'center' | 'right' =
								i <= 1 ? 'left' : i >= data.length - 2 ? 'right' : 'center'
							return (
								<MonthCol key={m.monthId} $hover={hover === i}>
									<HoverCard
										data-open={open}
										data-align={align}
										aria-hidden={!open}
										style={{ bottom: `calc(50% + ${revenuePct}% + 14px)` }}
									>
										<div className='hd'>{m.label}</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot rev' /> Revenue
											</span>
											<span className='v'>{formatMoney(m.revenueReceived)}</span>
										</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot sal' /> Salary
											</span>
											<span className='v'>{formatMoney(m.salaryCost)}</span>
										</div>
										<div className='sep' />
										<div className='rw total'>
											<span className='k'>Margin</span>
											<span className={`v ${negative ? 'neg' : 'pos'}`}>
												{negative ? '−' : ''}
												{formatMoney(Math.abs(m.margin))}
												{m.marginPercent !== null && ` · ${m.marginPercent.toFixed(1)}%`}
											</span>
										</div>
										<span className='arrow' aria-hidden='true' />
									</HoverCard>
									<DivergingBars>
										<div
											className='bar rev'
											style={{ height: `${revenuePct}%` }}
										/>
										<div
											className='bar sal'
											style={{ height: `${salaryPct}%` }}
										/>
									</DivergingBars>
									{hasAnyMoney && (
										<HoverZone
											style={{ height: '100%' }}
											onMouseEnter={() => setHover(i)}
											onMouseLeave={() => setHover(null)}
										/>
									)}
									<DivergingMonthLbl>{m.label.slice(0, 3)}</DivergingMonthLbl>
								</MonthCol>
							)
						})}
					</Bars>
				</DivergingPlot>
			</DivergingGrid>
			<ChartLegend>
				<span className='item'>
					<span className='dot rev' /> Revenue (up)
				</span>
				<span className='item'>
					<span className='dot sal' /> Salary (down)
				</span>
			</ChartLegend>
		</ChartWrap>
	)
}

/* Monthly margin — premium horizontal row list.
 *
 * One row per fiscal month. Each row carries the month label plus
 * four numeric columns: Revenue, Salary, Margin, Margin %. The two
 * cash columns are backed by inline capsule bars scaled to the
 * highest absolute value in the year. Numbers use a display face
 * (Bricolage Grotesque with tabular lining figures), currency sign
 * and % stay neutral mid-weight so the digits are the hero. */
const MonthlyMarginRows = ({ data }: { data: PnlRow[] }) => {
	const hasAny = data.some((m) => m.revenueReceived > 0 || m.salaryCost > 0)
	if (!hasAny) {
		return (
			<EmptyState>
				<span className='ico'>
					<SearchOffRounded />
				</span>
				<span className='title'>No margin data yet</span>
				<span className='sub'>Numbers appear once both sides show up.</span>
			</EmptyState>
		)
	}
	const rawMax = Math.max(1, ...data.map((m) => Math.max(m.revenueReceived, m.salaryCost)))
	const max = niceCeil(rawMax)
	return (
		<RowList>
			<RowHead>
				<span className='mo'>Month</span>
				<span className='h'>Revenue</span>
				<span className='h'>Salary</span>
				<span className='h num-h'>Margin</span>
				<span className='h num-h'>Margin %</span>
			</RowHead>
			{data.map((m) => {
				const empty = m.revenueReceived === 0 && m.salaryCost === 0
				const negative = m.margin < 0
				const revPct = (m.revenueReceived / max) * 100
				const salPct = (m.salaryCost / max) * 100
				return (
					<RowItem key={m.monthId} $dim={empty}>
						<span className='mo'>{m.label}</span>
						<RowBarCell>
							<RowBarTrack>
								<AnimatedBar tone='rev' targetPct={revPct} />
							</RowBarTrack>
							<Money value={m.revenueReceived} dim={empty} />
						</RowBarCell>
						<RowBarCell>
							<RowBarTrack>
								<AnimatedBar tone='sal' targetPct={salPct} />
							</RowBarTrack>
							<Money value={m.salaryCost} dim={empty} />
						</RowBarCell>
						<span className='num'>
							{empty ? (
								<EmptyPill title='No data yet'>
									<span />
									<span />
									<span />
								</EmptyPill>
							) : (
								<MarginPill $negative={negative} $zero={m.margin === 0}>
									{m.margin !== 0 && (
										<span className='sgn'>{negative ? '−' : '+'}</span>
									)}
									<span className='cur'>$</span>
									<AnimatedMoneyDigits value={m.margin} />
								</MarginPill>
							)}
						</span>
						<span className='pct'>
							{m.marginPercent === null ? (
								<EmptyPill title='No data yet'>
									<span />
									<span />
									<span />
								</EmptyPill>
							) : (
								<MarginPercent $negative={negative} $zero={m.marginPercent === 0}>
									<AnimatedPercent value={m.marginPercent} />
									<span className='sgn'>%</span>
								</MarginPercent>
							)}
						</span>
					</RowItem>
				)
			})}
		</RowList>
	)
}

/* Shared money renderer — splits $ sign, digits and optional +/−
 * prefix into separate spans so the display face only lands on the
 * digits and tabular-nums alignment stays crisp. Digits animate from
 * zero on mount via useCountUp. */
const Money = ({
	value,
	dim,
	showSign = false,
}: {
	value: number
	dim: boolean
	showSign?: boolean
}) => {
	const abs = Math.abs(value)
	const animated = useCountUp(abs)
	const digits = formatMoneyCompact(animated).replace(/^\$/, '')
	const sign = showSign ? (value < 0 ? '−' : value > 0 ? '+' : '') : ''
	return (
		<span className='val'>
			{sign && <span className='sgn'>{sign}</span>}
			<span className='cur'>$</span>
			<span className='big' style={dim ? { color: '#cbd5e1' } : undefined}>
				{digits}
			</span>
		</span>
	)
}

/* Animated percent — count-up like Money. */
const AnimatedPercent = ({ value }: { value: number }) => {
	const animated = useCountUp(value)
	return <span className='big'>{animated.toFixed(1)}</span>
}

/* Just the digits portion of a money value, animated. Used when the
 * $ sign / +/− prefix are rendered separately by the parent (e.g.
 * inside MarginPill where the pill owns the sign and currency). */
const AnimatedMoneyDigits = ({ value }: { value: number }) => {
	const animated = useCountUp(Math.abs(value))
	return (
		<span className='big'>
			{formatMoneyCompact(animated).replace(/^\$/, '')}
		</span>
	)
}

/* Animated horizontal bar — mirrors the Time-off "Annual balances"
 * progress-bar pattern (track + fill + shimmer + cursor dot), with
 * every animation three times slower per owner request. Width grows
 * via a CSS transition triggered after mount so the browser's own
 * transition engine handles it smoothly. */
const AnimatedBar = ({
	tone,
	targetPct,
}: {
	tone: 'rev' | 'sal'
	targetPct: number
}) => {
	const [width, setWidth] = useState(0)
	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			setWidth(targetPct)
			return
		}
		const t = window.setTimeout(() => setWidth(targetPct), 60)
		return () => window.clearTimeout(t)
	}, [targetPct])
	return (
		<>
			<BarFill $tone={tone} style={{ width: `${width}%` }}>
				<BarShimmer />
			</BarFill>
			{width > 0 && <BarCursor $tone={tone} style={{ left: `${width}%` }} />}
		</>
	)
}

const MonthlyChart = ({
	data,
	average,
}: {
	data: {
		monthId: string
		label: string
		sequenceInYear: number
		received: number
		pipeline: number
		entriesReceived?: number
	}[]
	average: number
}) => {
	const [hover, setHover] = useState<number | null>(null)

	const rawMax = Math.max(1, ...data.map((m) => m.received + m.pipeline))
	const max = niceCeil(rawMax)
	const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)

	// Fallback: use today's calendar month as an approximation of the current
	// fiscal month index; fiscal months follow a 4-4-5 rotation so this is
	// off by a week at boundaries but readable.
	const today = new Date()
	const currentMonthIdx = Math.min(data.length - 1, Math.max(0, today.getMonth()))

	const avgPct = max > 0 ? (average / max) * 100 : 0

	return (
		<ChartWrap>
			<ChartGrid>
				<YAxis>
					{[...gridTicks].reverse().map((t, i) => (
						<span key={i}>{formatMoneyCompact(t)}</span>
					))}
				</YAxis>
				<Plot>
					{gridTicks.map((_, i) => (
						<GridLine key={i} style={{ bottom: `${(i / (gridTicks.length - 1)) * 100}%` }} />
					))}
					{average > 0 && (
						<AvgLine style={{ bottom: `${avgPct}%` }}>
							<span className='lbl'>Avg {formatMoneyCompact(average)}</span>
						</AvgLine>
					)}
					<Bars>
						{data.map((m, i) => {
							const receivedPct = (m.received / max) * 100
							const pipelinePct = (m.pipeline / max) * 100
							const isCurrent = i === currentMonthIdx
							const totalMoney = m.received + m.pipeline
							const align: 'left' | 'center' | 'right' =
								i <= 1 ? 'left' : i >= data.length - 2 ? 'right' : 'center'
							const open = totalMoney > 0 && hover === i
							const entries = m.entriesReceived ?? 0
							const filledPct = Math.min(100, receivedPct + pipelinePct)
							return (
								<MonthCol key={m.monthId} $hover={hover === i}>
									<HoverCard
										data-open={open}
										data-align={align}
										aria-hidden={!open}
										style={{ bottom: `calc(${filledPct}% + 24px)` }}
									>
										<div className='hd'>
											{m.label}
											{isCurrent && <span className='cur-pill'>Current</span>}
										</div>
										<div className='rw'>
											<span className='k'>
												<span className='dot rec' /> Received
											</span>
											<span className='v'>{formatMoney(m.received)}</span>
										</div>
										{m.pipeline > 0 && (
											<div className='rw'>
												<span className='k'>
													<span className='dot pip' /> Pipeline
												</span>
												<span className='v'>{formatMoney(m.pipeline)}</span>
											</div>
										)}
										<div className='sep' />
										<div className='rw total'>
											<span className='k'>Total</span>
											<span className='v'>{formatMoney(totalMoney)}</span>
										</div>
										{entries > 0 && (
											<div className='meta'>
												{entries} {entries === 1 ? 'payment' : 'payments'} received
											</div>
										)}
										<span className='arrow' aria-hidden='true' />
									</HoverCard>
									<BarStack>
										{pipelinePct > 0 && (
											<ChartPipeBar $current={isCurrent} style={{ height: `${pipelinePct}%` }} />
										)}
										{receivedPct > 0 && (
											<ReceivedBar $current={isCurrent} style={{ height: `${receivedPct}%` }} />
										)}
									</BarStack>
									{totalMoney > 0 && (
										<HoverZone
											style={{ height: `${filledPct}%` }}
											onMouseEnter={() => setHover(i)}
											onMouseLeave={() => setHover(null)}
										/>
									)}
									<MonthLbl $current={isCurrent}>{m.label.slice(0, 3)}</MonthLbl>
								</MonthCol>
							)
						})}
					</Bars>
				</Plot>
			</ChartGrid>
			<ChartLegend>
				<span className='item'>
					<span className='dot rec' /> Received
				</span>
				<span className='item'>
					<span className='dot pip' /> Pipeline
				</span>
				{average > 0 && (
					<span className='item'>
						<span className='avgline' /> Average · {formatMoneyCompact(average)}
					</span>
				)}
				<span className='item'>
					<span className='dot cur' /> Current month
				</span>
			</ChartLegend>
		</ChartWrap>
	)
}

const BreakRowMoney = ({ value }: { value: number }) => {
	const v = useCountUp(value, 900)
	return <span className='money'>{formatMoney(v)}</span>
}

const BreakBar = ({ target, rank }: { target: number; rank: number }) => (
	<BreakFill $rank={rank} style={{ width: `${target}%` }} />
)

const Breakdown = ({
	rows,
	emptyTitle,
	emptySub,
}: {
	rows: {
		key: string
		label: string
		sub: string | null
		received: number
		percent: number
		entriesReceived?: number
	}[]
	emptyTitle: string
	emptySub: string
}) => {
	if (rows.length === 0)
		return (
			<EmptyState>
				<span className='ico'>
					<SearchOffRounded />
				</span>
				<span className='title'>{emptyTitle}</span>
				<span className='sub'>{emptySub}</span>
			</EmptyState>
		)
	const topFew = rows.slice(0, 8)
	const rest = rows.slice(8)
	const restReceived = rest.reduce((s, r) => s + r.received, 0)
	const restPercent = rest.reduce((s, r) => s + r.percent, 0)
	const restEntries = rest.reduce((s, r) => s + (r.entriesReceived ?? 0), 0)
	const maxReceived = Math.max(1, ...topFew.map((r) => r.received))
	return (
		<BreakList>
			{topFew.map((r, i) => {
				const rank = i + 1
				const barWidth = (r.received / maxReceived) * 100
				const entries = r.entriesReceived ?? 0
				const subParts = [
					r.sub,
					entries > 0 ? `${entries} ${entries === 1 ? 'payment' : 'payments'}` : null,
				].filter(Boolean)
				return (
					<BreakRow key={r.key} $rank={rank}>
						<BreakBar target={barWidth} rank={rank} />
						<BreakContent>
							<Rank $rank={rank}>{rank}</Rank>
							<BreakLbl $rank={rank}>
								<span className='name'>{r.label}</span>
								{subParts.length > 0 && <span className='sub'>{subParts.join(' · ')}</span>}
							</BreakLbl>
							<BreakVal $rank={rank}>
								<BreakRowMoney value={r.received} />
								<span className='pct'>{r.percent.toFixed(1)}%</span>
							</BreakVal>
						</BreakContent>
					</BreakRow>
				)
			})}
			{rest.length > 0 && (
				<BreakRow className='others' $rank={0}>
					<BreakBar target={(restReceived / maxReceived) * 100} rank={0} />
					<BreakContent>
						<Rank $rank={0}>+{rest.length}</Rank>
						<BreakLbl $rank={0}>
							<span className='name'>Others</span>
							<span className='sub'>
								{rest.length} smaller {rest.length === 1 ? 'entry' : 'entries'}
								{restEntries > 0
									? ` · ${restEntries} ${restEntries === 1 ? 'payment' : 'payments'}`
									: ''}
							</span>
						</BreakLbl>
						<BreakVal $rank={0}>
							<BreakRowMoney value={restReceived} />
							<span className='pct'>{restPercent.toFixed(1)}%</span>
						</BreakVal>
					</BreakContent>
				</BreakRow>
			)}
		</BreakList>
	)
}

/* ═════════════ Styles ═════════════ */

const FiltersRow = styled.div`
	position: relative;
	display: flex;
	align-items: stretch;
	gap: 22px;
	flex-wrap: wrap;
	padding: 18px 22px;
	margin-bottom: 28px;
	background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(0, 0, 0, 0.20),
		0 22px 56px rgba(15, 23, 42, 0.40);
	color: #e2e8f0;
	overflow: hidden;
`

const FiltersLead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	padding-right: 22px;
	border-right: 1px solid rgba(15, 23, 42, 0.06);

	[data-theme='dark'] & {
		border-right-color: rgba(255, 255, 255, 0.08);
	}
`

const FiltersLeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
	color: #ffffff;
	box-shadow: 0 4px 12px rgba(3, 105, 161, 0.24);

	svg {
		font-size: 20px;
	}

	[data-theme='dark'] & {
		background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
		box-shadow: 0 4px 14px rgba(56, 189, 248, 0.36);
	}
`

const FiltersLeadText = styled.div`
	display: flex;
	flex-direction: column;
	line-height: 1.15;
	min-width: 96px;

	.top {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 15px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.3px;
	}
	.bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		color: #64748b;
		letter-spacing: 0.2px;
		margin-top: 2px;
		white-space: nowrap;
	}

	[data-theme='dark'] & .top {
		color: #ffffff;
	}
	[data-theme='dark'] & .bot {
		color: rgba(203, 213, 225, 0.72);
	}
`

const FiltersGroups = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 22px;
	flex-wrap: nowrap;
	flex: 1;
	min-width: 0;
	overflow-x: auto;
	overflow-y: visible;
	scrollbar-width: thin;

	@media (max-width: 720px) {
		flex-wrap: wrap;
		overflow-x: visible;
	}
`

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	flex-shrink: 0;
`

const GroupLbl = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: #0f172a;
	line-height: 1;

	[data-theme='dark'] & {
		color: #e2e8f0;
	}
`

const IconChip = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 6px;
	background: rgba(3, 105, 161, 0.10);
	color: #0369a1;

	svg {
		font-size: 13px;
	}

	[data-theme='dark'] & {
		background: rgba(56, 189, 248, 0.16);
		color: #7dd3fc;
	}
`

const Divider = styled.span`
	width: 1px;
	align-self: stretch;
	background: rgba(15, 23, 42, 0.08);
	margin: 4px 2px;

	[data-theme='dark'] & {
		background: rgba(255, 255, 255, 0.10);
	}
`

const ResetLink = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border: 1.5px solid rgba(15, 23, 42, 0.10);
	background: #ffffff;
	color: #64748b;
	cursor: pointer;
	border-radius: 999px;
	margin-left: 4px;
	transition:
		background 160ms ease,
		color 160ms ease,
		border-color 160ms ease,
		opacity 160ms ease,
		transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);

	&[data-active='true'] {
		background: rgba(217, 119, 6, 0.10);
		color: #9a3412;
		border-color: rgba(217, 119, 6, 0.24);
	}

	&:hover:not(:disabled) {
		background: rgba(217, 119, 6, 0.16);
		color: #7c2d12;
		border-color: rgba(217, 119, 6, 0.36);
		transform: rotate(-60deg);
	}

	&:disabled {
		opacity: 0.4;
		cursor: default;
	}

	[data-theme='dark'] & {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
		color: #94a3b8;
	}
	[data-theme='dark'] &[data-active='true'] {
		background: rgba(251, 191, 36, 0.16);
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.36);
	}
	[data-theme='dark'] &:hover:not(:disabled) {
		background: rgba(251, 191, 36, 0.24);
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.52);
	}
`

const PopBackdrop = styled.div<{ $open: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.32);
	backdrop-filter: blur(2px);
	z-index: 1100;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 90px 20px 40px;
	opacity: ${(p) => (p.$open ? 1 : 0)};
	pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
	transition: opacity 220ms ease;
`

const PopSheet = styled.div<{ $open: boolean }>`
	width: 100%;
	max-width: 460px;
	background: #ffffff;
	border-radius: 22px;
	box-shadow:
		0 4px 8px rgba(15, 23, 42, 0.04),
		0 24px 60px rgba(15, 23, 42, 0.2);
	overflow: hidden;
	transform: translateY(${(p) => (p.$open ? '0' : '-12px')}) scale(${(p) => (p.$open ? 1 : 0.98)});
	transition: transform 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
`

const PopHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 22px 24px 16px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.4px;
		color: #0f172a;
	}
	p {
		margin: 4px 0 0;
		font-size: 12.5px;
		color: #64748b;
		max-width: 44ch;
	}
`

const PopClose = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 0;
	background: transparent;
	color: #64748b;
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease;

	svg {
		font-size: 20px;
	}

	&:hover {
		background: rgba(15, 23, 42, 0.06);
		color: #0f172a;
	}
`

const PopBody = styled.div`
	padding: 20px 24px 4px;
	display: flex;
	flex-direction: column;
	gap: 18px;
`

const PopGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const PopLbl = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: #0f172a;
`

const PopFoot = styled.footer`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 18px 24px 20px;
	border-top: 1px solid rgba(15, 23, 42, 0.08);
	margin-top: 8px;

	button {
		border: 0;
		padding: 10px 18px;
		border-radius: 999px;
		font: inherit;
		font-weight: 700;
		font-size: 12.5px;
		letter-spacing: 0.2px;
		cursor: pointer;
		transition: background 160ms ease, color 160ms ease, opacity 160ms ease;
	}
	button.reset {
		background: transparent;
		color: #64748b;
	}
	button.reset:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.06);
		color: #0f172a;
	}
	button.reset:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	button.apply {
		background: #0369a1;
		color: #ffffff;
		min-width: 120px;
		box-shadow: 0 2px 6px rgba(3, 105, 161, 0.24);
	}
	button.apply:hover {
		background: #0284c7;
	}
`

const SelectPill = styled.label<{ $active?: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px 8px 12px;
	border-radius: 999px;
	border: 1.5px solid
		${(p) => (p.$active ? '#0369a1' : 'rgba(15, 23, 42, 0.10)')};
	background: ${(p) => (p.$active ? 'rgba(3, 105, 161, 0.08)' : '#ffffff')};
	color: ${(p) => (p.$active ? '#0369a1' : '#252d3a')};
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition:
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 200ms ease,
		background 200ms ease,
		color 200ms ease;
	&:hover {
		transform: translateY(-1px);
		border-color: ${(p) => (p.$active ? '#0284c7' : 'rgba(15, 23, 42, 0.18)')};
	}

	[data-theme='dark'] & {
		background: ${(p) => (p.$active ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.06)')};
		border-color: ${(p) => (p.$active ? '#38bdf8' : 'rgba(255, 255, 255, 0.10)')};
		color: ${(p) => (p.$active ? '#7dd3fc' : '#e2e8f0')};
	}
	[data-theme='dark'] &:hover {
		border-color: ${(p) => (p.$active ? '#7dd3fc' : 'rgba(255, 255, 255, 0.24)')};
	}
`
const SelectText = styled.span`
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const SelectChev = styled.span`
	display: inline-flex;
	align-items: center;
	color: #a5a1b0;
`
const NativeSelect = styled.select`
	position: absolute;
	inset: 0;
	opacity: 0;
	cursor: pointer;
	border: none;
	outline: none;
	appearance: none;
	background: transparent;
`

const Snapshot = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`

const SnapshotWide = styled.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 1100px) {
		grid-template-columns: repeat(4, 1fr);
	}
	@media (max-width: 720px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
`

const Stat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 20px 22px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 18px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
`
const StatLbl = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: #64748b;
`
const StatVal = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 26px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.5px;
	line-height: 1;

	&.primary {
		color: #0369a1;
	}
`
const StatHint = styled.span`
	font-size: 12px;
	color: #94a3b8;
`
const DeltaRow = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 24px;
	font-weight: 700;
	line-height: 1;

	.up { color: #16a34a; }
	.down { color: #c94b4b; }
	.muted { color: #94a3b8; font-weight: 500; }
	svg { font-size: 22px; }
`

const Panel = styled.section`
	margin-top: 22px;
	padding: 20px 22px 22px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 18px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
`
const PanelHead = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 14px;
	flex-wrap: wrap;
`
const PanelTitle = styled.h3`
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-weight: 700;
	font-size: 18px;
	letter-spacing: -0.3px;
	color: #0f172a;
`
const PanelSub = styled.p`
	margin: 4px 0 0;
	color: #64748b;
	font-size: 12.5px;
	line-height: 1.5;
`
const AvgTag = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font-size: 12px;
	font-weight: 600;

	strong {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 700;
	}
`

const TwoCol = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	margin-top: 22px;

	${Panel} {
		margin-top: 0;
	}

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

const ChartWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
`

const ChartGrid = styled.div`
	display: grid;
	grid-template-columns: 46px 1fr;
	gap: 10px;
	width: 100%;
`

const YAxis = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 8px 0 26px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10.5px;
	color: #94a3b8;
	text-align: right;
	line-height: 1;
`

const Plot = styled.div`
	position: relative;
	height: 220px;
	padding-bottom: 26px;
`

const GridLine = styled.span`
	position: absolute;
	left: 0;
	right: 0;
	height: 1px;
	background: rgba(15, 23, 42, 0.06);
	pointer-events: none;
`

const AvgLine = styled.span`
	position: absolute;
	left: 0;
	right: 0;
	height: 0;
	border-top: 1.5px dashed rgba(217, 119, 6, 0.55);
	pointer-events: none;
	z-index: 2;

	.lbl {
		position: absolute;
		right: 0;
		bottom: 6px;
		padding: 4px 12px;
		background: rgba(217, 119, 6, 0.14);
		color: #9a3412;
		border-radius: 999px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		font-weight: 700;
		white-space: nowrap;
	}
`

const Bars = styled.div`
	position: absolute;
	inset: 0 0 26px 0;
	display: flex;
	align-items: flex-end;
	gap: 8px;
`

const MonthCol = styled.div<{ $hover: boolean }>`
	position: relative;
	flex: 1;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	cursor: default;

	${(p) =>
		p.$hover &&
		`
		z-index: 3;
	`}
`

const BarStack = styled.div`
	position: relative;
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	min-height: 0;
`

const ReceivedBar = styled.div<{ $current: boolean }>`
	background: ${(p) => (p.$current ? '#d97706' : '#0284c7')};
	border-radius: 4px 4px 0 0;
	transition: filter 160ms ease, background 160ms ease;

	${MonthCol}:hover & {
		filter: brightness(1.08);
	}
`

const ChartPipeBar = styled.div<{ $current: boolean }>`
	background: ${(p) =>
		p.$current ? 'rgba(217, 119, 6, 0.32)' : 'rgba(3, 105, 161, 0.18)'};
	border-radius: 4px 4px 0 0;
	transition: filter 160ms ease;

	${MonthCol}:hover & {
		filter: brightness(1.08);
	}
`

const HoverZone = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 3;
	cursor: pointer;
`

const CurrentMark = styled.span`
	position: absolute;
	bottom: -8px;
	left: 50%;
	transform: translateX(-50%);
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #0369a1;
	box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.18);
`

const MonthLbl = styled.span<{ $current: boolean }>`
	position: absolute;
	bottom: -22px;
	left: 0;
	right: 0;
	text-align: center;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 11px;
	font-weight: ${(p) => (p.$current ? 700 : 600)};
	color: ${(p) => (p.$current ? '#9a3412' : '#64748b')};
	letter-spacing: 0.4px;
	text-transform: uppercase;
	line-height: 1;
`

const HoverCard = styled.div`
	position: absolute;
	min-width: 196px;
	padding: 12px 14px 10px;
	background: #ffffff;
	border-radius: 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 14px 40px rgba(15, 23, 42, 0.20);
	z-index: 5;
	pointer-events: none;

	opacity: 0;
	visibility: hidden;
	transition:
		opacity 220ms ease,
		transform 280ms cubic-bezier(0.22, 1.35, 0.36, 1),
		visibility 0s linear 280ms;

	/* alignment via data-attr */
	&[data-align='center'] {
		left: 50%;
		transform: translateX(-50%) translateY(6px) scale(0.96);
		transform-origin: bottom center;
	}
	&[data-align='left'] {
		left: -8px;
		transform: translateY(6px) scale(0.96);
		transform-origin: bottom left;
	}
	&[data-align='right'] {
		right: -8px;
		transform: translateY(6px) scale(0.96);
		transform-origin: bottom right;
	}

	&[data-open='true'] {
		opacity: 1;
		visibility: visible;
		transition:
			opacity 220ms ease,
			transform 280ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}
	&[data-align='center'][data-open='true'] {
		transform: translateX(-50%) translateY(0) scale(1);
	}
	&[data-align='left'][data-open='true'],
	&[data-align='right'][data-open='true'] {
		transform: translateY(0) scale(1);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: opacity 120ms ease, visibility 0s linear 120ms;
		&[data-align='center'] { transform: translateX(-50%); }
		&[data-align='left'], &[data-align='right'] { transform: none; }
	}

	.hd {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 700;
		font-size: 14px;
		color: #0f172a;
		margin-bottom: 10px;
		letter-spacing: -0.3px;
	}
	.cur-pill {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(217, 119, 6, 0.14);
		color: #9a3412;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.4px;
		text-transform: uppercase;
	}
	.rw {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12.5px;
		color: #475569;
		margin-top: 6px;
	}
	.rw .k {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.rw .v {
		margin-left: auto;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 13px;
		color: #0f172a;
		letter-spacing: -0.2px;
	}
	.rw.total .k {
		font-weight: 700;
		color: #0f172a;
	}
	.rw.total .v {
		color: #0369a1;
		font-size: 14.5px;
	}
	.sep {
		height: 1px;
		background: rgba(15, 23, 42, 0.06);
		margin: 8px 0 0;
	}
	.meta {
		margin-top: 8px;
		font-size: 11px;
		color: #94a3b8;
		letter-spacing: 0.2px;
	}
	.dot {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.dot.rec {
		background: #0284c7;
	}
	.dot.pip {
		background: rgba(3, 105, 161, 0.30);
	}
	.dot.rev {
		background: #0284c7;
	}
	.dot.sal {
		background: #d97706;
	}
	.dot.mar {
		background: #0f172a;
	}
	.v.pos {
		color: #0284c7;
	}
	.v.neg {
		color: #d97706;
	}
	.arrow {
		position: absolute;
		bottom: -6px;
		width: 12px;
		height: 12px;
		background: #ffffff;
		transform: rotate(45deg);
		box-shadow: 3px 3px 6px rgba(15, 23, 42, 0.05);
	}
	&[data-align='center'] .arrow {
		left: 50%;
		margin-left: -6px;
	}
	&[data-align='left'] .arrow {
		left: 20px;
	}
	&[data-align='right'] .arrow {
		right: 20px;
	}
`

const ChartLegend = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 16px;
	padding-left: 56px;

	.item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
		color: #64748b;
	}
	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}
	.dot.rec {
		background: #0284c7;
	}
	.dot.pip {
		background: rgba(3, 105, 161, 0.30);
	}
	.dot.rev {
		background: #0284c7;
	}
	.dot.sal {
		background: #d97706;
	}
	.dot.mar {
		background: #0f172a;
	}
	.dot.cur {
		background: #d97706;
	}
	.avgline {
		display: inline-block;
		width: 18px;
		height: 0;
		border-top: 1.5px dashed rgba(217, 119, 6, 0.55);
	}
`

const BreakList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const BreakFill = styled.div<{ $rank: number }>`
	position: absolute;
	inset: 0 auto 0 0;
	border-radius: 14px;
	pointer-events: none;
	background: ${(p) => {
		if (p.$rank === 1)
			return 'linear-gradient(90deg, rgba(3, 105, 161, 0.24) 0%, rgba(3, 105, 161, 0.06) 100%)'
		if (p.$rank === 2 || p.$rank === 3)
			return 'linear-gradient(90deg, rgba(3, 105, 161, 0.16) 0%, rgba(3, 105, 161, 0.05) 100%)'
		if (p.$rank === 0)
			return 'linear-gradient(90deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.02) 100%)'
		return 'linear-gradient(90deg, rgba(3, 105, 161, 0.10) 0%, rgba(3, 105, 161, 0.03) 100%)'
	}};
`

const BreakContent = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	align-items: center;
	gap: 14px;
	padding: 12px 16px;
`

const BreakRow = styled.div<{ $rank: number }>`
	position: relative;
	border-radius: 14px;
	overflow: hidden;

	&.others {
		opacity: 0.85;
	}
`

const Rank = styled.span<{ $rank: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: ${(p) => (p.$rank === 1 ? 30 : 26)}px;
	height: ${(p) => (p.$rank === 1 ? 30 : 26)}px;
	padding: 0 8px;
	border-radius: 999px;
	border: 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-weight: 700;
	letter-spacing: -0.2px;

	${(p) =>
		p.$rank === 1 &&
		`
		background: linear-gradient(135deg, #0284c7, #0369a1);
		color: #ffffff;
		font-size: 13px;
		box-shadow:
			0 2px 8px rgba(3, 105, 161, 0.36),
			inset 0 1px 0 rgba(255, 255, 255, 0.30);
	`}
	${(p) =>
		(p.$rank === 2 || p.$rank === 3) &&
		`
		background: rgba(3, 105, 161, 0.14);
		color: #0369a1;
		font-size: 12px;
	`}
	${(p) =>
		p.$rank > 3 &&
		`
		background: rgba(15, 23, 42, 0.05);
		color: #64748b;
		font-size: 12px;
	`}
	${(p) =>
		p.$rank === 0 &&
		`
		background: rgba(15, 23, 42, 0.05);
		color: #94a3b8;
		font-size: 12px;
	`}
`

const BreakLbl = styled.div<{ $rank: number }>`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	.name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: ${(p) => (p.$rank === 1 ? 16 : 14.5)}px;
		font-weight: ${(p) => (p.$rank === 1 ? 700 : 600)};
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		letter-spacing: -0.3px;
		line-height: 1.15;
	}
	.sub {
		font-size: 11.5px;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`

const BreakVal = styled.div<{ $rank: number }>`
	display: inline-flex;
	align-items: baseline;
	gap: 10px;
	justify-content: flex-end;

	.money {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: ${(p) => (p.$rank === 1 ? 17 : 15)}px;
		font-weight: 700;
		color: ${(p) => (p.$rank === 1 ? '#0369a1' : '#0f172a')};
		letter-spacing: -0.3px;
	}
	.pct {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11.5px;
		font-weight: 700;
		color: ${(p) => (p.$rank === 0 ? '#94a3b8' : '#0369a1')};
		background: ${(p) => (p.$rank === 0 ? 'rgba(15, 23, 42, 0.06)' : 'rgba(3, 105, 161, 0.12)')};
		padding: 3px 8px;
		border-radius: 999px;
		min-width: 54px;
		text-align: center;
	}
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 40px 28px;
	text-align: center;

	.ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 999px;
		background: rgba(3, 105, 161, 0.10);
		color: #0369a1;
		margin-bottom: 6px;
	}
	.ico svg {
		font-size: 26px;
	}

	.title {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 15px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.3px;
	}
	.sub {
		max-width: 44ch;
		font-size: 12.5px;
		color: #64748b;
		line-height: 1.5;
	}
`

const VariantPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	margin-left: 8px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	color: #64748b;
	background: #f1f5f9;
	border-radius: 6px;
	vertical-align: middle;
`

/* ─── Variant B — Stacked overlay ─── */
const StackedBarCol = styled.div`
	position: absolute;
	left: 50%;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column-reverse;
	width: 60%;
	height: 100%;
	pointer-events: none;

	.bar {
		width: 100%;
		border-radius: 0;
	}
	.bar.sal {
		background: #d97706;
	}
	.bar.sal.full {
		border-radius: 4px 4px 0 0;
	}
	.bar.margin {
		background: #0284c7;
		border-radius: 4px 4px 0 0;
	}
`

/* ─── Variant C — Diverging axis ─── */
const DivergingGrid = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: 56px 1fr;
	gap: 8px;
	height: 320px;
	padding: 8px 0 4px;
`
const DivergingYAxis = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-end;
	padding-right: 8px;
	font-size: 10px;
	font-variant-numeric: tabular-nums;
	color: #94a3b8;
	border-right: 1px solid rgba(15, 23, 42, 0.06);
`
const DivergingPlot = styled.div`
	position: relative;
	height: 100%;
`
const ZeroLine = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	top: 50%;
	height: 1px;
	background: rgba(15, 23, 42, 0.14);
	z-index: 1;
`
const DivergingBars = styled.div`
	position: absolute;
	left: 50%;
	top: 0;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 60%;
	pointer-events: none;

	.bar {
		width: 100%;
	}
	.bar.rev {
		background: #0284c7;
		border-radius: 4px 4px 0 0;
	}
	.bar.sal {
		background: #d97706;
		border-radius: 0 0 4px 4px;
	}
`
const DivergingMonthLbl = styled.span`
	position: absolute;
	left: 0;
	right: 0;
	bottom: -22px;
	text-align: center;
	font-size: 11px;
	font-weight: 600;
	color: #64748b;
`

/* Three faint dots in a soft pill — reads as "waiting on data" rather
 * than a loud em-dash. Dots pulse gently so the user clocks the state
 * as pending rather than broken. */
const emptyPulse = keyframes`
	0%, 100% { opacity: 0.35; }
	50%      { opacity: 0.75; }
`
const EmptyPill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 7px 10px;
	border-radius: 8px;
	background: rgba(15, 23, 42, 0.035);

	> span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #94a3b8;
		animation: ${emptyPulse} 1.6s ease-in-out infinite;
	}
	> span:nth-child(2) {
		animation-delay: 0.2s;
	}
	> span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@media (prefers-reduced-motion: reduce) {
		> span {
			animation: none;
			opacity: 0.55;
		}
	}
`

/* Margin $ as a soft tinted pill — deep-blue for positive, copper for
 * negative. Digits are the hero (24px, deep tone), sign and $ stay
 * neutral mid-weight inside the pill. */
const MarginPill = styled.span<{ $negative: boolean; $zero: boolean }>`
	display: inline-flex;
	align-items: baseline;
	gap: 1px;
	padding: 4px 9px;
	border-radius: 8px;
	background: ${(p) =>
		p.$zero
			? 'transparent'
			: p.$negative
				? 'rgba(154, 52, 18, 0.13)'
				: 'rgba(12, 74, 110, 0.11)'};

	/* Double && boosts specificity above RowItem's own .sgn/.cur/.big
	 * rules so the colored hero styling wins. */
	&& .sgn,
	&& .cur {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		color: ${(p) => (p.$negative ? '#9a3412' : '#0c4a6e')};
		opacity: 0.75;
	}
	&& .big {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-variant-numeric: tabular-nums lining-nums;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.2px;
		color: ${(p) => (p.$negative ? '#9a3412' : '#0c4a6e')};
		margin-left: 1px;
	}
`

/* Margin % — same colored tone as the pill but without a background,
 * so the two hero cells read as paired without duplicating the chip. */
const MarginPercent = styled.span<{ $negative: boolean; $zero: boolean }>`
	display: inline-flex;
	align-items: baseline;
	gap: 1px;

	&& .big {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-variant-numeric: tabular-nums lining-nums;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.2px;
		color: ${(p) =>
			p.$zero ? '#94a3b8' : p.$negative ? '#9a3412' : '#0c4a6e'};
	}
	&& .sgn {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		color: ${(p) =>
			p.$zero ? '#94a3b8' : p.$negative ? '#9a3412' : '#0c4a6e'};
		opacity: 0.75;
		margin-left: 1px;
	}
`

/* ─── Monthly margin — premium rows ─── */
const RowList = styled.div`
	display: flex;
	flex-direction: column;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.03),
		0 24px 48px -32px rgba(15, 23, 42, 0.14);
	overflow: hidden;
`

const RowHead = styled.div`
	display: grid;
	grid-template-columns: 0.9fr 2fr 2fr 1fr 0.7fr;
	gap: 20px;
	align-items: center;
	padding: 14px 24px;
	background: linear-gradient(180deg, #fafbfc 0%, #f6f8fa 100%);
	border-bottom: 1px solid rgba(15, 23, 42, 0.05);
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.9px;
	text-transform: uppercase;
	color: #94a3b8;

	.mo,
	.h {
		display: inline-block;
	}
	.num-h {
		text-align: right;
	}
`

const RowItem = styled.div<{ $dim: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 0.9fr 2fr 2fr 1fr 0.7fr;
	gap: 20px;
	align-items: center;
	padding: 18px 24px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	font-family:
		'Bricolage Grotesque', 'Inter', ui-sans-serif, system-ui, sans-serif;
	font-variant-numeric: tabular-nums lining-nums;
	font-feature-settings: 'tnum' 1, 'lnum' 1, 'ss01' 1;
	color: ${(p) => (p.$dim ? '#cbd5e1' : '#0f172a')};
	transition:
		background 180ms ease,
		box-shadow 180ms ease;

	&:last-child {
		border-bottom: none;
	}
	&:hover {
		background: #fafbfc;
		box-shadow: inset 3px 0 0 rgba(15, 23, 42, 0.12);
	}

	/* Vertical column separators — subtle hairlines between cells. */
	> *:not(:first-child) {
		position: relative;
		&::before {
			content: '';
			position: absolute;
			left: -10px;
			top: 50%;
			transform: translateY(-50%);
			width: 1px;
			height: 32px;
			background: rgba(15, 23, 42, 0.04);
		}
	}

	.mo {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: -0.1px;
		color: ${(p) => (p.$dim ? '#94a3b8' : '#334155')};
	}

	.num,
	.pct {
		display: inline-flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: 1px;
	}
	.num {
		text-align: right;
	}
	.pct {
		text-align: right;
	}

	/* Sign colors: deep & muted, not primary pure. */
	.pos .sgn,
	.pos .cur {
		color: #0c4a6e;
	}
	.neg .sgn,
	.neg .cur {
		color: #9a3412;
	}

	.sgn {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-size: 11.5px;
		font-weight: 500;
		color: #94a3b8;
		margin-right: 1px;
	}
	.cur {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-size: 11.5px;
		font-weight: 500;
		color: #94a3b8;
	}
	.big {
		font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-variant-numeric: tabular-nums lining-nums;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.2px;
		color: ${(p) => (p.$dim ? '#cbd5e1' : '#0f172a')};
		margin-left: 1px;
	}
	.dash {
		font-size: 14px;
		font-weight: 400;
		color: #e2e8f0;
	}
`

const RowBarCell = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;

	.val {
		flex-shrink: 0;
		display: inline-flex;
		align-items: baseline;
		gap: 1px;
	}
`

/* Progress-bar family — mirrors the Time-off "Annual balances" look:
 * flat track, solid fill with an inner shimmer sweep, a small cursor
 * dot anchored at the fill's end. All animations run 3× slower than
 * the time-off version per owner request. */
const barToneFill = (tone: 'rev' | 'sal') =>
	tone === 'rev' ? '#0369a1' : '#c2410c'
const barToneRing = (tone: 'rev' | 'sal') =>
	tone === 'rev' ? 'rgba(3, 105, 161, 0.35)' : 'rgba(194, 65, 12, 0.35)'

const RowBarTrack = styled.div`
	position: relative;
	flex: 1;
	min-width: 0;
	height: 6px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.06);
	overflow: visible;
`

const BarFill = styled.div<{ $tone: 'rev' | 'sal' }>`
	position: relative;
	height: 100%;
	background: ${(p) => barToneFill(p.$tone)};
	border-radius: 999px;
	overflow: hidden;
	transition: width 1440ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: width;
`

const barShimmerKF = keyframes`
	0%   { transform: translateX(-120%); }
	100% { transform: translateX(220%); }
`

const BarShimmer = styled.span`
	position: absolute;
	top: 0;
	left: 0;
	width: 60%;
	height: 100%;
	background: linear-gradient(
		90deg,
		transparent 0%,
		rgba(255, 255, 255, 0.55) 50%,
		transparent 100%
	);
	animation: ${barShimmerKF} 5.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`

const barCursorPulseKF = keyframes`
	0%, 100% {
		box-shadow: 0 0 0 0 var(--ring);
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		box-shadow: 0 0 0 5px transparent;
		transform: translate(-50%, -50%) scale(1.2);
	}
`

const BarCursor = styled.span<{ $tone: 'rev' | 'sal' }>`
	position: absolute;
	top: 50%;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${(p) => barToneFill(p.$tone)};
	border: 2px solid #ffffff;
	--ring: ${(p) => barToneRing(p.$tone)};
	transform: translate(-50%, -50%);
	transition: left 1440ms cubic-bezier(0.22, 1, 0.36, 1);
	animation: ${barCursorPulseKF} 5.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const MarginDualBar = styled.div`
	position: absolute;
	left: 50%;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 4px;
	width: 72%;
	height: 100%;
	pointer-events: none;

	.bar {
		width: 50%;
		border-radius: 6px 6px 0 0;
		transition:
			background 160ms ease,
			box-shadow 160ms ease;
	}
	.bar.rev {
		background: #0284c7;
		border-radius: 4px 4px 0 0;
	}
	.bar.sal {
		background: #d97706;
		border-radius: 4px 4px 0 0;
	}
`

const MarginTag = styled.span<{ $negative: boolean }>`
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	display: inline-flex;
	align-items: baseline;
	gap: 5px;
	padding: 3px 8px;
	font-size: 11px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.1px;
	border-radius: 6px;
	white-space: nowrap;
	pointer-events: none;
	color: ${(p) => (p.$negative ? '#d97706' : '#0284c7')};
	background: ${(p) =>
		p.$negative ? 'rgba(217, 119, 6, 0.10)' : 'rgba(3, 105, 161, 0.10)'};

	.amt {
		font-weight: 700;
	}
	.pct {
		font-size: 10px;
		font-weight: 600;
		opacity: 0.75;
	}
`

const RiskBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 5px 12px;
	background: rgba(217, 119, 6, 0.14);
	color: #9a3412;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
`

const ConcentrationFoot = styled.div`
	margin-top: 14px;
	padding-top: 14px;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
	font-size: 12.5px;
	color: #64748b;

	b {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: #0f172a;
	}
`

const PipelineWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`

const PipelineBar = styled.div`
	position: relative;
	display: flex;
	width: 100%;
	height: 44px;
	border-radius: 14px;
	overflow: hidden;
	background: rgba(15, 23, 42, 0.04);
	box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
`

const PipelineSeg = styled.div<{ $color: string; $flex: number }>`
	position: relative;
	flex-grow: ${(p) => p.$flex};
	flex-basis: 0;
	background: ${(p) => p.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		flex-grow 600ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 160ms ease;
	overflow: hidden;
	white-space: nowrap;

	& + & {
		border-left: 1px solid rgba(255, 255, 255, 0.35);
	}

	.pct {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 15px;
		color: #ffffff;
		letter-spacing: -0.2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
	}

	&:hover {
		filter: brightness(1.06);
	}
`

const PipelineList = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px 20px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const PipelineItem = styled.div<{ $color: string }>`
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	align-items: baseline;
	gap: 12px;
	padding: 10px 4px;

	.dot {
		align-self: center;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: ${(p) => p.$color};
		box-shadow:
			0 0 0 3px color-mix(in srgb, ${(p) => p.$color} 22%, transparent),
			inset 0 0 0 1.5px rgba(255, 255, 255, 0.45);
	}
	.lbl {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 13.5px;
		font-weight: 600;
		color: #0f172a;
		letter-spacing: -0.2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		display: block;
		font-size: 11.5px;
		color: #64748b;
		margin-top: 2px;
	}
	.val {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}
	.val .money {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 19px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.3px;
	}
	.val .pct {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 13.5px;
		font-weight: 700;
		color: ${(p) => p.$color};
	}
`

const YearStat = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 16px 14px 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 18px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
	overflow: hidden;
	min-width: 0;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 130px;
		height: 130px;
		background: radial-gradient(circle at top right, rgba(3, 105, 161, 0.08), transparent 65%);
		pointer-events: none;
	}

	&.amber::before {
		background: radial-gradient(circle at top right, rgba(217, 119, 6, 0.10), transparent 65%);
	}

	&.hero {
		background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
		border-color: transparent;
		box-shadow: 0 6px 22px rgba(3, 105, 161, 0.28);
	}
	&.hero::before {
		background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 65%);
	}
	> span:nth-of-type(2) {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding-right: 44px;
	}
	> span:nth-of-type(3) {
		font-size: 22px;
		line-height: 1;
	}

	&.hero > span:nth-of-type(2) {
		color: rgba(255, 255, 255, 0.88);
	}
	&.hero > span:nth-of-type(3) {
		color: #ffffff !important;
	}
	&.hero > span:nth-of-type(4) {
		color: rgba(255, 255, 255, 0.78);
	}
`

const IconTile = styled.span`
	position: absolute;
	top: 12px;
	right: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	background: rgba(3, 105, 161, 0.10);
	color: #0369a1;

	svg {
		font-size: 18px;
	}

	&.amber {
		background: rgba(217, 119, 6, 0.12);
		color: #9a3412;
	}

	${YearStat}.hero & {
		background: rgba(255, 255, 255, 0.18);
		color: #ffffff;
	}
`

const DeltaPill = styled.span<{ $up: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	padding: 2px 7px;
	border-radius: 999px;
	background: ${(p) =>
		p.$up ? 'rgba(22, 163, 74, 0.14)' : 'rgba(217, 119, 6, 0.14)'};
	color: ${(p) => (p.$up ? '#15803d' : '#9a3412')};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: none;
	line-height: 1;
`

const YearSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 18px;
	margin-top: 20px;
	margin-bottom: 20px;
	padding-top: 26px;
	padding-bottom: 8px;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
`

const YearHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
`

const YearTitle = styled.h3`
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-variation-settings: 'opsz' 40;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.5px;
	color: #0f172a;
	line-height: 1.1;

	.sep {
		color: #94a3b8;
		font-weight: 500;
		margin: 0 2px;
	}
	.yr {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: #0369a1;
		font-weight: 700;
	}
`

const YearSub = styled.p`
	margin: 5px 0 0;
	font-size: 13px;
	color: #64748b;
	line-height: 1.5;
	max-width: 56ch;
`

const LoadingRibbon = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	padding: 8px 16px;
	background: rgba(3, 105, 161, 0.12);
	color: #0369a1;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	pointer-events: none;
	z-index: 40;
`
