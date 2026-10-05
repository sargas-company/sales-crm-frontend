import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'
import styled, { css, keyframes } from 'styled-components'
import {
	CalendarMonthOutlined,
	CheckCircleOutline,
	LockOpenOutlined,
	ChecklistRtlOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import { useGetEmployeesQuery } from '../../store/employees/employeesApi'
import {
	useGetPayrollQuery,
	useCreatePayrollMutation,
	useUpdatePayrollMutation,
	useMarkPayrollPaidMutation,
	useReopenPayrollMutation,
	type PayrollEntry,
	type RateType,
} from '../../store/payroll/payrollApi'

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const

const currentYear = () => new Date().getUTCFullYear()
const currentMonth = () => new Date().getUTCMonth() + 1

const fmtMoney = (n: number): string =>
	n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const useCountUp = (target: number, duration = 700): number => {
	const [display, setDisplay] = useState<number>(target)
	const rafRef = useRef<number | null>(null)
	const startRef = useRef<number | null>(null)
	const fromRef = useRef<number>(target)
	const displayRef = useRef<number>(target)

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
			if (t < 1) {
				rafRef.current = requestAnimationFrame(step)
			} else {
				rafRef.current = null
			}
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
	return <>${fmtMoney(v)}</>
}

const CountInt = ({ value, duration }: { value: number; duration?: number }) => {
	const v = useCountUp(value, duration ?? 500)
	return <>{Math.round(v).toLocaleString('en-US')}</>
}

const num = (v: string): number => {
	const n = parseFloat(v.replace(',', '.'))
	return Number.isFinite(n) ? n : 0
}

const compute = (input: {
	rateType: RateType
	rate: number
	hours: number
	bonusPercent: number
	fixedBonus: number
	advance: number
}) => {
	const base = input.rateType === 'HOURLY' ? input.rate * input.hours : input.rate
	const tax = 42.5 + base * 0.06
	const swt = base + tax
	const bonusAmt = (swt * input.bonusPercent) / 100 + input.fixedBonus
	const total = swt + bonusAmt
	const remain = Math.max(0, total - input.advance)
	const fee = total * 0.03
	const cost = total + fee
	return { base, tax, swt, bonusAmt, total, remain, fee, cost }
}

interface RowState {
	employeeId: string
	firstName: string
	lastName: string
	position: string
	entryId: string | null
	status: 'DRAFT' | 'PAID' | 'NEW'
	rateType: RateType
	rate: string
	hours: string
	bonusPercent: string
	fixedBonus: string
	advance: string
	note: string
}

const emptyRow = (
	e: { id: string; firstName: string; lastName: string; positions: string[] },
): RowState => ({
	employeeId: e.id,
	firstName: e.firstName,
	lastName: e.lastName,
	position: e.positions[0] ?? '',
	entryId: null,
	status: 'NEW',
	rateType: 'HOURLY',
	rate: '',
	hours: '',
	bonusPercent: '0',
	fixedBonus: '0',
	advance: '0',
	note: '',
})

const fromEntry = (
	e: { id: string; firstName: string; lastName: string; positions: string[] },
	p: PayrollEntry,
): RowState => ({
	employeeId: e.id,
	firstName: e.firstName,
	lastName: e.lastName,
	position: e.positions[0] ?? '',
	entryId: p.id,
	status: p.status,
	rateType: p.rateType,
	rate: p.rate,
	hours: p.hours ?? '',
	bonusPercent: p.bonusPercent,
	fixedBonus: p.fixedBonus,
	advance: p.advance,
	note: p.note ?? '',
})

const SalariesRun = () => {
	const { showToast } = useToast()

	const [year, setYear] = useState(currentYear())
	const [month, setMonth] = useState(currentMonth())
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [toReopen, setToReopen] = useState<RowState | null>(null)
	const [toMarkPaid, setToMarkPaid] = useState<RowState | null>(null)
	const [markingPaid, setMarkingPaid] = useState(false)

	// Month picker portal state.
	const [pickerOpen, setPickerOpen] = useState(false)
	const [pickerClosing, setPickerClosing] = useState(false)
	const [pickerYear, setPickerYear] = useState(currentYear())
	const closeTimerRef = useRef<number | null>(null)

	const closePicker = () => {
		if (!pickerOpen || pickerClosing) return
		setPickerClosing(true)
		if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		closeTimerRef.current = window.setTimeout(() => {
			setPickerOpen(false)
			setPickerClosing(false)
			closeTimerRef.current = null
		}, 180)
	}

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		}
	}, [])
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
			const left = Math.min(
				window.innerWidth - popupW - 8,
				Math.max(8, r.right - popupW),
			)
			setPopupPos({ top: r.bottom + 10, left })
		}
		recalc()
		window.addEventListener('scroll', recalc, true)
		window.addEventListener('resize', recalc)
		return () => {
			window.removeEventListener('scroll', recalc, true)
			window.removeEventListener('resize', recalc)
		}
	}, [pickerOpen])

	useEffect(() => {
		if (!pickerOpen) return
		setPickerYear(year)
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closePicker()
		}
		const onClick = (e: MouseEvent) => {
			const t = e.target as Node
			if (
				monthBtnRef.current && !monthBtnRef.current.contains(t) &&
				popupRef.current && !popupRef.current.contains(t)
			) closePicker()
		}
		window.addEventListener('keydown', onKey)
		window.addEventListener('mousedown', onClick)
		return () => {
			window.removeEventListener('keydown', onKey)
			window.removeEventListener('mousedown', onClick)
		}
	}, [pickerOpen, year])

	const { data: employeesPage, isLoading: empLoading } = useGetEmployeesQuery({
		page: 1,
		limit: 500,
	})
	const { data: entriesData, isLoading: entryLoading } = useGetPayrollQuery({ year, month })
	const [createPayroll] = useCreatePayrollMutation()
	const [updatePayroll] = useUpdatePayrollMutation()
	const [markPaid] = useMarkPayrollPaidMutation()
	const [reopen] = useReopenPayrollMutation()

	const [rows, setRows] = useState<Record<string, RowState>>({})

	useEffect(() => {
		if (!employeesPage) return
		const byEmployee = new Map<string, PayrollEntry>()
		for (const e of entriesData?.data ?? []) byEmployee.set(e.employeeId, e)
		const next: Record<string, RowState> = {}
		for (const emp of employeesPage.data) {
			const entry = byEmployee.get(emp.id)
			next[emp.id] = entry ? fromEntry(emp, entry) : emptyRow(emp)
		}
		setRows(next)
		// Pick the first employee as selected on month change.
		if (employeesPage.data.length > 0) {
			setSelectedId((prev) =>
				prev && next[prev] ? prev : employeesPage.data[0].id,
			)
		} else {
			setSelectedId(null)
		}
	}, [employeesPage, entriesData, year, month])

	const setRowField = <K extends keyof RowState>(
		employeeId: string,
		key: K,
		value: RowState[K],
	) => {
		setRows((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [key]: value } }))
	}

	const persistRow = async (row: RowState) => {
		if (row.status === 'PAID') return
		if (!row.rate || parseFloat(row.rate) < 0) return
		if (row.rateType === 'HOURLY' && (!row.hours || parseFloat(row.hours) < 0)) return
		const body = {
			rateType: row.rateType,
			rate: num(row.rate),
			hours: row.rateType === 'HOURLY' ? num(row.hours) : undefined,
			bonusPercent: num(row.bonusPercent),
			fixedBonus: num(row.fixedBonus),
			advance: num(row.advance),
			note: row.note.trim() || undefined,
		}
		try {
			if (row.entryId) {
				await updatePayroll({ id: row.entryId, body }).unwrap()
			} else {
				const created = await createPayroll({
					employeeId: row.employeeId,
					year, month,
					...body,
				}).unwrap()
				setRows((prev) => ({
					...prev,
					[row.employeeId]: {
						...prev[row.employeeId],
						entryId: created.id,
						status: 'DRAFT',
					},
				}))
			}
		} catch {
			showToast('Failed to save', 'error')
		}
	}

	const handleMarkPaid = async () => {
		const row = toMarkPaid
		if (!row?.entryId || row.status === 'PAID') return
		setMarkingPaid(true)
		try {
			await markPaid(row.entryId).unwrap()
			setRows((prev) => ({
				...prev,
				[row.employeeId]: { ...prev[row.employeeId], status: 'PAID' },
			}))
			setToMarkPaid(null)
			showToast(
				`${row.firstName} ${row.lastName} · marked as paid`,
				'success',
			)
		} catch {
			showToast('Failed to mark paid', 'error')
		} finally {
			setMarkingPaid(false)
		}
	}

	const handleReopen = async () => {
		if (!toReopen?.entryId) return
		try {
			await reopen(toReopen.entryId).unwrap()
			setRows((prev) => ({
				...prev,
				[toReopen.employeeId]: { ...prev[toReopen.employeeId], status: 'DRAFT' },
			}))
			showToast(
				`${toReopen.firstName} ${toReopen.lastName} · reopened`,
				'success',
			)
			setToReopen(null)
		} catch {
			showToast('Failed to reopen', 'error')
		}
	}

	const rowList = useMemo(() => {
		return Object.values(rows).sort((a, b) =>
			`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
		)
	}, [rows])

	const totals = useMemo(() => {
		let cost = 0
		let paidCount = 0
		let filledCount = 0
		let feesSum = 0
		let taxesSum = 0
		let bonusesSum = 0
		let baseSum = 0
		for (const r of Object.values(rows)) {
			if (r.status === 'PAID') paidCount++
			if (r.status !== 'NEW') filledCount++
			const c = compute({
				rateType: r.rateType,
				rate: num(r.rate),
				hours: num(r.hours),
				bonusPercent: num(r.bonusPercent),
				fixedBonus: num(r.fixedBonus),
				advance: num(r.advance),
			})
			cost += c.cost
			feesSum += c.fee
			taxesSum += c.tax
			bonusesSum += c.bonusAmt
			baseSum += c.base
		}
		return {
			cost,
			paidCount,
			filledCount,
			total: Object.keys(rows).length,
			feesSum,
			taxesSum,
			bonusesSum,
			baseSum,
		}
	}, [rows])

	const selected = selectedId ? rows[selectedId] : null
	const preview = selected
		? compute({
				rateType: selected.rateType,
				rate: num(selected.rate),
				hours: num(selected.hours),
				bonusPercent: num(selected.bonusPercent),
				fixedBonus: num(selected.fixedBonus),
				advance: num(selected.advance),
			})
		: null

	const monthFilter = (
		<>
			<MonthBtn
				ref={monthBtnRef}
				type='button'
				$active={pickerOpen}
				onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
			>
				<MonthIconWrap>
					<CalendarMonthOutlined style={{ fontSize: 17 }} />
				</MonthIconWrap>
				<MonthLabel>
					{MONTHS[month - 1]} <YearTag>{year}</YearTag>
				</MonthLabel>
			</MonthBtn>
			{pickerOpen && popupPos && createPortal(
				<Popup
					ref={popupRef}
					$closing={pickerClosing}
					style={{ top: popupPos.top, left: popupPos.left }}
				>
					<PickerHead>
						<PickerYearBtn type='button' onClick={() => setPickerYear((y) => y - 1)}>‹</PickerYearBtn>
						<PickerYearTitle>{pickerYear}</PickerYearTitle>
						<PickerYearBtn type='button' onClick={() => setPickerYear((y) => y + 1)}>›</PickerYearBtn>
					</PickerHead>
					<PickerMonths>
						{MONTHS.map((m, i) => {
							const monthIdx = i + 1
							const isCur = pickerYear === year && monthIdx === month
							return (
								<PickerMonthBtn
									key={m}
									type='button'
									$active={isCur}
									onClick={() => {
										setYear(pickerYear)
										setMonth(monthIdx)
										closePicker()
									}}
								>
									{m.slice(0, 3)}
								</PickerMonthBtn>
							)
						})}
					</PickerMonths>
				</Popup>,
				document.body,
			)}
		</>
	)

	const isLoading = empLoading || entryLoading

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'Finances' },
					{ label: 'Salaries' },
					{ label: 'Monthly run', current: true },
				]}
				icon={<ChecklistRtlOutlined />}
				title='Monthly payroll run'
				subtitle='Pick a person, fill in the numbers, click when you pay them.'
				action={
					<HeaderRight>
						<Inscription>
							<InsciMuted>Payday,</InsciMuted>{' '}
							<InsciAccent>
								made simple
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
						<HeaderFilterRow>{monthFilter}</HeaderFilterRow>
					</HeaderRight>
				}
			>
				<Split>
					<Roster $count={rowList.length}>
						<RosterCounter>
							{(() => {
								const paid = totals.paidCount
								const filled = totals.filledCount
								const draft = Math.max(0, filled - paid)
								const empty = Math.max(0, totals.total - filled)
								return (
									<V4Wrap>
										<V4Num>
											<CountInt value={paid} />
										</V4Num>
										<V4Sep>/</V4Sep>
										<V4Denom>{totals.total}</V4Denom>
										<V4Label>paid</V4Label>
										<V4Sub>
											{draft} pending · {empty} empty
										</V4Sub>
									</V4Wrap>
								)
							})()}
						</RosterCounter>

						<RosterList key={`${year}-${month}`}>
							{isLoading ? (
								<RosterEmpty>Loading…</RosterEmpty>
							) : rowList.length === 0 ? (
								<RosterEmpty>No employees.</RosterEmpty>
							) : (
								rowList.map((r, idx) => {
									const isSelected = r.employeeId === selectedId
									const c = compute({
										rateType: r.rateType,
										rate: num(r.rate),
										hours: num(r.hours),
										bonusPercent: num(r.bonusPercent),
										fixedBonus: num(r.fixedBonus),
										advance: num(r.advance),
									})
									return (
										<RosterItem
											key={r.employeeId}
											type='button'
											$selected={isSelected}
											$index={idx}
											onClick={() => setSelectedId(r.employeeId)}
										>
											<RosterMain>
												<RosterName $selected={isSelected}>
													{r.firstName} {r.lastName}
												</RosterName>
											</RosterMain>
											<RosterRight>
												<StatusDot $status={r.status} $selected={isSelected} />
												{r.status !== 'NEW' && (
													<RosterCost
														$paid={r.status === 'PAID'}
														$selected={isSelected}
													>
														<CountMoney value={c.total} />
													</RosterCost>
												)}
											</RosterRight>
										</RosterItem>
									)
								})
							)}
						</RosterList>

					</Roster>

					<Detail>
						{!selected || isLoading ? (
							<DetailEmpty>
								<DetailEmptyIcon>
									<ChecklistRtlOutlined style={{ fontSize: 40 }} />
								</DetailEmptyIcon>
								Pick an employee on the left to start.
							</DetailEmpty>
						) : (
							<DetailInner>
								<DetailHead>
									<DetailHeadText>
										<DetailName>
											{selected.firstName} {selected.lastName}
										</DetailName>
									</DetailHeadText>
									<StatusPill $status={selected.status}>{selected.status}</StatusPill>
								</DetailHead>

								<HeroBlock>
									<HeroLabel>Total accrued</HeroLabel>
									<HeroValue>
										<CountMoney value={preview?.total ?? 0} duration={800} />
									</HeroValue>
									<HeroSubGrid>
										<HeroSubItem>
											<HeroSubLabel>Company cost</HeroSubLabel>
											<HeroSubValue>
												<CountMoney value={preview?.cost ?? 0} />
											</HeroSubValue>
										</HeroSubItem>
										<HeroSubDivider />
										<HeroSubItem>
											<HeroSubLabel>Payoneer fee</HeroSubLabel>
											<HeroSubValue>
												<CountMoney value={preview?.fee ?? 0} />
											</HeroSubValue>
										</HeroSubItem>
									</HeroSubGrid>
								</HeroBlock>

								<TypeToggleRow>
									<TypeOpt
										type='button'
										$active={selected.rateType === 'HOURLY'}
										disabled={selected.status === 'PAID'}
										onClick={() => {
											setRowField(selected.employeeId, 'rateType', 'HOURLY')
											setTimeout(
												() => persistRow({ ...rows[selected.employeeId], rateType: 'HOURLY' }),
												0,
											)
										}}
									>
										Hourly
									</TypeOpt>
									<TypeOpt
										type='button'
										$active={selected.rateType === 'MONTHLY'}
										disabled={selected.status === 'PAID'}
										onClick={() => {
											setRowField(selected.employeeId, 'rateType', 'MONTHLY')
											setTimeout(
												() => persistRow({ ...rows[selected.employeeId], rateType: 'MONTHLY' }),
												0,
											)
										}}
									>
										Monthly
									</TypeOpt>
								</TypeToggleRow>

								<Fields>
									<Field>
										<FieldLabel>
											Rate{' '}
											<RateUnit key={selected.rateType}>
												{selected.rateType === 'HOURLY' ? '($/h)' : '($/month)'}
											</RateUnit>
										</FieldLabel>
										<FieldInput
											type='number'
											step='0.01'
											min='0'
											value={selected.rate}
											placeholder='0.00'
											disabled={selected.status === 'PAID'}
											onChange={(e) =>
												setRowField(selected.employeeId, 'rate', e.target.value)
											}
											onBlur={() => persistRow(rows[selected.employeeId])}
										/>
									</Field>

									<HoursSlot $shown={selected.rateType === 'HOURLY'}>
										<Field>
											<FieldLabel>Hours</FieldLabel>
											<FieldInput
												type='number'
												step='0.01'
												min='0'
												value={selected.hours}
												placeholder='0'
												disabled={selected.status === 'PAID'}
												tabIndex={selected.rateType === 'HOURLY' ? 0 : -1}
												onChange={(e) =>
													setRowField(selected.employeeId, 'hours', e.target.value)
												}
												onBlur={() => persistRow(rows[selected.employeeId])}
											/>
										</Field>
									</HoursSlot>

									<Field>
										<FieldLabel>Bonus %</FieldLabel>
										<FieldInput
											type='number'
											step='0.01'
											min='0'
											max='100'
											value={selected.bonusPercent}
											disabled={selected.status === 'PAID'}
											onChange={(e) =>
												setRowField(selected.employeeId, 'bonusPercent', e.target.value)
											}
											onBlur={() => persistRow(rows[selected.employeeId])}
										/>
									</Field>

									<Field>
										<FieldLabel>Fixed bonus</FieldLabel>
										<FieldInput
											type='number'
											step='0.01'
											min='0'
											value={selected.fixedBonus}
											disabled={selected.status === 'PAID'}
											onChange={(e) =>
												setRowField(selected.employeeId, 'fixedBonus', e.target.value)
											}
											onBlur={() => persistRow(rows[selected.employeeId])}
										/>
									</Field>

									<Field>
										<FieldLabel>Advance</FieldLabel>
										<FieldInput
											type='number'
											step='0.01'
											min='0'
											value={selected.advance}
											disabled={selected.status === 'PAID'}
											onChange={(e) =>
												setRowField(selected.employeeId, 'advance', e.target.value)
											}
											onBlur={() => persistRow(rows[selected.employeeId])}
										/>
									</Field>
								</Fields>

								<LedgerBox>
									<LedgerRow>
										<LedgerLbl>Base</LedgerLbl>
										<LedgerVal>
											<CountMoney value={preview?.base ?? 0} duration={500} />
										</LedgerVal>
									</LedgerRow>
									<LedgerRow>
										<LedgerLbl>Tax (42.5 + 6%)</LedgerLbl>
										<LedgerVal>
											<CountMoney value={preview?.tax ?? 0} duration={500} />
										</LedgerVal>
									</LedgerRow>
									<LedgerRow>
										<LedgerLbl>Bonus</LedgerLbl>
										<LedgerVal>
											<CountMoney value={preview?.bonusAmt ?? 0} duration={500} />
										</LedgerVal>
									</LedgerRow>
									<LedgerSum>
										<LedgerLblSum>Remaining to pay</LedgerLblSum>
										<LedgerValSum>
											<CountMoney value={preview?.remain ?? 0} duration={500} />
										</LedgerValSum>
									</LedgerSum>
								</LedgerBox>

								<Actions>
									{selected.status === 'DRAFT' && selected.entryId && (
										<PermissionGate permission='salaries:update'>
											<PayBtn type='button' onClick={() => setToMarkPaid(selected)}>
												<CheckCircleOutline style={{ fontSize: 18 }} />
												Mark as paid
											</PayBtn>
										</PermissionGate>
									)}
									{selected.status === 'PAID' && (
										<PermissionGate permission='salaries:update'>
											<ReopenBtn type='button' onClick={() => setToReopen(selected)}>
												<LockOpenOutlined style={{ fontSize: 16 }} />
												Reopen
											</ReopenBtn>
										</PermissionGate>
									)}
									{selected.status === 'NEW' && (
										<Hint>Fill rate {selected.rateType === 'HOURLY' ? '+ hours' : ''} to save as draft.</Hint>
									)}
								</Actions>
							</DetailInner>
						)}
					</Detail>
				</Split>

				<SummaryCard>
					{(() => {
						const base = totals.baseSum
						const tax = totals.taxesSum
						const bonus = totals.bonusesSum
						const fee = totals.feesSum
						const cost = totals.cost
						const baseTax = base + tax
						const sum = Math.max(base + tax + bonus + fee, 1)
						const basePct = (base / sum) * 100
						const taxPct = (tax / sum) * 100
						const bonusPct = (bonus / sum) * 100
						const feePct = (fee / sum) * 100
						return (
							<>
								<SumHead>
									<SumTitleWrap>
										<SumEyebrow>Monthly summary</SumEyebrow>
										<SumTitle>
											{MONTHS[month - 1]} <SumYearTag>{year}</SumYearTag>
										</SumTitle>
									</SumTitleWrap>
									<SumHeadRight>
										<SumMeta>
											<SumMetaVal>{totals.total}</SumMetaVal>
											<SumMetaLbl>people</SumMetaLbl>
										</SumMeta>
										<SumMeta>
											<SumMetaVal>{totals.filledCount}</SumMetaVal>
											<SumMetaLbl>filled</SumMetaLbl>
										</SumMeta>
										<SumMeta>
											<SumMetaVal>{totals.paidCount}</SumMetaVal>
											<SumMetaLbl>paid</SumMetaLbl>
										</SumMeta>
									</SumHeadRight>
								</SumHead>

								<SumBarWrap>
									<SumBar>
										<SumSeg style={{ width: `${basePct}%`, background: '#0369a1' }} />
										<SumSeg style={{ width: `${taxPct}%`, background: '#94a3b8' }} />
										<SumSeg style={{ width: `${bonusPct}%`, background: '#d97706' }} />
										<SumSeg style={{ width: `${feePct}%`, background: '#64748b' }} />
									</SumBar>
								</SumBarWrap>

								<SumStatsRow>
									<SumStat>
										<SumStatHead>
											<SumStatDot $c='#0369a1' />
											<SumStatLbl>Base</SumStatLbl>
										</SumStatHead>
										<SumStatVal>
											<CountMoney value={base} />
										</SumStatVal>
									</SumStat>
									<SumStat>
										<SumStatHead>
											<SumStatDot $c='#94a3b8' />
											<SumStatLbl>Taxes</SumStatLbl>
										</SumStatHead>
										<SumStatVal>
											<CountMoney value={tax} />
										</SumStatVal>
									</SumStat>
									<SumStat>
										<SumStatHead>
											<SumStatDot $c='#d97706' />
											<SumStatLbl>Bonuses</SumStatLbl>
										</SumStatHead>
										<SumStatVal>
											<CountMoney value={bonus} />
										</SumStatVal>
									</SumStat>
									<SumStat>
										<SumStatHead>
											<SumStatDot $c='#64748b' />
											<SumStatLbl>Payoneer fee</SumStatLbl>
										</SumStatHead>
										<SumStatVal>
											<CountMoney value={fee} />
										</SumStatVal>
									</SumStat>
								</SumStatsRow>

								<SumTotalsRow>
									<SumSubtotal>
										<SumSubLbl>Base + Taxes</SumSubLbl>
										<SumSubVal>
											<CountMoney value={baseTax} />
										</SumSubVal>
									</SumSubtotal>
									<SumHero>
										<SumHeroLbl>Company cost</SumHeroLbl>
										<SumHeroVal>
											<CountMoney value={cost} />
										</SumHeroVal>
									</SumHero>
								</SumTotalsRow>
							</>
						)
					})()}
				</SummaryCard>
			</ListPageShell>

			{toReopen && (
				<ConfirmModal
					icon={<LockOpenOutlined />}
					iconTone='warning'
					title='Reopen paid payroll?'
					description={
						<>
							Reopening lets you edit numbers already paid out for{' '}
							<strong>
								{toReopen.firstName} {toReopen.lastName}
							</strong>
							.
						</>
					}
					confirmLabel='Reopen'
					confirmColor='warning'
					onConfirm={handleReopen}
					onClose={() => setToReopen(null)}
				/>
			)}

			{toMarkPaid && (
				<ConfirmModal
					icon={<CheckCircleOutline />}
					iconTone='success'
					title='Mark salary as paid?'
					description={
						<>
							Confirm that{' '}
							<strong>
								{toMarkPaid.firstName} {toMarkPaid.lastName}
							</strong>{' '}
							has been paid for {MONTHS[month - 1]} {year}. This locks the
							numbers — reopening later requires a separate confirmation.
						</>
					}
					confirmLabel='Mark as paid'
					confirmLoadingLabel='Marking…'
					confirmColor='success'
					onConfirm={handleMarkPaid}
					onClose={() => (markingPaid ? null : setToMarkPaid(null))}
					isLoading={markingPaid}
				/>
			)}
		</>
	)
}

export default SalariesRun

/* ─── Styles ───────────────────────────────────────────────────────── */

const squiggleDraw = keyframes`
	0% { stroke-dashoffset: 260; }
	60%, 100% { stroke-dashoffset: 0; }
`

const inscriptionIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const HeaderRight = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0;
`

const HeaderFilterRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-top: 22px;
`

const Inscription = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-style: italic;
	font-size: 28px;
	font-weight: 500;
	line-height: 1;
	letter-spacing: -0.6px;
	white-space: nowrap;
	animation: ${inscriptionIn} 500ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 720px) {
		font-size: 22px;
	}
`

const InsciMuted = styled.span`
	color: ${T.textStrong};
	opacity: 0.85;
`

const InsciAccent = styled.span`
	position: relative;
	display: inline-block;
	color: #d97706;
	font-weight: 700;
	font-style: italic;
	padding-bottom: 4px;
`

const InsciSquiggle = styled.svg`
	position: absolute;
	left: 0;
	right: 0;
	bottom: -4px;
	width: 100%;
	height: 10px;
	color: #d97706;
	stroke-dasharray: 260;
	animation: ${squiggleDraw} 1.6s cubic-bezier(0.22, 1, 0.36, 1) 300ms both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		stroke-dashoffset: 0;
	}
`

const InsciDot = styled.span`
	color: ${T.textStrong};
	font-weight: 700;
	margin-left: -6px;
`

const Split = styled.div`
	display: grid;
	grid-template-columns: minmax(280px, 340px) 1fr;
	gap: 20px;
	align-items: start;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

/* ── Roster (left column) ───────────────────────────────────────── */

const ROSTER_SCROLL_THRESHOLD = 15

const Roster = styled.div<{ $count: number }>`
	background: #ffffff;
	border-radius: 16px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 8px 24px rgba(15, 23, 42, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ $count }) =>
		$count > ROSTER_SCROLL_THRESHOLD
			? 'max-height: calc(100vh - 240px); min-height: 480px;'
			: ''}
`

const RosterCounter = styled.div`
	display: flex;
	align-items: center;
	padding: 14px 18px;
	background: ${T.subtleBg};
	border-bottom: 1px solid ${T.divider};
`

const V4Wrap = styled.div`
	display: flex;
	align-items: baseline;
	gap: 4px;
	width: 100%;
`

const V4Num = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 34px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -1px;
	line-height: 1;
`

const V4Sep = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 24px;
	font-weight: 400;
	color: ${T.textMuted};
	line-height: 1;
`

const V4Denom = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 22px;
	font-weight: 500;
	color: ${T.textSecondary};
	letter-spacing: -0.5px;
	line-height: 1;
`

const V4Label = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${T.primary};
	margin-left: 6px;
	align-self: center;
`

const V4Sub = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
	color: ${T.textStrong};
	margin-left: auto;
	align-self: center;
	white-space: nowrap;
`

const RosterList = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 6px;
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const RosterEmpty = styled.div`
	padding: 40px 20px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 13px;
`

const rosterIn = keyframes`
	from {
		opacity: 0;
		transform: translateX(-8px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`

const RosterItem = styled.button<{ $selected: boolean; $index: number }>`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 10px;
	align-items: center;
	padding: 12px 14px;
	border-radius: 10px;
	background: ${({ $selected }) =>
		$selected
			? `linear-gradient(135deg, ${T.primary}, #075985)`
			: 'transparent'};
	box-shadow: ${({ $selected }) =>
		$selected ? '0 6px 18px rgba(3, 105, 161, 0.24)' : 'none'};
	border: none;
	cursor: pointer;
	text-align: left;
	font: inherit;
	position: relative;
	animation: ${rosterIn} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${({ $index }) => Math.min($index, 24) * 35}ms;
	transition:
		background 160ms ease,
		box-shadow 160ms ease;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	&:hover {
		background: ${({ $selected }) =>
			$selected
				? `linear-gradient(135deg, ${T.primary}, #075985)`
				: 'rgba(3, 105, 161, 0.04)'};
	}
`

const RosterMain = styled.div`
	min-width: 0;
`

const RosterName = styled.div<{ $selected?: boolean }>`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 16px;
	font-weight: 400;
	color: ${({ $selected }) => ($selected ? '#ffffff' : T.textStrong)};
	letter-spacing: -0.3px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const RosterRight = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
`

const RosterCost = styled.span<{ $paid: boolean; $selected?: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.2px;
	color: ${({ $selected }) => ($selected ? '#ffffff' : T.textStrong)};
	transition: color 160ms ease;
`

const pulseGreen = keyframes`
	0% {
		box-shadow:
			0 0 0 3px rgba(52, 211, 153, 0.35),
			0 0 0 0 rgba(52, 211, 153, 0.55);
	}
	70% {
		box-shadow:
			0 0 0 3px rgba(52, 211, 153, 0.28),
			0 0 0 12px rgba(52, 211, 153, 0);
	}
	100% {
		box-shadow:
			0 0 0 3px rgba(52, 211, 153, 0.28),
			0 0 0 0 rgba(52, 211, 153, 0);
	}
`

const pulseOrange = keyframes`
	0% {
		box-shadow:
			0 0 0 3px rgba(251, 146, 60, 0.38),
			0 0 0 0 rgba(251, 146, 60, 0.55);
	}
	70% {
		box-shadow:
			0 0 0 3px rgba(251, 146, 60, 0.30),
			0 0 0 12px rgba(251, 146, 60, 0);
	}
	100% {
		box-shadow:
			0 0 0 3px rgba(251, 146, 60, 0.30),
			0 0 0 0 rgba(251, 146, 60, 0);
	}
`

const pulseWhite = keyframes`
	0% {
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.22),
			0 0 0 0 rgba(255, 255, 255, 0.45);
	}
	70% {
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.15),
			0 0 0 12px rgba(255, 255, 255, 0);
	}
	100% {
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.15),
			0 0 0 0 rgba(255, 255, 255, 0);
	}
`

const StatusDot = styled.span<{
	$status: 'DRAFT' | 'PAID' | 'NEW'
	$selected?: boolean
}>`
	width: ${({ $selected }) => ($selected ? '10px' : '8px')};
	height: ${({ $selected }) => ($selected ? '10px' : '8px')};
	border-radius: 50%;
	margin-right: ${({ $selected }) => ($selected ? '6px' : '0')};
	transition:
		background 160ms ease,
		width 160ms ease,
		height 160ms ease,
		margin-right 160ms ease;

	${({ $status, $selected }) => {
		if ($selected) {
			const bg =
				$status === 'PAID'
					? '#34d399'
					: $status === 'DRAFT'
						? '#fb923c'
						: 'rgba(255, 255, 255, 0.6)'
			const anim =
				$status === 'PAID'
					? pulseGreen
					: $status === 'DRAFT'
						? pulseOrange
						: pulseWhite
			return css`
				background: ${bg};
				animation: ${anim} 2s ease-out infinite;

				@media (prefers-reduced-motion: reduce) {
					animation: none;
					box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
				}
			`
		}
		const bg =
			$status === 'PAID'
				? '#10b981'
				: $status === 'DRAFT'
					? '#d97706'
					: 'rgba(15, 23, 42, 0.15)'
		const halo =
			$status === 'PAID'
				? '0 0 0 3px rgba(16, 185, 129, 0.16)'
				: $status === 'DRAFT'
					? '0 0 0 3px rgba(217, 119, 6, 0.18)'
					: '0 0 0 3px rgba(15, 23, 42, 0.06)'
		return css`
			background: ${bg};
			box-shadow: ${halo};
		`
	}}
`

const SummaryCard = styled.div`
	margin-top: 20px;
	padding: 24px 28px;
	background: #ffffff;
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 10px 26px rgba(15, 23, 42, 0.06);

	@media (max-width: 720px) {
		padding: 18px 16px;
	}
`

const SumHead = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 20px;
	margin-bottom: 20px;
	flex-wrap: wrap;
`

const SumTitleWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
`

const SumEyebrow = styled.span`
	font-size: 9.5px;
	font-weight: 800;
	letter-spacing: 1px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const SumTitle = styled.h3`
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 22px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.6px;
	line-height: 1.1;
`

const SumYearTag = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 16px;
	font-weight: 500;
	color: ${T.textSecondary};
	letter-spacing: -0.3px;
	margin-left: 3px;
`

const SumHeadRight = styled.div`
	display: flex;
	gap: 20px;
	align-items: baseline;
`

const SumMeta = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;
`

const SumMetaVal = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 16px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
	line-height: 1;
`

const SumMetaLbl = styled.span`
	font-size: 9px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const SumBarWrap = styled.div`
	margin-bottom: 22px;
`

const SumBar = styled.div`
	display: flex;
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	overflow: hidden;
	box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
`

const SumSeg = styled.div`
	height: 100%;
	transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
`

const SumStatsRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	padding: 14px 0;
	border-top: 1px solid rgba(15, 23, 42, 0.08);
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);

	@media (max-width: 720px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
`

const SumStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const SumStatHead = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`

const SumStatDot = styled.span<{ $c: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $c }) => $c};
	box-shadow: 0 0 0 2.5px ${({ $c }) => `${$c}22`};
`

const SumStatLbl = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11.5px;
	font-weight: 600;
	color: ${T.textSecondary};
`

const SumStatVal = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 16px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
	line-height: 1;
`

const SumTotalsRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 20px;
	padding-top: 16px;
	flex-wrap: wrap;
`

const SumSubtotal = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const SumSubLbl = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const SumSubVal = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 17px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
	line-height: 1;
`

const SumHero = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 6px;
`

const SumHeroLbl = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.primary};
`

const SumHeroVal = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 26px;
	font-weight: 700;
	color: ${T.primary};
	letter-spacing: -0.8px;
	line-height: 1;
`

/* ── Detail (right column) ──────────────────────────────────── */

const detailIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Detail = styled.div`
	background: #ffffff;
	border-radius: 16px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 8px 24px rgba(15, 23, 42, 0.06);
	padding: 28px 32px 32px;
	min-height: 480px;
`

const DetailEmpty = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 80px 24px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 14px;
`

const DetailEmptyIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: ${T.primaryTint};
	color: ${T.primary};
`

const DetailInner = styled.div`
	animation: ${detailIn} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const DetailHead = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	margin-bottom: 22px;
`

const DetailHeadText = styled.div`
	flex: 1;
	min-width: 0;
`

const DetailName = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 26px;
	font-weight: 400;
	color: ${T.textStrong};
	letter-spacing: -0.7px;
	line-height: 1.15;
`

const StatusPill = styled.span<{ $status: 'DRAFT' | 'PAID' | 'NEW' }>`
	display: inline-block;
	padding: 4px 12px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	white-space: nowrap;
	background: ${({ $status }) =>
		$status === 'PAID'
			? 'rgba(16, 185, 129, 0.15)'
			: $status === 'DRAFT'
				? 'rgba(217, 119, 6, 0.15)'
				: 'rgba(15, 23, 42, 0.05)'};
	color: ${({ $status }) =>
		$status === 'PAID'
			? '#059669'
			: $status === 'DRAFT'
				? '#b45309'
				: T.textMuted};
`

const HeroBlock = styled.div`
	padding: 22px 24px;
	border-radius: 16px;
	background: linear-gradient(135deg, ${T.primary}, #075985);
	color: #ffffff;
	margin-bottom: 24px;
	box-shadow: 0 8px 24px rgba(3, 105, 161, 0.2);
`

const HeroLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.85);
	margin-bottom: 4px;
