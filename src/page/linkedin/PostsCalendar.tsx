import { MouseEvent as ReactMouseEvent, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ChevronLeftRounded,
	ChevronRightRounded,
	TodayOutlined,
	InboxOutlined,
	SearchOffOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import {
	EmptyState,
	EmptyIconWrap,
	EmptyTitle,
} from '../../components/_shared/DataTable/DataTable.styled'
import {
	useGetLinkedInPostsQuery,
	type LinkedInPost,
	type LinkedInPostStatus,
} from '../../store/linkedin-posts/linkedInPostsApi'
import {
	useGetLinkedInAccountsQuery,
	type LinkedInAccount,
} from '../../store/linkedin-accounts/linkedInAccountsApi'
import type { LinkedInPostFormat } from '../../store/linkedin-ideas/linkedInIdeasApi'

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

const STATUS_COLOR: Record<
	LinkedInPostStatus,
	{ bg: string; color: string; soft: string; priority: number }
> = {
	DRAFT: { bg: 'rgba(15, 23, 42, 0.06)', color: '#64748b', soft: 'rgba(100, 116, 139, 0.25)', priority: 1 },
	READY: { bg: 'rgba(3, 105, 161, 0.12)', color: '#0369a1', soft: 'rgba(3, 105, 161, 0.25)', priority: 3 },
	SCHEDULED: { bg: 'rgba(217, 119, 6, 0.15)', color: '#b45309', soft: 'rgba(217, 119, 6, 0.30)', priority: 4 },
	PUBLISHED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', soft: 'rgba(16, 185, 129, 0.30)', priority: 5 },
	ARCHIVED: { bg: 'rgba(217, 34, 113, 0.10)', color: '#9d174d', soft: 'rgba(217, 34, 113, 0.25)', priority: 2 },
}

const ROW_HEIGHT = 52
const HEADER_HEIGHT = 44
const ACC_COL_WIDTH = 220
const DAY_MIN_WIDTH = 32

const isWeekend = (year: number, month: number, day: number): boolean => {
	const d = new Date(Date.UTC(year, month - 1, day))
	const wd = d.getUTCDay()
	return wd === 0 || wd === 6
}

const daysInMonth = (year: number, month: number): number =>
	new Date(Date.UTC(year, month, 0)).getUTCDate()

interface Props {
	accountId?: string
	status?: LinkedInPostStatus
	format?: LinkedInPostFormat
}

interface TipState {
	posts: LinkedInPost[]
	x: number
	y: number
	dayLabel: string
	accountName: string
}

const PostsCalendar = ({ accountId, status, format }: Props) => {
	const navigate = useNavigate()
	const today = new Date()
	const [year, setYear] = useState(today.getUTCFullYear())
	const [month, setMonth] = useState(today.getUTCMonth() + 1)
	const [tip, setTip] = useState<TipState | null>(null)

	const showTip = (
		e: ReactMouseEvent<HTMLButtonElement>,
		posts: LinkedInPost[],
		day: number,
		accountName: string,
	) => {
		const r = e.currentTarget.getBoundingClientRect()
		setTip({
			posts,
			x: r.left + r.width / 2,
			y: r.top,
			dayLabel: new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'short',
				day: 'numeric',
			}),
			accountName,
		})
	}
	const hideTip = () => setTip(null)

	const rangeStart = new Date(Date.UTC(year, month - 1, 1))
	const rangeEnd = new Date(Date.UTC(year, month, 1))

	const { data: accountsData } = useGetLinkedInAccountsQuery({
		page: 1,
		limit: 100,
		status: 'all',
	})
	const { data, isLoading, isError } = useGetLinkedInPostsQuery({
		limit: 200,
		accountId,
		status,
		format,
		rangeStart: rangeStart.toISOString(),
		rangeEnd: rangeEnd.toISOString(),
	})

	// Filter visible accounts (respect the top-level account filter).
	const visibleAccounts: LinkedInAccount[] = useMemo(() => {
		const all = accountsData?.data ?? []
		return accountId ? all.filter((a) => a.id === accountId) : all
	}, [accountsData, accountId])

	// Group posts by accountId → day (1..daysInMonth) → posts[]
	const grouped = useMemo(() => {
		const g = new Map<string, Map<number, LinkedInPost[]>>()
		for (const p of data?.data ?? []) {
			const iso = p.publishedAt ?? p.scheduledAt
			if (!iso) continue
			const d = new Date(iso)
			if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) continue
			const day = d.getUTCDate()
			const perAccount = g.get(p.accountId) ?? new Map<number, LinkedInPost[]>()
			const arr = perAccount.get(day) ?? []
			arr.push(p)
			perAccount.set(day, arr)
			g.set(p.accountId, perAccount)
		}
		return g
	}, [data, year, month])

	const nDays = daysInMonth(year, month)
	const dayList = useMemo(
		() => Array.from({ length: nDays }, (_, i) => i + 1),
		[nDays],
	)

	const goPrev = () => {
		if (month === 1) {
			setMonth(12)
			setYear((y) => y - 1)
		} else {
			setMonth((m) => m - 1)
		}
	}
	const goNext = () => {
		if (month === 12) {
			setMonth(1)
			setYear((y) => y + 1)
		} else {
			setMonth((m) => m + 1)
		}
	}
	const goToday = () => {
		const now = new Date()
		setYear(now.getUTCFullYear())
		setMonth(now.getUTCMonth() + 1)
	}

	const totalPosts = (data?.data ?? []).length

	return (
		<Wrap>
			<TopBar>
				<Nav>
					<NavBtn type='button' onClick={goPrev} aria-label='Previous month'>
						<ChevronLeftRounded style={{ fontSize: 20 }} />
					</NavBtn>
					<MonthLabel>
						{MONTHS[month - 1]} <YearTag>{year}</YearTag>
					</MonthLabel>
					<NavBtn type='button' onClick={goNext} aria-label='Next month'>
						<ChevronRightRounded style={{ fontSize: 20 }} />
					</NavBtn>
				</Nav>
				<TodayBtn type='button' onClick={goToday}>
					<TodayOutlined style={{ fontSize: 15 }} /> Today
				</TodayBtn>
			</TopBar>

			{isLoading ? (
				<LoadingBox>Loading…</LoadingBox>
			) : isError ? (
				<EmptyState>
					<EmptyIconWrap>
						<InboxOutlined />
					</EmptyIconWrap>
					<EmptyTitle>Could not load posts</EmptyTitle>
				</EmptyState>
			) : visibleAccounts.length === 0 ? (
				<EmptyState>
					<EmptyIconWrap>
						<SearchOffOutlined />
					</EmptyIconWrap>
					<EmptyTitle>No accounts to display</EmptyTitle>
				</EmptyState>
			) : totalPosts === 0 ? (
				<EmptyState>
					<EmptyIconWrap>
						<SearchOffOutlined />
					</EmptyIconWrap>
					<EmptyTitle>No posts in this month</EmptyTitle>
				</EmptyState>
			) : (
				<Scroller>
					<Chart
						style={{
							gridTemplateColumns: `${ACC_COL_WIDTH}px repeat(${nDays}, minmax(${DAY_MIN_WIDTH}px, 1fr))`,
							gridTemplateRows: `${HEADER_HEIGHT}px repeat(${visibleAccounts.length}, ${ROW_HEIGHT}px)`,
						}}
					>
						{/* Today's column soft accent. */}
						{(() => {
							const now = new Date()
							if (now.getUTCFullYear() !== year || now.getUTCMonth() + 1 !== month) return null
							const t = now.getUTCDate()
							return (
								<TodayCol
									style={{
										gridColumn: t + 1,
										gridRow: `2 / span ${visibleAccounts.length}`,
									}}
								/>
							)
						})()}

						{/* Header corner + day headers */}
						<HeaderCorner>Account</HeaderCorner>
						{dayList.map((d) => {
							const now = new Date()
							const isToday =
								now.getUTCFullYear() === year &&
								now.getUTCMonth() + 1 === month &&
								now.getUTCDate() === d
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
						{visibleAccounts.map((acc, i) => {
							const row = i + 2
							const dayMap = grouped.get(acc.id) ?? new Map<number, LinkedInPost[]>()
							return (
								<RowFragment key={acc.id}>
									<AccountCell style={{ gridRow: row, gridColumn: 1 }}>
										<AccountName>{acc.displayName}</AccountName>
										<AccountType>
											{acc.type === 'COMPANY' ? 'Company page' : 'Personal profile'}
										</AccountType>
									</AccountCell>
									{dayList.map((d) => (
										<Cell
											key={`c-${acc.id}-${d}`}
											$weekend={isWeekend(year, month, d)}
											style={{ gridRow: row, gridColumn: d + 1 }}
										/>
									))}
									{Array.from(dayMap.entries()).map(([day, posts]) => {
										const sorted = [...posts].sort(
											(a, b) =>
												STATUS_COLOR[b.status].priority -
												STATUS_COLOR[a.status].priority,
										)
										const primary = sorted[0]
										const meta = STATUS_COLOR[primary.status]
										const primaryIso = primary.publishedAt ?? primary.scheduledAt
										const timeStr = primaryIso
											? new Date(primaryIso).toLocaleTimeString('en-US', {
													hour: '2-digit',
													minute: '2-digit',
													hour12: false,
												})
											: ''
										return (
											<DayFill
												key={`f-${acc.id}-${day}`}
												type='button'
												style={{
													gridRow: row,
													gridColumn: day + 1,
													background: meta.bg,
													color: meta.color,
													boxShadow: `inset 0 0 0 1.5px ${meta.soft}`,
													animationDelay: `${(i * 60 + day * 12) % 700}ms`,
												}}
												onMouseEnter={(e) => showTip(e, posts, day, acc.displayName)}
												onMouseLeave={hideTip}
												onClick={() =>
													posts.length === 1
														? navigate(`/linkedin/posts/${primary.id}`)
														: undefined
												}
											>
												<FillLabel>
													{posts.length > 1 ? `×${posts.length}` : timeStr}
												</FillLabel>
											</DayFill>
										)
									})}
								</RowFragment>
							)
						})}
					</Chart>
				</Scroller>
			)}

			<Legend>
				{(Object.keys(STATUS_COLOR) as LinkedInPostStatus[]).map((s) => (
					<LegendItem key={s}>
						<LegendDot $c={STATUS_COLOR[s].color} />
						{s.charAt(0) + s.slice(1).toLowerCase()}
					</LegendItem>
				))}
			</Legend>

			{tip && createPortal(
				<TipCard
					style={{
						top: `${tip.y - 12}px`,
						left: `${tip.x}px`,
					}}
				>
					<TipArrow />
					<TipHead>
						<TipDay>{tip.dayLabel}</TipDay>
						<TipAccount>{tip.accountName}</TipAccount>
					</TipHead>
					<TipList>
						{tip.posts.slice(0, 5).map((p) => {
							const iso = p.publishedAt ?? p.scheduledAt
							const time = iso
								? new Date(iso).toLocaleTimeString('en-US', {
										hour: '2-digit',
										minute: '2-digit',
										hour12: false,
									})
								: ''
							return (
								<TipRow key={p.id}>
									<TipDot $c={STATUS_COLOR[p.status].color} />
									<TipRowMeta>
										<TipRowTitle>{p.internalTitle}</TipRowTitle>
										<TipRowSub>
											<TipTime>{time}</TipTime>
											<TipStatus $c={STATUS_COLOR[p.status].color}>
												{p.status}
											</TipStatus>
										</TipRowSub>
									</TipRowMeta>
								</TipRow>
							)
						})}
						{tip.posts.length > 5 && (
							<TipMore>+{tip.posts.length - 5} more</TipMore>
						)}
					</TipList>
				</TipCard>,
				document.body,
			)}
		</Wrap>
	)
}

export default PostsCalendar

/* ─── Styles ──────────────────────────────────────────────────────── */

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const TopBar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`

const Nav = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

const NavBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textSecondary};
	cursor: pointer;
	padding: 0;
	transition: all 160ms ease;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const MonthLabel = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 22px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
`

const YearTag = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 16px;
	color: ${T.textSecondary};
	letter-spacing: -0.3px;
	margin-left: 4px;
`

const TodayBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-radius: 999px;
	border: 1.5px solid ${T.primary};
	background: #ffffff;
	color: ${T.primary};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms ease;
	&:hover {
		background: ${T.primaryTint};
	}
`

const LoadingBox = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: ${T.textSecondary};
	font-size: 13px;
`

/* ─── Gantt-style calendar (Time Off pattern) ──────────────────── */

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

	&::-webkit-scrollbar {
		height: 10px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 999px;
		border: 2px solid transparent;
		background-clip: padding-box;
		transition: background 220ms ease;
	}
	scrollbar-color: transparent transparent;
	scrollbar-width: thin;

	&:hover,
	&:focus-within {
		&::-webkit-scrollbar-thumb {
			background: rgba(3, 105, 161, 0.35);
			background-clip: padding-box;
		}
		scrollbar-color: rgba(3, 105, 161, 0.35) transparent;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: ${T.primary};
		background-clip: padding-box;
	}
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

const TodayCol = styled.div`
	background: rgba(3, 105, 161, 0.06);
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
	padding: 8px 16px;
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
`

const HeaderDay = styled.div<{ $weekend: boolean; $today: boolean }>`
	position: relative;
	background: ${({ $today, $weekend }) =>
		$today
			? 'linear-gradient(180deg, #f0f9ff 0%, #dbeafe 100%)'
			: $weekend
				? 'linear-gradient(180deg, #fbfaff 0%, #f5f4fb 100%)'
				: 'linear-gradient(180deg, #ffffff 0%, #fbfaff 100%)'};
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 5px 2px;
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.1),
		0 1px 0 rgba(15, 23, 42, 0.12);
	overflow: hidden;
	${({ $today }) =>
		$today &&
		`box-shadow: inset -1px 0 0 rgba(15, 23, 42, 0.1), 0 2px 0 rgba(3, 105, 161, 0.45);`}
`

const HeaderDayNum = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 12.5px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	line-height: 1.05;
`

const HeaderDayWk = styled.span`
	font-size: 9px;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.4px;
	margin-top: 1px;
`

const AccountCell = styled.div`
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
`

const AccountName = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const AccountType = styled.span`
	font-size: 11px;
	color: ${T.textSecondary};
	line-height: 1.2;
`

const Cell = styled.div<{ $weekend: boolean }>`
	background: ${({ $weekend }) =>
		$weekend
			? `repeating-linear-gradient(
					45deg,
					rgba(15, 23, 42, 0.06),
					rgba(15, 23, 42, 0.06) 5px,
					rgba(255, 255, 255, 1) 5px,
					rgba(255, 255, 255, 1) 10px
				)`
			: 'transparent'};
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.06),
		inset 0 -1px 0 rgba(15, 23, 42, 0.06);
`

const fillIn = keyframes`
	from {
		opacity: 0;
		transform: scale(0.7);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
`

const DayFill = styled.button`
	position: relative;
	z-index: 2;
	margin: 6px;
	border-radius: 8px;
	border: none;
	cursor: pointer;
	font: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 200ms ease;
	animation: ${fillIn} 340ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:hover {
		transform: scale(1.08);
		filter: brightness(0.97);
		z-index: 4;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&:hover {
			transform: none;
		}
	}
`

const FillLabel = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: -0.2px;
`

/* ─── Legend ─────────────────────────────────────────────────────── */

const Legend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 14px 24px;
	padding: 14px 0 6px;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textStrong};
`

const LegendItem = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const halo = keyframes`
	0%   { transform: scale(0.7); opacity: 0.7; }
	80%  { transform: scale(2); opacity: 0; }
	100% { transform: scale(2); opacity: 0; }
`

const LegendDot = styled.span<{ $c: string }>`
	position: relative;
	display: inline-block;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${({ $c }) => $c};
	box-shadow: 0 0 0 3px ${({ $c }) => `${$c}33`};

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: ${({ $c }) => $c};
		opacity: 0.5;
		animation: ${halo} 2.4s ease-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		&::before {
			animation: none;
			opacity: 0;
		}
	}
`

/* ─── Tooltip ────────────────────────────────────────────────────── */

const tipIn = keyframes`
	from {
		opacity: 0;
		transform: translate(-50%, -100%) translateY(4px) scale(0.94);
	}
	to {
		opacity: 1;
		transform: translate(-50%, -100%) translateY(0) scale(1);
	}
`

const TipCard = styled.div`
	position: fixed;
	z-index: 1000;
	min-width: 220px;
	max-width: 320px;
	padding: 12px 14px 12px;
	background: #ffffff;
	border-radius: 12px;
	border: 1px solid rgba(15, 23, 42, 0.06);
	box-shadow:
		0 12px 32px rgba(15, 23, 42, 0.14),
		0 2px 6px rgba(15, 23, 42, 0.06);
	transform: translate(-50%, -100%);
	transform-origin: bottom center;
	animation: ${tipIn} 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
	pointer-events: none;
	color: ${T.textStrong};

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transform: translate(-50%, -100%);
	}
`

const TipArrow = styled.span`
	position: absolute;
	bottom: -6px;
	left: 50%;
	transform: translateX(-50%) rotate(45deg);
	width: 12px;
	height: 12px;
	background: #ffffff;
	border-right: 1px solid rgba(15, 23, 42, 0.06);
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`

const TipHead = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-bottom: 8px;
	margin-bottom: 8px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`

const TipDay = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

const TipAccount = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.55px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const TipList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const TipRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 8px;
`

const TipDot = styled.span<{ $c: string }>`
	flex-shrink: 0;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $c }) => $c};
	box-shadow: 0 0 0 2.5px ${({ $c }) => `${$c}22`};
	margin-top: 5px;
`

const TipRowMeta = styled.div`
	flex: 1;
	min-width: 0;
`

const TipRowTitle = styled.div`
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`

const TipRowSub = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-top: 2px;
`

const TipTime = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 10.5px;
	font-weight: 600;
	color: ${T.textSecondary};
`

const TipStatus = styled.span<{ $c: string }>`
	font-size: 9.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${({ $c }) => $c};
`

const TipMore = styled.div`
	font-size: 11px;
	font-weight: 600;
	color: ${T.textMuted};
	padding-top: 4px;
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
`
