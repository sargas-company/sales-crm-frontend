import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { CalendarMonthOutlined, AssessmentOutlined } from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { Crumbs, PageHead as BasePageHead, ViewFade } from '../salesAnalytics.styled'
import {
	useGetTimeOffCalendarQuery,
	useGetTimeOffBalancesQuery,
	type CalendarRecord,
	type TimeOffType,
} from '../../../store/time-off/timeOffApi'

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
] as const

const currentYear = () => new Date().getUTCFullYear()
const currentMonth = () => new Date().getUTCMonth() + 1

const TYPE_META: Record<
	TimeOffType,
	{ label: string; bg: string; fg: string; solid: string; soft: string }
> = {
	VACATION: {
		label: 'Vacation',
		bg: 'rgba(3, 105, 161, 0.85)',
		fg: '#ffffff',
		solid: '#0369a1',
		soft: 'rgba(3, 105, 161, 0.25)',
	},
	SICK_LEAVE: {
		label: 'Sick leave',
		bg: 'rgba(220, 38, 38, 0.85)',
		fg: '#ffffff',
		solid: '#b91c1c',
		soft: 'rgba(185, 28, 28, 0.25)',
	},
	UNPAID_LEAVE: {
		label: 'Unpaid leave',
		bg: 'rgba(100, 116, 139, 0.85)',
		fg: '#ffffff',
		solid: '#475569',
		soft: 'rgba(71, 85, 105, 0.25)',
	},
}

// Column geometry for the wall chart.
const ROW_HEIGHT = 48
const HEADER_HEIGHT = 48
const EMP_COL_WIDTH = 240

const isWeekend = (year: number, month: number, day: number): boolean => {
	const d = new Date(Date.UTC(year, month - 1, day))
	const dow = d.getUTCDay()
	return dow === 0 || dow === 6
}

const dayFromISO = (iso: string): number => Number(iso.slice(8, 10))

const workingDaysInRange = (year: number, month: number, from: number, to: number): number => {
	let n = 0
	for (let d = from; d <= to; d++) {
		if (!isWeekend(year, month, d)) n++
	}
	return n
}

