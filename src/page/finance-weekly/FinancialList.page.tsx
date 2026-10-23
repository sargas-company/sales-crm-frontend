import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	ListAltOutlined,
	OpenInNewRounded,
	MoneyOffOutlined,
	PaidOutlined,
	SearchOutlined,
	ClearRounded,
	ReceiptLongOutlined,
	TrendingUpOutlined,
	DateRangeOutlined,
	PersonOffOutlined,
} from '@mui/icons-material'

import DatePickerPill from './DatePickerPill'

import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import { DataTable, TableSkeleton, Actions, IconAction } from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../analytics/filters/filters.styled'
import {
	ClearBtn,
	InlineField,
	InlineSelect,
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import PermissionGate from '../../components/auth/PermissionGate'

import {
	FinanceRegistryRow,
	PaymentStatus,
	useGetPaymentsRegistryQuery,
	useGetFinanceProjectsSummaryQuery,
} from '../../store/finance-weekly/financeWeeklyApi'

import { STATUS_META } from './statusMeta'

const PAGE_SIZE = 50

const STATUS_ORDER: PaymentStatus[] = [
	'received',
	'in_transit',
	'expected_later',
	'planned_invoice',
]

type ScopePreset = 'thisMonth' | 'last3Months' | 'thisYear' | 'allTime' | 'custom'

function formatMoney(value: string | number | null, opts?: { cents?: boolean }): string {
	if (value === null || value === undefined) return '—'
	const num = typeof value === 'string' ? Number(value) : value
	if (Number.isNaN(num)) return '—'
	const cents = opts?.cents ?? false
	return num.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: cents ? 2 : 0,
		maximumFractionDigits: cents || num % 1 !== 0 ? 2 : 0,
	})
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

const AnimatedNum = ({
	value,
	format,
}: {
	value: number
	format: (n: number) => string
}) => {
	const v = useCountUp(value)
	const mirRef = useRef<HTMLSpanElement>(null)
	const [minWidth, setMinWidth] = useState<number | undefined>(undefined)

	useLayoutEffect(() => {
		if (!mirRef.current) return
		const w = mirRef.current.getBoundingClientRect().width
		setMinWidth((prev) => (prev == null ? w : Math.max(prev, w)))
	}, [value])

	return (
		<NumSlot style={minWidth != null ? { minWidth: `${minWidth}px` } : undefined}>
			<span className='mir' ref={mirRef} aria-hidden='true'>
				{format(value)}
			</span>
			<span className='vis'>{format(v)}</span>
		</NumSlot>
	)
}

const CountInt = ({ value }: { value: number }) => (
	<AnimatedNum value={value} format={(n) => Math.round(n).toLocaleString('en-US')} />
)

const CountMoney = ({ value, cents = false }: { value: number; cents?: boolean }) => (
	<AnimatedNum value={value} format={(n) => formatMoney(n, { cents })} />
)

function formatShortDate(iso: string | null): string | null {
	if (!iso) return null
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return null
	return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function toIsoDate(d: Date): string {
	return d.toISOString().slice(0, 10)
}

function computeRange(
	scope: ScopePreset,
	customFrom: string,
	customTo: string
): { from: string | undefined; to: string | undefined; label: string } {
	const today = new Date()
	today.setUTCHours(0, 0, 0, 0)

	if (scope === 'allTime') return { from: undefined, to: undefined, label: 'All time' }

	if (scope === 'custom') {
		return {
			from: customFrom || undefined,
			to: customTo || undefined,
			label:
				customFrom || customTo ? `${customFrom || '…'} — ${customTo || '…'}` : 'Custom range',
		}
	}

	if (scope === 'thisMonth') {
		const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
		const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
		return { from: toIsoDate(from), to: toIsoDate(to), label: 'This month' }
	}

	if (scope === 'last3Months') {
		const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1))
		return { from: toIsoDate(from), to: toIsoDate(today), label: 'Last 3 months' }
	}

	// thisYear
	const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
	const to = new Date(Date.UTC(today.getUTCFullYear(), 11, 31))
	return { from: toIsoDate(from), to: toIsoDate(to), label: 'This year' }
}

