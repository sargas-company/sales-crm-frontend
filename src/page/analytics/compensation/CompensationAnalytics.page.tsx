import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styled, { css, keyframes } from 'styled-components'
import {
	CalendarMonthOutlined,
	TrendingUpOutlined,
	ScheduleOutlined,
	PaidOutlined,
	LaunchOutlined,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { Crumbs, PageHead as BasePageHead, ViewFade } from '../salesAnalytics.styled'
import { useGetCompensationOverviewQuery } from '../../../store/compensation-analytics/compensationAnalyticsApi'

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

const fmt = (v: string | number | null | undefined): string => {
	if (v == null) return '—'
	const n = typeof v === 'string' ? parseFloat(v) : v
	if (!isFinite(n)) return '—'
	return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Tween a number from its previous displayed value to the new target
 *  with an ease-out cubic curve. Starts at 0 on mount so the first
 *  render shows the "counting up" effect; on every subsequent target
 *  change it tweens from the last displayed value. Respects
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
	return <>${fmt(display)}</>
}

/** Same count-up but without a currency symbol (caller adds it). */
const CountNumber = ({ value }: { value: string | number | null | undefined }) => {
	const n = value == null ? 0 : typeof value === 'string' ? parseFloat(value) || 0 : value
	const display = useCountUp(n)
	if (value == null) return <>—</>
	return <>{fmt(display)}</>
}

/** Compact currency notation ("$75.1K", "$1.2M") for space-tight
 *  bar labels — combined with the count-up hook so it still animates. */
const fmtCompact = (n: number): string =>
	n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })

const CountCompact = ({ value }: { value: string | number | null | undefined }) => {
	const n = value == null ? 0 : typeof value === 'string' ? parseFloat(value) || 0 : value
	const display = useCountUp(n)
	if (value == null) return <>—</>
	return <>${fmtCompact(display)}</>
}

/** Percent count-up — one decimal place, no % symbol. */
const CountPct = ({ value }: { value: number }) => {
	const display = useCountUp(value)
	return <>{display.toFixed(1)}</>
}

const initials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const fmtMonthYear = (iso: string): string => {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
	if (!m) return iso
	const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		timeZone: 'UTC',
	})
}

