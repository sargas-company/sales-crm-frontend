import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	BeachAccessOutlined,
	AddRounded,
	FlightTakeoffOutlined,
	LocalHospitalOutlined,
	HourglassEmptyOutlined,
	ArrowOutwardOutlined,
} from '@mui/icons-material'
import { T } from '../../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../../components/_shared/formShell.styled'
import PermissionGate from '../../../../components/auth/PermissionGate'
import ConfirmModal from '../../../../components/_shared/ConfirmModal'
import { useToast } from '../../../../context/toast/ToastContext'
import type {
	TimeOffItem,
	TimeOffSortBy,
	TimeOffType,
} from '../../../../store/time-off/timeOffApi'
import {
	useGetTimeOffListQuery,
	useGetTimeOffSummaryQuery,
	useDeleteTimeOffMutation,
} from '../../../../store/time-off/timeOffApi'
import { useGetEmployeesQuery } from '../../../../store/employees/employeesApi'
import { formatDate } from '../../../../utils/format'
import useDebouncedValue from '../../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

// Column keys that map 1:1 to the backend TimeOffSortBy enum. Sorts on
// other keys (e.g. the derived "state" column) are handled client-side
// on the current page.
const BACKEND_SORT_KEYS = new Set([
	'startDate',
	'endDate',
	'type',
	'workingDays',
	'createdAt',
	'updatedAt',
])

// Rank used by the client-side sort on the derived Status column.
// Ascending order = past → away now → upcoming (temporal reading).
const stateRank = (start: string, end: string): number => {
	const st = derivedState(start, end)
	if (st === 'past') return 0
	if (st === 'away') return 1
	return 2
}

const currentYear = () => new Date().getUTCFullYear()

/** Tween an integer from previous value to target with ease-out cubic. */
function useCountUp(target: number, duration = 500): number {
	const [display, setDisplay] = useState(target)
	const prev = useRef(target)
	useEffect(() => {
		const from = prev.current
		const to = target
		if (from === to) return
		let raf = 0
		const start = performance.now()
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const cur = Math.round(from + (to - from) * eased)
			setDisplay(cur)
			if (t < 1) raf = requestAnimationFrame(step)
			else prev.current = to
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])
	return display
}

/** Renders a KPI number that ticks up from 0 → target on first load and
 *  from previous → new value on subsequent updates (e.g. year change).
 *  Displays an em-dash while the query is loading (value === undefined). */
const KpiCounter = ({ value }: { value: number | undefined }) => {
	const v = useCountUp(value ?? 0)
	if (value === undefined) return <>—</>
	return <>{v}</>
}

const TYPE_META: Record<TimeOffType, { label: string; tint: string; fg: string }> = {
	VACATION: { label: 'Vacation', tint: 'rgba(3, 105, 161, 0.12)', fg: '#0369a1' },
	SICK_LEAVE: { label: 'Sick leave', tint: 'rgba(220, 38, 38, 0.12)', fg: '#b91c1c' },
	UNPAID_LEAVE: { label: 'Unpaid leave', tint: 'rgba(100, 116, 139, 0.14)', fg: '#475569' },
}

const derivedState = (start: string, end: string): 'upcoming' | 'away' | 'past' => {
	const today = new Date().toISOString().slice(0, 10)
	if (end < today) return 'past'
	if (start > today) return 'upcoming'
	return 'away'
}

const STATE_META: Record<'upcoming' | 'away' | 'past', { label: string; bg: string; fg: string }> = {
	upcoming: { label: 'Upcoming', bg: 'rgba(3, 105, 161, 0.10)', fg: '#0369a1' },
	away: { label: 'Away now', bg: 'rgba(245, 158, 11, 0.16)', fg: '#a26608' },
	past: { label: 'Past', bg: 'rgba(15, 23, 42, 0.06)', fg: '#64748b' },
}

const fmt = (iso: string) => formatDate(iso, 'short')
const daysWord = (n: number) => (n === 1 ? 'day' : 'days')

const authorInitials = (a: TimeOffItem['createdBy']) => {
	const x = (a.firstName?.[0] ?? '').toUpperCase()
	const y = (a.lastName?.[0] ?? '').toUpperCase()
	return (x + y || '?').slice(0, 2)
}