const SCOPE_VALUES: ScopePreset[] = [
	'thisMonth',
	'last3Months',
	'thisYear',
	'allTime',
	'custom',
]

const FinancialPaymentsListPage = () => {
	const navigate = useNavigate()

	const [searchParams, setSearchParams] = useSearchParams()

	const [scope, setScope] = useState<ScopePreset>(() => {
		const v = searchParams.get('scope')
		return v && (SCOPE_VALUES as string[]).includes(v) ? (v as ScopePreset) : 'last3Months'
	})
	const [customFrom, setCustomFrom] = useState(() => searchParams.get('from') ?? '')
	const [customTo, setCustomTo] = useState(() => searchParams.get('to') ?? '')
	const [status, setStatus] = useState<PaymentStatus | ''>(
		() => (searchParams.get('status') as PaymentStatus | null) ?? ''
	)
	const [projectId, setProjectId] = useState<string>(() => searchParams.get('project') ?? '')
	const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
	const [page, setPage] = useState(() => {
		const p = Number(searchParams.get('page'))
		return Number.isFinite(p) && p > 0 ? p : 1
	})
	const [sort, setSort] = useState<SortState | null>({
		key: 'weekStart',
		direction: 'desc',
	})

	// Sliding tape indicator for the Status TapePills row.
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number; opacity: number }>({
		left: 0,
		width: 0,
		opacity: 0,
	})
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>('[data-active="true"]')
		if (el) {
			setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
		}
	}, [status])

	useEffect(() => {
		const next = new URLSearchParams()
		if (scope !== 'last3Months') next.set('scope', scope)
		if (scope === 'custom') {
			if (customFrom) next.set('from', customFrom)
			if (customTo) next.set('to', customTo)
		}
		if (status) next.set('status', status)
		if (projectId) next.set('project', projectId)
		if (search) next.set('q', search)
		if (page !== 1) next.set('page', String(page))
		setSearchParams(next, { replace: true })
	}, [scope, customFrom, customTo, status, projectId, search, page, setSearchParams])

	const range = useMemo(
		() => computeRange(scope, customFrom, customTo),
		[scope, customFrom, customTo]
	)

	const activeStatusLabel = status ? STATUS_META[status].label : 'ALL'

	const activeFilterCount = useMemo(() => {
		return [
			search.trim() ? 1 : 0,
			status ? 1 : 0,
			projectId ? 1 : 0,
			scope !== 'last3Months' ? 1 : 0,
			scope === 'custom' && customFrom ? 1 : 0,
			scope === 'custom' && customTo ? 1 : 0,
		].reduce((a, b) => a + b, 0)
	}, [search, status, projectId, scope, customFrom, customTo])

	const clearAll = () => {
		setSearch('')
		setStatus('')
		setProjectId('')
		setScope('last3Months')
		setCustomFrom('')
		setCustomTo('')
		setPage(1)
	}

	const { data, isLoading, isError, refetch, isFetching } = useGetPaymentsRegistryQuery({
		from: range.from,
		to: range.to,
		status: status || undefined,
		projectId: projectId || undefined,
		search: search || undefined,
		page,
		pageSize: PAGE_SIZE,
	})

	const { data: projectsSummary } = useGetFinanceProjectsSummaryQuery()

	const rows = data?.rows ?? []
	const total = data?.pagination.total ?? 0

	const stats = useMemo(() => {
		const withAmount = rows.filter((r) => r.amount && Number(r.amount) > 0)
		const totalSum = withAmount.reduce((s, r) => s + Number(r.amount ?? 0), 0)
		const avg = withAmount.length ? totalSum / withAmount.length : 0
		return {
			count: rows.length,
			withAmount: withAmount.length,
			total: totalSum,
			avg,
		}
	}, [rows])

	const columns: DataTableColumn<FinanceRegistryRow>[] = [
		{
			key: 'monthLabel',
			label: 'Month',
			sortable: true,
			sortValue: (r) => r.weekStart,
			render: (r) => <MonthBadge>{r.monthLabel}</MonthBadge>,
			skeleton: () => <TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'weekStart',
			label: 'Week',
			sortable: true,
			sortValue: (r) => r.weekStart,
			render: (r) => <MonoCell>{r.weekLabel}</MonoCell>,
			skeleton: () => <TableSkeleton $w='120px' $h='14px' />,
		},
		{
			key: 'projectName',
			label: 'Project',
			sortable: true,
			sortValue: (r) => r.projectName,
			render: (r) => <ProjectName>{r.projectName}</ProjectName>,
			skeleton: () => <TableSkeleton $w='180px' $h='14px' />,
		},
		{
			key: 'clientName',
			label: 'Client',
			sortable: true,
			sortValue: (r) => r.clientName ?? '',
			render: (r) =>
				r.clientName ? (
					<ClientName>{r.clientName}</ClientName>
				) : (
					<EmptyBadge title='No client linked to this project'>
						<PersonOffOutlined />
						No client
					</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'status',
			label: 'Status',
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => {
				const meta = STATUS_META[r.status]
				return (
					<StatusPill $bg={meta.bg} $fg={meta.fg} $accent={meta.color}>
						{meta.label}
					</StatusPill>
				)
			},
			skeleton: () => <TableSkeleton $w='96px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'amount',
			label: 'Amount',
			sortable: true,
			sortValue: (r) => (r.amount ? Number(r.amount) : 0),
			render: (r) => {
				const hasAmount = r.amount !== null && r.amount !== undefined && Number(r.amount) > 0
				if (!hasAmount) {
					return (
						<EmptyBadge title='No amount recorded'>
							<MoneyOffOutlined />
							No amount
						</EmptyBadge>
					)
				}
				const invoice = formatShortDate(r.invoiceSentAt)
				const received = formatShortDate(r.receivedAt)
				return (
					<AmountCellWrap>
						<span className='money'>{formatMoney(r.amount)}</span>
						{(invoice || received) && (
							<span className='dates'>
								{received && <span className='received'>received {received}</span>}
								{received && invoice && <span className='sep'> · </span>}
								{invoice && !received && (
									<span className='invoice'>invoiced {invoice}</span>
								)}
							</span>
						)}
					</AmountCellWrap>
				)
			},
			skeleton: () => <TableSkeleton $w='80px' $h='14px' />,
		},
		{
			key: 'actions',
			label: '',
			render: (r) => (
				<Actions>
					<PermissionGate permission='finances_weekly:view'>
						<IconAction
							as='button'
							type='button'
							onClick={() => navigate(`/finances/payments/month/${r.monthId}`)}
							aria-label={`Open ${r.projectName} in grid`}
							title='Open in grid'
						>
							<OpenInNewRounded />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	const scopeOptions = [
		{ value: 'thisMonth', label: 'This month' },
		{ value: 'last3Months', label: 'Last 3 months' },
		{ value: 'thisYear', label: 'This year' },
		{ value: 'allTime', label: 'All time' },
		{ value: 'custom', label: 'Custom' },
	]

	return (
		<ListPageShell
			crumbs={[{ label: 'Finances' }, { label: 'Payments · Registry', current: true }]}
			icon={<ListAltOutlined />}
			title='Payments'
			subtitle='Full registry of payment entries — search and filter across months. For editing, open the grid.'
			action={
				<HeaderHint aria-hidden='true'>
					<HintMuted>every</HintMuted>
					<HintAccentWrap>
						<HintAccent>payment</HintAccent>
						<svg
							width='120'
							height='12'
							viewBox='0 0 120 12'
							preserveAspectRatio='none'
						>
							<path
								d='M2 8 Q 15 2, 30 8 T 60 8 T 90 8 T 118 8'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
							/>
						</svg>
					</HintAccentWrap>
					<HintMuted>accounted</HintMuted>
				</HeaderHint>
			}
			filters={
				<>
					<FiltersBlock role='region' aria-label='Payments filters'>
						<TopFilterRow>
							<StatusGroup>
								<div className='filter-lead'>
									<span className='lead-icon'>
										<PaidOutlined />
									</span>
									<div className='lead-text'>
										<span className='top'>Status</span>
										<span className='bot'>{activeStatusLabel}</span>
									</div>
								</div>

								<TapePills ref={pillsRef} role='tablist' aria-label='Status'>
									<TapeIndicator
										style={{
											transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
											width: `${ind.width}px`,
											opacity: ind.opacity,
										}}
									/>
									{[{ value: '', label: 'All' }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))].map((opt) => (
										<TapePill
											key={opt.value || 'all'}
											type='button'
											role='tab'
											data-active={status === opt.value || undefined}
											aria-selected={status === opt.value}
											$active={status === opt.value}
											onClick={() => {
												setStatus(opt.value as PaymentStatus | '')
												setPage(1)
											}}
										>
											{opt.label}
										</TapePill>
									))}
								</TapePills>
							</StatusGroup>

							<SearchPill className='search'>
								<SearchOutlined className='ico' />
								<input
									type='text'
									name='search-payments'
									placeholder='Search'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value)
										setPage(1)
									}}
									aria-label='Search payments by project, client or note'
								/>
							</SearchPill>
						</TopFilterRow>

						<BottomFilterRow>
							<InlineField>
								<span className='l'>Project</span>
								<InlineSelect
									value={projectId}
									onChange={(e) => {
										setProjectId(e.target.value)
										setPage(1)
									}}
								>
									<option value=''>All projects</option>
									{(projectsSummary ?? []).map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
											{p.clientName ? ` — ${p.clientName}` : ''}
										</option>
									))}
								</InlineSelect>
							</InlineField>

							<InlineField>
								<span className='l'>Scope</span>
								<InlineSelect
									value={scope}
									onChange={(e) => {
										setScope(e.target.value as ScopePreset)
										setPage(1)
									}}
								>
									{scopeOptions.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</InlineSelect>
							</InlineField>

							<RangeGroup aria-label='Date range'>
								<DatePickerPill
									label='From'
									value={customFrom}
									max={customTo || undefined}
									placeholder='Any'
									accent='orange'
									size='lg'
									onChange={(v) => {
										setCustomFrom(v)
										if (v) setScope('custom')
										setPage(1)
									}}
								/>
								<RangeDash aria-hidden='true'>—</RangeDash>
								<DatePickerPill
									label='To'
									value={customTo}
									min={customFrom || undefined}
									placeholder='Any'
									accent='orange'
									size='lg'
									onChange={(v) => {
										setCustomTo(v)
										if (v) setScope('custom')
										setPage(1)
									}}
								/>
							</RangeGroup>

							<ClearBtn
								className='clear'
								type='button'
								onClick={clearAll}
								disabled={activeFilterCount === 0}
							>
								<ClearRounded style={{ fontSize: 15 }} />
								Clear
							</ClearBtn>
						</BottomFilterRow>
					</FiltersBlock>

					{!isLoading && rows.length > 0 && (
						<KpiRow>
							<KpiCard>
								<KpiIcon>
									<ReceiptLongOutlined />
								</KpiIcon>
								<KpiBody>
									<KpiLabel>Total entries</KpiLabel>
									<KpiNum>
										<CountInt value={total} />
									</KpiNum>
								</KpiBody>
							</KpiCard>
							<KpiCard>
								<KpiIcon>
									<PaidOutlined />
								</KpiIcon>
								<KpiBody>
									<KpiLabel>Sum</KpiLabel>
									<KpiNum>
										<CountMoney value={stats.total} cents />
									</KpiNum>
								</KpiBody>
							</KpiCard>
							<KpiCard>
								<KpiIcon>
									<TrendingUpOutlined />
								</KpiIcon>
								<KpiBody>
									<KpiLabel>Average</KpiLabel>
									<KpiNum>
										<CountMoney value={stats.avg} />
									</KpiNum>
								</KpiBody>
							</KpiCard>
							<KpiCard>
								<KpiIcon>
									<DateRangeOutlined />
								</KpiIcon>
								<KpiBody>
									<KpiLabel>Scope</KpiLabel>
									<KpiNum className='text'>{range.label}</KpiNum>
								</KpiBody>
							</KpiCard>
						</KpiRow>
					)}
				</>
			}
		>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				searchActive={!!search || !!status || !!projectId || scope !== 'allTime'}
				sort={sort}
				onSortChange={(next) => {
					setSort(next)
					setPage(1)
				}}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
				emptyTitle='No entries yet'
				emptyTitleSearch='No entries match your filters'
			/>
		</ListPageShell>
	)
}

