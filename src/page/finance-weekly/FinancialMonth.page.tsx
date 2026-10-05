import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
	PaymentOutlined,
	ArrowBackRounded,
	ArrowForwardRounded,
	VisibilityOffOutlined,
	AddRounded,
	CalculateOutlined,
	CheckRounded,
	CloseRounded,
	DoneAllRounded,
} from '@mui/icons-material'

import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	FinanceGridEntry,
	PaymentStatus,
	useGetCurrentFiscalMonthQuery,
	useGetMonthOverviewQuery,
} from '../../store/finance-weekly/financeWeeklyApi'

import {
	GridBodyCell,
	GridBodyFill,
	GridCard,
	GridCardHead,
	GridChart,
	GridFooterCell,
	GridFooterCorner,
	GridFooterTotal,
	GridHeaderCorner,
	GridHeaderTotal,
	GridHeaderWeek,
	GridProjectCell,
	GridRowTotalCell,
	GridScroller,
	HeaderRight,
	HeroBlock,
	HeroLabel,
	HeroLegend,
	HeroLegendCount,
	HeroLegendItem,
	HeroLegendLabel,
	HeroLegendValue,
	AddProjectAnchor,
	AddProjectBtn,
	AddProjectMenu,
	RowBody,
	MonthPeekBar,
	MonthPeekBtn,
	MonthPeekCenter,
	MonthPeekNameAnim,
	HeroInscription,
	HeroInsciMuted,
	HeroInsciAccent,
	HeroInsciSquiggle,
	HeroInsciDot,
	HeroTopRow,
	HeroValue,
	InsciAccent,
	InsciDot,
	InsciMuted,
	InsciSquiggle,
	Inscription,
	LegendInline,
	CalcToggleBtn,
	CalcBtnLabel,
	CalcPanel,
	CalcPanelStat,
	CalcPanelDivider,
	CalcPanelBtn,
	HeadRightCluster,
} from './financeWeekly.styled'
import { STATUS_META } from './statusMeta'
import CellEditor from './CellEditor'

const STATUS_ORDER: PaymentStatus[] = [
	'received',
	'in_transit',
	'expected_later',
	'planned_invoice',
]

const NO_AMOUNT_STATUSES = new Set<PaymentStatus>(['expected_later', 'no_work'])

const HERO_STATUSES: PaymentStatus[] = [
	'received',
	'in_transit',
	'expected_later',
	'planned_invoice',
]

function formatMoney(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '—'
	const num = typeof value === 'number' ? value : Number(value)
	if (Number.isNaN(num)) return '—'
	if (num === 0) return '$0'
	return num.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: num % 1 === 0 ? 0 : 2,
	})
}

function formatShortDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'short',
	})
}

function useCountUp(target: number, duration = 700): number {
	const [display, setDisplay] = useState<number>(0)
	const rafRef = useRef<number | null>(null)
	const startRef = useRef<number | null>(null)
	const fromRef = useRef<number>(0)
	const displayRef = useRef<number>(0)

	useEffect(() => {
		displayRef.current = display
	}, [display])

	useEffect(() => {
		if (typeof window === 'undefined') return
		const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		if (reduce) {
			setDisplay(target)
			return
		}
		if (rafRef.current) cancelAnimationFrame(rafRef.current)
		fromRef.current = displayRef.current
		startRef.current = null
		const step = (ts: number) => {
			if (startRef.current === null) startRef.current = ts
			const elapsed = ts - startRef.current
			const t = Math.min(1, elapsed / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const current = fromRef.current + (target - fromRef.current) * eased
			setDisplay(current)
			if (t < 1) rafRef.current = requestAnimationFrame(step)
			else rafRef.current = null
		}
		rafRef.current = requestAnimationFrame(step)
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
		}
	}, [target, duration])

	return display
}

const CountMoney = ({ value, duration }: { value: number; duration?: number }) => {
	const v = useCountUp(value, duration ?? 700)
	return (
		<>
			{v.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}
		</>
	)
}

const CountMoneyOptional = ({
	value,
	duration,
	fallback = '—',
}: {
	value: number | string | null | undefined
	duration?: number
	fallback?: string
}) => {
	if (value === null || value === undefined || value === '') return <>{fallback}</>
	const num = typeof value === 'number' ? value : Number(value)
	if (Number.isNaN(num)) return <>{fallback}</>
	return <CountMoney value={num} duration={duration} />
}

