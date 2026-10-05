import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ListAltOutlined,
	FileDownloadOutlined,
	ExpandMoreRounded,
	OpenInNewRounded,
	DateRangeOutlined,
	FilterAltOutlined,
} from '@mui/icons-material'

import DatePickerPill from './DatePickerPill'

import { ListPageShell } from '../../components/_shared/ListPageShell'
import { DataTable, TableSkeleton, Actions, IconAction } from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import { PrimaryGhostButton } from '../../components/_shared/formShell.styled'
import { useToast } from '../../context/toast/ToastContext'
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
	const { showToast } = useToast()

	const [searchParams, setSearchParams] = useSearchParams()

	const [scope, setScope] = useState<ScopePreset>(() => {
		const v = searchParams.get('scope')
		return v && (SCOPE_VALUES as string[]).includes(v) ? (v as ScopePreset) : 'last3Months'
	})
	const [customFrom, setCustomFrom] = useState(() => searchParams.get('from') ?? '')
	const [customTo, setCustomTo] = useState(() => searchParams.get('to') ?? '')
	const [customReady, setCustomReady] = useState(false)
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

	useEffect(() => {
		if (scope === 'custom') {
			const t = setTimeout(() => setCustomReady(true), 330)
			return () => clearTimeout(t)
		}
		setCustomReady(false)
	}, [scope])

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

	const buildCsv = (): string => {
		const lines: string[] = []
		lines.push('month,week,project,client,status,amount,invoiceSentAt,receivedAt,note')
		for (const r of rows) {
			const escape = (v: string | null) =>
				v && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : (v ?? '')
			lines.push(
				[
					escape(r.monthLabel),
					escape(r.weekLabel),
					escape(r.projectName),
					escape(r.clientName),
					r.status,
					r.amount ?? '',
					r.invoiceSentAt ?? '',
					r.receivedAt ?? '',
					escape(r.note),
				].join(',')
			)
		}
		return lines.join('\n')
	}

	const downloadCsv = () => {
		if (!data) return
		const csv = buildCsv()
		const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const fname = `payments-${range.label
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')}-${new Date().toISOString().slice(0, 10)}.csv`
		const a = document.createElement('a')
		a.href = url
		a.download = fname
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		const n = rows.length
		showToast?.(`Downloaded ${fname} — ${n} ${n === 1 ? 'row' : 'rows'}`, 'success')
	}

	const columns: DataTableColumn<FinanceRegistryRow>[] = [
		{
			key: 'monthLabel',
			label: 'Month',
			sortable: true,
			sortValue: (r) => r.weekStart,
			render: (r) => <MonthBadge>{r.monthLabel}</MonthBadge>,
			skeleton: () => <TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 8 }} />,
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
			render: (r) => (
				<ProjectCellWrap>
					<span className='name'>{r.projectName}</span>
					{r.clientName && <span className='client'>{r.clientName}</span>}
				</ProjectCellWrap>
			),
			skeleton: () => (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<TableSkeleton $w='180px' $h='14px' />
					<TableSkeleton $w='120px' $h='11px' />
				</div>
			),
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
						<span className='dot' />
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
			key: 'note',
			label: 'Note',
			render: (r) => <NoteCell title={r.note ?? undefined}>{r.note ?? '—'}</NoteCell>,
			skeleton: () => <TableSkeleton $w='200px' $h='14px' />,
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
			subtitle='Full registry of payment entries — search, filter and export across months. For editing, open the grid.'
			action={
				<ActionRow>
					<CopyGhostButton
						type='button'
						onClick={downloadCsv}
						disabled={!data || rows.length === 0}
						title='Download current page as a CSV file'
					>
						<FileDownloadOutlined />
						Download CSV
					</CopyGhostButton>
				</ActionRow>
			}
			searchPlaceholder='Search project, client or note'
			search={search}
			onSearchChange={(v) => {
				setSearch(v)
				setPage(1)
			}}
			filters={
				<>
					<ProjectPill>
						<ProjectPillLbl>Project</ProjectPillLbl>
						<ProjectPillText>
							{projectId
								? (projectsSummary?.find((p) => p.id === projectId)?.name ?? 'Selected')
								: 'All projects'}
						</ProjectPillText>
						<ProjectPillChev>
							<ExpandMoreRounded style={{ fontSize: 16 }} />
						</ProjectPillChev>
						<ProjectPillSelect
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
						</ProjectPillSelect>
					</ProjectPill>
					{!isLoading && rows.length > 0 && (
						<StatsBar>
							<StatsItem>
								<span className='lbl'>Total</span>
								<span className='val'>
									<CountInt value={total} />
								</span>
							</StatsItem>
							<StatsDivider />
							<StatsItem>
								<span className='lbl'>Sum</span>
								<span className='val strong'>
									<CountMoney value={stats.total} cents />
								</span>
							</StatsItem>
							<StatsDivider />
							<StatsItem>
								<span className='lbl'>Avg</span>
								<span className='val'>
									<CountMoney value={stats.avg} />
								</span>
							</StatsItem>
							<StatsDivider />
							<StatsItem className='scope'>
								<span className='lbl'>Scope</span>
								<span className='val'>{range.label}</span>
							</StatsItem>
						</StatsBar>
					)}
					<FiltersRow>
					<FilterInline>
						<FilterGroup>
							<GroupLabel>
								<FilterAltOutlined style={{ fontSize: 15 }} /> Status
							</GroupLabel>
							<AnimatedSegmented
								items={[
									{ value: '', label: 'All' },
									...STATUS_ORDER.map((s) => ({
										value: s,
										label: STATUS_META[s].label,
										color: STATUS_META[s].color,
									})),
								]}
								active={status}
								onSelect={(v) => {
									setStatus(v as PaymentStatus | '')
									setPage(1)
								}}
							/>
						</FilterGroup>

						<FilterGroup className='align-right'>
							<GroupLabel>
								<DateRangeOutlined style={{ fontSize: 15 }} /> Scope
							</GroupLabel>
							<AnimatedSegmented
								items={scopeOptions}
								active={scope}
								onSelect={(v) => {
									setScope(v as ScopePreset)
									setPage(1)
								}}
							/>
						</FilterGroup>
					</FilterInline>

					<CustomRange
						data-open={scope === 'custom' ? 'true' : 'false'}
						data-ready={customReady ? 'true' : 'false'}
						aria-hidden={scope !== 'custom'}
					>
						<DatePickerPill
							label='From'
							value={customFrom}
							max={customTo || undefined}
							placeholder='Start date'
							tabIndex={scope === 'custom' ? 0 : -1}
							onChange={(v) => {
								setCustomFrom(v)
								setPage(1)
							}}
						/>
						<RangeSep aria-hidden='true'>
							<svg width='16' height='12' viewBox='0 0 24 16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<path d='M2 8h20M16 2l6 6-6 6' />
							</svg>
						</RangeSep>
						<DatePickerPill
							label='To'
							value={customTo}
							min={customFrom || undefined}
							placeholder='End date'
							tabIndex={scope === 'custom' ? 0 : -1}
							onChange={(v) => {
								setCustomTo(v)
								setPage(1)
							}}
						/>
					</CustomRange>
				</FiltersRow>
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

const ActionRow = styled.div`
	display: inline-flex;
	gap: 8px;
	align-items: center;
`

const CopyGhostButton = styled(PrimaryGhostButton)`
	svg {
		transform-origin: 60% 40%;
		transition:
			scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1),
			rotate 300ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.15;
		rotate: -6deg;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			scale: 1;
			rotate: 0deg;
		}
	}
`

const FiltersRow = styled.div`
	flex: 1 1 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 14px;
	margin-top: 12px;
`

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-width: 0;

	&.align-right {
		margin-left: auto;
		align-items: flex-end;
	}
`

const FilterInline = styled.div`
	width: 100%;
	display: flex;
	align-items: flex-end;
	gap: 16px;
	flex-wrap: wrap;
`

const GroupLabel = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: #64748b;
`

const CustomRange = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	overflow: hidden;
	max-height: 0;
	opacity: 0;
	transform: translateY(-4px);
	transition:
		max-height 320ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms ease,
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
		margin-top 320ms cubic-bezier(0.22, 1, 0.36, 1);
	margin-top: 0;
	pointer-events: none;

	&[data-open='true'] {
		max-height: 80px;
		opacity: 1;
		transform: translateY(0);
		margin-top: 4px;
		pointer-events: auto;
	}

	&[data-ready='true'] {
		overflow: visible;
	}
`

const arrowPulse = keyframes`
	0%, 100% { transform: translateX(0); }
	50%      { transform: translateX(2px); }
`

const RangeSep = styled.span`
	display: inline-flex;
	align-items: center;
	color: #94a3b8;
	user-select: none;

	svg {
		animation: ${arrowPulse} 2200ms ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			animation: none;
		}
	}
