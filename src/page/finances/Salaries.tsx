import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	AttachMoneyOutlined,
	AutoAwesomeOutlined,
	CalendarMonthOutlined,
	CheckCircleOutline,
	DeleteOutline,
	EditOutlined,
	LockOpenOutlined,
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
import {
	useGetPayrollQuery,
	useGetPayrollSummaryQuery,
	useDeletePayrollMutation,
	useMarkPayrollPaidMutation,
	useReopenPayrollMutation,
	type PayrollEntry,
	type PayrollSortBy,
} from '../../store/payroll/payrollApi'

const MONTHS = [
	'January','February','March','April','May','June',
	'July','August','September','October','November','December',
] as const

const currentYear = () => new Date().getUTCFullYear()
const currentMonth = () => new Date().getUTCMonth() + 1

const fmtMoney = (v: string | number | null | undefined): string => {
	if (v == null) return '—'
	const n = typeof v === 'string' ? parseFloat(v) : v
	if (!isFinite(n)) return '—'
	return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Tween a number from its previous displayed value up to the new
 *  target with an ease-out cubic curve. Starts at 0 on mount so the
 *  first render shows the "counting up" effect; on every subsequent
 *  target change it tweens from the last displayed value. Respects
 *  prefers-reduced-motion. */
function useCountUp(target: number, duration = 900): number {
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

const CountMoney = ({ value }: { value: string | number | null | undefined }) => {
	const n = value == null ? 0 : typeof value === 'string' ? parseFloat(value) || 0 : value
	const display = useCountUp(n)
	if (value == null) return <>—</>
	return <>${fmtMoney(display)}</>
}

const Salaries = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [urlParams] = useSearchParams()

	// Deep-link support: /finances/salaries?year=..&month=..&sortBy=..&sortDirection=..
	// lets other pages (e.g. Compensation Analytics) jump straight to
	// a specific month with a specific sort applied.
	const initialYear = (() => {
		const y = Number(urlParams.get('year'))
		return y >= 2000 && y <= 2100 ? y : currentYear()
	})()
	const initialMonth = (() => {
		const m = Number(urlParams.get('month'))
		return m >= 1 && m <= 12 ? m : currentMonth()
	})()
	const initialSort: SortState = (() => {
		const key = urlParams.get('sortBy')
		const dir = urlParams.get('sortDirection') === 'asc' ? 'asc' : 'desc'
		return key ? { key, direction: dir } : { key: 'employee', direction: 'asc' }
	})()

	const [year, setYear] = useState<number>(initialYear)
	const [month, setMonth] = useState<number>(initialMonth)
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState<SortState | null>(initialSort)
	const [page, setPage] = useState(1)
	const [toDelete, setToDelete] = useState<PayrollEntry | null>(null)
	const [toReopen, setToReopen] = useState<PayrollEntry | null>(null)
	const [pickerOpen, setPickerOpen] = useState(false)
	const [pickerYear, setPickerYear] = useState<number>(currentYear())
	const monthBtnRef = useRef<HTMLButtonElement>(null)
	const popupRef = useRef<HTMLDivElement>(null)
	const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

	useLayoutEffect(() => {
		if (!pickerOpen) return
		const recalc = () => {
			const btn = monthBtnRef.current
			if (!btn) return
			const r = btn.getBoundingClientRect()
			const popupW = 320
			const gap = 10
			const left = Math.min(
				window.innerWidth - popupW - 8,
				Math.max(8, r.right - popupW),
			)
			setPopupPos({ top: r.bottom + gap, left })
		}
		recalc()
		window.addEventListener('scroll', recalc, true)
		window.addEventListener('resize', recalc)
		return () => {
			window.removeEventListener('scroll', recalc, true)
			window.removeEventListener('resize', recalc)
		}
	}, [pickerOpen])

	useEffect(() => setPage(1), [year, month, search, sort])
	useEffect(() => {
		if (!pickerOpen) return
		setPickerYear(year)
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setPickerOpen(false)
		}
		const onClick = (e: MouseEvent) => {
			const target = e.target as Node
			if (
				monthBtnRef.current &&
				!monthBtnRef.current.contains(target) &&
				popupRef.current &&
				!popupRef.current.contains(target)
			) {
				setPickerOpen(false)
			}
		}
		window.addEventListener('keydown', onKey)
		window.addEventListener('mousedown', onClick)
		return () => {
			window.removeEventListener('keydown', onKey)
			window.removeEventListener('mousedown', onClick)
		}
	}, [pickerOpen, year])

	const { data, isLoading, isError, refetch } = useGetPayrollQuery({
		year,
		month,
		search: search.trim() || undefined,
		sortBy: (sort?.key as PayrollSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const { data: summary } = useGetPayrollSummaryQuery({ year, month })
	const [deletePayroll, { isLoading: deleting }] = useDeletePayrollMutation()
	const [markPaid] = useMarkPayrollPaidMutation()
	const [reopen] = useReopenPayrollMutation()

	const rows = data?.data ?? []

	const columns: DataTableColumn<PayrollEntry>[] = [
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
			key: 'rate',
			label: 'Rate',
			render: (r) => (
				<RateCell>
					<RateBadge>{r.rateType === 'HOURLY' ? 'H' : 'M'}</RateBadge>
					<Mono>${fmtMoney(r.rate)}</Mono>
				</RateCell>
			),
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'hours',
			label: 'Hours',
			minWidth: 90,
			render: (r) => (r.rateType === 'HOURLY' ? <Mono>{fmtMoney(r.hours)}</Mono> : <SubText>—</SubText>),
			skeleton: () => <TableSkeleton $w='40px' $h='14px' />,
		},
		{
			key: 'baseSalary',
			label: 'Base',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.baseSalary),
			render: (r) => <Mono>${fmtMoney(r.baseSalary)}</Mono>,
			skeleton: () => <TableSkeleton $w='60px' $h='14px' />,
		},
		{
			key: 'tax',
			label: 'Tax',
			minWidth: 90,
			render: (r) => <Mono>${fmtMoney(r.tax)}</Mono>,
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'bonusAmount',
			label: 'Bonus',
			minWidth: 90,
			sortable: true,
			sortValue: (r) => parseFloat(r.bonusAmount),
			render: (r) => <Mono>${fmtMoney(r.bonusAmount)}</Mono>,
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'advance',
			label: 'Advance',
			minWidth: 90,
			render: (r) => <Mono>${fmtMoney(r.advance)}</Mono>,
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'totalAccrued',
			label: 'Total',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.totalAccrued),
			render: (r) => <MonoStrong>${fmtMoney(r.totalAccrued)}</MonoStrong>,
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'remainingToPay',
			label: 'Remaining',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.remainingToPay),
			render: (r) => <Mono>${fmtMoney(r.remainingToPay)}</Mono>,
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'payoneerFee',
			label: 'Fee',
			minWidth: 80,
			render: (r) => <Mono>${fmtMoney(r.payoneerFee)}</Mono>,
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'companyCost',
			label: 'Company',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.companyCost),
			render: (r) => <MonoAccent>${fmtMoney(r.companyCost)}</MonoAccent>,
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => <StatusPill $paid={r.status === 'PAID'}>{r.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) =>
				r.status === 'DRAFT' ? (
					<Actions>
						<PermissionGate permission='salaries:update'>
							<IconAction
								type='button'
								onClick={() => navigate(`/finances/salaries/edit/${r.id}`)}
								aria-label='Edit payroll'
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='salaries:update'>
							<IconAction
								type='button'
								onClick={async () => {
									try {
										await markPaid(r.id).unwrap()
										showToast('Marked as paid', 'success')
									} catch {
										showToast('Failed to mark paid', 'error')
									}
								}}
								aria-label='Mark paid'
							>
								<CheckCircleOutline />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='salaries:delete'>
							<IconAction
								type='button'
								$danger
								onClick={() => setToDelete(r)}
								aria-label='Delete payroll entry'
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					</Actions>
				) : (
					<Actions>
						<PermissionGate permission='salaries:update'>
							<IconAction
								type='button'
								onClick={() => setToReopen(r)}
								aria-label='Reopen paid payroll'
							>
								<LockOpenOutlined />
							</IconAction>
						</PermissionGate>
					</Actions>
				),
		},
	]

	const monthFilter = (
		<>
			<DatePickerButton
				ref={monthBtnRef}
				type='button'
				$active={pickerOpen}
				onClick={() => setPickerOpen((v) => !v)}
				aria-haspopup='dialog'
				aria-expanded={pickerOpen}
			>
				<CalendarMonthOutlined style={{ fontSize: 17 }} />
				<DatePickerLabel>
					{MONTHS[month - 1]} <DatePickerYear>{year}</DatePickerYear>
				</DatePickerLabel>
			</DatePickerButton>
			{pickerOpen && popupPos &&
				createPortal(
					<DatePickerPopup
						ref={popupRef}
						role='dialog'
						aria-label='Pick month and year'
						style={{ top: popupPos.top, left: popupPos.left }}
					>
						<PickerHead>
							<PickerYearBtn
								type='button'
								onClick={() => setPickerYear((y) => y - 1)}
								aria-label='Previous year'
							>
								‹
							</PickerYearBtn>
							<PickerYearTitle>{pickerYear}</PickerYearTitle>
							<PickerYearBtn
								type='button'
								onClick={() => setPickerYear((y) => y + 1)}
								aria-label='Next year'
							>
								›
							</PickerYearBtn>
						</PickerHead>
						<PickerMonths>
							{MONTHS.map((m, i) => {
								const monthIdx = i + 1
								const isCur = pickerYear === year && monthIdx === month
								const isRealToday =
									pickerYear === currentYear() && monthIdx === currentMonth()
								return (
									<PickerMonthBtn
										key={m}
										type='button'
										$active={isCur}
										$today={isRealToday}
										onClick={() => {
											setYear(pickerYear)
											setMonth(monthIdx)
											setPickerOpen(false)
										}}
									>
										{m.slice(0, 3)}
									</PickerMonthBtn>
								)
							})}
						</PickerMonths>
						<PickerFoot>
							<PickerTodayBtn
								type='button'
								onClick={() => {
									setYear(currentYear())
									setMonth(currentMonth())
									setPickerYear(currentYear())
									setPickerOpen(false)
								}}
							>
								Jump to today
							</PickerTodayBtn>
						</PickerFoot>
					</DatePickerPopup>,
					document.body,
				)}
		</>
	)

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Finances' }, { label: 'Salaries', current: true }]}
				icon={<AttachMoneyOutlined />}
				title='Salaries'
				subtitle='Monthly payroll — hourly and monthly rates, taxes, bonuses, advances, Payoneer fee and company cost.'
				action={
					<PermissionGate permission='salaries:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate(`/finances/salaries/add?year=${year}&month=${month}`)}
						>
							<AddRounded />
							New entry
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search employee'
				search={search}
				onSearchChange={setSearch}
				filters={monthFilter}
			>
				{!isLoading && !isError && rows.length > 0 && (
					<KpiRow>
						<KpiCard>
							<KpiLabel>Base payroll</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.baseSalaries} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Taxes</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.taxes} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Bonuses</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.bonuses} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Total accrued</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.totalAccrued} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Payoneer fee</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.payoneerFees} />
							</KpiVal>
						</KpiCard>
						<KpiV1>
							<KpiSparkle aria-hidden='true'>
								<AutoAwesomeOutlined style={{ fontSize: 20 }} />
							</KpiSparkle>
							<KpiLabelV1>Company cost</KpiLabelV1>
							<KpiValV1>
								<CountMoney value={summary?.companyCost} />
							</KpiValV1>
						</KpiV1>
						<KpiCard>
							<KpiLabel>Outstanding</KpiLabel>
							<KpiVal>
								<CountMoney value={summary?.outstanding} />
							</KpiVal>
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
					searchActive={!!search}
					sort={sort}
					onSortChange={setSort}
					pagination={{
						page,
						pageSize: rows.length || 20,
						total: rows.length,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete payroll entry?'
					description={
						<>
							Delete the {MONTHS[toDelete.month - 1]} {toDelete.year} record for{' '}
							<strong>
								{toDelete.employee.firstName} {toDelete.employee.lastName}
							</strong>
							?
						</>
					}
					confirmLabel='Delete'
					confirmColor='error'
					isLoading={deleting}
					onConfirm={async () => {
						try {
							await deletePayroll(toDelete.id).unwrap()
							showToast('Payroll entry deleted', 'success')
							setToDelete(null)
						} catch {
							showToast('Failed to delete', 'error')
						}
					}}
					onClose={() => setToDelete(null)}
				/>
			)}

			{toReopen && (
				<ConfirmModal
					icon={<LockOpenOutlined />}
					iconTone='warning'
					title='Reopen paid payroll?'
					description={
						<>
							Reopening lets you edit numbers that have already been paid out for{' '}
							<strong>
								{toReopen.employee.firstName} {toReopen.employee.lastName}
							</strong>
							.
						</>
					}
					confirmLabel='Reopen'
					confirmColor='warning'
					onConfirm={async () => {
						try {
							await reopen(toReopen.id).unwrap()
							showToast('Entry reopened', 'success')
							setToReopen(null)
						} catch {
							showToast('Failed to reopen', 'error')
						}
					}}
					onClose={() => setToReopen(null)}
				/>
			)}
		</>
	)
}