export default FinancialPaymentsListPage

/* ── Styled ─────────────────────────────────────────────────────── */

/* Blue handwritten header callout — same visual family as the orange
 * upwork-hint used on other list pages, but tinted sky-blue to match
 * the Payments domain accent. */
const BLUE_INK = '#0f172a'
const BLUE_ACCENT = '#0369a1'

const HeaderHint = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	pointer-events: none;
	color: ${BLUE_INK};

	@media (max-width: 900px) {
		display: none;
	}
`

const HintMuted = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 28px;
	line-height: 1;
	letter-spacing: 0.2px;
	color: ${BLUE_INK};
`

const HintAccentWrap = styled.span`
	position: relative;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	padding-bottom: 4px;
`

const HintAccent = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 32px;
	line-height: 1;
	letter-spacing: 0.3px;
	color: ${BLUE_ACCENT};
`

const FiltersBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin-top: 12px;
	width: 100%;
`

const TopFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px 16px;
	min-height: 56px;
	width: 100%;

	.search {
		flex: 0 1 260px;
		min-width: 180px;
	}
	.search input {
		width: 100%;
	}
`

/* Ported from JobPostList's DecisionGroup — dark lead chip + icon
 * sitting next to the TapePills row. */
const StatusGroup = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	flex: 0 1 auto;
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

const BottomFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 10px 12px;
	width: 100%;

	.clear {
		margin-left: auto;
	}
`