`

const HeroValue = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 34px;
	font-weight: 700;
	letter-spacing: -0.9px;
	line-height: 1.05;
`

const HeroSubGrid = styled.div`
	display: flex;
	align-items: stretch;
	gap: 18px;
	margin-top: 16px;
	padding-top: 14px;
	border-top: 1px solid rgba(255, 255, 255, 0.18);
`

const HeroSubItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
`

const HeroSubLabel = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.7);
`

const HeroSubValue = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 15px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.92);
`

const HeroSubDivider = styled.span`
	width: 1px;
	background: rgba(255, 255, 255, 0.18);
`

const TypeToggleRow = styled.div`
	display: inline-flex;
	padding: 4px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	margin-bottom: 20px;
`

const TypeOpt = styled.button<{ $active: boolean }>`
	padding: 8px 20px;
	border-radius: 999px;
	border: none;
	background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
	color: ${({ $active }) => ($active ? T.primary : T.textSecondary)};
	font: inherit;
	font-size: 12.5px;
	font-weight: 700;
	cursor: pointer;
	text-transform: none;
	transition: all 160ms ease;
	box-shadow: ${({ $active }) =>
		$active ? '0 2px 6px rgba(15, 23, 42, 0.1)' : 'none'};
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	&:hover:not(:disabled) {
		color: ${({ $active }) => ($active ? T.primary : T.textStrong)};
	}
