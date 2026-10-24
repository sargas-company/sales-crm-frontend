import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
	SearchOutlined,
	ClearRounded,
	PaidOutlined,
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
import DatePickerPill from '../finance-weekly/DatePickerPill'
import {
	ClearBtn,
	InlineField,
	InlineSelect,
} from '../../components/_shared/filters/freshPaperFilters'
import { useGetEmployeesQuery } from '../../store/employees/employeesApi'
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
	return <>${fmtMoney(display)}</>
}

/* ---------- Scope presets for the date-range filter ---------- */

type ScopePreset =
	| 'thisMonth'
	| 'last3Months'
	| 'thisYear'
	| 'allTime'
	| 'custom'

const SCOPE_VALUES: ScopePreset[] = [
	'thisMonth',
	'last3Months',
	'thisYear',
	'allTime',
	'custom',
]

const SCOPE_LABEL: Record<ScopePreset, string> = {
	thisMonth: 'This month',
	last3Months: 'Last 3 months',
	thisYear: 'This year',
	allTime: 'All time',
	custom: 'Custom',
}

type PeriodParams = {
	year?: number
	month?: number
	fromYear?: number
	fromMonth?: number
	toYear?: number
	toMonth?: number
}

function parseYm(ym: string): { y: number; m: number } | null {
	const [y, m] = ym.split('-').map(Number)
	if (!y || !m || m < 1 || m > 12 || y < 2000 || y > 2100) return null
	return { y, m }
}

function computePeriod(
	scope: ScopePreset,
	year: number,
	month: number,
	customFrom: string,
	customTo: string,
): PeriodParams {
	if (scope === 'thisMonth') return { year, month }
	if (scope === 'allTime') return {}
	const now = new Date()
	const curY = now.getUTCFullYear()
	const curM = now.getUTCMonth() + 1
	if (scope === 'last3Months') {
		const fromDate = new Date(Date.UTC(curY, curM - 1 - 2, 1))
		return {
			fromYear: fromDate.getUTCFullYear(),
			fromMonth: fromDate.getUTCMonth() + 1,
			toYear: curY,
			toMonth: curM,
		}
	}
	if (scope === 'thisYear') {
		return { fromYear: curY, fromMonth: 1, toYear: curY, toMonth: 12 }
	}
	// custom
	const f = parseYm(customFrom)
	const t = parseYm(customTo)
	return {
		fromYear: f?.y,
		fromMonth: f?.m,
		toYear: t?.y,
		toMonth: t?.m,
	}
}