const TimeOffList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({ key: 'startDate', direction: 'desc' })
	const [typeFilter, setTypeFilter] = useState<TimeOffType | ''>('')
	const [employeeFilter, setEmployeeFilter] = useState<string>('')
	const [year, setYear] = useState<number>(currentYear())
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

	const backendSortBy: TimeOffSortBy | undefined =
		sort && BACKEND_SORT_KEYS.has(sort.key)
			? (sort.key as TimeOffSortBy)
			: undefined
	const { data, isLoading, isError, refetch } = useGetTimeOffListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: backendSortBy,
		sortDirection: backendSortBy ? sort?.direction : undefined,
		type: typeFilter || undefined,
		employeeId: employeeFilter || undefined,
		year,
	})
	const { data: summary } = useGetTimeOffSummaryQuery({ year })
	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 500 })
	const [deleteTimeOff, { isLoading: deleting }] = useDeleteTimeOffMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	// Client-side sort for keys the backend doesn't expose (currently
	// only the derived "state" column). Sorts within the current page.
	const displayItems = useMemo(() => {
		if (!sort || sort.key !== 'state') return items
		const dir = sort.direction === 'asc' ? 1 : -1
		return [...items].sort((a, b) => {
			const rA = stateRank(a.startDate, a.endDate)
			const rB = stateRank(b.startDate, b.endDate)
			if (rA !== rB) return (rA - rB) * dir
			// Stable tiebreaker: chronological by startDate, latest first.
			return a.startDate < b.startDate ? 1 : -1
		})
	}, [items, sort])

	const yearOptions = useMemo(() => {
		const y = currentYear()
		return [y - 1, y, y + 1]
	}, [])

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search, typeFilter, employeeFilter, year])

	const columns: DataTableColumn<TimeOffItem>[] = [
		{
			key: 'employee',
			label: 'Employee',
			render: (r) => (
				<EmpCell>
					<EmpLink
						onClick={(e) => {
							e.stopPropagation()
							navigate(`/employees/${r.employee.id}`)
						}}
					>
						<span>
							{r.employee.firstName} {r.employee.lastName}
						</span>
						<LinkIcon aria-hidden='true'>
							<ArrowOutwardOutlined />
						</LinkIcon>
					</EmpLink>
					{r.employee.positions.length > 0 && (
						<EmpPos>{r.employee.positions[0]}</EmpPos>
					)}
				</EmpCell>
			),
			skeleton: () => (
				<EmpCell>
					<TableSkeleton $w='120px' $h='14px' />
					<TableSkeleton $w='80px' $h='11px' style={{ marginTop: 4 }} />
				</EmpCell>
			),
		},
		{
			key: 'type',
			label: 'Type',
			sortable: true,
			sortValue: (r) => r.type,
			render: (r) => (
				<TypePill $tint={TYPE_META[r.type].tint} $fg={TYPE_META[r.type].fg}>
					{TYPE_META[r.type].label}
				</TypePill>
			),
			skeleton: () => <TableSkeleton $w='90px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'startDate',
			label: 'Date range',
			sortable: true,
			sortValue: (r) => new Date(r.startDate),
			render: (r) => (
				<RangeDates>
					{fmt(r.startDate)} — {fmt(r.endDate)}
				</RangeDates>
			),
			skeleton: () => <TableSkeleton $w='170px' $h='13px' />,
		},
		{
			key: 'state',
			label: 'Status',
			sortable: true,
			sortValue: (r) => stateRank(r.startDate, r.endDate),
			render: (r) => {
				const st = derivedState(r.startDate, r.endDate)
				return (
					<StatePill $bg={STATE_META[st].bg} $fg={STATE_META[st].fg}>
						{STATE_META[st].label}
					</StatePill>
				)
			},
			skeleton: () => <TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'workingDays',
			label: 'Days',
			sortable: true,
			sortValue: (r) => r.workingDays,
			render: (r) => (
				<Hours>
					<HoursNum>{r.workingDays}</HoursNum>
					<HoursUnit>{daysWord(r.workingDays)}</HoursUnit>
				</Hours>
			),
			skeleton: () => <TableSkeleton $w='50px' $h='22px' />,
		},
		{
			key: 'createdBy',
			label: 'Created by',
			render: (r) => (
				<AuthorCell title={`${r.createdBy.firstName} ${r.createdBy.lastName}`}>
					<AuthorAvatar>{authorInitials(r.createdBy)}</AuthorAvatar>
					<span>
						{r.createdBy.firstName} {r.createdBy.lastName}
					</span>
				</AuthorCell>
			),
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<PermissionGate permission='time_off:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/time-off/${r.id}`)}
							aria-label='View'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='time_off:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/time-off/edit/${r.id}`)}
							aria-label='Edit'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='time_off:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() =>
								setDeleteTarget({
									id: r.id,
									title: `${r.employee.firstName} ${r.employee.lastName} · ${fmt(r.startDate)}`,
								})
							}
							aria-label='Delete'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteTimeOff(deleteTarget.id).unwrap()
			showToast('Time off deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'People' },
					{ label: 'Employees' },
					{ label: 'Time Off', current: true },
				]}
				icon={<BeachAccessOutlined />}
				title='Time Off'
				subtitle='Vacation, sick and unpaid absences across the team.'
				action={
					<PermissionGate permission='time_off:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/employees/time-off/add')}
						>
							<AddRounded />
							Add time off
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by employee or note'
				search={searchInput}
				onSearchChange={setSearchInput}
				filters={
					<Filters>
						<FilterSelect
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value as TimeOffType | '')}
							aria-label='Filter by type'
						>
							<option value=''>Any type</option>
							<option value='VACATION'>Vacation</option>
							<option value='SICK_LEAVE'>Sick leave</option>
							<option value='UNPAID_LEAVE'>Unpaid leave</option>
						</FilterSelect>
						<FilterSelect
							value={employeeFilter}
							onChange={(e) => setEmployeeFilter(e.target.value)}
							aria-label='Filter by employee'
						>
							<option value=''>Any employee</option>
							{(employeesPage?.data ?? []).map((e) => (
								<option key={e.id} value={e.id}>
									{e.firstName} {e.lastName}
								</option>
							))}
						</FilterSelect>
						<FilterSelect
							value={String(year)}
							onChange={(e) => setYear(Number(e.target.value))}
							aria-label='Filter by year'
						>
							{yearOptions.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</FilterSelect>
					</Filters>
				}
			>
				<KpiRow>
					<KpiCard>
						<KpiIcon>
							<HourglassEmptyOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Out today</KpiLabel>
							<KpiNum>
								<KpiCounter value={summary?.outToday} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<FlightTakeoffOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Upcoming · 30 days</KpiLabel>
							<KpiNum>
								<KpiCounter value={summary?.upcomingIn30Days} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<BeachAccessOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Vacation booked · {year}</KpiLabel>
							<KpiNum>
								<KpiCounter value={summary?.vacationDaysThisYear} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<LocalHospitalOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Sick used · {year}</KpiLabel>
							<KpiNum>
								<KpiCounter value={summary?.sickDaysThisYear} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
				</KpiRow>

				<DataTable
					columns={columns}
					rows={displayItems}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					sort={sort}
					onSortChange={handleSortChange}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{deleteTarget && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete time off?'
					description={
						<>
							Delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This will free up the days on the year balance.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					isLoading={deleting}
				/>
			)}
		</>
	)
}

