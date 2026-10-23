import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	LocalOfferOutlined,
	DeleteOutline,
	EditOutlined,
	AddRounded,
	SearchOutlined,
	ClearRounded,
	HourglassEmptyOutlined,
	TrendingUpOutlined,
	TrendingFlatOutlined,
	ScheduleOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import { TapeIndicator, TapePill, TapePills } from '../analytics/filters/filters.styled'
import {
	ClearBtn,
	InlineField,
	InlineSelect,
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import BulkActionBar from '../../components/_shared/BulkActionBar'
import { useToast } from '../../context/toast/ToastContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import {
	useGetSalaryReviewsQuery,
	useDeleteSalaryReviewMutation,
	type SalaryReview,
	type SalaryReviewResult,
	type SalaryReviewSortBy,
	type SalaryReviewStatus,
} from '../../store/salary-reviews/salaryReviewsApi'

const PAGE_SIZE = 20

const RESULT_META: Record<
	SalaryReviewResult,
	{ label: string; color: string; bg: string; icon: JSX.Element }
> = {
	INCREASED: {
		label: 'Increased',
		color: '#059669',
		bg: 'rgba(16, 185, 129, 0.15)',
		icon: <TrendingUpOutlined style={{ fontSize: 12 }} />,
	},
	NO_CHANGE: {
		label: 'No change',
		color: '#5a5476',
		bg: '#f0edf9',
		icon: <TrendingFlatOutlined style={{ fontSize: 12 }} />,
	},
	POSTPONED: {
		label: 'Postponed',
		color: '#b45309',
		bg: 'rgba(217, 119, 6, 0.15)',
		icon: <ScheduleOutlined style={{ fontSize: 12 }} />,
	},
}

const fmt = (v: string | number | null | undefined): string => {
	if (v == null) return '—'
	const n = typeof v === 'string' ? parseFloat(v) : v
	if (!isFinite(n)) return '—'
	return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Render a YYYY-MM-DD string as "Sep 15, 2026" without letting the local
// timezone push the day around (the backend sends date-only, tz-agnostic).
const fmtDay = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
	if (!m) return iso
	const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	})
}