const Salaries = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [urlParams, setUrlParams] = useSearchParams()

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
	const initialScope = ((): ScopePreset => {
		const s = urlParams.get('scope')
		return SCOPE_VALUES.includes(s as ScopePreset) ? (s as ScopePreset) : 'thisMonth'
	})()
	const initialFrom = urlParams.get('from') ?? ''
	const initialTo = urlParams.get('to') ?? ''

	const [year, setYear] = useState<number>(initialYear)
	const [month, setMonth] = useState<number>(initialMonth)
	const [scope, setScope] = useState<ScopePreset>(initialScope)
	const [customFrom, setCustomFrom] = useState(initialFrom)
	const [customTo, setCustomTo] = useState(initialTo)
	const [employeeId, setEmployeeId] = useState('')
	const [status, setStatus] = useState<'' | 'DRAFT' | 'PAID'>('')

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
	}, [status])

	const scopePillsRef = useRef<HTMLDivElement>(null)
	const [scopeInd, setScopeInd] = useState<{
		left: number
		width: number
		opacity: number
	}>({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		if (!scopePillsRef.current) return
		const el = scopePillsRef.current.querySelector<HTMLButtonElement>(
			'[data-active="true"]',
		)
		if (el)
			setScopeInd({
				left: el.offsetLeft,
				width: el.offsetWidth,
				opacity: 1,
			})
	}, [scope])

	const activeStatusLabel = status || 'ALL'

	const activeFilterCount =
		(employeeId ? 1 : 0) +
		(status ? 1 : 0) +
		(scope !== 'thisMonth' ? 1 : 0) +
		(scope === 'thisMonth' &&
		(year !== currentYear() || month !== currentMonth())
			? 1
			: 0)

	const clearAll = () => {
		setEmployeeId('')
		setStatus('')
		setYear(currentYear())
		setMonth(currentMonth())
		setScope('thisMonth')
		setCustomFrom('')
		setCustomTo('')
	}
	const [sort, setSort] = useState<SortState | null>(initialSort)
	const [page, setPage] = useState(1)

	/* Keep year/month, scope and custom range in the URL so refresh,
	 * back/forward and shared links all restore the exact view. */
	useEffect(() => {
		setUrlParams(
			(prev) => {
				const next = new URLSearchParams(prev)
				next.set('year', String(year))
				next.set('month', String(month))
				if (scope !== 'thisMonth') next.set('scope', scope)
				else next.delete('scope')
				if (scope === 'custom' && customFrom) next.set('from', customFrom)
				else next.delete('from')
				if (scope === 'custom' && customTo) next.set('to', customTo)
				else next.delete('to')
				return next
			},
			{ replace: true },
		)
	}, [year, month, scope, customFrom, customTo, setUrlParams])
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

	useEffect(() => setPage(1), [year, month, employeeId, status, sort])
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

	const period = useMemo(
		() => computePeriod(scope, year, month, customFrom, customTo),
		[scope, year, month, customFrom, customTo],
	)
	const { data, isLoading, isError, refetch } = useGetPayrollQuery({
		...period,
		status: status || undefined,
		sortBy: (sort?.key as PayrollSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 500 })
	const employees = employeesPage?.data ?? []
	const [deletePayroll, { isLoading: deleting }] = useDeletePayrollMutation()
	const [markPaid] = useMarkPayrollPaidMutation()
	const [reopen] = useReopenPayrollMutation()

	const allRows = data?.data ?? []
	/* Match Monthly Run's visible roster: skip advisor payrolls (they
	 * don't receive salary — this role is for shareholders) and skip
	 * employees who weren't on staff during that row's own period
	 * (terminated before periodStart or hired after periodEnd). The
	 * check runs per row because range filters can span months and
	 * each entry has its own (year, month). */
	const normalizedRows = useMemo(() => {
		return allRows.filter((r) => {
			if (
				r.employee.positions.some(
					(p) => p.title.toLowerCase() === 'advisor',
				)
			) {
				return false
			}
			const periodStart = Date.UTC(r.year, r.month - 1, 1)
			const periodEnd = Date.UTC(r.year, r.month, 0, 23, 59, 59, 999)
			const hired = r.employee.hiredAt
				? Date.parse(r.employee.hiredAt)
				: null
			const terminated = r.employee.terminatedAt
				? Date.parse(r.employee.terminatedAt)
				: null
			if (hired != null && hired > periodEnd) return false
			if (terminated != null && terminated < periodStart) return false
			return true
		})
	}, [allRows])
	const rows = employeeId
		? normalizedRows.filter((r) => r.employeeId === employeeId)
		: normalizedRows

	/* KPI stats are computed from the CURRENTLY VISIBLE rows so they
	 * stay in sync with the active status/search/period filter. Empty
	 * filter → all zeros (user wants cards to stay visible, not
	 * disappear). Passthrough rule mirrors the Monthly Run summary:
	 * a row with base=0 + fixedBonus>0 is a pure Payoneer payout, so
	 * its bonus amount is folded into Base (not Bonuses). */
	const summary = useMemo(() => {
		const acc = {
			baseSalaries: 0,
			taxes: 0,
			bonuses: 0,
			payoneerFees: 0,
			companyCost: 0,
		}
		for (const r of rows) {
			const base = parseFloat(r.baseSalary) || 0
			const bonus = parseFloat(r.bonusAmount) || 0
			if (base > 0) {
				acc.baseSalaries += base
				acc.bonuses += bonus
			} else {
				acc.baseSalaries += bonus
			}
			acc.taxes += parseFloat(r.tax) || 0
			acc.payoneerFees += parseFloat(r.payoneerFee) || 0
			acc.companyCost += parseFloat(r.companyCost) || 0
		}
		return acc
	}, [rows])

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
			key: 'status',
			label: 'Status',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => <StatusPill $paid={r.status === 'PAID'}>{r.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'rate',
			label: 'Rate',
			render: (r) => (
				<RateCell>
					<RateBadge $type={r.rateType}>{r.rateType === 'HOURLY' ? 'H' : 'M'}</RateBadge>
					<Mono>${fmtMoney(r.rate)}</Mono>
				</RateCell>
			),
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'hours',
			label: 'Hours',
			minWidth: 90,
			render: (r) =>
				r.rateType === 'HOURLY' ? (
					<Mono>{fmtMoney(r.hours)}</Mono>
				) : (
					<EmptyBadge title='N/A for monthly employees'>N/A</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='40px' $h='14px' />,
		},
		{
			key: 'baseSalary',
			label: 'Monthly base',
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
			label: 'Gross',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.totalAccrued),
			render: (r) => <Mono>${fmtMoney(r.totalAccrued)}</Mono>,
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
		{
			key: 'remainingToPay',
			label: 'To pay now',
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
			label: 'Total',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => parseFloat(r.companyCost),
			render: (r) => <TotalPill>${fmtMoney(r.companyCost)}</TotalPill>,
			skeleton: () => <TableSkeleton $w='70px' $h='14px' />,
		},
	]

	const monthPicker = (
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
					<LedgerStamp aria-hidden='true'>
						<LedgerStampInner>
							<span className='top'>Ledger</span>
							<span className='mid'>
								{String(month).padStart(2, '0')}
								<span className='slash'>/</span>
								{String(year).slice(-2)}
							</span>
							<span className='bot'>pay cycle</span>
						</LedgerStampInner>
					</LedgerStamp>
				}
				filters={
					<FiltersBlock role='region' aria-label='Salaries filters'>
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
									{[
										{ value: '', label: 'All' },
										{ value: 'DRAFT', label: 'Draft' },
										{ value: 'PAID', label: 'Paid' },
									].map((opt) => (
										<TapePill
											key={opt.value || 'all'}
											type='button'
											role='tab'
											data-active={status === opt.value || undefined}
											aria-selected={status === opt.value}
											$active={status === opt.value}
											onClick={() => setStatus(opt.value as '' | 'DRAFT' | 'PAID')}
										>
											{opt.label}
										</TapePill>
									))}
								</TapePills>
							</StatusGroup>

							<InlineField>
								<span className='l'>Employee</span>
								<InlineSelect
									value={employeeId}
									onChange={(e) => setEmployeeId(e.target.value)}
								>
									<option value=''>All employees</option>
									{employees.map((emp) => (
										<option key={emp.id} value={emp.id}>
											{emp.firstName} {emp.lastName}
										</option>
									))}
								</InlineSelect>
							</InlineField>

						</TopFilterRow>

						<MiddleFilterRow>
							<ScopeGroup>
								<span className='l'>Period</span>
								<TapePills ref={scopePillsRef} role='tablist'>
									<TapeIndicator
										style={{
											transform: `translateX(${scopeInd.left}px) rotate(-1.2deg)`,
											width: `${scopeInd.width}px`,
											opacity: scopeInd.opacity,
										}}
									/>
									{SCOPE_VALUES.map((v) => (
										<TapePill
											key={v}
											type='button'
											role='tab'
											data-active={scope === v || undefined}
											aria-selected={scope === v}
											$active={scope === v}
											onClick={() => setScope(v)}
										>
											{SCOPE_LABEL[v]}
										</TapePill>
									))}
								</TapePills>
							</ScopeGroup>

							<ScopeExtra $show={scope === 'thisMonth'}>{monthPicker}</ScopeExtra>
							<ScopeExtra $show={scope === 'custom'}>
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
										}}
									/>
									<RangeDash aria-hidden='true'>-</RangeDash>
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
										}}
									/>
								</RangeGroup>
							</ScopeExtra>

							<ClearBtn
								className='clear'
								type='button'
								onClick={clearAll}
								disabled={activeFilterCount === 0}
							>
								<ClearRounded style={{ fontSize: 15 }} />
								Clear
							</ClearBtn>
						</MiddleFilterRow>
					</FiltersBlock>
				}
			>
				{!isError && (
					<KpiRow>
						<KpiCard>
							<KpiLabel>Base</KpiLabel>
							<KpiVal>
								<CountMoney value={summary.baseSalaries} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Taxes</KpiLabel>
							<KpiVal>
								<CountMoney value={summary.taxes} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Bonuses</KpiLabel>
							<KpiVal>
								<CountMoney value={summary.bonuses} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Payoneer fee</KpiLabel>
							<KpiVal>
								<CountMoney value={summary.payoneerFees} />
							</KpiVal>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Base + Taxes</KpiLabel>
							<KpiVal>
								<CountMoney
									value={summary.baseSalaries + summary.taxes}
								/>
							</KpiVal>
						</KpiCard>
						<KpiV1>
							<KpiSparkle aria-hidden='true'>
								<AutoAwesomeOutlined style={{ fontSize: 20 }} />
							</KpiSparkle>
							<KpiLabelV1>Company cost</KpiLabelV1>
							<KpiValV1>
								<CountMoney value={summary.companyCost} />
							</KpiValV1>
						</KpiV1>
					</KpiRow>
				)}

				<GroupedTableWrap>
					<DataTable
						columns={columns}
						rows={rows}
						rowKey={(r) => r.id}
						isLoading={isLoading}
						isError={isError}
						onRetry={refetch}
						searchActive={!!employeeId || !!status}
						sort={sort}
						onSortChange={setSort}
						pagination={{
							page,
							pageSize: rows.length || 20,
							total: rows.length,
							onPageChange: setPage,
						}}
					/>
				</GroupedTableWrap>
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

