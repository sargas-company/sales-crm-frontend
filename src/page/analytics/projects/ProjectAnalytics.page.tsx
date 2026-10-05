import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { ThemeProvider, keyframes } from 'styled-components'
import {
	FolderOutlined,
	AssessmentOutlined,
	PauseCircleOutlined,
	Inventory2Outlined,
	AccessTimeRounded,
	PeopleAltOutlined,
	GroupsOutlined,
	FilterAltOutlined,
	CalendarMonthOutlined,
	DateRangeOutlined,
	TuneRounded,
	RestartAltRounded,
	ExpandMoreRounded,
	ExpandLessRounded,
	InsertChartOutlinedRounded,
} from '@mui/icons-material'
import useTheme from '../../../theme/useTheme'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { AnimatedSegmented } from '../../../components/_shared/AnimatedSegmented'
import DatePickerPill from '../../finance-weekly/DatePickerPill'
import {
	Crumbs,
	PageHead,
	ShellCard,
	ShellInner,
	ViewFade,
} from '../salesAnalytics.styled'
import {
	useGetProjectAnalyticsOverviewQuery,
	type Aggregation,
	type ProjectStatus,
	type ProjectAnalyticsWorkloadRow,
} from '../../../store/project-analytics/projectAnalyticsApi'

/* ── inline utilities (shared later if we extract) ──────────────────── */
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
const CountInt = ({ value }: { value: number }) => {
	const v = useCountUp(value)
	return <>{Math.round(v).toLocaleString('en-US')}</>
}

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
	planned: { label: 'Planned', color: '#0369a1', bg: 'rgba(3, 105, 161, 0.14)' },
	active: { label: 'Active', color: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },
	paused: { label: 'Paused', color: '#b45309', bg: 'rgba(217, 119, 6, 0.15)' },
	completed: { label: 'Completed', color: '#475569', bg: 'rgba(100, 116, 139, 0.15)' },
	archived: { label: 'Archived', color: '#9d174d', bg: 'rgba(217, 34, 113, 0.12)' },
}

const CHART_COLORS = [
	'#0369a1',
	'#d97706',
	'#059669',
	'#7c3aed',
	'#dc2626',
	'#0d9488',
	'#b45309',
	'#4338ca',
	'#c026d3',
	'#0f766e',
]

const isoDay = (d: Date): string => d.toISOString().slice(0, 10)
const defaultFrom = (): string => {
	const d = new Date()
	d.setUTCFullYear(d.getUTCFullYear() - 1)
	return isoDay(d)
}