`


const ProjectPill = styled.label`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 14px 6px 12px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #252d3a;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		transform: translateY(-1px);
	}
`

const ProjectPillLbl = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: #94a3b8;
`

const ProjectPillText = styled.span`
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const ProjectPillChev = styled.span`
	display: inline-flex;
	align-items: center;
	color: #a5a1b0;
`

const ProjectPillSelect = styled.select`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0;
	cursor: pointer;
	border: none;
	outline: none;
	appearance: none;
	-webkit-appearance: none;
	background: transparent;
`

const StatsBar = styled.div`
	display: flex;
	align-items: center;
	gap: 22px;
	flex-wrap: wrap;
	margin-left: auto;
	padding: 10px 16px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
`

const StatsItem = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 3px;
	line-height: 1;

	&.scope {
		min-width: 110px;
	}

	.lbl {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: #64748b;
	}
	.val {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		letter-spacing: -0.2px;
	}
	.val.strong {
		font-size: 18px;
		font-weight: 700;
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

const StatsDivider = styled.span`
	width: 1px;
	height: 30px;
	background: rgba(15, 23, 42, 0.08);
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
	border-radius: 8px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: -0.2px;
	white-space: nowrap;
`

const ProjectCellWrap = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.2;

	.name {
		font-weight: 600;
		color: #0f172a;
		font-size: 13.5px;
		white-space: nowrap;
		letter-spacing: -0.2px;
	}
	.client {
		font-size: 11.5px;
		color: #64748b;
		white-space: nowrap;
	}
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
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	white-space: nowrap;

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${(p) => p.$accent};
	}
`