const fmtDay = (iso: string): string => {
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

const CompensationAnalytics = () => {
	const navigate = useNavigate()
	const [year, setYear] = useState<number>(currentYear())
	const [month, setMonth] = useState<number>(currentMonth())
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

	const { data, isLoading } = useGetCompensationOverviewQuery({ year, month })

	const seriesMax = useMemo(() => {
		if (!data) return 0
		return data.monthlySeries.reduce(
			(m, p) => Math.max(m, parseFloat(p.companyCost) || 0),
			0,
		)
	}, [data])

	return (
		<ViewFade>
			<Root>
				<SectionCard>
					<Crumbs>
						<span className='crumb-dot' aria-hidden='true' />
						<span className='current'>Compensation dashboard</span>
					</Crumbs>

					<PageHead>
						<div className='title'>
							<h1>Compensation</h1>
							<p>Total payroll cost, taxes, bonuses and recent salary reviews across the whole team.</p>
						</div>
						<div className='title-right' aria-hidden='true'>
							<span className='hand-line'>value of the people</span>
						</div>
					</PageHead>

					<ControlsRow>
						<Muted>
							{isLoading
								? 'Loading…'
								: `${data?.summary.count ?? 0} payroll entries — ${data?.summary.paidCount ?? 0} paid · ${data?.summary.draftCount ?? 0} draft`}
						</Muted>
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
					</ControlsRow>

					<KpiGrid>
						<KpiV1>
							<KpiSparkle aria-hidden='true'>
								<PaidOutlined style={{ fontSize: 22 }} />
							</KpiSparkle>
							<KpiLabelV1>Company cost</KpiLabelV1>
							<KpiValueV1>
								<CountMoney value={data?.summary.companyCost} />
							</KpiValueV1>
						</KpiV1>
						<KpiCard>
							<KpiLabel>Base salaries</KpiLabel>
							<KpiValue>
								<CountMoney value={data?.summary.baseSalaries} />
							</KpiValue>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Taxes</KpiLabel>
							<KpiValue>
								<CountMoney value={data?.summary.taxes} />
							</KpiValue>
						</KpiCard>
						<KpiCardLink
							type='button'
							aria-label={`Open salaries for ${MONTHS[month - 1]} ${year} sorted by bonus`}
							onClick={() =>
								navigate(
									`/finances/salaries?year=${year}&month=${month}&sortBy=bonusAmount&sortDirection=desc&highlight=bonus`,
								)
							}
						>
							<KpiLinkIcon aria-hidden='true'>
								<KpiLinkInner>
									<LaunchOutlined style={{ fontSize: 15 }} />
								</KpiLinkInner>
							</KpiLinkIcon>
							<KpiLabel>Bonuses</KpiLabel>
							<KpiValue>
								<CountMoney value={data?.summary.bonuses} />
							</KpiValue>
						</KpiCardLink>
						<KpiCard>
							<KpiLabel>Payoneer fees</KpiLabel>
							<KpiValue>
								<CountMoney value={data?.summary.payoneerFees} />
							</KpiValue>
						</KpiCard>
						<KpiCard>
							<KpiLabel>Outstanding</KpiLabel>
							<KpiValue>
								<CountMoney value={data?.summary.outstanding} />
							</KpiValue>
						</KpiCard>
					</KpiGrid>
				</SectionCard>

				<SectionCard>
					<SumHeaderRow>
						<SectionTitle>
							Monthly summary — {MONTHS[month - 1]} {year}
						</SectionTitle>
						<SumMetaRow>
							<SumMeta>
								<SumMetaVal>{data?.summary.count ?? 0}</SumMetaVal>
								<SumMetaLbl>filled</SumMetaLbl>
							</SumMeta>
							<SumMeta>
								<SumMetaVal>{data?.summary.paidCount ?? 0}</SumMetaVal>
								<SumMetaLbl>paid</SumMetaLbl>
							</SumMeta>
							<SumMeta>
								<SumMetaVal>{data?.summary.draftCount ?? 0}</SumMetaVal>
								<SumMetaLbl>draft</SumMetaLbl>
							</SumMeta>
						</SumMetaRow>
					</SumHeaderRow>
					{(() => {
						const base = parseFloat(data?.summary.baseSalaries ?? '0') || 0
						const tax = parseFloat(data?.summary.taxes ?? '0') || 0
						const bonus = parseFloat(data?.summary.bonuses ?? '0') || 0
						const fee = parseFloat(data?.summary.payoneerFees ?? '0') || 0
						const cost = parseFloat(data?.summary.companyCost ?? '0') || 0
						const baseTax = base + tax
						const sum = Math.max(base + tax + bonus + fee, 1)
						const basePct = (base / sum) * 100
						const taxPct = (tax / sum) * 100
						const bonusPct = (bonus / sum) * 100
						const feePct = (fee / sum) * 100
						return (
							<>
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
				</SectionCard>

				<SectionCard>
					<SectionTitle>Company cost - last 12 months</SectionTitle>
					{isLoading || !data ? (
						<Empty>Loading…</Empty>
					) : (
						<CardsRow>
							{data.monthlySeries.map((p) => {
								const cost = parseFloat(p.companyCost) || 0
								const share = seriesMax > 0 ? (cost / seriesMax) * 100 : 0
								const isCurrent = p.year === year && p.month === month
								return (
									<MonthCard
										key={`${p.year}-${p.month}`}
										type='button'
										$current={isCurrent}
										aria-label={`Open salaries for ${MONTHS[p.month - 1]} ${p.year}`}
										onClick={() =>
											navigate(`/finances/salaries?year=${p.year}&month=${p.month}`)
										}
									>
										<MonthCardLinkIcon $current={isCurrent} aria-hidden='true'>
											<MonthCardLinkInner>
												<LaunchOutlined style={{ fontSize: 13 }} />
											</MonthCardLinkInner>
										</MonthCardLinkIcon>
										<MonthCardName $current={isCurrent}>
											{MONTHS[p.month - 1].slice(0, 3)}
										</MonthCardName>
										<MonthCardVal $current={isCurrent}>
											<CountCompact value={p.companyCost} />
										</MonthCardVal>
										<MonthCardBar $current={isCurrent}>
											<MonthCardFill
												$current={isCurrent}
												style={{ width: `${share}%` }}
											/>
										</MonthCardBar>
									</MonthCard>
								)
							})}
						</CardsRow>
					)}
				</SectionCard>

				<TwoCol>
					<SectionCard>
						<SectionTitle>
							<TrendingUpOutlined style={{ fontSize: 20, verticalAlign: 'middle' }} /> Biggest recent increases
						</SectionTitle>

						{isLoading || !data ? (
							<Empty>Loading…</Empty>
						) : data.biggestIncreases.length === 0 ? (
							<Empty>No completed increases yet.</Empty>
						) : (
							<InsightsList>
								{data.biggestIncreases.map((r, idx) => (
									<InsightRowIncrease key={r.id} style={{ animationDelay: `${idx * 60}ms` }}>
										<PersonSide>
											<Avatar $tier={-1}>
												{initials(r.employee.firstName, r.employee.lastName)}
											</Avatar>
											<InsightMain>
												<Name>
													{r.employee.firstName} {r.employee.lastName}
												</Name>
												<Sub>
													{r.effectiveDate ? fmtDay(r.effectiveDate) : 'no date'}
												</Sub>
											</InsightMain>
										</PersonSide>
										<RateChange>
											<RateChangeSide>${fmt(r.previousRate)}</RateChangeSide>
											<RateChangeArrow>→</RateChangeArrow>
											<RateChangeNew>${fmt(r.newRate)}</RateChangeNew>
										</RateChange>
										<DiffPctSm>
											<Plus>+</Plus>
											<CountPct value={parseFloat(r.pct)} />
											<Pct>%</Pct>
										</DiffPctSm>
									</InsightRowIncrease>
								))}
							</InsightsList>
						)}
					</SectionCard>

					<SectionCard>
						<SectionTitle>
							<ScheduleOutlined style={{ fontSize: 20, verticalAlign: 'middle' }} /> Upcoming reviews
						</SectionTitle>
						{isLoading || !data ? (
							<Empty>Loading…</Empty>
						) : data.upcomingReviews.length === 0 ? (
							<Empty>Nothing scheduled ahead.</Empty>
						) : (
							<InsightsList>
								{data.upcomingReviews.map((r, idx) => (
									<InsightRowIncrease
										key={r.id}
										style={{ animationDelay: `${idx * 60}ms` }}
									>
										<PersonSide>
											<Avatar $tier={-1}>
												{initials(r.employee.firstName, r.employee.lastName)}
											</Avatar>
											<InsightMain>
												<Name>
													{r.employee.firstName} {r.employee.lastName}
												</Name>
											</InsightMain>
										</PersonSide>
										<CurrentRateInline>
											{r.previousRate ? (
												<>
													<CurrentRateLabel>current</CurrentRateLabel>
													<CurrentRateValue>
														${fmt(r.previousRate)}
														<CurrentRateUnit>
															{r.previousRateType === 'HOURLY' ? '/h' : '/mo'}
														</CurrentRateUnit>
													</CurrentRateValue>
												</>
											) : (
												<span style={{ opacity: 0.5 }}>—</span>
											)}
										</CurrentRateInline>
										<ScheduledDate>{fmtMonthYear(r.scheduledDate)}</ScheduledDate>
									</InsightRowIncrease>
								))}
							</InsightsList>
						)}
					</SectionCard>
				</TwoCol>

				<TwoCol>
					<SectionCard>
						<SectionTitle>Employee breakdown — {MONTHS[month - 1]} {year}</SectionTitle>
						{isLoading || !data ? (
							<Empty>Loading…</Empty>
						) : data.employeeBreakdown.length === 0 ? (
							<Empty>No payroll entries in this month.</Empty>
						) : (
							<BreakdownList>
								{data.employeeBreakdown.map((row) => {
									const share =
										parseFloat(data.summary.companyCost) > 0
											? (parseFloat(row.companyCost) / parseFloat(data.summary.companyCost)) *
												100
											: 0
									const clamped = Math.min(100, share)
									return (
										<BreakRow key={row.id}>
											<BreakName>
												<div>
													{row.employee.firstName} {row.employee.lastName}
												</div>
												<Sub>{row.employee.positions[0] ?? row.rateType}</Sub>
											</BreakName>
											<BaseCol>
												<BaseLabel>base</BaseLabel>
												<BaseVal>${fmt(row.baseSalary)}</BaseVal>
											</BaseCol>
											<BreakBarWrap>
												<BreakBarFill style={{ width: `${clamped}%` }}>
													<BreakShimmer />
												</BreakBarFill>
												{clamped > 0 && (
													<BreakCursor style={{ left: `${clamped}%` }} />
												)}
											</BreakBarWrap>
											<BreakVal>
												${fmt(row.companyCost)} <SubInline>{share.toFixed(1)}%</SubInline>
											</BreakVal>
										</BreakRow>
									)
								})}
							</BreakdownList>
						)}
					</SectionCard>

					<SectionCard>
						<SectionTitle>Recent salary reviews</SectionTitle>
						{isLoading || !data ? (
							<Empty>Loading…</Empty>
						) : data.recentHistory.length === 0 ? (
							<Empty>No completed reviews yet.</Empty>
						) : (
							<HistoryList>
								{data.recentHistory.map((r) => (
									<HistoryRow key={r.id}>
										<HistoryLeft>
											<Name>
												{r.employee.firstName} {r.employee.lastName}
											</Name>
											<Sub>
												{r.scheduledDate}
												{r.completedAt ? ` · completed ${r.completedAt.slice(0, 10)}` : ''}
											</Sub>
										</HistoryLeft>
										<HistoryCenter>
											{r.previousRate && r.newRate ? (
												<>
													<Mono>${fmt(r.previousRate)}</Mono>
													<Arrow>→</Arrow>
													<Mono $accent>${fmt(r.newRate)}</Mono>
												</>
											) : (
												<Sub>—</Sub>
											)}
										</HistoryCenter>
										<ResultTag $result={r.result}>{r.result}</ResultTag>
									</HistoryRow>
								))}
							</HistoryList>
						)}
					</SectionCard>
				</TwoCol>
			</Root>
		</ViewFade>
	)
}

export default CompensationAnalytics

/* ─── Styles ─────────────────────────────────────────────────────────── */

const Root = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
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

const PageHead = styled(BasePageHead)`
	.title-right {
		margin-right: 40px;
		margin-top: -4px;
	}
`

const ControlsRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	margin-top: 24px;
	margin-bottom: 20px;
`

const Muted = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
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

const KpiGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
`

const kpiFade = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const KpiCard = styled.div`
	flex: 1 1 170px;
	min-width: 170px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #fafafd;
	border: 1px solid rgba(15, 23, 42, 0.06);
	animation: ${kpiFade} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	display: flex;
	flex-direction: column;
	gap: 6px;
`

/* Clickable KPI card — same base look as KpiCard but carries a
 *  "link" icon in the top-right corner. The icon uses two nested
 *  wrappers so the idle keyframe (scale + opacity, inner) never
 *  conflicts with the hover-driven translate (outer, transition).
 *  Result: neither state jerks when the other kicks in. */
const linkBreath = keyframes`
	0%   { transform: scale(1);    opacity: 0.55; }
	60%  { transform: scale(1.22); opacity: 1;    }
	100% { transform: scale(1.05); opacity: 0.9;  }
`

const KpiCardLink = styled.button`
	position: relative;
	flex: 1 1 170px;
	min-width: 170px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #fafafd;
	border: 1px solid rgba(15, 23, 42, 0.06);
	animation: ${kpiFade} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	text-align: left;
	cursor: pointer;
	font: inherit;
	color: inherit;
	overflow: hidden;

	&:focus-visible {
		outline: none;
	}
`

const KpiLinkIcon = styled.span`
	position: absolute;
	top: 12px;
	right: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.primary};
	pointer-events: none;
	transform: translate(0, 0);
	transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);

	${KpiCardLink}:hover & {
		transform: translate(5px, -5px);
	}
`

const KpiLinkInner = styled.span`
	display: inline-flex;
	animation: ${linkBreath} 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
	transform-origin: center;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* Company cost — solid primary highlight (matches Salaries page), wider */
const KpiV1 = styled.div`
	position: relative;
	flex: 1.55 1 240px;
	min-width: 240px;
	padding: 16px 20px;
	border-radius: 14px;
	background: ${T.primary};
	color: #ffffff;
	display: flex;
	flex-direction: column;
	gap: 6px;
	overflow: hidden;
	box-shadow:
		0 8px 20px rgba(3, 105, 161, 0.28),
		inset 0 -1px 0 rgba(255, 255, 255, 0.14);
	animation: ${kpiFade} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const KpiLabelV1 = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.85);
`

const KpiValueV1 = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 26px;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: -0.5px;
	font-variant-numeric: tabular-nums;
`

const KpiSubV1 = styled.div`
	font-size: 11.5px;
	color: rgba(255, 255, 255, 0.8);
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
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const KpiValue = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 26px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.5px;
	font-variant-numeric: tabular-nums;
`

const KpiSub = styled.div`
	font-size: 11.5px;
	color: ${T.textSecondary};
`

const SectionTitle = styled.h2`
	margin: 0 0 14px;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-variation-settings: 'opsz' 72;
	font-size: 22px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.5px;
	line-height: 1.1;
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const Empty = styled.div`
	padding: 30px 8px;
	color: ${T.textSecondary};
	text-align: center;
	font-size: 13px;
`

/* ─── Company cost · month cards row ─────────────────────── */

const cardIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const CardsRow = styled.div`
	display: grid;
	grid-template-columns: repeat(12, minmax(90px, 1fr));
	gap: 10px;
	overflow-x: auto;
	margin-top: 18px;
`

const MonthCard = styled.button<{ $current: boolean }>`
	position: relative;
	padding: 12px 14px;
	border-radius: 12px;
	background: ${({ $current }) => ($current ? T.primary : '#fafafd')};
	border: 1px solid ${({ $current }) => ($current ? T.primary : 'rgba(15, 23, 42, 0.06)')};
	display: flex;
	flex-direction: column;
	align-items: stretch;
	text-align: left;
	gap: 8px;
	font: inherit;
	color: inherit;
	cursor: pointer;
	overflow: hidden;
	box-shadow: ${({ $current }) => ($current ? '0 6px 18px rgba(3, 105, 161, 0.24)' : 'none')};
	animation: ${cardIn} 380ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:focus-visible {
		outline: none;
	}
`

const MonthCardLinkIcon = styled.span<{ $current: boolean }>`
	position: absolute;
	top: 8px;
	right: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${({ $current }) => ($current ? 'rgba(255, 255, 255, 0.75)' : T.primary)};
	opacity: 0.7;
	pointer-events: none;
	transform: translate(0, 0);
	transition:
		transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;

	${MonthCard}:hover & {
		transform: translate(4px, -4px);
		opacity: 1;
	}
`

const MonthCardLinkInner = styled.span`
	display: inline-flex;
`

const MonthCardName = styled.div<{ $current: boolean }>`
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${({ $current }) => ($current ? 'rgba(255, 255, 255, 0.85)' : T.textSecondary)};
`

const MonthCardVal = styled.div<{ $current: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 17px;
	font-weight: 400;
	color: ${({ $current }) => ($current ? '#ffffff' : T.textStrong)};
	letter-spacing: -0.4px;
`

const MonthCardBar = styled.div<{ $current: boolean }>`
	position: relative;
	height: 4px;
	border-radius: 999px;
	background: ${({ $current }) => ($current ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.08)')};
	overflow: hidden;
`

const MonthCardFill = styled.div<{ $current: boolean }>`
	position: absolute;
	inset: 0 auto 0 0;
	background: ${({ $current }) => ($current ? '#ffffff' : T.primary)};
	border-radius: 999px;
	transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
`

const TwoCol = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	align-items: start;
	gap: 20px;
	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

const InsightsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const InsightRow = styled.div`
	display: grid;
	grid-template-columns: auto auto minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	padding: 10px 8px;
	border-radius: 12px;
	animation: ${rowIn} 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const Avatar = styled.div<{ $tier: number }>`
	width: 36px;
	height: 36px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	font-family: 'JetBrains Mono', monospace;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.4px;
	background: ${T.primary};
	box-shadow: 0 4px 10px rgba(3, 105, 161, 0.2);
	flex-shrink: 0;
`

const InsightMain = styled.div`
	min-width: 0;
`

const Name = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const Sub = styled.div`
	font-size: 12px;
	color: ${T.textSecondary};
	margin-top: 3px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const SubInline = styled.span`
	font-size: 11px;
	color: ${T.textSecondary};
	margin-left: 6px;
`

/* Row for "Biggest recent increases": three-column grid so the middle
 *  rate-change block sits at the true horizontal center of the row —
 *  the left (person) and right (pct) side columns share the same 1fr
 *  weight, and their content aligns to opposite edges. */
const InsightRowIncrease = styled(InsightRow)`
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	gap: 20px;
`

const PersonSide = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
`

const RateChange = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	justify-self: center;
	gap: 8px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	white-space: nowrap;
`

const RateChangeSide = styled.span`
	font-size: 13px;
	font-weight: 500;
	color: ${T.textSecondary};
	text-decoration: line-through;
	text-decoration-color: rgba(122, 118, 134, 0.5);
`

const RateChangeArrow = styled.span`
	font-size: 13px;
	color: ${T.primary};
`

const RateChangeNew = styled.span`
	font-size: 15px;
	font-weight: 700;
	color: ${T.primary};
`

/* Amber pill for the increase % — the project's second accent. */
const DiffPctSm = styled.span`
	display: inline-flex;
	align-items: baseline;
	justify-self: end;
	gap: 1px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	color: #b45309;
	background: rgba(217, 119, 6, 0.15);
	padding: 5px 12px;
	border-radius: 999px;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: -0.3px;
`

/* Upcoming reviews — scheduled date on the right, small & muted. */
const ScheduledDate = styled.span`
	justify-self: end;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	color: ${T.textSecondary};
	font-size: 13px;
	font-weight: 500;
	letter-spacing: -0.2px;
	white-space: nowrap;
`

/* Upcoming reviews — current rate in the center, big & blue. */
const CurrentRateInline = styled.span`
	justify-self: center;
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	white-space: nowrap;
`

const CurrentRateLabel = styled.span`
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 400;
	color: ${T.textSecondary};
`

const CurrentRateValue = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	color: ${T.primary};
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.4px;
`

const CurrentRateUnit = styled.span`
	font-size: 12px;
	font-weight: 600;
	opacity: 0.7;
`

const Plus = styled.span`
	font-size: 13px;
	font-weight: 700;
`

const Pct = styled.span`
	font-size: 11px;
	font-weight: 700;
	opacity: 0.7;
	margin-left: 1px;
`

const BreakdownList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const BreakRow = styled.div`
	display: grid;
	grid-template-columns:
		minmax(0, 1.6fr)
		auto
		minmax(90px, 2fr)
		auto;
	gap: 14px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.05);
	&:last-child {
		border-bottom: none;
	}
`

const BreakName = styled.div`
	display: flex;
	flex-direction: column;
	color: ${T.textStrong};
	font-size: 13.5px;
	font-weight: 600;
	min-width: 0;
	overflow: hidden;
`

const BaseCol = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;
	white-space: nowrap;
`

const BaseLabel = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const BaseVal = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 14px;
	font-weight: 700;
	color: ${T.primary};
	letter-spacing: -0.3px;
	white-space: nowrap;
`

const BreakBarWrap = styled.div`
	position: relative;
	height: 10px;
	background: rgba(15, 23, 42, 0.05);
	border-radius: 999px;
	overflow: visible;
`

const BreakBarFill = styled.div`
	position: relative;
	height: 100%;
	background: ${T.primary};
	border-radius: 999px;
	transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
	overflow: hidden;
`

const breakShimmerKF = keyframes`
	0%   { transform: translateX(-120%); }
	100% { transform: translateX(220%); }
`

const BreakShimmer = styled.span`
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
	animation: ${breakShimmerKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`

const breakCursorPulseKF = keyframes`
	0%, 100% {
		box-shadow: 0 0 0 0 rgba(3, 105, 161, 0.35);
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		box-shadow: 0 0 0 5px rgba(3, 105, 161, 0);
		transform: translate(-50%, -50%) scale(1.2);
	}
`

const BreakCursor = styled.span`
	position: absolute;
	top: 50%;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${T.primary};
	border: 2px solid #ffffff;
	transform: translate(-50%, -50%);
	transition: left 500ms cubic-bezier(0.22, 1, 0.36, 1);
	animation: ${breakCursorPulseKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const BreakVal = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	text-align: right;
	white-space: nowrap;
	letter-spacing: -0.3px;
`

const HistoryList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const HistoryRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 16px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
	&:last-child {
		border-bottom: none;
	}
`

const HistoryLeft = styled.div``

const HistoryCenter = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
`

const Mono = styled.span<{ $accent?: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 13.5px;
	font-weight: ${({ $accent }) => ($accent ? 700 : 500)};
	letter-spacing: -0.3px;
	color: ${({ $accent }) => ($accent ? T.primary : T.textStrong)};
`

const Arrow = styled.span`
	color: ${T.textSecondary};
`

const ResultTag = styled.span<{ $result: string }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	background: ${({ $result }) =>
		$result === 'INCREASED'
			? 'rgba(16, 185, 129, 0.15)'
			: $result === 'POSTPONED'
				? 'rgba(217, 119, 6, 0.15)'
				: '#f0edf9'};
	color: ${({ $result }) =>
		$result === 'INCREASED'
			? '#059669'
			: $result === 'POSTPONED'
				? '#b45309'
				: '#5a5476'};
`

/* ── Monthly summary block ─────────────────────────────────────── */

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

const SumHeaderRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 20px;
	flex-wrap: wrap;
	margin-bottom: 6px;

	${'' /* SectionTitle inside already has margin-bottom, keep it */}
`

const SumMetaRow = styled.div`
	display: flex;
	gap: 22px;
	align-items: baseline;
	padding-top: 4px;
`

const SumMeta = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;
`

const SumMetaVal = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 20px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
	line-height: 1;
`

const SumMetaLbl = styled.span`
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${T.textSecondary};
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