const ProjectAnalytics = () => {
	const navigate = useNavigate()
	const {
		theme: { mode, primaryColor },
	} = useTheme()
	const [from, setFrom] = useState(defaultFrom())
	const [to, setTo] = useState(isoDay(new Date()))
	const [aggregation, setAggregation] = useState<Aggregation>('week')
	const [projectFilter, setProjectFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
	const [workloadSort, setWorkloadSort] = useState<{
		key: 'hours' | 'reports' | 'reportAuthors' | 'lastReport'
		dir: 'asc' | 'desc'
	}>({ key: 'hours', dir: 'desc' })
	const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set())
	const [reportsHover, setReportsHover] = useState<number | null>(null)
	type WorkloadDisplayItem = {
		row: ProjectAnalyticsWorkloadRow
		exiting?: boolean
	}
	const [workloadDisplay, setWorkloadDisplay] = useState<WorkloadDisplayItem[]>(
		[],
	)
	const [workloadExpanded, setWorkloadExpanded] = useState(false)
	const WORKLOAD_TOP_N = 10

	const { data, isLoading } = useGetProjectAnalyticsOverviewQuery({
		from: from ? new Date(from).toISOString() : undefined,
		to: to ? new Date(to).toISOString() : undefined,
		aggregation,
		projectId: projectFilter || undefined,
		status: statusFilter || undefined,
	})

	// Project → color map (uses hoursSeries.projects for stable palette).
	const projectColor = useMemo(() => {
		const map = new Map<string, string>()
		;(data?.hoursSeries.projects ?? []).forEach((p, i) => {
			map.set(p.id, CHART_COLORS[i % CHART_COLORS.length])
		})
		return map
	}, [data])

	const visibleProjects = useMemo(
		() =>
			(data?.hoursSeries.projects ?? []).filter((p) => !hiddenProjects.has(p.id)),
		[data, hiddenProjects],
	)

	// Recompute per-bucket total using ONLY visible projects for the chart.
	const chartBuckets = useMemo(() => {
		if (!data) return []
		return data.hoursSeries.buckets.map((b) => {
			let filteredTotal = 0
			const filtered: Array<{ projectId: string; hours: number }> = []
			for (const p of visibleProjects) {
				const h = b.perProject[p.id] ?? 0
				if (h > 0) filtered.push({ projectId: p.id, hours: h })
				filteredTotal += h
			}
			return {
				period: b.period,
				periodStart: b.periodStart,
				total: filteredTotal,
				perProject: filtered,
			}
		})
	}, [data, visibleProjects])
	const chartMax = useMemo(
		() => Math.max(1, ...chartBuckets.map((b) => b.total)),
		[chartBuckets],
	)

	const reportsMax = useMemo(
		() => Math.max(1, ...(data?.reportsSeries ?? []).map((b) => b.count)),
		[data],
	)
	const statusTotalMax = useMemo(() => {
		if (!data) return 1
		return Math.max(
			1,
			...data.statusOverTime.map(
				(b) =>
					(Object.values(b.statusCounts).reduce((a, c) => a + c, 0) || 0),
			),
		)
	}, [data])

	const workloadRows = useMemo(() => {
		const rows = data?.workload ?? []
		const dir = workloadSort.dir === 'asc' ? 1 : -1
		return [...rows].sort((a, b) => {
			const av = a[workloadSort.key] as number | string | null
			const bv = b[workloadSort.key] as number | string | null
			if (av === null && bv === null) return 0
			if (av === null) return 1
			if (bv === null) return -1
			return av > bv ? dir : av < bv ? -dir : 0
		})
	}, [data, workloadSort])

	useEffect(() => {
		setWorkloadDisplay((prev) => {
			const activeIds = new Set(workloadRows.map((r) => r.id))
			const prevIds = new Set(
				prev.filter((p) => !p.exiting).map((p) => p.row.id),
			)
			const next: WorkloadDisplayItem[] = []
			for (const p of prev) {
				if (p.exiting) {
					if (!activeIds.has(p.row.id)) next.push(p)
				} else if (activeIds.has(p.row.id)) {
					const fresh = workloadRows.find((r) => r.id === p.row.id)
					if (fresh) next.push({ row: fresh })
				} else {
					next.push({ row: p.row, exiting: true })
				}
			}
			for (const r of workloadRows) {
				if (!prevIds.has(r.id)) next.push({ row: r })
			}
			return next
		})
	}, [workloadRows])

	useEffect(() => {
		if (!workloadDisplay.some((d) => d.exiting)) return
		const t = window.setTimeout(() => {
			setWorkloadDisplay((prev) => prev.filter((d) => !d.exiting))
		}, 460)
		return () => window.clearTimeout(t)
	}, [workloadDisplay])

	const toggleProject = (id: string) => {
		const next = new Set(hiddenProjects)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setHiddenProjects(next)
	}

	const sortHeader = (
		key: typeof workloadSort.key,
		label: string,
		align?: 'right',
	) => (
		<Th
			style={{ textAlign: align, cursor: 'pointer' }}
			onClick={() =>
				setWorkloadSort((s) =>
					s.key === key
						? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
						: { key, dir: 'desc' },
				)
			}
		>
			<span>{label}</span>
			<SortMark $active={workloadSort.key === key}>
				{workloadSort.key === key ? (workloadSort.dir === 'asc' ? '▲' : '▼') : '·'}
			</SortMark>
		</Th>
	)

	return (
		<ThemeProvider theme={{ mode, primaryColor }}>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='current'>Project dashboard</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<h1>Projects</h1>
								<p>Portfolio health, team allocation and delivery activity.</p>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>ship the plan</span>
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

						{/* Filter bar — dark command panel */}
						{(() => {
							const activeCount =
								(from !== defaultFrom() ? 1 : 0) +
								(to !== isoDay(new Date()) ? 1 : 0) +
								(aggregation !== 'week' ? 1 : 0) +
								(projectFilter ? 1 : 0) +
								(statusFilter ? 1 : 0)
							const resetAll = () => {
								setFrom(defaultFrom())
								setTo(isoDay(new Date()))
								setAggregation('week')
								setProjectFilter('')
								setStatusFilter('')
							}
							const selectedProjectName =
								data?.hoursSeries.projects.find((p) => p.id === projectFilter)?.name

							return (
								<FiltersRow data-theme='dark'>
									<FiltersLead>
										<FiltersLeadIcon>
											<FilterAltOutlined />
										</FiltersLeadIcon>
										<FiltersLeadText>
											<span className='top'>Filters</span>
											<span className='bot'>
												{activeCount === 0
													? 'Default view'
													: `${activeCount} active`}
											</span>
										</FiltersLeadText>
										<ResetLink
											type='button'
											onClick={resetAll}
											disabled={activeCount === 0}
											data-active={activeCount > 0}
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
												From
											</GroupLbl>
											<DatePickerPill
												label='From'
												value={from}
												max={to || undefined}
												placeholder='Start date'
												onChange={(v) => setFrom(v)}
											/>
										</FilterGroup>
										<FilterGroup>
											<GroupLbl>
												<IconChip>
													<CalendarMonthOutlined />
												</IconChip>
												To
											</GroupLbl>
											<DatePickerPill
												label='To'
												value={to}
												min={from || undefined}
												placeholder='End date'
												onChange={(v) => setTo(v)}
											/>
										</FilterGroup>
										<FilterGroup>
											<GroupLbl>
												<IconChip>
													<TuneRounded />
												</IconChip>
												Aggregation
											</GroupLbl>
											<AnimatedSegmented
												items={[
													{ value: 'week', label: 'Week' },
													{ value: 'month', label: 'Month' },
												]}
												active={aggregation}
												onSelect={(v) => setAggregation(v as Aggregation)}
											/>
										</FilterGroup>

										<Divider aria-hidden='true' />

										<FilterGroup>
											<GroupLbl>
												<IconChip>
													<FolderOutlined />
												</IconChip>
												Project
											</GroupLbl>
											<SelectPill $active={!!projectFilter}>
												<SelectText>
													{selectedProjectName ?? 'All projects'}
												</SelectText>
												<SelectChev>
													<ExpandMoreRounded style={{ fontSize: 16 }} />
												</SelectChev>
												<NativeSelect
													value={projectFilter}
													onChange={(e) => setProjectFilter(e.target.value)}
												>
													<option value=''>All projects</option>
													{(data?.hoursSeries.projects ?? []).map((p) => (
														<option key={p.id} value={p.id}>
															{p.name}
														</option>
													))}
												</NativeSelect>
											</SelectPill>
										</FilterGroup>
										<FilterGroup>
											<GroupLbl>
												<IconChip>
													<InsertChartOutlinedRounded />
												</IconChip>
												Status
											</GroupLbl>
											<SelectPill $active={!!statusFilter}>
												<SelectText>
													{statusFilter ? STATUS_META[statusFilter].label : 'Any status'}
												</SelectText>
												<SelectChev>
													<ExpandMoreRounded style={{ fontSize: 16 }} />
												</SelectChev>
												<NativeSelect
													value={statusFilter}
													onChange={(e) =>
														setStatusFilter(e.target.value as ProjectStatus | '')
													}
												>
													<option value=''>Any status</option>
													{(data?.statuses ?? []).map((s) => (
														<option key={s} value={s}>
															{STATUS_META[s].label}
														</option>
													))}
												</NativeSelect>
											</SelectPill>
										</FilterGroup>
									</FiltersGroups>
								</FiltersRow>
							)
						})()}

						{/* KPI — hero portfolio + activity strip */}
						{(() => {
							const active = data?.kpi.active ?? 0
							const paused = data?.kpi.paused ?? 0
							const archived = data?.kpi.archived ?? 0
							const total = active + paused + archived
							return (
								<KpiLayout>
									<PortfolioCard>
										<PortfolioFlourish aria-hidden='true'>
											<span className='script'>in flight</span>
											<svg viewBox='0 0 200 26' width='200' height='26'>
												<path
													d='M6 18 C 52 4, 108 26, 168 8'
													fill='none'
													stroke='currentColor'
													strokeWidth='2.6'
													strokeLinecap='round'
												/>
												<path
													d='M156 3 L 172 8 L 162 20'
													fill='none'
													stroke='currentColor'
													strokeWidth='2.6'
													strokeLinecap='round'
													strokeLinejoin='round'
												/>
											</svg>
										</PortfolioFlourish>
										<PortfolioHead>Active projects</PortfolioHead>
										<PortfolioVal>
											<CountInt value={active} />
										</PortfolioVal>
										<PortfolioSub>
											<CountInt value={data?.kpi.assignedToActive ?? 0} /> people
											assigned across the portfolio
										</PortfolioSub>
										<PortfolioBar>
											{active > 0 && (
												<span
													className='seg active'
													style={{
														flex: total > 0 ? active : 1,
													}}
													title={`Active — ${active}`}
												/>
											)}
											{paused > 0 && (
												<span
													className='seg paused'
													style={{
														flex: paused,
													}}
													title={`Paused — ${paused}`}
												/>
											)}
											{archived > 0 && (
												<span
													className='seg arch'
													style={{
														flex: archived,
													}}
													title={`Archived — ${archived}`}
												/>
											)}
											{total === 0 && <span className='seg empty' />}
										</PortfolioBar>
										<PortfolioLegend>
											<span className='k'>
												<span className='dot active' />
												Active <b>{active}</b>
											</span>
											<span className='k'>
												<span className='dot paused' />
												Paused <b>{paused}</b>
											</span>
											<span className='k'>
												<span className='dot arch' />
												Archived <b>{archived}</b>
											</span>
										</PortfolioLegend>
									</PortfolioCard>

									<ActivityStrip>
										<ActivityCard>
											<span className='ico'>
												<AccessTimeRounded />
											</span>
											<div className='body'>
												<div className='lbl'>Tracked</div>
												<div className='name'>Hours</div>
											</div>
											<span className='val'>
												<CountInt value={data?.kpi.trackedHours ?? 0} />
											</span>
										</ActivityCard>
										<ActivityCard>
											<span className='ico'>
												<AssessmentOutlined />
											</span>
											<div className='body'>
												<div className='lbl'>Submitted</div>
												<div className='name'>Reports</div>
											</div>
											<span className='val'>
												<CountInt value={data?.kpi.reportsCount ?? 0} />
											</span>
										</ActivityCard>
										<ActivityCard>
											<span className='ico'>
												<PeopleAltOutlined />
											</span>
											<div className='body'>
												<div className='lbl'>Filed</div>
												<div className='name'>Report authors</div>
											</div>
											<span className='val'>
												<CountInt value={data?.kpi.reportAuthors ?? 0} />
											</span>
										</ActivityCard>
									</ActivityStrip>
								</KpiLayout>
							)
						})()}

						{/* Hours over time — heatmap */}
						<Section>
							<SectionHead>
								<SectionTitle>Hours over time</SectionTitle>
								<SectionSub>
									Rows are projects, columns are {aggregation}s. Darker cell = more
									hours.
								</SectionSub>
							</SectionHead>
							{(() => {
								const buckets = data?.hoursSeries.buckets ?? []
								const projects = data?.hoursSeries.projects ?? []
								if (buckets.length === 0 || projects.length === 0) {
									return (
										<EmptyState>
											<span className='ico'>
												<AccessTimeRounded />
											</span>
											<span className='title'>No tracked hours</span>
											<span className='sub'>
												Nothing logged for this range. Widen the dates or check back
												after reports land.
											</span>
										</EmptyState>
									)
								}

								const projectTotals = new Map<string, number>()
								let cellMax = 0
								let colMax = 0
								for (const b of buckets) {
									let colSum = 0
									for (const p of projects) {
										const v = b.perProject[p.id] ?? 0
										if (v > cellMax) cellMax = v
										colSum += v
										projectTotals.set(p.id, (projectTotals.get(p.id) ?? 0) + v)
									}
									if (colSum > colMax) colMax = colSum
								}

								const sortedProjects = [...projects].sort(
									(a, b) =>
										(projectTotals.get(b.id) ?? 0) - (projectTotals.get(a.id) ?? 0),
								)

								const yearOf = (iso: string): number =>
									new Date(iso).getUTCFullYear()
								const yearSegments: Array<{ year: number; span: number }> = []
								let prevYear: number | null = null
								for (const b of buckets) {
									const y = yearOf(b.periodStart)
									if (y !== prevYear) {
										yearSegments.push({ year: y, span: 1 })
										prevYear = y
									} else {
										yearSegments[yearSegments.length - 1].span += 1
									}
								}
								const yearStartIndex = new Set<number>()
								{
									let running = 0
									for (const s of yearSegments) {
										yearStartIndex.add(running)
										running += s.span
									}
								}
								const isYearBoundary = (i: number) =>
									i > 0 && yearStartIndex.has(i)

								return (
									<HeatmapWrap>
										<HeatmapScale>
											<span>0h</span>
											<span className='bar' />
											<span>{Math.round(cellMax)}h</span>
										</HeatmapScale>
										<HeatmapScroller>
											<HeatmapGrid $cols={buckets.length}>
												<div className='corner corner-year' />
												{yearSegments.map((s, i) => (
													<div
														key={`${s.year}-${i}`}
														className='yearLbl'
														style={{ gridColumn: `span ${s.span}` }}
													>
														<span>{s.year}</span>
													</div>
												))}

												<div className='corner' />
												{buckets.map((b, i) => {
													const short = b.period.split(' · ')[0]
													return (
														<div
															key={b.period}
															className={`colLbl${isYearBoundary(i) ? ' yearBoundary' : ''}`}
															title={b.period}
														>
															{short}
														</div>
													)
												})}

												{sortedProjects.map((p) => (
													<HeatRow key={p.id}>
														<div className='rowLbl' title={p.name}>
															{p.name}
														</div>
														{buckets.map((b, i) => {
															const v = b.perProject[p.id] ?? 0
															const intensity = cellMax > 0 ? v / cellMax : 0
															const isBig = intensity >= 0.55
															const isEmpty = v === 0
															const onClick = isEmpty
																? undefined
																: () => {
																		const start = new Date(b.periodStart)
																		const end = new Date(start)
																		if (aggregation === 'week') {
																			end.setUTCDate(end.getUTCDate() + 6)
																		} else {
																			end.setUTCMonth(end.getUTCMonth() + 1)
																			end.setUTCDate(end.getUTCDate() - 1)
																		}
																		const qs = new URLSearchParams({
																			projectId: p.id,
																			from: isoDay(start),
																			to: isoDay(end),
																		})
																		navigate(`/projects/reports?${qs.toString()}`)
																	}
															return (
																<HeatCell
																	key={b.period}
																	$intensity={intensity}
																	$big={isBig}
																	$empty={isEmpty}
																	$yearBoundary={isYearBoundary(i)}
																	title={
																		isEmpty
																			? `${p.name} · ${b.period}: no hours`
																			: `${p.name} · ${b.period}: ${v.toFixed(1)}h — click to open reports`
																	}
																	onClick={onClick}
																>
																	{v > 0 ? Math.round(v) : ''}
																</HeatCell>
															)
														})}
													</HeatRow>
												))}

												<HeatRow>
													<div className='rowLbl totalLbl'>Total h</div>
													{buckets.map((b, i) => {
														const pct = colMax > 0 ? (b.total / colMax) * 100 : 0
														return (
															<TotalCell
																key={b.period}
																$yearBoundary={isYearBoundary(i)}
																title={`${b.period}: ${b.total.toFixed(1)}h`}
															>
																<span
																	className='bar'
																	style={{ height: `${Math.max(pct, 3)}%` }}
																/>
																<span className='num'>
																	{Math.round(b.total)}
																</span>
															</TotalCell>
														)
													})}
												</HeatRow>
											</HeatmapGrid>
										</HeatmapScroller>
									</HeatmapWrap>
								)
							})()}
						</Section>

						{/* Reports activity — dual-metric combo */}
						<Section>
							<SectionHead>
								<SectionTitle>Reports activity</SectionTitle>
								<SectionSub>
									Reports submitted per {aggregation}. Bars = count, line = hours.
								</SectionSub>
							</SectionHead>
							{(data?.reportsSeries ?? []).length === 0 ? (
								<EmptyState>
									<span className='ico'>
										<AssessmentOutlined />
									</span>
									<span className='title'>No reports submitted</span>
									<span className='sub'>
										Nothing to summarise in this range. Reports drive most of the numbers
										on this page.
									</span>
								</EmptyState>
							) : (
								(() => {
									const rs = data!.reportsSeries
									const totalReports = rs.reduce((a, b) => a + b.count, 0)
									const totalHours = rs.reduce((a, b) => a + b.hours, 0)
									const cntMax = Math.max(1, ...rs.map((b) => b.count))
									const hrsMax = Math.max(1, ...rs.map((b) => b.hours))
									const yCountTicks = [cntMax, cntMax * 0.66, cntMax * 0.33, 0]
									const yHoursTicks = [hrsMax, hrsMax * 0.66, hrsMax * 0.33, 0]

									// Year segments — for divider lines + labels
									const yearOf = (iso: string): number =>
										new Date(iso).getUTCFullYear()
									const rSegments: Array<{
										year: number
										startIdx: number
										span: number
									}> = []
									let rPrev: number | null = null
									rs.forEach((b, i) => {
										const y = yearOf(b.periodStart)
										if (y !== rPrev) {
											rSegments.push({ year: y, startIdx: i, span: 1 })
											rPrev = y
										} else {
											rSegments[rSegments.length - 1].span += 1
										}
									})
									return (
										<ReportsWrap>
											<ReportsHead>
												<div className='totals'>
													<span className='tot count'>
														<span className='k'>Reports</span>
														<span className='v'>
															<CountInt value={totalReports} />
														</span>
													</span>
													<span className='tot hours'>
														<span className='k'>Hours</span>
														<span className='v'>
															<CountInt value={Math.round(totalHours)} />
														</span>
													</span>
													<span className='tot ratio'>
														<span className='k'>Avg h/report</span>
														<span className='v'>
															{totalReports > 0
																? (totalHours / totalReports).toFixed(1)
																: '0'}
														</span>
													</span>
												</div>
												<div className='range'>
													{rs.length} {aggregation}
													{rs.length === 1 ? '' : 's'}
												</div>
											</ReportsHead>

											<ReportsPlotWrap>
												{rSegments.length > 1 && (
													<>
														<div />
														<YearStrip>
															{rSegments.map((seg, si) => {
																const left =
																	rs.length > 0
																		? (seg.startIdx / rs.length) * 100
																		: 0
																const width =
																	rs.length > 0
																		? (seg.span / rs.length) * 100
																		: 100
																return (
																	<span
																		key={`${seg.year}-${si}`}
																		className='yearPill'
																		style={{
																			left: `${left}%`,
																			width: `${width}%`,
																		}}
																	>
																		<span>{seg.year}</span>
																	</span>
																)
															})}
														</YearStrip>
														<div />
													</>
												)}
												<YAx className='left'>
													{yCountTicks.map((t, i) => (
														<span key={i}>{Math.round(t)}</span>
													))}
												</YAx>
												<ReportsPlot>
													<span className='grid' style={{ top: '0%' }} />
													<span className='grid' style={{ top: '33%' }} />
													<span className='grid' style={{ top: '66%' }} />
													<span className='grid' style={{ top: '100%' }} />

													{rSegments.slice(1).map((seg, si) => {
														const left =
															rs.length > 0
																? (seg.startIdx / rs.length) * 100
																: 0
														return (
															<span
																key={`div-${seg.year}-${si}`}
																className='yearDivider'
																style={{ left: `${left}%` }}
															/>
														)
													})}

													<div className='bars'>
														{rs.map((b, i) => (
															<div
																key={b.period}
																className='bar'
																style={{
																	height: `${(b.count / cntMax) * 100}%`,
																	animationDelay: `${i * 22}ms`,
																}}
																title={`${b.period}: ${b.count} reports, ${b.hours.toFixed(1)}h`}
															/>
														))}
													</div>
													<svg
														className='line'
														viewBox='0 0 100 100'
														preserveAspectRatio='none'
													>
														<polyline
															points={rs
																.map((b, i) => {
																	const x =
																		rs.length > 0
																			? ((i + 0.5) / rs.length) * 100
																			: 50
																	const y = 100 - (b.hours / hrsMax) * 100
																	return `${x.toFixed(3)},${y.toFixed(3)}`
																})
																.join(' ')}
															fill='none'
															stroke='#d97706'
															strokeWidth='1.6'
															vectorEffect='non-scaling-stroke'
															strokeLinecap='round'
															strokeLinejoin='round'
														/>
													</svg>
													<div className='dots'>
														{rs.map((b, i) => {
															const left =
																rs.length > 0
																	? ((i + 0.5) / rs.length) * 100
																	: 50
															const bottom = (b.hours / hrsMax) * 100
															return (
																<span
																	key={b.period}
																	className={`dot${reportsHover === i ? ' on' : ''}`}
																	style={{
																		left: `${left}%`,
																		bottom: `${bottom}%`,
																	}}
																/>
															)
														})}
													</div>
													<div className='xax'>
														{rs.map((b, i) => (
															<span
																key={b.period}
																className={
																	rs.length <= 20 ||
																	i % Math.ceil(rs.length / 12) === 0
																		? ''
																		: 'hide'
																}
															>
																{b.period.split(' · ')[0]}
															</span>
														))}
													</div>
													<div className='cols'>
														{rs.map((b, i) => {
															const barPct = (b.count / cntMax) * 100
															const hoursPct = (b.hours / hrsMax) * 100
															const topOfContent = Math.max(
																barPct,
																hoursPct,
															)
															const align: 'left' | 'center' | 'right' =
																i <= 1
																	? 'left'
																	: i >= rs.length - 2
																		? 'right'
																		: 'center'
															const avgHrs =
																b.count > 0 ? b.hours / b.count : 0
															return (
																<ReportsCol
																	key={b.period}
																	$hover={reportsHover === i}
																	onMouseEnter={() => setReportsHover(i)}
																	onMouseLeave={() => setReportsHover(null)}
																>
																	<ReportsHoverCard
																		data-open={reportsHover === i}
																		data-align={align}
																		aria-hidden={reportsHover !== i}
																		style={{
																			bottom: `calc(${topOfContent}% + 16px)`,
																		}}
																	>
																		<div className='hd'>{b.period}</div>
																		<div className='rw'>
																			<span className='k'>
																				<span className='dot count' />
																				Reports
																			</span>
																			<span className='v'>{b.count}</span>
																		</div>
																		<div className='rw'>
																			<span className='k'>
																				<span className='dot hours' />
																				Hours
																			</span>
																			<span className='v'>
																				{b.hours.toFixed(1)}h
																			</span>
																		</div>
																		<div className='sep' />
																		<div className='rw total'>
																			<span className='k'>Avg h/report</span>
																			<span className='v'>
																				{avgHrs.toFixed(1)}h
																			</span>
																		</div>
																		<span
																			className='arrow'
																			aria-hidden='true'
																		/>
																	</ReportsHoverCard>
																</ReportsCol>
															)
														})}
													</div>
												</ReportsPlot>
												<YAx className='right'>
													{yHoursTicks.map((t, i) => (
														<span key={i}>{Math.round(t)}h</span>
													))}
												</YAx>
											</ReportsPlotWrap>

											<ReportsLegend>
												<span className='k'>
													<span className='swatch count' />
													Reports (count)
												</span>
												<span className='k'>
													<span className='swatch hours' />
													Hours
												</span>
											</ReportsLegend>
										</ReportsWrap>
									)
								})()
							)}
						</Section>

						{/* Projects over time — small multiples */}
						<Section>
							<SectionHead>
								<SectionTitle>Projects over time</SectionTitle>
								<SectionSub>
									Per-status trend of the portfolio composition per {aggregation}.
								</SectionSub>
							</SectionHead>
							{(data?.statusOverTime ?? []).length === 0 ? (
								<EmptyState>
									<span className='ico'>
										<InsertChartOutlinedRounded />
									</span>
									<span className='title'>No status history yet</span>
									<span className='sub'>
										Nothing to plot for this range. Status transitions appear here as
										projects move through phases.
									</span>
								</EmptyState>
							) : (
								(() => {
									const series = data!.statusOverTime
									const STATUS_SUB: Record<ProjectStatus, string> = {
										planned: 'Backlog before kickoff',
										active: 'In flight right now',
										paused: 'Temporarily on hold',
										completed: 'Delivered in range',
										archived: 'Closed / archived',
									}
									return (
										<StatusGrid>
											{data!.statuses.map((s) => {
												const counts = series.map(
													(b) => b.statusCounts[s] ?? 0,
												)
												const current = counts[counts.length - 1] ?? 0
												const first = counts[0] ?? 0
												const delta = current - first
												const maxC = Math.max(1, ...counts)
												const peakIdx = counts.reduce(
													(best, c, i) => (c > counts[best] ? i : best),
													0,
												)
												const peakVal = counts[peakIdx] ?? 0
												const peakLabel =
													series[peakIdx]?.period.split(' · ')[0] ?? '—'
												const meta = STATUS_META[s]
												const points = counts
													.map((c, i) => {
														const x =
															counts.length <= 1
																? 50
																: (i / (counts.length - 1)) * 100
														const y = 40 - (c / maxC) * 36
														return `${x.toFixed(2)},${y.toFixed(2)}`
													})
													.join(' ')
												return (
													<StatusCard key={s} $color={meta.color}>
														<div className='h'>
															<span
																className='swatch'
																style={{ background: meta.color }}
															/>
															<span className='name'>{meta.label}</span>
														</div>
														<div className='story'>
															<span className='was'>{first}</span>
															<span className='arrow'>→</span>
															<span className='now'>
																<CountInt value={current} />
															</span>
															<span
																className={`delta ${
																	delta > 0
																		? 'up'
																		: delta < 0
																			? 'down'
																			: 'flat'
																}`}
															>
																{delta > 0
																	? `↑ ${delta}`
																	: delta < 0
																		? `↓ ${Math.abs(delta)}`
																		: '→ 0'}
															</span>
														</div>
														<div className='desc'>{STATUS_SUB[s]}</div>
														<div className='sparkBox'>
															<svg
																viewBox='0 0 100 44'
																preserveAspectRatio='none'
																className='spark'
															>
																<defs>
																	<linearGradient
																		id={`sparkFill-${s}`}
																		x1='0'
																		y1='0'
																		x2='0'
																		y2='1'
																	>
																		<stop
																			offset='0%'
																			stopColor={meta.color}
																			stopOpacity='0.28'
																		/>
																		<stop
																			offset='100%'
																			stopColor={meta.color}
																			stopOpacity='0'
																		/>
																	</linearGradient>
																</defs>
																{counts.length > 0 && (
																	<>
																		<polygon
																			points={`0,44 ${points} 100,44`}
																			fill={`url(#sparkFill-${s})`}
																		/>
																		<polyline
																			points={points}
																			fill='none'
																			stroke={meta.color}
																			strokeWidth='1.6'
																			vectorEffect='non-scaling-stroke'
																			strokeLinecap='round'
																			strokeLinejoin='round'
																		/>
																	</>
																)}
															</svg>
															{counts.length > 0 && (
																<>
																	<span className='marker start'>{first}</span>
																	<span className='marker end'>{current}</span>
																</>
															)}
														</div>
														<div className='peak'>
															<span>Peak</span>
															<b>
																{peakVal} in {peakLabel}
															</b>
														</div>
													</StatusCard>
												)
											})}
										</StatusGrid>
									)
								})()
							)}
						</Section>

						{/* Workload by project */}
						<Section>
							<WorkloadHeadRow>
								<span className='title'>
									<GroupsOutlined className='ico' />
									Workload by project
								</span>
								<span className='sep' aria-hidden='true' />
								<span className='count'>
									<CountInt value={workloadRows.length} />
								</span>
								<span className='label'>projects</span>
								<span className='sep' aria-hidden='true' />
								<span className='count'>
									<CountInt
										value={Math.round(
											workloadRows.reduce((a, r) => a + r.hours, 0),
										)}
									/>
									<span className='unit'>h</span>
								</span>
								<span className='label'>total</span>
								<span className='meta'>sorted by hours</span>
							</WorkloadHeadRow>
							{isLoading ? (
								<EmptyState>
									<span className='ico'>
										<AccessTimeRounded />
									</span>
									<span className='title'>Loading workload…</span>
									<span className='sub'>Fetching data from server.</span>
								</EmptyState>
							) : workloadRows.length === 0 ? (
								<EmptyState>
									<span className='ico'>
										<GroupsOutlined />
									</span>
									<span className='title'>No projects yet</span>
									<span className='sub'>
										Nothing in this range. Widen the dates in the filters above.
									</span>
								</EmptyState>
							) : null}
							{!isLoading && workloadDisplay.length > 0 && (
								<RaceRows>
									{workloadDisplay.map((d) => {
										const r = d.row
										const meta = STATUS_META[r.status]
										const activeIdx = workloadRows.findIndex(
											(wr) => wr.id === r.id,
										)
										const rank = activeIdx >= 0 ? activeIdx + 1 : 999
										const dayMs = 24 * 60 * 60 * 1000
										const lastRel = r.lastReport
											? (() => {
													const dt = new Date(r.lastReport)
													const diff = Math.floor(
														(Date.now() - dt.getTime()) / dayMs,
													)
													if (diff <= 0) return 'today'
													if (diff === 1) return 'yesterday'
													if (diff < 7) return `${diff} days ago`
													if (diff < 30)
														return `${Math.round(diff / 7)} wk ago`
													if (diff < 365)
														return `${Math.round(diff / 30)} mo ago`
													return `${Math.round(diff / 365)} yr ago`
												})()
											: '—'
										const hidden =
											!d.exiting &&
											!workloadExpanded &&
											rank > WORKLOAD_TOP_N
										return (
											<RaceRow
												key={r.id}
												data-exiting={d.exiting || undefined}
												data-hidden={hidden || undefined}
												style={{
													transitionDelay:
														hidden
															? `${Math.min(Math.max(0, rank - WORKLOAD_TOP_N - 1), 20) * 20}ms`
															: workloadExpanded && rank > WORKLOAD_TOP_N
																? `${Math.min(Math.max(0, rank - WORKLOAD_TOP_N - 1), 20) * 30}ms`
																: '0ms',
												}}
											>
												<RaceInner
													$topThree={rank <= 3}
													onClick={
														d.exiting || hidden
															? undefined
															: () => navigate(`/projects/list`)
													}
												>
													<RaceRank $topThree={rank <= 3}>{rank}</RaceRank>
													<RaceBody>
													<div className='title'>
														<span className='name'>{r.name}</span>
														<StatusPill $bg={meta.bg} $color={meta.color}>
															{meta.label}
														</StatusPill>
													</div>
													<div className='track'>
														<span
															className='fill'
															style={{
																width: `${Math.max(2, Math.min(100, r.share))}%`,
															}}
														>
															<span className='shimmer' />
														</span>
														<span
															className='cursor'
															style={{
																left: `${Math.max(2, Math.min(100, r.share))}%`,
															}}
														/>
													</div>
													<div className='meta'>
														<span className='kv'>
															Reports <b>{r.reports}</b>
														</span>
														<span className='kv' title='Distinct Employee authors of MANUAL reports in range. Discord-sourced reports count toward hours but have no Employee author.'>
															Authors <b>{r.reportAuthors}</b>
														</span>
														<span className='kv'>
															Last <b>{lastRel}</b>
														</span>
													</div>
												</RaceBody>
												<RaceStats>
													<span className='hrs'>
														<CountInt value={Math.round(r.hours)} />h
													</span>
													<span className='share'>{r.share.toFixed(1)}%</span>
												</RaceStats>
												</RaceInner>
											</RaceRow>
										)
									})}
								</RaceRows>
							)}
							{!isLoading && workloadRows.length > WORKLOAD_TOP_N && (
								<ShowMoreBar>
									<ShowMoreBtn
										type='button'
										onClick={() => setWorkloadExpanded((v) => !v)}
									>
										{workloadExpanded ? (
											<>
												<ExpandLessRounded style={{ fontSize: 18 }} />
												Show less
											</>
										) : (
											<>
												<ExpandMoreRounded style={{ fontSize: 18 }} />
												Show all {workloadRows.length} projects
											</>
										)}
									</ShowMoreBtn>
								</ShowMoreBar>
							)}
						</Section>
					</ShellInner>
				</ShellCard>
			</ViewFade>
		</ThemeProvider>
	)
}