const TotalPill = styled(Mono)`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.1);
	color: #0369a1;
	font-weight: 800;
	letter-spacing: -0.2px;
`

const RateCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
`

const RateBadge = styled.span<{ $type: 'HOURLY' | 'MONTHLY' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: ${({ $type }) =>
		$type === 'HOURLY' ? 'rgba(234, 88, 12, 0.14)' : 'rgba(3, 105, 161, 0.12)'};
	color: ${({ $type }) => ($type === 'HOURLY' ? '#c2410c' : '#0369a1')};
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.5px;
`

const EmptyBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.06);
	color: #64748b;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;
`

/* ─── Grouped column backgrounds ──────────────────────────────────
 * Visually buckets the money columns into 3 bands:
 *   • "Rate" group     — Rate / Hours / Monthly base   → soft slate
 *   • "Earnings" group — Tax / Bonus / Advance         → soft amber
 *   • "Payout" group   — Gross / To pay now / Fee / Total → soft sky
 * Each cell has a per-column className `col-<key>` emitted by
 * DataTable; we tint the whole column in one shot. */
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
	transition:
		background 160ms ease,
		color 160ms ease;
`

/* Column groups separated by thin vertical rules.
 *
 * Row hover — "Spotlight lift": the row raises 1px, scales very
 * slightly (1.003), picks up a soft two-layer shadow, and animates
 * in with a punchy overshoot (lifts to 2px before settling at 1px).
 * Leave is smooth. */