const TimeOffAnalytics = () => {
	const navigate = useNavigate()
	const [year, setYear] = useState<number>(currentYear())
	const [month, setMonth] = useState<number>(currentMonth())

	// Fancy date picker popup — replaces the month/year selects.
	const [pickerOpen, setPickerOpen] = useState(false)
	const [pickerYear, setPickerYear] = useState<number>(currentYear())
	const pickerRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (!pickerOpen) return
		setPickerYear(year)
		const onClick = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setPickerOpen(false)
			}
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setPickerOpen(false)
		}
		window.addEventListener('mousedown', onClick)
		window.addEventListener('keydown', onKey)
		return () => {
			window.removeEventListener('mousedown', onClick)
			window.removeEventListener('keydown', onKey)
		}
	}, [pickerOpen, year])

	const { data: calendar, isLoading: calLoading } = useGetTimeOffCalendarQuery({
		year,
		month,
	})
	const { data: balances, isLoading: balLoading } = useGetTimeOffBalancesQuery({ year })

	const daysInMonth = calendar?.daysInMonth ?? 30
	const dayList = Array.from({ length: daysInMonth }, (_, i) => i + 1)

	const groupedByEmployee = useMemo(() => {
		const map = new Map<string, CalendarRecord[]>()
		for (const rec of calendar?.records ?? []) {
			const arr = map.get(rec.employeeId) ?? []
			arr.push(rec)
			map.set(rec.employeeId, arr)
		}
		return map
	}, [calendar])

	return (
		<ViewFade>
			<Root>
				<SectionCard>
					<Crumbs>
						<span className='crumb-dot' aria-hidden='true' />
						<span className='current'>Time off dashboard</span>
					</Crumbs>

					<PageHead>
						<div className='title'>
							<h1>Time Off</h1>
							<p>Wall-chart schedule, per-employee balances and yearly allowance status.</p>
						</div>
						<div className='title-right' aria-hidden='true'>
							<span className='hand-line'>time to breathe</span>
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

					<ControlsRow>
						<Legend>
							{(['VACATION', 'SICK_LEAVE', 'UNPAID_LEAVE'] as TimeOffType[]).map((t) => (
								<LegendItem key={t}>
									<LegendSwatch $bg={TYPE_META[t].solid} />
									{TYPE_META[t].label}
								</LegendItem>
							))}
							<LegendSep />
							<LegendItem>
								<WeekendSwatch />
								Weekend
							</LegendItem>
						</Legend>
						<HeadTools>
							<DatePickerAnchor ref={pickerRef}>
								<DatePickerButton
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
								<DatePickerPopup
									$open={pickerOpen}
									role='dialog'
									aria-label='Pick month and year'
									aria-hidden={!pickerOpen}
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
											const isCurrent = pickerYear === year && monthIdx === month
											const isRealToday =
												pickerYear === currentYear() && monthIdx === currentMonth()
											return (
												<PickerMonthBtn
													key={m}
													type='button'
													$active={isCurrent}
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
								</DatePickerPopup>
							</DatePickerAnchor>
						</HeadTools>
					</ControlsRow>

					{calLoading ? (
						<LoadingBlock>Loading calendar…</LoadingBlock>
					) : !calendar || calendar.employees.length === 0 ? (
						<EmptyState>No employees to display for this month.</EmptyState>
					) : (
						<Scroller>
							<Chart
								style={{
									gridTemplateColumns: `${EMP_COL_WIDTH}px repeat(${daysInMonth}, minmax(30px, 1fr))`,
									gridTemplateRows: `${HEADER_HEIGHT}px repeat(${calendar.employees.length}, ${ROW_HEIGHT}px)`,
								}}
							>
								{/* Today accent — soft fill through the current day column. */}
								{(() => {
									const now = new Date()
									if (now.getUTCFullYear() !== year || now.getUTCMonth() + 1 !== month) {
										return null
									}
									const today = now.getUTCDate()
									return (
										<TodayLine
											style={{
												gridColumn: today + 1,
												gridRow: `2 / span ${calendar.employees.length}`,
											}}
										/>
									)
								})()}

								{/* Header row */}
								<HeaderCorner>Employee</HeaderCorner>
								{dayList.map((d) => {
									const isToday =
										new Date().getUTCFullYear() === year &&
										new Date().getUTCMonth() + 1 === month &&
										new Date().getUTCDate() === d
									return (
										<HeaderDay
											key={`h-${d}`}
											$weekend={isWeekend(year, month, d)}
											$today={isToday}
											style={{ gridRow: 1, gridColumn: d + 1 }}
										>
											<HeaderDayNum>{d}</HeaderDayNum>
											<HeaderDayWk>
												{new Date(Date.UTC(year, month - 1, d))
													.toLocaleDateString('en-US', { weekday: 'short' })
													.slice(0, 2)}
											</HeaderDayWk>
										</HeaderDay>
									)
								})}

								{/* Body rows */}
								{calendar.employees.map((emp, i) => {
									const row = i + 2 // header is row 1
									const recs = groupedByEmployee.get(emp.id) ?? []
									return (
										<RowFragment key={emp.id}>
											<EmployeeCell style={{ gridRow: row, gridColumn: 1 }}>
												<EmpName>
													{emp.firstName} {emp.lastName}
												</EmpName>
												{emp.positions.length > 0 && (
													<EmpPos>{emp.positions[0]}</EmpPos>
												)}
											</EmployeeCell>
											{dayList.map((d) => (
												<Cell
													key={`c-${emp.id}-${d}`}
													$weekend={isWeekend(year, month, d)}
													style={{ gridRow: row, gridColumn: d + 1 }}
												/>
											))}
											{recs.flatMap((rec) => {
												const startDay = dayFromISO(rec.startDate)
												const endDay = dayFromISO(rec.endDate)
												const meta = TYPE_META[rec.type]
												const totalWorkingDays = workingDaysInRange(
													year,
													month,
													startDay,
													endDay
												)

												// Split the record into contiguous working-day runs;
												// weekends punch a visual gap between segments.
												const segments: { from: number; to: number }[] = []
												let segStart: number | null = null
												for (let d = startDay; d <= endDay; d++) {
													if (!isWeekend(year, month, d)) {
														if (segStart === null) segStart = d
													} else if (segStart !== null) {
														segments.push({ from: segStart, to: d - 1 })
														segStart = null
													}
												}
												if (segStart !== null)
													segments.push({ from: segStart, to: endDay })

												return segments.map((seg, segIdx) => {
													const isFirst = segIdx === 0
													const isLast = segIdx === segments.length - 1
													const segSpan = seg.to - seg.from + 1
													const openLeft = isFirst && rec.continuesLeft
													const openRight = isLast && rec.continuesRight
													return (
														<Bar
															key={`${rec.id}-s${segIdx}`}
															onClick={() =>
																navigate(`/employees/time-off/${rec.id}`)
															}
															title={`${meta.label} · ${totalWorkingDays} working day${
																totalWorkingDays === 1 ? '' : 's'
															} (days ${startDay}–${endDay})`}
															style={{
																gridRow: row,
																gridColumn: `${seg.from + 1} / span ${segSpan}`,
																background: meta.bg,
																color: meta.fg,
																boxShadow: `0 2px 6px ${meta.soft}, inset 0 -1px 0 rgba(0, 0, 0, 0.12)`,
																borderTopLeftRadius: openLeft ? 0 : 10,
																borderBottomLeftRadius: openLeft ? 0 : 10,
																borderTopRightRadius: openRight ? 0 : 10,
																borderBottomRightRadius: openRight ? 0 : 10,
																animationDelay: `${(i * 60 + seg.from * 18) % 900}ms`,
															}}
														>
															{segSpan === 1 ? (
																<BarPip aria-label='1 day' />
															) : (
																<BarLabel>
																	<BarLabelNum>{segSpan}</BarLabelNum>
																	<BarLabelUnit>days</BarLabelUnit>
																</BarLabel>
															)}
														</Bar>
													)
												})
											})}
										</RowFragment>
									)
								})}
							</Chart>
						</Scroller>
					)}
				</SectionCard>

				<SectionCard>
					<SectionHead>
						<SectionTitle>
							<AssessmentOutlined style={{ fontSize: 22 }} />
							<span>Annual balances · {year}</span>
						</SectionTitle>
						<HeadHint>
							Allowance · Vacation {balances?.allowances.vacation ?? 21}d · Sick{' '}
							{balances?.allowances.sickLeave ?? 5}d · Unpaid unlimited
						</HeadHint>
					</SectionHead>

					{balLoading ? (
						<LoadingBlock>Loading balances…</LoadingBlock>
					) : !balances || balances.employees.length === 0 ? (
						<EmptyState>No employees to display.</EmptyState>
					) : (
						<TableWrap>
							<BalTable>
								<thead>
									<tr>
										<th>Employee</th>
										<th>Vacation used / remaining</th>
										<th>Sick used / remaining</th>
										<th>Unpaid days</th>
										<th>Next absence</th>
									</tr>
								</thead>
								<tbody>
									{balances.employees.map((row) => (
										<tr key={row.employee.id}>
											<td>
												<BalName>
													{row.employee.firstName} {row.employee.lastName}
												</BalName>
												{row.employee.positions.length > 0 && (
													<BalPos>{row.employee.positions[0]}</BalPos>
												)}
											</td>
											<td>
												<BalRatio>
													<BalNum>{row.vacationUsed}</BalNum>
													<BalSlash>/</BalSlash>
													<BalRemain>{row.vacationRemaining}</BalRemain>
												</BalRatio>
												{(() => {
													const pct = Math.min(
														100,
														(row.vacationUsed / balances.allowances.vacation) * 100
													)
													return (
														<BalBar>
															<BalBarFill
																$tone='VACATION'
																style={{ width: `${pct}%` }}
															>
																<BalShimmer />
															</BalBarFill>
															{pct > 0 && (
																<BalCursor
																	$tone='VACATION'
																	style={{ left: `${pct}%` }}
																/>
															)}
														</BalBar>
													)
												})()}
											</td>
											<td>
												<BalRatio>
													<BalNum>{row.sickUsed}</BalNum>
													<BalSlash>/</BalSlash>
													<BalRemain>{row.sickRemaining}</BalRemain>
												</BalRatio>
												{(() => {
													const pct = Math.min(
														100,
														(row.sickUsed / balances.allowances.sickLeave) * 100
													)
													return (
														<BalBar>
															<BalBarFill
																$tone='SICK_LEAVE'
																style={{ width: `${pct}%` }}
															>
																<BalShimmer />
															</BalBarFill>
															{pct > 0 && (
																<BalCursor
																	$tone='SICK_LEAVE'
																	style={{ left: `${pct}%` }}
																/>
															)}
														</BalBar>
													)
												})()}
											</td>
											<td>
												<BalRatio>
													<BalNum>{row.unpaidDays}</BalNum>
												</BalRatio>
											</td>
											<td>
												{row.nextAbsence ? (
													<NextAbsence>
														<NextType $type={row.nextAbsence.type}>
															{TYPE_META[row.nextAbsence.type].label}
														</NextType>
														<NextRange>
															{row.nextAbsence.startDate} → {row.nextAbsence.endDate}
														</NextRange>
													</NextAbsence>
												) : (
													<Muted>—</Muted>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</BalTable>
						</TableWrap>
					)}
				</SectionCard>
			</Root>
		</ViewFade>
	)
}

export default TimeOffAnalytics

const Root = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`

const PageHead = styled(BasePageHead)`
	.title-right {
		margin-right: 56px;
		margin-top: -6px;
	}

	@media (max-width: 720px) {
		.title-right {
			margin-right: 0;
			margin-top: 0;
		}
	}
`

const SectionCard = styled.section`
	background: #ffffff;
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	padding: 32px 36px 36px;

	@media (max-width: 720px) {
		padding: 22px 20px 26px;
	}
`

const SectionHead = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 14px;
	margin-bottom: 14px;
`

const ControlsRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 14px;
	margin-bottom: 18px;
`

const SectionTitle = styled.h2`
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-size: 17px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

const HeadTools = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`

const HeadHint = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`

const DatePickerAnchor = styled.div`
	position: relative;
	display: inline-block;
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

const DatePickerPopup = styled.div<{ $open: boolean }>`
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	z-index: 40;
	width: 320px;
	padding: 16px;
	border-radius: 16px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow:
		0 12px 32px rgba(15, 23, 42, 0.12),
		0 2px 6px rgba(15, 23, 42, 0.06);
	transform-origin: top right;
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	transform: ${({ $open }) => ($open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)')};
	visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
	pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
	transition:
		opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
		visibility 240ms;

	@media (prefers-reduced-motion: reduce) {
		transition: opacity 120ms linear;
		transform: none;
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

const Legend = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
	font-size: 15px;
	font-weight: 400;
	color: ${T.textStrong};
`

const LegendItem = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 12px;
`

const LegendSep = styled.span`
	width: 1px;
	height: 24px;
	background: rgba(15, 23, 42, 0.1);
`

const LegendSwatch = styled.span<{ $bg: string }>`
	display: inline-block;
	width: 48px;
	height: 20px;
	border-radius: 7px;
	background: ${({ $bg }) => $bg};
`

const WeekendSwatch = styled.span`
	display: inline-block;
	width: 48px;
	height: 20px;
	border-radius: 7px;
	background: repeating-linear-gradient(
		45deg,
		rgba(15, 23, 42, 0.07),
		rgba(15, 23, 42, 0.07) 5px,
		rgba(255, 255, 255, 1) 5px,
		rgba(255, 255, 255, 1) 10px
	);
`

const Scroller = styled.div`
	overflow-x: auto;
	overflow-y: hidden;
	border-radius: 16px;
	background: #ffffff;
	box-shadow:
		inset 0 0 0 1px rgba(15, 23, 42, 0.06),
		0 1px 2px rgba(15, 23, 42, 0.02);
	-webkit-overflow-scrolling: touch;
	overscroll-behavior-x: contain;
	scrollbar-gutter: stable;

	&::-webkit-scrollbar {
		height: 10px;
	}
	&::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.03);
		border-radius: 0 0 16px 16px;
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

const Chart = styled.div`
	display: grid;
	position: relative;
	background: #ffffff;
	min-width: 100%;
	width: max-content;
`

const RowFragment = styled.div`
	display: contents;
`

const TodayLine = styled.div`
	background: rgba(3, 105, 161, 0.08);
	z-index: 0;
	pointer-events: none;
`

const HeaderCorner = styled.div`
	grid-column: 1;
	grid-row: 1;
	position: sticky;
	left: 0;
	z-index: 6;
	background: linear-gradient(180deg, #ffffff 0%, #fbfaff 100%);
	padding: 10px 16px;
	font-size: 10.5px;
	font-weight: 700;
	color: ${T.textMuted};
	text-transform: uppercase;
	letter-spacing: 0.8px;
	box-shadow:
		1px 0 0 rgba(15, 23, 42, 0.08),
		0 1px 0 rgba(15, 23, 42, 0.08);
	display: flex;
	align-items: center;
	min-width: 0;
`

const HeaderDay = styled.div<{ $weekend: boolean; $today: boolean }>`
	position: relative;
	background: linear-gradient(180deg, #ffffff 0%, #fbfaff 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 6px 2px;
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.1),
		0 1px 0 rgba(15, 23, 42, 0.12);
	min-width: 0;
	overflow: hidden;

	${({ $today }) =>
		$today &&
		`
		background: linear-gradient(180deg, #f0f9ff 0%, #dbeafe 100%);
		box-shadow: inset -1px 0 0 rgba(15, 23, 42, 0.1), 0 2px 0 rgba(3, 105, 161, 0.45);
	`}
`

const HeaderDayNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	line-height: 1.05;
`

const HeaderDayWk = styled.span`
	font-size: 9px;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.4px;
	line-height: 1.2;
	margin-top: 2px;
`

const EmployeeCell = styled.div`
	position: sticky;
	left: 0;
	z-index: 3;
	background: #ffffff;
	padding: 8px 16px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
	box-shadow:
		1px 0 0 rgba(15, 23, 42, 0.08),
		inset 0 -1px 0 rgba(15, 23, 42, 0.06);
	min-width: 0;
`

const EmpName = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const EmpPos = styled.span`
	font-size: 11px;
	color: ${T.textSecondary};
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const Cell = styled.div<{ $weekend: boolean }>`
	background: ${({ $weekend }) =>
		$weekend
			? `repeating-linear-gradient(
					45deg,
					rgba(15, 23, 42, 0.07),
					rgba(15, 23, 42, 0.07) 5px,
					rgba(255, 255, 255, 1) 5px,
					rgba(255, 255, 255, 1) 10px
				)`
			: 'transparent'};
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.08),
		inset 0 -1px 0 rgba(15, 23, 42, 0.08);
`

const barEnterKF = keyframes`
	from {
		opacity: 0;
		transform: translateY(4px) scaleX(0.92);
	}
	to {
		opacity: 1;
		transform: translateY(0) scaleX(1);
	}
`

const barGleamKF = keyframes`
	0%, 100% { opacity: 0; }
	45%, 55% { opacity: 1; }
`

const Bar = styled.button`
	position: relative;
	align-self: center;
	justify-self: stretch;
	height: ${ROW_HEIGHT - 16}px;
	padding: 0 8px;
	margin: 0 2px;
	border: none;
	border-radius: 10px;
	font-family: inherit;
	cursor: pointer;
	overflow: hidden;
	text-transform: none;
	letter-spacing: normal;
	line-height: 1;
	min-width: 0;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: left center;
	animation: ${barEnterKF} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 220ms ease,
		filter 220ms ease;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, transparent 55%);
		border-radius: inherit;
		opacity: 0;
		animation: ${barGleamKF} 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-2px);
		filter: brightness(1.08);
		box-shadow:
			0 8px 20px rgba(15, 23, 42, 0.14),
			inset 0 -1px 0 rgba(0, 0, 0, 0.12);
	}

	&:focus-visible {
		outline: none;
		filter: brightness(1.1);
		box-shadow:
			0 0 0 3px rgba(3, 105, 161, 0.3),
			inset 0 -1px 0 rgba(0, 0, 0, 0.12);
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::after {
			animation: none;
			display: none;
		}
	}
`

const BarLabel = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 3px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: clip;
	max-width: 100%;
`

const BarLabelNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 15px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	line-height: 1;
`

const BarLabelUnit = styled.span`
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	line-height: 1;
`

const pipPulseKF = keyframes`
	0%, 100% {
		transform: scale(1);
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.22);
	}
	50% {
		transform: scale(1.18);
		box-shadow: 0 0 0 7px rgba(255, 255, 255, 0);
	}
`

const BarPip = styled.span`
	display: inline-block;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.22);
	flex-shrink: 0;
	animation: ${pipPulseKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const LoadingBlock = styled.div`
	padding: 40px 20px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 13px;
`

const EmptyState = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 13.5px;
`

const TableWrap = styled.div`
	overflow-x: auto;
`

const BalTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 13.5px;

	thead th {
		text-align: left;
		font-size: 11.5px;
		font-weight: 700;
		color: ${T.textSecondary};
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 12px 14px;
		background: ${T.subtleBg};
		border-bottom: 1px solid ${T.divider};
		white-space: nowrap;
	}
	thead th:first-child {
		border-top-left-radius: 12px;
	}
	thead th:last-child {
		border-top-right-radius: 12px;
	}

	tbody td {
		padding: 14px;
		border-bottom: 1px solid ${T.divider};
		vertical-align: top;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
`

const BalName = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
`

const BalPos = styled.div`
	font-size: 11.5px;
	color: ${T.textSecondary};
	margin-top: 2px;
`

const BalRatio = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
`

const BalNum = styled.span`
	font-size: 20px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
`

const BalSlash = styled.span`
	font-size: 14px;
	color: ${T.textSecondary};
	font-weight: 500;
`

const BalRemain = styled.span`
	font-size: 14px;
	color: ${T.textSecondary};
	font-weight: 600;
`

const BalBar = styled.div`
	position: relative;
	margin-top: 8px;
	width: 160px;
	height: 6px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.06);
	overflow: visible;
`

const toneColor = ($tone: TimeOffType) =>
	$tone === 'VACATION' ? '#0369a1' : $tone === 'SICK_LEAVE' ? '#b91c1c' : '#475569'

const toneRing = ($tone: TimeOffType) =>
	$tone === 'VACATION'
		? 'rgba(3, 105, 161, 0.35)'
		: $tone === 'SICK_LEAVE'
			? 'rgba(185, 28, 28, 0.35)'
			: 'rgba(71, 85, 105, 0.35)'

const BalBarFill = styled.div<{ $tone: TimeOffType }>`
	position: relative;
	height: 100%;
	background: ${({ $tone }) => toneColor($tone)};
	border-radius: 999px;
	transition: width 480ms cubic-bezier(0.22, 1, 0.36, 1);
	overflow: hidden;
`

const balShimmerKF = keyframes`
	0%   { transform: translateX(-120%); }
	100% { transform: translateX(220%); }
`

const BalShimmer = styled.span`
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
	animation: ${balShimmerKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`

const balCursorPulseKF = keyframes`
	0%, 100% {
		box-shadow: 0 0 0 0 var(--ring);
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		box-shadow: 0 0 0 5px transparent;
		transform: translate(-50%, -50%) scale(1.2);
	}
`

const BalCursor = styled.span<{ $tone: TimeOffType }>`
	position: absolute;
	top: 50%;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $tone }) => toneColor($tone)};
	border: 2px solid #ffffff;
	--ring: ${({ $tone }) => toneRing($tone)};
	transform: translate(-50%, -50%);
	transition: left 480ms cubic-bezier(0.22, 1, 0.36, 1);
	animation: ${balCursorPulseKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const NextAbsence = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const NextType = styled.span<{ $type: TimeOffType }>`
	display: inline-block;
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	background: ${({ $type }) =>
		$type === 'VACATION'
			? 'rgba(3, 105, 161, 0.12)'
			: $type === 'SICK_LEAVE'
				? 'rgba(220, 38, 38, 0.12)'
				: 'rgba(100, 116, 139, 0.14)'};
	color: ${({ $type }) =>
		$type === 'VACATION' ? '#0369a1' : $type === 'SICK_LEAVE' ? '#b91c1c' : '#475569'};
	align-self: flex-start;
`

const NextRange = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	color: ${T.textSecondary};
`

const Muted = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
`