const RangeGroup = styled.div`
	display: inline-flex;
	align-items: flex-end;
	gap: 10px;
	align-self: flex-end;
	padding: 4px 10px;
	border: 1px dashed rgba(36, 30, 22, 0.14);
	border-radius: 14px;
`

const RangeDash = styled.span`
	align-self: flex-end;
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

const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
	margin-top: 14px;
	width: 100%;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	@media (max-width: 520px) {
		grid-template-columns: minmax(0, 1fr);
	}
`

const KpiCard = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	width: 100%;
	min-width: 0;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`

const KpiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 46px;
	border-radius: 12px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 26px;
	}
`

const KpiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const KpiLabel = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.55px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const KpiNum = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 30px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.05;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.7px;

	&.text {
		font-family: inherit;
		font-size: 18px;
		letter-spacing: -0.3px;
	}
`

const NumSlot = styled.span`
	position: relative;
	display: inline-block;
	white-space: nowrap;
	vertical-align: baseline;
	font-variant-numeric: tabular-nums;
	transition: min-width 420ms cubic-bezier(0.22, 1, 0.36, 1);

	.mir {
		position: absolute;
		left: 0;
		top: 0;
		visibility: hidden;
		pointer-events: none;
		user-select: none;
		white-space: nowrap;
	}
	.vis {
		display: inline-block;
	}