export default Salaries

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
`

const MonoStrong = styled(Mono)`
	font-weight: 700;
`

const MonoAccent = styled(Mono)`
	font-weight: 700;
	color: ${T.primary};
`

const RateCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
`

const RateBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 6px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	font-weight: 700;
`

const StatusPill = styled.span<{ $paid: boolean }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $paid }) => ($paid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)')};
	color: ${({ $paid }) => ($paid ? '#059669' : '#b45309')};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const KpiRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 20px;
`

const KpiCard = styled.div`
	flex: 1 1 130px;
	min-width: 130px;
	padding: 14px 16px;
	border-radius: 14px;
	background: #fafafd;
	border: 1px solid rgba(15, 23, 42, 0.06);
	display: flex;
	flex-direction: column;
	gap: 6px;
`

/* Company cost — solid primary highlight, wider than siblings */
const KpiV1 = styled.div`
	position: relative;
	flex: 1.45 1 190px;
	min-width: 190px;
	padding: 14px 18px;
	border-radius: 14px;
	background: ${T.primary};
	color: #ffffff;
	display: flex;
	flex-direction: column;
	gap: 6px;
	box-shadow:
		0 8px 20px rgba(3, 105, 161, 0.28),
		inset 0 -1px 0 rgba(255, 255, 255, 0.14);
	overflow: hidden;
`