export default ProjectAnalytics

/* ─── Styles ───────────────────────────────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

/* Dark command panel — mirrors Finance Analytics for consistency */
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
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
	color: #e2e8f0;
	overflow: hidden;
`

const FiltersLead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	padding-right: 22px;
	border-right: 1px solid rgba(255, 255, 255, 0.08);
`

const FiltersLeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
	color: #ffffff;
	box-shadow: 0 4px 14px rgba(56, 189, 248, 0.36);

	svg {
		font-size: 20px;
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
		color: #ffffff;
		letter-spacing: -0.3px;
	}
	.bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		color: rgba(203, 213, 225, 0.72);
		letter-spacing: 0.2px;
		margin-top: 2px;
		white-space: nowrap;
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
	color: #e2e8f0;
	line-height: 1;
`

const IconChip = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 6px;
	background: rgba(56, 189, 248, 0.16);
	color: #7dd3fc;

	svg {
		font-size: 13px;
	}
`

const Divider = styled.span`
	width: 1px;
	align-self: stretch;
	background: rgba(255, 255, 255, 0.10);
	margin: 4px 2px;
`

const SelectPill = styled.label<{ $active?: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px 8px 12px;
	border-radius: 999px;
	border: 1.5px solid
		${(p) => (p.$active ? '#38bdf8' : 'rgba(255, 255, 255, 0.10)')};
	background: ${(p) => (p.$active ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.06)')};
	color: ${(p) => (p.$active ? '#7dd3fc' : '#e2e8f0')};
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
	color: rgba(255, 255, 255, 0.55);
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

const ResetLink = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border: 1.5px solid rgba(255, 255, 255, 0.12);
	background: rgba(255, 255, 255, 0.08);
	color: #94a3b8;
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
		background: rgba(251, 191, 36, 0.16);
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.36);
	}

	&:hover:not(:disabled) {
		background: rgba(251, 191, 36, 0.24);
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.52);
		transform: rotate(-60deg);
	}

	&:disabled {
		opacity: 0.4;
		cursor: default;
	}