`

const Fields = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
	margin-bottom: 22px;
`

const Field = styled.label`
	flex: 1 1 160px;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const HoursSlot = styled.div<{ $shown: boolean }>`
	flex: ${({ $shown }) => ($shown ? '1 1 160px' : '0 0 0px')};
	min-width: 0;
	overflow: hidden;
	opacity: ${({ $shown }) => ($shown ? 1 : 0)};
	transform: ${({ $shown }) =>
		$shown ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-8px)'};
	transform-origin: left center;
	transition:
		flex-basis 380ms cubic-bezier(0.22, 1, 0.36, 1),
		flex-grow 380ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 240ms ease,
		transform 380ms cubic-bezier(0.22, 1, 0.36, 1);

	& > label {
		width: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const rateUnitIn = keyframes`
	from { opacity: 0; transform: translateY(-3px); }
	to { opacity: 1; transform: translateY(0); }
`

const RateUnit = styled.span`
	display: inline-block;
	animation: ${rateUnitIn} 260ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const FieldLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.55px;
	color: ${T.textSecondary};
	text-transform: uppercase;
`

const FieldInput = styled.input`
	padding: 10px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	outline: none;
	transition:
		border-color 160ms ease,
		box-shadow 160ms ease;
	&::-webkit-inner-spin-button,
	&::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	&::placeholder {
		color: ${T.textMuted};
		font-weight: 400;
	}
	&:hover:not(:disabled) {
		border-color: rgba(15, 23, 42, 0.22);
	}
	&:focus {
		border-color: ${T.primary};
		box-shadow: 0 0 0 4px ${T.primaryTint};
	}
	&:disabled {
		background: rgba(15, 23, 42, 0.03);
		color: ${T.textMuted};
		cursor: not-allowed;
	}
`

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`

const PayBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	border-radius: 999px;
	border: none;
	background: #059669;
	color: #ffffff;
	font: inherit;
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
	text-transform: none;
	letter-spacing: 0.2px;
	box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22);
	transition:
		background 160ms ease,
		transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 160ms ease;
	&:hover {
		background: #047857;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
	}
`

const ReopenBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 18px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: transparent;
	color: ${T.textSecondary};
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	text-transform: none;
	transition: all 160ms ease;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const Hint = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
	font-style: italic;
`

/* ── Month picker (portalled, same shape as other pages) ── */

const iconWiggle = keyframes`
	0%, 100% { transform: rotate(0deg); }
	20% { transform: rotate(-10deg); }
	45% { transform: rotate(9deg); }
	70% { transform: rotate(-5deg); }
	85% { transform: rotate(3deg); }
`

const MonthIconWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: center;
`

const MonthBtn = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 9px;
	padding: 0 18px;
	height: 44px;
	box-sizing: border-box;
	border-radius: 999px;
	border: 1.5px solid ${T.primary};
	background: #ffffff;
	color: ${T.primary};
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	line-height: 1;
	cursor: pointer;
	text-transform: none;
	white-space: nowrap;
	flex-shrink: 0;
	transition:
		background 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		transform: translateY(-1px);
	}

	&:hover ${MonthIconWrap} {
		animation: ${iconWiggle} 620ms ease-in-out;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover ${MonthIconWrap} {
			animation: none;
		}
	}