const GroupedTableWrap = styled.div`
	th.col-rate,
	td.col-rate,
	th.col-tax,
	td.col-tax,
	th.col-totalAccrued,
	td.col-totalAccrued {
		border-left: 1px solid rgba(15, 23, 42, 0.1);
	}

	tbody tr {
		transition:
			background-color 220ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	tbody tr td {
		transition: background 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	tbody tr:hover {
		transform: translateY(-1px) scale(1.003);
		box-shadow:
			0 8px 20px -8px rgba(15, 23, 42, 0.18),
			0 2px 6px -2px rgba(15, 23, 42, 0.1);
		position: relative;
		z-index: 2;
		animation: rowLift 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	tbody tr:hover td {
		background: #ffffff !important;
		border-left-color: rgba(15, 23, 42, 0.14) !important;
	}

	@keyframes rowLift {
		0% {
			transform: translateY(0) scale(1);
			box-shadow: 0 0 0 rgba(15, 23, 42, 0);
		}
		60% {
			transform: translateY(-2px) scale(1.006);
		}
		100% {
			transform: translateY(-1px) scale(1.003);
		}
	}
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
	border: 1.5px solid #241e16;
	background: #ffffff;
	color: #241e16;
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
		color: #241e16;
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
	color: #241e16;
	opacity: 0.6;
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

/* ─── Shared filter block (ported from Registry/FinancialList) ─── */

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

	.clear {
		margin-left: auto;
	}
`

