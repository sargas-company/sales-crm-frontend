import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	LocalOfferOutlined,
	TrendingUpOutlined,
	TrendingFlatOutlined,
	ScheduleOutlined,
	DeleteOutline,
	EditOutlined,
	AddRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
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

	useEffect(() => setPage(1), [search, status, resultFilter])

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
			key: 'position',
			label: 'Position',
			minWidth: 160,
			render: (r) =>
				r.employee.positions.length > 0 ? (
					<PositionPill title={r.employee.positions[0]}>
						{r.employee.positions[0]}
					</PositionPill>
				) : (
					<SubText>—</SubText>
				),
			skeleton: () => <TableSkeleton $w='90px' $h='22px' style={{ borderRadius: 999 }} />,
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
					<ResultPill $tone={r.result}>
						{RESULT_META[r.result].icon}
						{RESULT_META[r.result].label}
					</ResultPill>
				) : (
					<PendingPill>Pending</PendingPill>
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
								<SubText>—</SubText>
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
								<SubText>—</SubText>
							)}
						</RateNode>
					</RateFlow>
				) : (
					<SubText>—</SubText>
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
				if (!r.previousRate || !r.newRate) return <SubText>—</SubText>
				const p = parseFloat(r.previousRate)
				const n = parseFloat(r.newRate)
				if (!p) return <SubText>—</SubText>
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
				r.effectiveDate ? <Mono>{fmtDay(r.effectiveDate)}</Mono> : <SubText>—</SubText>,
			skeleton: () => <TableSkeleton $w='110px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
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

	const filters = (
		<>
			<FilterSelect
				value={status}
				onChange={(e) => setStatus(e.target.value as SalaryReviewStatus | '')}
			>
				<option value=''>All statuses</option>
				<option value='upcoming'>Upcoming</option>
				<option value='completed'>Completed</option>
				<option value='postponed'>Postponed</option>
			</FilterSelect>
			<FilterSelect
				value={resultFilter}
				onChange={(e) => setResultFilter(e.target.value as SalaryReviewResult | '')}
			>
				<option value=''>All results</option>
				<option value='INCREASED'>Increased</option>
				<option value='NO_CHANGE'>No change</option>
				<option value='POSTPONED'>Postponed</option>
			</FilterSelect>
		</>
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
				searchPlaceholder='Search by employee or note'
				search={searchInput}
				onSearchChange={setSearchInput}
				filters={filters}
			>
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
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

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

const PositionPill = styled.span`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${T.subtleBg};
	color: ${T.textSecondary};
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	border: 1px solid ${T.border};
	white-space: nowrap;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	vertical-align: middle;
`

const SubText = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`

const Mono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
	color: ${T.textStrong};
	font-size: 13px;
`

const ResultPill = styled.span<{ $tone: SalaryReviewResult }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	background: ${({ $tone }) => RESULT_META[$tone].bg};
	color: ${({ $tone }) => RESULT_META[$tone].color};
	text-transform: uppercase;
`

const PendingPill = styled.span`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	background: ${T.primaryTint};
	color: ${T.primary};
	text-transform: uppercase;
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

const FilterSelect = styled.select`
	appearance: none;
	padding: 8px 30px 8px 14px;
	border-radius: 999px;
	border: 1.5px solid #cec9d8;
	background: #ffffff;
	font: inherit;
	font-size: 13px;
	color: ${T.textStrong};
	cursor: pointer;
	outline: none;
	background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
	background-repeat: no-repeat;
	background-position: right 10px center;
	&:focus {
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}
`