const KpiLabelV1 = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.85);
`

const KpiValV1 = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 22px;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: -0.5px;
	font-variant-numeric: tabular-nums;
`

const sparkleTwinkle = keyframes`
	0%, 100% {
		transform: rotate(0deg) scale(1);
		opacity: 0.85;
	}
	40% {
		transform: rotate(18deg) scale(1.18);
		opacity: 1;
		filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.75));
	}
	70% {
		transform: rotate(-8deg) scale(0.96);
		opacity: 0.9;
	}
`

const KpiSparkle = styled.span`
	position: absolute;
	top: 12px;
	right: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: rgba(255, 255, 255, 0.9);
	pointer-events: none;
	animation: ${sparkleTwinkle} 3.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	transform-origin: center;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const KpiLabel = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const KpiVal = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 20px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
	font-variant-numeric: tabular-nums;
`

const dateBtnIconWiggleKF = keyframes`
	0%   { transform: rotate(0deg) scale(1); }
	30%  { transform: rotate(-8deg) scale(1.1); }
	60%  { transform: rotate(6deg) scale(1.1); }
	100% { transform: rotate(0deg) scale(1); }
`

const DatePickerButton = styled.button<{ $active: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 9px;
	padding: 9px 16px;
	border-radius: 999px;
	border: 1.5px solid ${T.primary};
	background: #ffffff;
	color: ${T.primary};
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	line-height: 1;
	cursor: pointer;
	text-transform: none;
	letter-spacing: normal;
	flex-shrink: 0;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		color: ${T.primary};
		transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover {
		transform: translateY(-1px);
		svg {
			animation: ${dateBtnIconWiggleKF} 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	${({ $active }) =>
		$active &&
		`
		svg {
			transform: rotate(-6deg) scale(1.05);
		}
	`}

	@media (prefers-reduced-motion: reduce) {
		&:hover svg {
			animation: none;
		}
	}
`

const DatePickerLabel = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
`

const DatePickerYear = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 13px;
	color: ${T.primary};
	opacity: 0.75;
	letter-spacing: -0.2px;
`

const popupIn = keyframes`
	from { opacity: 0; transform: translateY(-8px) scale(0.96); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const DatePickerPopup = styled.div`
	position: fixed;
	z-index: 1000;
	width: 320px;
	padding: 16px;
	border-radius: 16px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow:
		0 12px 32px rgba(15, 23, 42, 0.12),
		0 2px 6px rgba(15, 23, 42, 0.06);
	transform-origin: top right;
	animation: ${popupIn} 220ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const PickerHead = styled.div`
	display: grid;
	grid-template-columns: 32px 1fr 32px;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
`

const PickerYearBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	min-width: 0;
	padding: 0;
	margin: 0;
	border-radius: 10px;
	background: transparent;
	border: 1px solid rgba(15, 23, 42, 0.1);
	color: ${T.textSecondary};
	font-size: 18px;
	font-weight: 700;
	line-height: 1;
	cursor: pointer;
	text-transform: none;
	letter-spacing: normal;
	transition:
		color 160ms ease,
		border-color 160ms ease,
		background 160ms ease;

	&:hover {
		color: ${T.primary};
		border-color: ${T.primary};
		background: ${T.primaryTint};
	}
`

const PickerYearTitle = styled.div`
	text-align: center;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 18px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.4px;
`

const PickerMonths = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 6px;
`

const PickerMonthBtn = styled.button<{ $active: boolean; $today: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 0;
	min-width: 0;
	margin: 0;
	border-radius: 10px;
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 700;
	line-height: 1;
	cursor: pointer;
	text-transform: none;
	letter-spacing: 0.3px;
	background: ${({ $active }) => ($active ? T.primary : 'transparent')};
	color: ${({ $active }) => ($active ? '#ffffff' : T.textStrong)};
	border: 1.5px solid
		${({ $active, $today }) =>
			$active ? T.primary : $today ? T.primary : 'rgba(15, 23, 42, 0.08)'};
	position: relative;
	transition:
		background 160ms ease,
		color 160ms ease,
		border-color 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&::after {
		content: '';
		position: absolute;
		bottom: 4px;
		left: 50%;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${({ $today, $active }) => ($today && !$active ? T.primary : 'transparent')};
		transform: translateX(-50%);
	}

	&:hover {
		background: ${({ $active }) => ($active ? T.primary : T.primaryTint)};
		border-color: ${T.primary};
		color: ${({ $active }) => ($active ? '#ffffff' : T.primary)};
		transform: translateY(-1px);
	}
`

const PickerFoot = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
`

const PickerTodayBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 6px 16px;
	min-width: 0;
	margin: 0;
	border-radius: 999px;
	background: transparent;
	border: none;
	color: ${T.primary};
	font-family: inherit;
	font-size: 12px;
	font-weight: 700;
	line-height: 1;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	cursor: pointer;
	transition:
		color 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		color: #0f4c81;
		transform: translateY(-1px);
	}
`