const ScopeGroup = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex: 0 1 auto;
	min-width: 0;

	.l {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.4px;
		text-transform: uppercase;
		color: #64748b;
	}
`

const MiddleFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	width: 100%;
	margin-top: 10px;

	.clear {
		margin-left: auto;
	}
`

/* Smooth expand/collapse slot for the scope-dependent extras (month
 * picker, custom range). Max-width collapse keeps the layout stable
 * on toggle; opacity + translateY add a tiny fade/slide. */
const ScopeExtra = styled.div<{ $show: boolean }>`
	display: inline-flex;
	align-items: center;
	overflow: hidden;
	/* Vertical padding + negative margin keeps the hover lift of
	 * inner buttons (translateY(-1px) etc.) inside the clip box so
	 * the top edge of the picker never gets cropped. */
	padding: 6px 0;
	margin: -6px 0;
	opacity: ${({ $show }) => ($show ? 1 : 0)};
	max-width: ${({ $show }) => ($show ? '680px' : '0')};
	transform: translateY(${({ $show }) => ($show ? '0' : '-4px')});
	pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
	transition:
		opacity 240ms ease,
		max-width 320ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 240ms ease;
`

const RangeGroup = styled.div`
	display: inline-flex;
	align-items: flex-end;
	gap: 10px;
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

/* Blue notary-stamp look: rotated slightly off-axis, double border,
 * uppercase mono text, slightly faded like real ink. Original —
 * doesn't repeat the handwritten orange callout used elsewhere. */
const LEDGER_STAMP_BLUE = '#0369a1'

const stampSlam = keyframes`
	0%   { transform: rotate(-12deg) scale(1.35); opacity: 0; }
	55%  { transform: rotate(-2deg)  scale(0.96); opacity: 1; }
	80%  { transform: rotate(-5deg)  scale(1.02); }
	100% { transform: rotate(-4deg)  scale(1); }
`

const LedgerStamp = styled.div`
	display: inline-block;
	transform: rotate(-4deg);
	animation: ${stampSlam} 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
	user-select: none;
	pointer-events: none;
	transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
`

const LedgerStampInner = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1px;
	padding: 8px 20px 7px;
	border: 2px solid ${LEDGER_STAMP_BLUE};
	border-radius: 6px;
	color: ${LEDGER_STAMP_BLUE};
	background: transparent;
	opacity: 0.85;
	line-height: 1;

	/* Inner double-border for the "notary" feel. */
	&::before {
		content: '';
		position: absolute;
		inset: 3px;
		border: 1px solid ${LEDGER_STAMP_BLUE};
		border-radius: 4px;
		pointer-events: none;
	}

	.top,
	.bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		opacity: 0.9;
	}
	.mid {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.5px;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		margin: 2px 0;
	}
	.mid .slash {
		opacity: 0.5;
		margin: 0 2px;
	}
`