`

const MonthLabel = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
`

const YearTag = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	color: ${T.primary};
	opacity: 0.75;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.2px;
`

const popupIn = keyframes`
	from { opacity: 0; transform: translateY(-8px) scale(0.96); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const popupOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); }
	to   { opacity: 0; transform: translateY(-6px) scale(0.97); }
`

const Popup = styled.div<{ $closing: boolean }>`
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
	animation: ${({ $closing }) =>
			$closing
				? css`
						${popupOut} 180ms cubic-bezier(0.4, 0, 0.6, 1) both
					`
				: css`
						${popupIn} 220ms cubic-bezier(0.22, 1, 0.36, 1) both
					`};

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: ${({ $closing }) => ($closing ? 0 : 1)};
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
	font-family: 'JetBrains Mono', monospace;
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

const PickerMonthBtn = styled.button<{ $active: boolean }>`
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
		${({ $active }) => ($active ? T.primary : 'rgba(15, 23, 42, 0.08)')};
	transition:
		background 160ms ease,
		color 160ms ease,
		border-color 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover {
		background: ${({ $active }) => ($active ? T.primary : T.primaryTint)};
		border-color: ${T.primary};
		color: ${({ $active }) => ($active ? '#ffffff' : T.primary)};
		transform: translateY(-1px);
	}
`

const LedgerBox = styled.div`
	display: flex;
	flex-direction: column;
	padding: 4px 0 0;
	margin-bottom: 22px;
`

const LedgerRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding: 8px 0;
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const LedgerLbl = styled.span``

const LedgerVal = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 17px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.25px;
`

const LedgerSum = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-top: 8px;
	padding-top: 12px;
	border-top: 1.5px solid rgba(15, 23, 42, 0.14);
`

const LedgerLblSum = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

const LedgerValSum = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 19px;
	font-weight: 700;
	color: ${T.primary};
	letter-spacing: -0.3px;
`