`

/* ─── Hero portfolio card + activity strip (KPI Variant 1) ─────────── */
const KpiLayout = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
	gap: 14px;
	margin-bottom: 26px;
	animation: ${fadeIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

const PortfolioCard = styled.div`
	position: relative;
	padding: 24px 28px;
	border-radius: 20px;
	background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
	color: #ffffff;
	box-shadow: 0 8px 26px rgba(3, 105, 161, 0.28);
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 220px;
		height: 220px;
		background: radial-gradient(
			circle at top right,
			rgba(255, 255, 255, 0.18),
			transparent 65%
		);
		pointer-events: none;
	}
`

const flourishIn = keyframes`
	0%   { opacity: 0; transform: rotate(-4deg) translateY(6px); }
	60%  { opacity: 1; }
	100% { opacity: 1; transform: rotate(-4deg) translateY(0); }
`

const PortfolioFlourish = styled.div`
	position: absolute;
	top: 22px;
	right: 26px;
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
	color: #fbbf24;
	pointer-events: none;
	transform-origin: right center;
	animation: ${flourishIn} 620ms cubic-bezier(0.22, 1.35, 0.36, 1) both;
	animation-delay: 220ms;
	z-index: 2;

	.script {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 46px;
		line-height: 0.95;
		letter-spacing: -0.8px;
	}

	svg {
		display: block;
		margin-right: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const PortfolioHead = styled.div`
	position: relative;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: rgba(255, 255, 255, 0.78);
`

const PortfolioVal = styled.div`
	position: relative;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 44px;
	font-weight: 700;
	letter-spacing: -1px;
	line-height: 1;
	margin-top: 8px;
`

const PortfolioSub = styled.div`
	position: relative;
	margin-top: 8px;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.82);
`

const PortfolioBar = styled.div`
	position: relative;
	display: flex;
	align-items: stretch;
	height: 10px;
	border-radius: 999px;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.14);
	margin-top: 22px;

	.seg {
		display: block;
		transition: flex 480ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.seg.active {
		background: rgba(255, 255, 255, 0.90);
	}
	.seg.paused {
		background: rgba(251, 191, 36, 0.90);
	}
	.seg.arch {
		background: rgba(255, 255, 255, 0.28);
	}
	.seg.empty {
		flex: 1;
	}
`

const PortfolioLegend = styled.div`
	position: relative;
	display: flex;
	gap: 22px;
	margin-top: 14px;
	font-size: 12.5px;
	color: rgba(255, 255, 255, 0.90);
	flex-wrap: wrap;

	.k {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.k b {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		margin-left: 2px;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.dot.active {
		background: rgba(255, 255, 255, 0.90);
	}
	.dot.paused {
		background: rgba(251, 191, 36, 0.90);
	}
	.dot.arch {
		background: rgba(255, 255, 255, 0.28);
	}
`

const ActivityStrip = styled.div`
	display: grid;
	grid-template-rows: repeat(3, 1fr);
	gap: 10px;
`

const ActivityCard = styled.div`
	position: relative;
	padding: 14px 20px;
	border-radius: 16px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 14px;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 120px;
		height: 120px;
		background: radial-gradient(
			circle at top right,
			rgba(3, 105, 161, 0.07),
			transparent 65%
		);
		pointer-events: none;
	}

	.ico {
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: rgba(3, 105, 161, 0.10);
		color: #0369a1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.ico svg {
		font-size: 22px;
	}
	.body {
		min-width: 0;
	}
	.body .lbl {
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.55px;
		color: ${T.textSecondary};
	}
	.body .name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 700;
		font-size: 15px;
		color: ${T.textStrong};
		letter-spacing: -0.3px;
	}
	.val {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
		text-align: right;
	}
`

const Section = styled.section`
	background: #ffffff;
	border: 1px solid ${T.divider};
	border-radius: 16px;
	padding: 20px 24px;
	margin-bottom: 18px;
	animation: ${fadeIn} 320ms ease-out both;
`

const SectionHead = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
	flex-wrap: wrap;
`

const SectionTitle = styled.h2`
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 18px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
`

const SectionSub = styled.p`
	margin: 0;
	font-size: 12px;
	color: ${T.textSecondary};
`

/* ─── Heatmap for Hours over time (Variant 2) ───────────────────────── */
const HeatmapWrap = styled.div`
	animation: ${fadeIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const HeatmapScale = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 14px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 11px;
	color: ${T.textMuted};

	.bar {
		display: inline-block;
		width: 140px;
		height: 8px;
		border-radius: 3px;
		background: linear-gradient(
			90deg,
			rgba(3, 105, 161, 0.06),
			rgba(3, 105, 161, 0.90)
		);
	}
`

const HeatmapScroller = styled.div`
	overflow-x: auto;
	overflow-y: hidden;
	border-radius: 12px;
	background: #ffffff;
	box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
	-webkit-overflow-scrolling: touch;
	overscroll-behavior-x: contain;
	scrollbar-gutter: stable;

	&::-webkit-scrollbar {
		height: 10px;
	}
	&::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.03);
		border-radius: 0 0 12px 12px;
	}
	&::-webkit-scrollbar-thumb {
		background: rgba(3, 105, 161, 0.35);
		border-radius: 999px;
		border: 2px solid transparent;
		background-clip: padding-box;
		transition: background 160ms ease;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: ${T.primary};
		background-clip: padding-box;
		border: 2px solid transparent;
	}
	scrollbar-color: rgba(3, 105, 161, 0.35) rgba(15, 23, 42, 0.03);
	scrollbar-width: thin;