const Promotions = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [status, setStatus] = useState<SalaryReviewStatus | ''>('')
	const [resultFilter, setResultFilter] = useState<SalaryReviewResult | ''>('')
	const [sort, setSort] = useState<SortState | null>({
		key: 'scheduledDate',
		direction: 'desc',
	})
	const [page, setPage] = useState(1)
	const [toDelete, setToDelete] = useState<SalaryReview | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)
	const [bulkDeleting, setBulkDeleting] = useState(false)

	useEffect(() => setPage(1), [search, status, resultFilter])

	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number; opacity: number }>({
		left: 0,
		width: 0,
		opacity: 0,
	})
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>('[data-active="true"]')
		if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
	}, [resultFilter])

	const activeResultLabel =
		resultFilter === 'INCREASED' ? 'INCREASED'
			: resultFilter === 'NO_CHANGE' ? 'NO CHANGE'
			: resultFilter === 'POSTPONED' ? 'POSTPONED'
			: 'ALL'

	const activeFilterCount =
		(search ? 1 : 0) + (status ? 1 : 0) + (resultFilter ? 1 : 0)

	const clearAll = () => {
		setSearchInput('')
		setStatus('')
		setResultFilter('')
	}

	const selectionCtx = {
		selected,
		onToggleRow: (id: string, next: boolean) => {
			setSelected((prev) => {
				const nextSet = new Set(prev)
				if (next) nextSet.add(id)
				else nextSet.delete(id)
				return nextSet
			})
		},
		onToggleAllOnPage: (pageRows: SalaryReview[], next: boolean) => {
			setSelected((prev) => {
				const nextSet = new Set(prev)
				for (const r of pageRows) {
					if (next) nextSet.add(r.id)
					else nextSet.delete(r.id)
				}
				return nextSet
			})
		},
		headerLabel: 'Select all reviews on this page',
		rowLabel: (r: SalaryReview) =>
			`Select review for ${r.employee.firstName} ${r.employee.lastName}`,
	}

	const runBulkDelete = async () => {
		if (selected.size === 0) return
		setBulkDeleting(true)
		const ids = [...selected]
		const results = await Promise.allSettled(
			ids.map((id) => deleteReview(id).unwrap()),
		)
		const succeeded = new Set<string>()
		let failedCount = 0
		results.forEach((r, i) => {
			if (r.status === 'fulfilled') succeeded.add(ids[i])
			else failedCount++
		})
		/* Prune succeeded ids from the selection so a re-confirm never
		 * retries ones that are already gone (would 404). Failed ids
		 * stay selected so the user can see and retry them. */
		setSelected((prev) => {
			const next = new Set(prev)
			for (const id of succeeded) next.delete(id)
			return next
		})
		if (failedCount === 0) {
			showToast(`Deleted ${ids.length} reviews`, 'success')
		} else if (succeeded.size === 0) {
			showToast(`Failed to delete ${failedCount} reviews`, 'error')
		} else {
			showToast(
				`Deleted ${succeeded.size} of ${ids.length} · ${failedCount} failed`,
				'error',
			)
		}
		setBulkOpen(false)
		setBulkDeleting(false)
	}

	const { data, isLoading, isError, refetch } = useGetSalaryReviewsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: status || undefined,
		result: resultFilter || undefined,
		sortBy: (sort?.key as SalaryReviewSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteReview, { isLoading: deleting }] = useDeleteSalaryReviewMutation()

	const rows = data?.data ?? []
	const total = data?.total ?? 0

	const stats = useMemo(() => {
		let pending = 0
		let increased = 0
		let noChange = 0
		let postponed = 0
		let raiseSum = 0
		let raiseCount = 0
		for (const r of rows) {
			if (r.result === null || r.result === undefined) pending++
			else if (r.result === 'INCREASED') {
				increased++
				const p = parseFloat(r.previousRate ?? '0')
				const n = parseFloat(r.newRate ?? '0')
				if (p > 0 && n > 0) {
					raiseSum += ((n - p) / p) * 100
					raiseCount++
				}
			} else if (r.result === 'NO_CHANGE') noChange++
			else if (r.result === 'POSTPONED') postponed++
		}
		return {
			pending,
			increased,
			noChange,
			postponed,
			avgRaise: raiseCount > 0 ? raiseSum / raiseCount : 0,
			raiseCount,
		}
	}, [rows])

	const columns: DataTableColumn<SalaryReview>[] = [
		{
			key: 'employee',
			label: 'Employee',
			sortable: true,
			sortValue: (r) => `${r.employee.firstName} ${r.employee.lastName}`,
			render: (r) => (
				<NameText>
					{r.employee.firstName} {r.employee.lastName}
				</NameText>
			),
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'scheduledDate',
			label: 'Scheduled',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => new Date(r.scheduledDate),
			render: (r) => <Mono>{fmtDay(r.scheduledDate)}</Mono>,
			skeleton: () => <TableSkeleton $w='110px' $h='14px' />,
		},
		{
			key: 'result',
			label: 'Result',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => r.result ?? 'zzz-pending',
			render: (r) =>
				r.result ? (
					<ResultPill $tone={r.result}>{RESULT_META[r.result].label}</ResultPill>
				) : (
					<PendingPill>
						<HourglassEmptyOutlined />
						Pending
					</PendingPill>
				),
			skeleton: () => <TableSkeleton $w='90px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'rates',
			label: 'Old → New',
			minWidth: 200,
			render: (r) =>
				r.previousRate || r.newRate ? (
					<RateFlow>
						<RateNode>
							{r.previousRate ? (
								<>
									<RateVal>${fmt(r.previousRate)}</RateVal>
									<RateTag>{r.previousRateType === 'HOURLY' ? '/h' : '/mo'}</RateTag>
								</>
							) : (
								<EmptyBadge>N/A</EmptyBadge>
							)}
						</RateNode>
						<Arrow>→</Arrow>
						<RateNode>
							{r.newRate ? (
								<>
									<RateVal $accent>${fmt(r.newRate)}</RateVal>
									<RateTag>{r.newRateType === 'HOURLY' ? '/h' : '/mo'}</RateTag>
								</>
							) : (
								<EmptyBadge>N/A</EmptyBadge>
							)}
						</RateNode>
					</RateFlow>
				) : (
					<EmptyBadge title='No rates recorded'>Not set</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'newRate',
			label: 'Δ',
			minWidth: 80,
			sortable: true,
			sortValue: (r) => {
				if (!r.previousRate || !r.newRate) return -Infinity
				const p = parseFloat(r.previousRate)
				const n = parseFloat(r.newRate)
				if (!p) return -Infinity
				return ((n - p) / p) * 100
			},
			render: (r) => {
				if (!r.previousRate || !r.newRate) return <EmptyBadge>—</EmptyBadge>
				const p = parseFloat(r.previousRate)
				const n = parseFloat(r.newRate)
				if (!p) return <EmptyBadge>—</EmptyBadge>
				const pct = ((n - p) / p) * 100
				return (
					<DiffPct $pos={n > p}>
						{pct >= 0 ? '+' : ''}
						{pct.toFixed(1)}%
					</DiffPct>
				)
			},
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'effectiveDate',
			label: 'Effective',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => (r.effectiveDate ? new Date(r.effectiveDate) : new Date(0)),
			render: (r) =>
				r.effectiveDate ? (
					<Mono>{fmtDay(r.effectiveDate)}</Mono>
				) : (
					<EmptyBadge title='Not yet effective'>Not set</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='110px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<PermissionGate permission='compensation_reviews:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/finances/promotions/view/${r.id}`)}
							aria-label='View salary review'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='compensation_reviews:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/finances/promotions/edit/${r.id}`)}
							aria-label='Edit salary review'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='compensation_reviews:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setToDelete(r)}
							aria-label='Delete salary review'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	const RESULT_OPTIONS: Array<{ value: '' | SalaryReviewResult; label: string }> = [
		{ value: '', label: 'All' },
		{ value: 'INCREASED', label: 'Increased' },
		{ value: 'NO_CHANGE', label: 'No change' },
		{ value: 'POSTPONED', label: 'Postponed' },
	]

	const filters = (
		<FiltersBlock role='region' aria-label='Salary reviews filters'>
			<TopFilterRow>
				<ResultGroup>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<LocalOfferOutlined />
						</span>
						<div className='lead-text'>
							<span className='top'>Result</span>
							<span className='bot'>{activeResultLabel}</span>
						</div>
					</div>
					<TapePills ref={pillsRef} role='tablist' aria-label='Result'>
						<TapeIndicator
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
								opacity: ind.opacity,
							}}
						/>
						{RESULT_OPTIONS.map((opt) => (
							<TapePill
								key={opt.value || 'all'}
								type='button'
								role='tab'
								data-active={resultFilter === opt.value || undefined}
								aria-selected={resultFilter === opt.value}
								$active={resultFilter === opt.value}
								onClick={() => setResultFilter(opt.value as SalaryReviewResult | '')}
							>
								{opt.label}
							</TapePill>
						))}
					</TapePills>
				</ResultGroup>

				<InlineField>
					<span className='l'>Status</span>
					<InlineSelect
						value={status}
						onChange={(e) => setStatus(e.target.value as SalaryReviewStatus | '')}
					>
						<option value=''>Any</option>
						<option value='upcoming'>Upcoming</option>
						<option value='completed'>Completed</option>
						<option value='postponed'>Postponed</option>
					</InlineSelect>
				</InlineField>

				<SearchPill className='search'>
					<SearchOutlined className='ico' />
					<input
						type='text'
						name='search-reviews'
						placeholder='Search employee or note'
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						aria-label='Search by employee or note'
					/>
				</SearchPill>

				<BulkBarSlot aria-live='polite'>
					<BulkActionBar
						persistent
						count={selected.size}
						onClear={() => setSelected(new Set())}
						onConfirm={() => setBulkOpen(true)}
						isLoading={bulkDeleting}
					/>
				</BulkBarSlot>
			</TopFilterRow>

			<BottomFilterRow>
				<ClearBtn
					type='button'
					onClick={clearAll}
					disabled={activeFilterCount === 0}
				>
					<ClearRounded style={{ fontSize: 15 }} />
					Clear
				</ClearBtn>
			</BottomFilterRow>
		</FiltersBlock>
	)

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Finances' }, { label: 'Salary reviews', current: true }]}
				icon={<LocalOfferOutlined />}
				title='Salary Reviews'
				subtitle='Scheduled rate reviews and promotions. Increased reviews propagate a new effective rate for future payroll runs.'
				action={
					<PermissionGate permission='compensation_reviews:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/finances/promotions/add')}
						>
							<AddRounded />
							New review
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={filters}
			>
				{!isError && (
					<KpiRow>
						<KpiCard>
							<KpiIcon>
								<LocalOfferOutlined />
							</KpiIcon>
							<KpiBody>
								<KpiLabel>Total reviews</KpiLabel>
								<KpiNum>{total}</KpiNum>
							</KpiBody>
						</KpiCard>
						<KpiCard>
							<KpiIcon>
								<HourglassEmptyOutlined />
							</KpiIcon>
							<KpiBody>
								<KpiLabel>Pending</KpiLabel>
								<KpiNum>{stats.pending}</KpiNum>
							</KpiBody>
						</KpiCard>
						<KpiCard>
							<KpiIcon>
								<TrendingUpOutlined />
							</KpiIcon>
							<KpiBody>
								<KpiLabel>Increased</KpiLabel>
								<KpiNum>{stats.increased}</KpiNum>
							</KpiBody>
						</KpiCard>
						<KpiCard>
							<KpiIcon>
								<TrendingFlatOutlined />
							</KpiIcon>
							<KpiBody>
								<KpiLabel>Avg raise</KpiLabel>
								<KpiNum>
									{stats.raiseCount > 0 ? `+${stats.avgRaise.toFixed(1)}%` : '—'}
								</KpiNum>
							</KpiBody>
						</KpiCard>
					</KpiRow>
				)}

				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search || !!status || !!resultFilter}
					sort={sort}
					onSortChange={setSort}
					selection={selectionCtx}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} salary review${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> salary review
							{selected.size === 1 ? '' : 's'}. If any were INCREASED, their derived
							compensation rate rows are also removed. This cannot be undone.
						</>
					}
					confirmLabel={`Delete ${selected.size}`}
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					isLoading={bulkDeleting}
					onConfirm={runBulkDelete}
					onClose={() => setBulkOpen(false)}
				/>
			)}

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete salary review?'
					description={
						<>
							Delete the review scheduled <strong>{toDelete.scheduledDate}</strong> for{' '}
							<strong>
								{toDelete.employee.firstName} {toDelete.employee.lastName}
							</strong>
							? If it was INCREASED, the derived compensation rate row is also removed.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					isLoading={deleting}
					onConfirm={async () => {
						try {
							await deleteReview(toDelete.id).unwrap()
							showToast('Salary review deleted', 'success')
							setToDelete(null)
						} catch {
							showToast('Failed to delete review', 'error')
						}
					}}
					onClose={() => setToDelete(null)}
				/>
			)}
		</>
	)
}