`

const MonoCell = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	color: #475569;
	white-space: nowrap;
`

const MonthBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
`

const EmptyBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.06);
	color: #64748b;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;

	svg {
		font-size: 15px;
		opacity: 0.7;
	}
`

const ProjectName = styled.span`
	display: inline-block;
	font-weight: 600;
	color: #0f172a;
	font-size: 13.5px;
	letter-spacing: -0.2px;
	white-space: nowrap;
`

const ClientName = styled.span`
	display: inline-block;
	font-size: 13px;
	color: #334155;
	white-space: nowrap;
`

const NoteCell = styled.span`
	display: inline-block;
	max-width: 320px;
	color: #64748b;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	vertical-align: middle;
`

const AmountCellWrap = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.2;

	.money {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 700;
		color: #0f172a;
		font-size: 13.5px;
		white-space: nowrap;
		letter-spacing: -0.2px;
	}
	.dates {
		font-size: 10.5px;
		color: #94a3b8;
		white-space: nowrap;
		letter-spacing: 0.1px;
	}
	.received {
		color: #4a8f74;
		font-weight: 600;
	}
	.invoice {
		color: #6f7681;
		font-weight: 600;
	}
	.sep {
		color: #cbd5e1;
	}
`

const StatusPill = styled.span<{ $bg: string; $fg: string; $accent: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	white-space: nowrap;
`