`

const HeatmapGrid = styled.div<{ $cols: number }>`
	display: grid;
	grid-template-columns: 240px repeat(
			${(p) => p.$cols},
			minmax(40px, 1fr)
		);
	gap: 3px;
	padding: 10px 12px 12px 0;
	width: 100%;
	min-width: 100%;

	.corner {
		position: sticky;
		left: 0;
		z-index: 3;
		background: #ffffff;
	}
	.corner-year {
		height: 26px;
	}
	.yearLbl {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 0 8px;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 13px;
		font-weight: 700;
		color: #0369a1;
		letter-spacing: -0.3px;
		border-bottom: 1px dashed rgba(3, 105, 161, 0.28);
		margin-bottom: 4px;
		min-width: 0;

		span {
			padding: 3px 10px;
			border-radius: 999px;
			background: rgba(3, 105, 161, 0.10);
		}
	}
	.colLbl {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		color: ${T.textMuted};
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 4px 2px 8px;
		text-align: center;
		align-self: end;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		position: relative;
	}
	.colLbl.yearBoundary {
		margin-left: 5px;
	}
	.colLbl.yearBoundary::before {
		content: '';
		position: absolute;
		left: -4px;
		top: 0;
		bottom: 0;
		width: 1.5px;
		background: repeating-linear-gradient(
			180deg,
			rgba(3, 105, 161, 0.30) 0 3px,
			transparent 3px 6px
		);
		pointer-events: none;
	}
	.rowLbl {
		position: sticky;
		left: 0;
		z-index: 2;
		background: #ffffff;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 13px;
		font-weight: 600;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		text-align: right;
		padding: 0 14px 0 12px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: 1px 0 0 rgba(15, 23, 42, 0.06);
	}
	.rowLbl.totalLbl {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10.5px;
		font-weight: 700;
		color: ${T.textMuted};
		text-transform: uppercase;
		letter-spacing: 0.6px;
		border-top: 1px solid ${T.divider};
		margin-top: 8px;
		padding-top: 12px;
	}