export default Promotions

/* ─── Styles ─────────────────────────────────────────────────────────── */

const NameText = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
`

const Mono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
	color: ${T.textStrong};
	font-size: 13px;
`

/* Canonical pill — mirrors ClientList.StatusPill geometry
 * (padding 4px 10px / font 11px / weight 700 / letter-spacing 0.3px /
 * border-radius 999px / nowrap / uppercase). */
const ResultPill = styled.span<{ $tone: SalaryReviewResult }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	background: ${({ $tone }) => RESULT_META[$tone].bg};
	color: ${({ $tone }) => RESULT_META[$tone].color};
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;
`

const PendingPill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	background: rgba(100, 116, 139, 0.14);
	color: #475569;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;

	svg {
		font-size: 14px;
	}
`

const EmptyBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 9px;
	border-radius: 999px;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.06);
	color: #64748b;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;

	svg {
		font-size: 13px;
		opacity: 0.7;
	}
`

const RateFlow = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const RateNode = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 3px;
`

const RateVal = styled.span<{ $accent?: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-weight: 700;
	font-size: 13.5px;
	color: ${({ $accent }) => ($accent ? T.primary : T.textStrong)};
`

const RateTag = styled.span`
	font-size: 10px;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.4px;
`

const Arrow = styled.span`
	color: ${T.textSecondary};
	font-size: 14px;
`

const DiffPct = styled.span<{ $pos: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-weight: 700;
	font-size: 13.5px;
	color: ${({ $pos }) => ($pos ? '#15803d' : '#c94b4b')};
`

/* Shared filter block (ported from Registry/Salaries). */
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
	align-items: flex-end;
	gap: 12px 16px;
	min-height: 56px;
	width: 100%;

	/* Compact search: just enough to type a name, so the row holds
	 * Result pills + Status + Search + BulkBar on one line. */
	.search {
		flex: 0 0 auto;
	}
	.search input {
		width: 160px;
	}
`

const BottomFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 12px;
	width: 100%;
	justify-content: flex-end;
`

const ResultGroup = styled.div`
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

/* ─── KPI cards (Time Off pattern) ─────────────────────────────── */

const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
	margin: 14px 0;
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
`

/* Reserved spot for the BulkActionBar — persistent so toggling
 * selection never jumps the surrounding filter row. Anchored to the
 * right end of the top filter line. */
const BulkBarSlot = styled.div`
	display: inline-flex;
	align-items: center;
	min-height: 48px;
	margin-left: auto;
`