interface EditorState {
	rect: DOMRect
	weekId: string
	weekLabel: string
	projectId: string
	projectName: string
	entry: FinanceGridEntry | null
}

const FinancialMonthPage = () => {
	const { id } = useParams<{ id?: string }>()
	const navigate = useNavigate()
	const { data: currentMonth, isLoading: currentLoading } = useGetCurrentFiscalMonthQuery(
		undefined,
		{ skip: !!id }
	)

	const effectiveId = id ?? currentMonth?.id
	const { data, isLoading, isFetching } = useGetMonthOverviewQuery(effectiveId ?? '', {
		skip: !effectiveId,
	})
	const [editor, setEditor] = useState<EditorState | null>(null)
	const [navDir, setNavDir] = useState<'prev' | 'next' | null>(null)
	const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set())
	const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set())
	const leavingTimersRef = useRef<Record<string, number>>({})
	const [calcMode, setCalcModeState] = useState(false)
	const [selectedAmounts, setSelectedAmounts] = useState<Record<string, number>>({})

	const CALC_STORAGE_KEY = 'fw:calc:selected:v1'
	const CALC_MODE_STORAGE_KEY = 'fw:calc:mode:v1'

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(CALC_STORAGE_KEY)
			if (raw) {
				const parsed = JSON.parse(raw)
				if (parsed && typeof parsed === 'object') {
					const cleaned: Record<string, number> = {}
					for (const [k, v] of Object.entries(parsed)) {
						const n = Number(v)
						if (typeof k === 'string' && Number.isFinite(n)) cleaned[k] = n
					}
					setSelectedAmounts(cleaned)
				}
			}
			const mode = window.localStorage.getItem(CALC_MODE_STORAGE_KEY)
			if (mode === '1') setCalcModeState(true)
		} catch {
			/* ignore */
		}
	}, [])

	const setCalcMode = (next: boolean | ((prev: boolean) => boolean)) => {
		setCalcModeState((prev) => {
			const value = typeof next === 'function' ? next(prev) : next
			try {
				if (value) window.localStorage.setItem(CALC_MODE_STORAGE_KEY, '1')
				else window.localStorage.removeItem(CALC_MODE_STORAGE_KEY)
			} catch {
				/* ignore */
			}
			return value
		})
	}

	const persistSelection = (next: Record<string, number>) => {
		setSelectedAmounts(next)
		try {
			window.localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(next))
		} catch {
			/* ignore quota errors */
		}
	}

	const toggleCellSelection = (entryId: string, amount: number) => {
		const next = { ...selectedAmounts }
		if (next[entryId] !== undefined) delete next[entryId]
		else next[entryId] = amount
		persistSelection(next)
	}

	const clearSelection = () => persistSelection({})

	const selectionCount = Object.keys(selectedAmounts).length
	const selectionTotal = useMemo(
		() => Object.values(selectedAmounts).reduce((s, n) => s + n, 0),
		[selectedAmounts]
	)

	const shouldShowPanel = calcMode || selectionCount > 0
	const [panelMounted, setPanelMounted] = useState(false)
	const [panelLeaving, setPanelLeaving] = useState(false)
	const panelExitTimerRef = useRef<number | null>(null)

	useEffect(() => {
		if (shouldShowPanel) {
			if (panelExitTimerRef.current) {
				window.clearTimeout(panelExitTimerRef.current)
				panelExitTimerRef.current = null
			}
			setPanelLeaving(false)
			setPanelMounted(true)
		} else if (panelMounted) {
			setPanelLeaving(true)
			if (panelExitTimerRef.current) window.clearTimeout(panelExitTimerRef.current)
			panelExitTimerRef.current = window.setTimeout(() => {
				setPanelMounted(false)
				setPanelLeaving(false)
				panelExitTimerRef.current = null
			}, 380)
		}
	}, [shouldShowPanel, panelMounted])

	useEffect(() => {
		return () => {
			if (panelExitTimerRef.current) window.clearTimeout(panelExitTimerRef.current)
		}
	}, [])

	useEffect(() => {
		return () => {
			Object.values(leavingTimersRef.current).forEach((t) => window.clearTimeout(t))
		}
	}, [])
	const [addOpen, setAddOpen] = useState(false)
	const addAnchorRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!addOpen) return
		const onDoc = (e: MouseEvent) => {
			if (!addAnchorRef.current) return
			if (!addAnchorRef.current.contains(e.target as Node)) setAddOpen(false)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setAddOpen(false)
		}
		setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onDoc)
			document.removeEventListener('keydown', onKey)
		}
	}, [addOpen])

	const hiddenStorageKey = effectiveId ? `fw:hidden:${effectiveId}` : null

	useEffect(() => {
		if (!hiddenStorageKey) return
		try {
			const raw = window.localStorage.getItem(hiddenStorageKey)
			if (!raw) {
				setHiddenProjectIds(new Set())
				return
			}
			const parsed = JSON.parse(raw)
			setHiddenProjectIds(
				new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [])
			)
		} catch {
			setHiddenProjectIds(new Set())
		}
	}, [hiddenStorageKey])

	const persistHidden = (next: Set<string>) => {
		setHiddenProjectIds(next)
		if (!hiddenStorageKey) return
		try {
			window.localStorage.setItem(hiddenStorageKey, JSON.stringify([...next]))
		} catch {
			/* ignore quota errors */
		}
	}

	const hideProject = (id: string) => {
		if (leavingIds.has(id) || hiddenProjectIds.has(id)) return
		setLeavingIds((prev) => new Set(prev).add(id))
		const timer = window.setTimeout(() => {
			const next = new Set(hiddenProjectIds)
			next.add(id)
			persistHidden(next)
			setLeavingIds((prev) => {
				const n = new Set(prev)
				n.delete(id)
				return n
			})
			delete leavingTimersRef.current[id]
		}, 520)
		leavingTimersRef.current[id] = timer
	}

	const showProject = (id: string) => {
		const next = new Set(hiddenProjectIds)
		next.delete(id)
		persistHidden(next)
	}

	const columnTotals = useMemo(() => {
		if (!data) return {}
		const totals: Record<string, number> = {}
		for (const week of data.weeks) totals[week.id] = 0
		for (const row of Object.values(data.grid)) {
			for (const [wid, entry] of Object.entries(row)) {
				if (entry?.amount && entry.status !== 'no_work') {
					totals[wid] += Number(entry.amount)
				}
			}
		}
		return totals
	}, [data])

	if ((!id && currentLoading) || isLoading || !data) {
		return (
			<ListPageShell
				crumbs={[{ label: 'Finances' }, { label: 'Payments · Grid', current: true }]}
				icon={<PaymentOutlined />}
				title='Weekly payments'
				subtitle='Loading fiscal month…'
			>
				<div />
			</ListPageShell>
		)
	}

	const heroTotalNumber = Number(data.kpi.total)
	const heroCount = HERO_STATUSES.reduce((sum, s) => sum + data.kpi.byStatus[s].count, 0)

	const openEditor = (
		e: React.MouseEvent<HTMLButtonElement>,
		weekId: string,
		weekLabel: string,
		projectId: string,
		projectName: string,
		entry: FinanceGridEntry | null
	) => {
		const rect = e.currentTarget.getBoundingClientRect()
		setEditor({ rect, weekId, weekLabel, projectId, projectName, entry })
	}

	const goPrev = () => {
		if (data.navigation.prev) {
			setNavDir('prev')
			navigate(`/finances/payments/month/${data.navigation.prev.id}`)
		}
	}
	const goNext = () => {
		if (data.navigation.next) {
			setNavDir('next')
			navigate(`/finances/payments/month/${data.navigation.next.id}`)
		}
	}
	const goToday = () => {
		setNavDir(null)
		navigate('/finances/payments')
	}

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Finances' }, { label: 'Payments · Grid', current: true }]}
				icon={<PaymentOutlined />}
				title='Weekly payments'
				subtitle='Track incoming revenue by fiscal months with a 4-4-5 rotation. Click a cell to edit its status, amount and note.'
				action={
					<HeaderRight>
						<Inscription>
							<InsciMuted>Cash-in,</InsciMuted>{' '}
							<InsciAccent>
								week by week
								<InsciSquiggle
									viewBox='0 0 120 10'
									preserveAspectRatio='none'
									aria-hidden='true'
								>
									<path
										d='M2 6 Q 15 1, 30 6 T 60 6 T 90 6 T 118 6'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
									/>
								</InsciSquiggle>
							</InsciAccent>
							<InsciDot>.</InsciDot>
						</Inscription>
					</HeaderRight>
				}
			>
				<HeroBlock>
					<HeroTopRow>
						<div>
							<HeroLabel>Expected total · {heroCount} entries</HeroLabel>
							<HeroValue>
								<CountMoney value={heroTotalNumber} duration={800} />
							</HeroValue>
						</div>
						<HeroInscription>
							<HeroInsciMuted>Money</HeroInsciMuted>{' '}
							<HeroInsciAccent>
								in motion
								<HeroInsciSquiggle
									viewBox='0 0 120 10'
									preserveAspectRatio='none'
									aria-hidden='true'
								>
									<path
										d='M2 6 Q 15 1, 30 6 T 60 6 T 90 6 T 118 6'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
									/>
								</HeroInsciSquiggle>
							</HeroInsciAccent>
							<HeroInsciDot>.</HeroInsciDot>
						</HeroInscription>
					</HeroTopRow>
					<div
						style={{
							marginTop: 22,
							paddingTop: 20,
							borderTop: '1px solid rgba(255,255,255,0.18)',
							position: 'relative',
							zIndex: 1,
						}}
					>
						<MonthPeekBar>
							<MonthPeekBtn type='button' disabled={!data.navigation.prev} onClick={goPrev}>
								<span className='chev'>
									<ArrowBackRounded />
								</span>
								<MonthPeekNameAnim
									key={`prev-${data.navigation.prev?.id ?? 'none'}`}
									className='name'
								>
									{data.navigation.prev?.label ?? '—'}
								</MonthPeekNameAnim>
							</MonthPeekBtn>
							<MonthPeekCenter key={data.month.id} $dir={navDir}>
								<span className='label'>{data.month.label}</span>
								<span className='range'>
									{formatShortDate(data.month.startDate)} –{' '}
									{formatShortDate(data.month.endDate)}
								</span>
							</MonthPeekCenter>
							<MonthPeekBtn
								$right
								type='button'
								disabled={!data.navigation.next}
								onClick={goNext}
							>
								<span className='chev'>
									<ArrowForwardRounded />
								</span>
								<MonthPeekNameAnim
									key={`next-${data.navigation.next?.id ?? 'none'}`}
									className='name'
								>
									{data.navigation.next?.label ?? '—'}
								</MonthPeekNameAnim>
							</MonthPeekBtn>
						</MonthPeekBar>
					</div>
					<HeroLegend>
						{HERO_STATUSES.map((s) => {
							const meta = STATUS_META[s]
							const bucket = data.kpi.byStatus[s]
							return (
								<HeroLegendItem key={s}>
									<HeroLegendLabel>{meta.label}</HeroLegendLabel>
									<HeroLegendValue>
										<CountMoney value={Number(bucket.total)} />
									</HeroLegendValue>
									<HeroLegendCount>{bucket.count} entries</HeroLegendCount>
								</HeroLegendItem>
							)
						})}
					</HeroLegend>
				</HeroBlock>

				<GridCard>
					<GridCardHead>
						<div className='title-row'>
							<h3>Projects × Weeks</h3>
							<LegendInline>
								{STATUS_ORDER.map((s) => {
									const meta = STATUS_META[s]
									return (
										<span className='chip' key={s}>
											<span className='dot' style={{ ['--c' as string]: meta.color }} />
											{meta.label}
										</span>
									)
								})}
							</LegendInline>
						</div>
						<HeadRightCluster>
							<CalcToggleBtn
								type='button'
								$active={calcMode}
								$hasSelection={selectionCount > 0}
								onClick={() => setCalcMode((v) => !v)}
								title={calcMode ? 'Exit selection mode' : 'Select payments to sum them up'}
								aria-label={
									calcMode
										? 'Done — exit selection mode'
										: 'Calculate — start selecting payments'
								}
							>
								<CalculateOutlined />
								<CalcBtnLabel>
									<span className='sizer' aria-hidden='true'>
										Calculate
									</span>
									<span key={calcMode ? 'on' : 'off'} className='text'>
										{calcMode ? 'Done' : 'Calculate'}
									</span>
								</CalcBtnLabel>
								{selectionCount > 0 && (
									<span className='count-badge'>{selectionCount}</span>
								)}
							</CalcToggleBtn>
							<AddProjectAnchor ref={addAnchorRef}>
								<AddProjectBtn
									type='button'
									$open={addOpen}
									$muted={hiddenProjectIds.size === 0}
									onClick={() => {
										if (hiddenProjectIds.size === 0) return
										setAddOpen((v) => !v)
									}}
									title={
										hiddenProjectIds.size === 0
											? 'All projects visible'
											: 'Add a project back to this month'
									}
								>
									<AddRounded />
									Add project
									{hiddenProjectIds.size > 0 ? ` (${hiddenProjectIds.size})` : ''}
								</AddProjectBtn>
								{addOpen && (
									<AddProjectMenu>
										{(() => {
											const hidden = data.projects.filter((p) =>
												hiddenProjectIds.has(p.id)
											)
											if (hidden.length === 0) {
												return <div className='empty'>All projects are visible</div>
											}
											return hidden.map((p) => (
												<button
													key={p.id}
													type='button'
													className='row'
													onClick={() => {
														showProject(p.id)
														if (hiddenProjectIds.size <= 1) setAddOpen(false)
													}}
												>
													<AddRounded />
													<span className='name'>
														{p.name}
														{p.clientName && (
															<span className='client'> · {p.clientName}</span>
														)}
													</span>
												</button>
											))
										})()}
									</AddProjectMenu>
								)}
							</AddProjectAnchor>
						</HeadRightCluster>
					</GridCardHead>
					{(() => {
						const today = new Date()
						today.setUTCHours(0, 0, 0, 0)
						const currentWeekId = data.weeks.find((w) => {
							const s = new Date(w.startDate)
							const e = new Date(w.endDate)
							return today >= s && today <= e
						})?.id
						const grandTotal = data.weeks.reduce((s, w) => s + (columnTotals[w.id] ?? 0), 0)
						const gridTemplate = `minmax(240px, 260px) repeat(${data.weeks.length}, minmax(128px, 1fr)) minmax(120px, 140px)`

						return (
							<GridScroller>
								<GridChart style={{ gridTemplateColumns: gridTemplate }}>
									<GridHeaderCorner>Project</GridHeaderCorner>
									{data.weeks.map((w) => (
										<GridHeaderWeek key={w.id} $current={w.id === currentWeekId}>
											<span className='wk'>Week {w.indexInMonth}</span>
											<span className='dates'>{w.label}</span>
										</GridHeaderWeek>
									))}
									<GridHeaderTotal>Month total</GridHeaderTotal>

									{data.projects
										.filter((p) => !hiddenProjectIds.has(p.id) || leavingIds.has(p.id))
										.map((p) => {
											const rowSum = data.weeks.reduce((s, w) => {
												const e = data.grid[p.id]?.[w.id]
												if (!e || !e.amount || e.status === 'no_work') return s
												return s + Number(e.amount)
											}, 0)
											const isLeaving = leavingIds.has(p.id)
											return (
												<RowBody key={p.id} $leaving={isLeaving}>
													<GridProjectCell>
														<div className='body'>
															<span className='name'>{p.name}</span>
															{p.clientName && (
																<span className='client'>{p.clientName}</span>
															)}
														</div>
														<button
															type='button'
															className='hide-btn'
															onClick={() => hideProject(p.id)}
															aria-label={`Hide ${p.name} for this month`}
															title='Hide from this month'
														>
															<VisibilityOffOutlined />
														</button>
													</GridProjectCell>
													{data.weeks.map((w) => {
														const entry = data.grid[p.id]?.[w.id] ?? null
														const meta = entry ? STATUS_META[entry.status] : null
														const hasMoney =
															!!entry &&
															!NO_AMOUNT_STATUSES.has(entry.status) &&
															entry.amount != null &&
															Number(entry.amount) > 0
														const isSelected = !!(
															entry && selectedAmounts[entry.id] !== undefined
														)
														return (
															<GridBodyCell key={w.id} $empty={!entry}>
																{entry && meta ? (
																	<GridBodyFill
																		$bg={meta.bg}
																		$fg={meta.fg}
																		$accent={meta.color}
																		$selected={isSelected}
																		data-cell-editor-anchor
																		disabled={calcMode && !hasMoney}
																		style={
																			calcMode && !hasMoney
																				? {
																						cursor: 'not-allowed',
																						opacity: 0.55,
																					}
																				: undefined
																		}
																		onClick={(e) => {
																			if (calcMode) {
																				if (hasMoney) {
																					toggleCellSelection(
																						entry.id,
																						Number(entry.amount)
																					)
																				}
																				return
																			}
																			openEditor(
																				e,
																				w.id,
																				w.label,
																				p.id,
																				p.name,
																				entry
																			)
																		}}
																	>
																		{isSelected && (
																			<span
																				className='selection-check'
																				aria-hidden='true'
																			>
																				<CheckRounded />
																			</span>
																		)}
																		{!NO_AMOUNT_STATUSES.has(entry.status) && (
																			<span className='amt'>
																				<CountMoneyOptional
																					value={entry.amount}
																				/>
																			</span>
																		)}
																		{entry.status !== 'expected_later' && (
																			<span className='st'>{meta.label}</span>
																		)}
																	</GridBodyFill>
																) : (
																	<button
																		type='button'
																		data-cell-editor-anchor
																		disabled={calcMode}
																		style={
																			calcMode
																				? {
																						cursor: 'not-allowed',
																						opacity: 0.45,
																					}
																				: undefined
																		}
																		onClick={(e) => {
																			if (calcMode) return
																			openEditor(
																				e,
																				w.id,
																				w.label,
																				p.id,
																				p.name,
																				null
																			)
																		}}
																	>
																		<span className='placeholder'>+</span>
																	</button>
																)}
															</GridBodyCell>
														)
													})}
													<GridRowTotalCell>
														<CountMoneyOptional value={rowSum} />
													</GridRowTotalCell>
												</RowBody>
											)
										})}

									<GridFooterCorner>Week total</GridFooterCorner>
									{data.weeks.map((w) => (
										<GridFooterCell key={w.id} $current={w.id === currentWeekId}>
											<CountMoneyOptional value={columnTotals[w.id] ?? 0} />
										</GridFooterCell>
									))}
									<GridFooterTotal>
										<CountMoneyOptional value={grandTotal} />
									</GridFooterTotal>
								</GridChart>
							</GridScroller>
						)
					})()}
				</GridCard>
			</ListPageShell>

			{editor && !calcMode && (
				<CellEditor
					key={`${editor.weekId}-${editor.projectId}`}
					anchor={editor.rect}
					weekId={editor.weekId}
					weekLabel={editor.weekLabel}
					projectId={editor.projectId}
					projectName={editor.projectName}
					initial={editor.entry}
					onClose={() => setEditor(null)}
				/>
			)}

			{panelMounted && (
				<CalcPanel $leaving={panelLeaving} role='status' aria-live='polite'>
					<CalcPanelStat>
						<span className='lbl'>Selected</span>
						<span className='val' key={`c-${selectionCount}`}>
							{selectionCount} {selectionCount === 1 ? 'payment' : 'payments'}
						</span>
					</CalcPanelStat>
					<CalcPanelDivider />
					<CalcPanelStat>
						<span className='lbl'>Total</span>
						<span className='val total'>
							<CountMoney value={selectionTotal} duration={420} />
						</span>
					</CalcPanelStat>
					<CalcPanelDivider />
					<CalcPanelBtn
						type='button'
						onClick={clearSelection}
						disabled={selectionCount === 0}
						title='Clear all selected payments'
					>
						<CloseRounded />
						Clear
					</CalcPanelBtn>
					{calcMode && (
						<CalcPanelBtn
							type='button'
							$variant='solid'
							onClick={() => setCalcMode(false)}
							title='Exit selection mode (selection is kept)'
						>
							<DoneAllRounded />
							Done
						</CalcPanelBtn>
					)}
					{!calcMode && selectionCount > 0 && (
						<CalcPanelBtn
							type='button'
							$variant='solid'
							onClick={() => setCalcMode(true)}
							title='Resume selection mode'
						>
							<CalculateOutlined />
							Resume
						</CalcPanelBtn>
					)}
				</CalcPanel>
			)}

			{isFetching && !editor && (
				<div
					style={{
						position: 'fixed',
						top: 12,
						right: 16,
						fontSize: 11,
						color: '#0369a1',
						fontWeight: 600,
						background: 'rgba(255,255,255,0.9)',
						padding: '4px 10px',
						borderRadius: 8,
						border: '1px solid #e0f2fe',
						zIndex: 100,
					}}
				>
					Refreshing…
				</div>
			)}
		</>
	)
}

export default FinancialMonthPage