export default TimeOffList

// styled

const Filters = styled.div`
	display: inline-flex;
	gap: 10px;
	flex-wrap: wrap;
	align-items: center;
`

// Matches the SearchField pill in ListPageShell: same padding, same
// 1.5px cec9d8 border, same radius/pill. Text color mirrors the
// search input's placeholder tone (T.textSecondary) so the filter
// row reads as a single quiet strip next to the search field.
// Border stays put on focus per design — no primary ring, no colour
// swap. Solid white background on both the trigger and the option
// popup keeps the dropdown clean instead of inheriting a translucent
// / patchy look from the page background.
const FilterSelect = styled.select`
	appearance: none;
	background-color: #ffffff;
	background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
	background-repeat: no-repeat;
	background-position: right 14px center;
	border: 1.5px solid #cec9d8;
	border-radius: 999px;
	padding: 10px 34px 10px 16px;
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	color: ${T.textSecondary};
	cursor: pointer;
	transition: border-color 120ms ${T.ease};

	&:hover {
		border-color: #b3adc2;
	}
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: #cec9d8;
		box-shadow: none;
	}

	option {
		background: #ffffff;
		color: ${T.textStrong};
		font-weight: 500;
	}
`

const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`

const KpiCard = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
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

const EmpCell = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	gap: 2px;
`

const EmpLink = styled.button`
	background: transparent;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	text-transform: none;
	letter-spacing: normal;
	line-height: 1.2;

	&:hover {
		color: ${T.primary};
		text-decoration: underline;
	}
`

const LinkIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0.55;
	transition: opacity 160ms ease, color 160ms ease;

	svg {
		font-size: 14px;
	}

	${EmpLink}:hover & {
		opacity: 1;
		color: ${T.primary};
	}
`

const EmpPos = styled.span`
	font-size: 11.5px;
	color: ${T.textSecondary};
	white-space: nowrap;
`

const TypePill = styled.span<{ $tint: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 700;
	background: ${({ $tint }) => $tint};
	color: ${({ $fg }) => $fg};
	white-space: nowrap;
`

const RangeDates = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 15.5px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
`

const StatePill = styled.span<{ $bg: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	background: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	white-space: nowrap;
`

const Hours = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	line-height: 1;
`

const HoursNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 26px;
	font-weight: 700;
	color: ${T.primary};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.5px;
`

const HoursUnit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textStrong};
`


const AuthorCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: ${T.textStrong};
	white-space: nowrap;
`

const AuthorAvatar = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.14);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
`