`

const HeatRow = styled.div`
	display: contents;
`

const TotalCell = styled.div<{ $yearBoundary?: boolean }>`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	padding-top: 6px;
	margin-top: 8px;
	border-top: 1px solid ${T.divider};
	margin-left: ${(p) => (p.$yearBoundary ? '5px' : '0')};

	${(p) =>
		p.$yearBoundary &&
		`
		&::before {
			content: '';
			position: absolute;
			left: -4px;
			top: 8px;
			bottom: 0;
			width: 1.5px;
			background: repeating-linear-gradient(
				180deg,
				rgba(3, 105, 161, 0.45) 0 3px,
				transparent 3px 6px
			);
			pointer-events: none;
		}
	`}

	.bar {
		display: block;
		width: 60%;
		max-height: 26px;
		min-height: 2px;
		border-radius: 3px 3px 0 0;
		background: linear-gradient(180deg, #0284c7, #0369a1);
		transition: height 480ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.num {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
		line-height: 1;
		padding-top: 2px;
	}
`

const heatKey = keyframes`
	from { opacity: 0; transform: scale(0.85); }
	to { opacity: 1; transform: scale(1); }
`

const HeatCell = styled.div<{
	$intensity: number
	$big: boolean
	$empty: boolean
	$yearBoundary?: boolean
}>`
	position: relative;
	aspect-ratio: 1;
	max-height: 34px;
	border-radius: 5px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: -0.2px;
	background: ${(p) =>
		p.$empty
			? 'rgba(15, 23, 42, 0.03)'
			: `rgba(3, 105, 161, ${Math.max(0.08, p.$intensity * 0.95)})`};
	color: ${(p) =>
		p.$empty ? 'transparent' : p.$big ? '#ffffff' : T.textStrong};
	cursor: ${(p) => (p.$empty ? 'default' : 'pointer')};
	transition:
		transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 160ms ease,
		outline-color 160ms ease;
	outline: 2px solid transparent;
	outline-offset: -1px;
	animation: ${heatKey} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	margin-left: ${(p) => (p.$yearBoundary ? '5px' : '0')};

	${(p) =>
		p.$yearBoundary &&
		`
		&::before {
			content: '';
			position: absolute;
			left: -4px;
			top: -1px;
			bottom: -1px;
			width: 1.5px;
			background: repeating-linear-gradient(
				180deg,
				rgba(3, 105, 161, 0.45) 0 3px,
				transparent 3px 6px
			);
			pointer-events: none;
		}
	`}

	&:hover {
		transform: ${(p) => (p.$empty ? 'none' : 'scale(1.18)')};
		outline-color: ${(p) => (p.$empty ? 'transparent' : '#0369a1')};
		box-shadow: ${(p) =>
			p.$empty ? 'none' : '0 6px 16px rgba(3, 105, 161, 0.22)'};
		z-index: 2;
	}
`

/* ─── Reports activity · Dual-metric combo (bars + line + dots) ────── */
const ReportsWrap = styled.div`
	animation: ${fadeIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const ReportsHead = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 22px;
	margin-bottom: 18px;
	flex-wrap: wrap;

	.totals {
		display: inline-flex;
		align-items: baseline;
		gap: 26px;
		flex-wrap: wrap;
	}
	.tot {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
	}
	.tot .k {
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: ${T.textSecondary};
	}
	.tot .v {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.5px;
		color: ${T.textStrong};
	}
	.tot.count .v {
		color: ${T.primary};
	}
	.tot.hours .v {
		color: #d97706;
	}
	.range {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12px;
		color: ${T.textMuted};
	}
`

const ReportsPlotWrap = styled.div`
	display: grid;
	grid-template-columns: 46px 1fr 46px;
	gap: 10px;
	align-items: stretch;
`

const YAx = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding-bottom: 24px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10.5px;
	line-height: 1;

	&.left {
		text-align: right;
		color: ${T.primary};
	}
	&.right {
		text-align: left;
		color: #d97706;
	}
`

const barIn = keyframes`
	from { transform: scaleY(0); }
	to { transform: scaleY(1); }
`

const YearStrip = styled.div`
	position: relative;
	height: 24px;
	margin-bottom: 8px;
	border-bottom: 1px dashed rgba(3, 105, 161, 0.28);

	.yearPill {
		position: absolute;
		top: 0;
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
	}
	.yearPill > span {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 999px;
		background: rgba(3, 105, 161, 0.10);
		color: #0369a1;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: -0.2px;
	}
`

const ReportsPlot = styled.div`
	position: relative;
	height: 220px;
	padding-bottom: 24px;

	.grid {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: rgba(15, 23, 42, 0.06);
		pointer-events: none;
	}
	.yearDivider {
		position: absolute;
		top: 0;
		bottom: 24px;
		width: 1.5px;
		background: repeating-linear-gradient(
			180deg,
			rgba(3, 105, 161, 0.30) 0 4px,
			transparent 4px 7px
		);
		transform: translateX(-1px);
		pointer-events: none;
		z-index: 1;
	}
	.bars {
		position: absolute;
		inset: 0 0 24px 0;
		display: flex;
		gap: 4px;
		align-items: flex-end;
	}
	.bar {
		flex: 1;
		min-width: 2px;
		background: linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%);
		border-radius: 3px 3px 0 0;
		transform-origin: bottom;
		animation: ${barIn} 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
		transition: filter 160ms ease;
	}
	.bar:hover {
		filter: brightness(1.1);
	}
	.line {
		position: absolute;
		inset: 0 0 24px 0;
		width: 100%;
		height: calc(100% - 24px);
		pointer-events: none;
	}
	.dots {
		position: absolute;
		inset: 0 0 24px 0;
		pointer-events: none;
	}
	.dots .dot {
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #ffffff;
		border: 3px solid #d97706;
		transform: translate(-50%, 50%);
		box-shadow: 0 3px 10px rgba(217, 119, 6, 0.35);
		pointer-events: none;
		transition:
			transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 180ms ease;
	}
	.dots .dot.on {
		transform: translate(-50%, 50%) scale(1.4);
		box-shadow: 0 6px 18px rgba(217, 119, 6, 0.55);
	}
	.xax {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		gap: 4px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		color: ${T.textMuted};
	}
	.xax span {
		flex: 1;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.xax span.hide {
		visibility: hidden;
	}
	.cols {
		position: absolute;
		inset: 0 0 24px 0;
		display: flex;
		gap: 4px;
		pointer-events: none;
		z-index: 5;
	}
`

const ReportsCol = styled.div<{ $hover: boolean }>`
	position: relative;
	flex: 1;
	pointer-events: auto;
	cursor: pointer;
	background: ${(p) =>
		p.$hover ? 'rgba(3, 105, 161, 0.06)' : 'transparent'};
	border-radius: 4px;
	transition: background 160ms ease;
`

const ReportsHoverCard = styled.div`
	position: absolute;
	min-width: 200px;
	padding: 12px 14px 10px;
	background: #ffffff;
	border-radius: 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 14px 40px rgba(15, 23, 42, 0.20);
	z-index: 6;
	pointer-events: none;

	opacity: 0;
	visibility: hidden;
	transition:
		opacity 220ms ease,
		transform 280ms cubic-bezier(0.22, 1.35, 0.36, 1),
		visibility 0s linear 280ms;

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
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-weight: 700;
		font-size: 14px;
		color: ${T.textStrong};
		margin-bottom: 10px;
		letter-spacing: -0.3px;
	}
	.rw {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12.5px;
		color: ${T.textSecondary};
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
		color: ${T.textStrong};
		letter-spacing: -0.2px;
	}
	.rw.total .k {
		font-weight: 700;
		color: ${T.textStrong};
	}
	.rw.total .v {
		color: #d97706;
		font-size: 14.5px;
	}
	.sep {
		height: 1px;
		background: rgba(15, 23, 42, 0.06);
		margin: 8px 0 0;
	}
	.dot {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.dot.count {
		background: linear-gradient(135deg, #38bdf8, #0369a1);
	}
	.dot.hours {
		background: #d97706;
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

const ReportsLegend = styled.div`
	display: flex;
	gap: 24px;
	margin-top: 18px;
	padding-top: 14px;
	border-top: 1px solid ${T.divider};
	font-size: 12.5px;

	.k {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: ${T.textSecondary};
	}
	.swatch {
		display: inline-block;
		width: 16px;
		height: 4px;
		border-radius: 2px;
	}
	.swatch.count {
		background: linear-gradient(90deg, #38bdf8, #0369a1);
	}
	.swatch.hours {
		background: #d97706;
		position: relative;
	}
	.swatch.hours::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ffffff;
		border: 2px solid #d97706;
		transform: translate(-50%, -50%);
	}
`

/* ─── Projects over time · Small multiples ───────────────────────────── */
const StatusGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 14px;
	animation: ${fadeIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const StatusCard = styled.div<{ $color: string }>`
	position: relative;
	padding: 16px 18px 14px;
	background: #ffffff;
	border: 1px solid ${T.divider};
	border-radius: 14px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
	overflow: hidden;

	.h {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}
	.h .swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}
	.h .name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 13.5px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
	}
	.story {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 4px;
	}
	.story .was {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 15px;
		font-weight: 600;
		color: ${T.textMuted};
		letter-spacing: -0.3px;
	}
	.story .arrow {
		color: ${T.textMuted};
		font-size: 14px;
	}
	.story .now {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.5px;
		line-height: 1;
		color: ${T.textStrong};
	}
	.delta {
		margin-left: auto;
		padding: 3px 9px;
		border-radius: 999px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: -0.1px;
	}
	.delta.up {
		background: rgba(5, 150, 105, 0.14);
		color: #047857;
	}
	.delta.down {
		background: rgba(220, 38, 38, 0.10);
		color: #b91c1c;
	}
	.delta.flat {
		background: rgba(15, 23, 42, 0.06);
		color: ${T.textMuted};
	}
	.desc {
		font-size: 11px;
		color: ${T.textMuted};
		margin-bottom: 10px;
	}
	.sparkBox {
		position: relative;
		height: 56px;
		background: rgba(15, 23, 42, 0.02);
		border-radius: 8px;
		padding: 6px;
	}
	.spark {
		display: block;
		width: 100%;
		height: 100%;
	}
	.marker {
		position: absolute;
		bottom: 4px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 9.5px;
		font-weight: 700;
		color: ${T.textMuted};
		padding: 1px 6px;
		background: #ffffff;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
	}
	.marker.start {
		left: 4px;
	}
	.marker.end {
		right: 4px;
	}
	.peak {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		font-size: 11px;
		color: ${T.textMuted};
	}
	.peak b {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: ${T.textStrong};
		font-weight: 700;
		letter-spacing: -0.2px;
	}
`

/* ─── Workload · single head row (title + counter) ──────────────────── */
const WorkloadHeadRow = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 4px 0 16px;
	margin-bottom: 8px;
	border-bottom: 1px solid ${T.divider};
	flex-wrap: wrap;

	.title {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-size: 17px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
	}
	.title .ico {
		font-size: 20px;
		color: #0369a1;
	}
	.sep {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.20);
	}
	.count {
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 700;
		color: #0369a1;
		letter-spacing: -0.5px;
		line-height: 1;
	}
	.count .unit {
		font-size: 14px;
		font-weight: 700;
		color: #0369a1;
	}
	.label {
		font-size: 12.5px;
		color: ${T.textMuted};
		letter-spacing: 0.1px;
		text-transform: lowercase;
	}
	.meta {
		margin-left: auto;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 11px;
		color: ${T.textMuted};
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 700;
	}
`

/* ─── Workload · Race bars (ranked list) ────────────────────────────── */
const RaceHead = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 14px;
	font-size: 12.5px;
	color: ${T.textSecondary};

	b {
		color: ${T.textStrong};
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}
`

const RaceRows = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	contain: layout;
	overflow-anchor: auto;
`

const RaceRow = styled.div`
	display: grid;
	grid-template-rows: 1fr;
	overflow: hidden;
	transition:
		grid-template-rows 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 380ms ease,
		margin 420ms cubic-bezier(0.22, 1, 0.36, 1);

	> * {
		min-height: 0;
	}

	&[data-exiting],
	&[data-hidden] {
		grid-template-rows: 0fr;
		opacity: 0;
		margin-top: -10px;
		pointer-events: none;
	}
`

const RaceInner = styled.div<{ $topThree: boolean }>`
	display: grid;
	grid-template-columns: 32px 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 12px 14px;
	border-radius: 12px;
	cursor: pointer;
	overflow: hidden;
	animation: ${fadeIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		background 140ms ease,
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		background: rgba(15, 23, 42, 0.03);
		transform: translateY(-1px);
	}

	${RaceRow}[data-exiting] &,
	${RaceRow}[data-hidden] & {
		cursor: default;
		animation: none;
	}
	${RaceRow}[data-exiting] &:hover,
	${RaceRow}[data-hidden] &:hover {
		background: transparent;
		transform: none;
	}
`

/* ─── Workload · loading skeleton (slow shimmer + pulsing cursor) ───── */
const skelShimmerKF = keyframes`
	0%   { transform: translateX(-120%); }
	20%  { transform: translateX(220%); }
	100% { transform: translateX(220%); }
`

const skelCursorPulseKF = keyframes`
	0% {
		box-shadow: 0 0 0 0 rgba(3, 105, 161, 0.35);
		transform: translate(-50%, -50%) scale(1);
	}
	10% {
		box-shadow: 0 0 0 6px rgba(3, 105, 161, 0);
		transform: translate(-50%, -50%) scale(1.2);
	}
	20%, 100% {
		box-shadow: 0 0 0 0 rgba(3, 105, 161, 0);
		transform: translate(-50%, -50%) scale(1);
	}
`

const WorkloadSkeleton = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	animation: ${fadeIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const SkelRow = styled.div`
	display: grid;
	grid-template-columns: 32px 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 12px 14px;
	border-radius: 12px;

	.rank {
		width: 26px;
		height: 26px;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.06);
	}
	.body {
		min-width: 0;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}
	.title .name {
		display: inline-block;
		height: 14px;
		border-radius: 4px;
		background: rgba(15, 23, 42, 0.08);
	}
	.title .pill {
		display: inline-block;
		width: 48px;
		height: 16px;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.06);
	}
	.track {
		position: relative;
		height: 8px;
		border-radius: 4px;
		background: rgba(15, 23, 42, 0.04);
		overflow: visible;
	}
	.track .fill {
		position: relative;
		display: block;
		height: 100%;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			rgba(56, 189, 248, 0.65) 0%,
			rgba(3, 105, 161, 0.85) 100%
		);
		overflow: hidden;
	}
	.track .fill .shimmer {
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
		animation: ${skelShimmerKF} 8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}
	.track .cursor {
		position: absolute;
		top: 50%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #0369a1;
		border: 2px solid #ffffff;
		transform: translate(-50%, -50%);
		animation: ${skelCursorPulseKF} 8s cubic-bezier(0.22, 1, 0.36, 1)
			infinite;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 10px;
	}
	.meta .m {
		display: inline-block;
		height: 11px;
		border-radius: 3px;
		background: rgba(15, 23, 42, 0.06);
	}
	.stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
	}
	.stats .hrs {
		display: inline-block;
		height: 20px;
		border-radius: 4px;
		background: rgba(15, 23, 42, 0.08);
	}
	.stats .share {
		display: inline-block;
		width: 40px;
		height: 11px;
		border-radius: 3px;
		background: rgba(15, 23, 42, 0.06);
	}

	@media (prefers-reduced-motion: reduce) {
		.track .fill .shimmer,
		.track .cursor {
			animation: none;
		}
	}
`

const ShowMoreBar = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 12px;
	padding-top: 14px;
	border-top: 1px dashed rgba(15, 23, 42, 0.10);
`

const ShowMoreBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 18px;
	border-radius: 999px;
	background: transparent;
	border: 1.5px solid rgba(3, 105, 161, 0.24);
	color: #0369a1;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 180ms ease,
		border-color 180ms ease,
		transform 200ms cubic-bezier(0.22, 1.35, 0.36, 1);

	&:hover {
		background: rgba(3, 105, 161, 0.08);
		border-color: #0369a1;
		transform: translateY(-1px);
	}
	svg {
		transition: transform 200ms ease;
	}
`

const RaceRank = styled.span<{ $topThree: boolean }>`
	width: 26px;
	height: 26px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: -0.2px;
	${(p) =>
		p.$topThree
			? `
			background: linear-gradient(135deg, #0284c7, #0369a1);
			color: #ffffff;
			box-shadow: 0 3px 10px rgba(3, 105, 161, 0.35);
		`
			: `
			background: rgba(3, 105, 161, 0.10);
			color: #0369a1;
		`}
`

const RaceBody = styled.div`
	min-width: 0;

	.title {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
	}
	.title .name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		font-weight: 700;
		font-size: 15px;
		color: ${T.textStrong};
		letter-spacing: -0.3px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.track {
		height: 8px;
		border-radius: 4px;
		background: rgba(15, 23, 42, 0.04);
		position: relative;
	}
	.track .fill {
		position: relative;
		display: block;
		height: 100%;
		background: linear-gradient(
			90deg,
			#38bdf8 0%,
			#0284c7 60%,
			#0369a1 100%
		);
		border-radius: 4px;
		box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.08);
		overflow: hidden;
		transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.track .fill .shimmer {
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
		animation: ${skelShimmerKF} 8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}
	.track .cursor {
		position: absolute;
		top: 50%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #0369a1;
		border: 2px solid #ffffff;
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 0 rgba(3, 105, 161, 0.35);
		animation: ${skelCursorPulseKF} 8s cubic-bezier(0.22, 1, 0.36, 1)
			infinite;
		transition: left 520ms cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.track .fill .shimmer,
		.track .cursor {
			animation: none;
		}
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 8px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13px;
		color: ${T.textMuted};
		flex-wrap: wrap;
	}
	.meta .kv {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.meta .kv b {
		color: ${T.textStrong};
		font-weight: 700;
		font-size: 13.5px;
	}
`

const RaceStats = styled.div`
	text-align: right;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 3px;

	.hrs {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.5px;
		line-height: 1;
	}
	.share {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13px;
		color: #0369a1;
		font-weight: 700;
	}
`

const StackedChart = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 3px;
	height: 180px;
	padding: 4px 0;
`

const StackedBar = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column-reverse;
	height: 100%;
	gap: 1px;
	animation: ${fadeIn} 340ms ease-out both;
`

const StackedSlice = styled.div`
	width: 100%;
	border-radius: 3px;
	transition: height 240ms ease, filter 160ms ease;
	&:hover {
		filter: brightness(1.1);
	}
`

const DualChart = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 4px;
	height: 160px;
	padding: 4px 0;
`

const DualBar = styled.div`
	flex: 1;
	display: flex;
	gap: 2px;
	align-items: flex-end;
	height: 100%;
	animation: ${fadeIn} 320ms ease-out both;
`

const DualBarCount = styled.div`
	flex: 1;
	background: linear-gradient(180deg, ${T.primary}, #075985);
	border-radius: 3px 3px 0 0;
	transition: height 240ms ease;
`

const DualBarHours = styled.div`
	flex: 1;
	background: linear-gradient(180deg, #d97706, #b45309);
	border-radius: 3px 3px 0 0;
	transition: height 240ms ease;
`

const ChartAxis = styled.div`
	display: flex;
	gap: 3px;
	margin-top: 6px;
`

const AxisLbl = styled.div<{ $show: boolean }>`
	flex: 1;
	text-align: center;
	font-family: 'JetBrains Mono', monospace;
	font-size: 9.5px;
	color: ${T.textMuted};
	visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
	white-space: nowrap;
	overflow: hidden;
`

const Legend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 12px;
`

const LegendBtn = styled.button<{ $off?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	color: ${({ $off }) => ($off ? T.textMuted : T.textStrong)};
	font: inherit;
	font-size: 11.5px;
	font-weight: 600;
	cursor: pointer;
	opacity: ${({ $off }) => ($off ? 0.5 : 1)};
	transition: all 160ms ease;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const LegendSwatch = styled.span`
	width: 10px;
	height: 10px;
	border-radius: 3px;
`


const TableScroll = styled.div`
	overflow-x: auto;
	&::-webkit-scrollbar {
		height: 8px;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 999px;
		transition: background 200ms ease;
	}
	&:hover::-webkit-scrollbar-thumb {
		background: rgba(3, 105, 161, 0.35);
	}
`

const Table = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
`

const Th = styled.th`
	text-align: left;
	padding: 10px 12px;
	background: ${T.subtleBg};
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${T.textSecondary};
	user-select: none;
	white-space: nowrap;
	span {
		margin-right: 4px;
	}
`

const SortMark = styled.span<{ $active: boolean }>`
	font-size: 9px;
	color: ${({ $active }) => ($active ? T.primary : T.textMuted)};
`

const Tr = styled.tr`
	animation: ${fadeIn} 240ms ease-out both;
	cursor: pointer;
	&:hover td {
		background: rgba(3, 105, 161, 0.03);
	}
`

const Td = styled.td`
	padding: 10px 12px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.05);
	font-size: 13px;
	color: ${T.textStrong};
	vertical-align: middle;
`

const ProjRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

const ProjSwatch = styled.span`
	width: 8px;
	height: 8px;
	border-radius: 50%;
`

const ProjName = styled.span`
	font-weight: 600;
`

const StatusPill = styled.span<{ $bg: string; $color: string }>`
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $bg }) => $bg};
	color: ${({ $color }) => $color};
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 12.5px;
	font-weight: 600;
`

const Muted = styled.span`
	color: ${T.textMuted};
	font-size: 12.5px;
`

const ShareBar = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	position: relative;
	width: 160px;
	height: 16px;
`

const ShareFill = styled.div`
	position: absolute;
	inset: 4px 0 4px 0;
	background: linear-gradient(90deg, ${T.primary}, #075985);
	border-radius: 999px;
	transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
`

const ShareText = styled.span`
	position: relative;
	z-index: 1;
	font-family: 'JetBrains Mono', monospace;
	font-size: 10.5px;
	font-weight: 700;
	color: ${T.textStrong};
	margin-left: auto;
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 40px 28px;
	margin-top: 12px;
	text-align: center;
	background:
		radial-gradient(circle at 50% 0%, rgba(3, 105, 161, 0.06), transparent 60%),
		#fafafd;
	border: 1px dashed rgba(15, 23, 42, 0.10);
	border-radius: 16px;

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
