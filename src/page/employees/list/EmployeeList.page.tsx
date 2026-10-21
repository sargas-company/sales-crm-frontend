import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	GroupsOutlined,
	AddRounded,
	SearchOutlined,
	ClearRounded,
	FilterListOutlined,
	PhoneOutlined,
	PhoneDisabledOutlined,
	WorkOffOutlined,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import {
	BottomSlot,
	ClearBtn as FreshClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../analytics/filters/filters.styled'
import PermissionGate from '../../../components/auth/PermissionGate'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import type {
	EmployeeItem,
	EmployeeSortBy,
	EmployeeStatus,
} from '../../../store/employees/employeesApi'
import {
	useGetEmployeesQuery,
	useDeleteEmployeeMutation,
} from '../../../store/employees/employeesApi'
import { useGetPositionsQuery } from '../../../store/positions/positionsApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import usePermissions from '../../../hooks/usePermissions'
import { countryToFlag, formatPhoneDisplay, phoneCountryIso } from '../../../utils/phone'

const PAGE_SIZE = 20

/* Status "preset" tabs — same tape visual as Clients page presets.
 * Empty-string value acts as "All" (no filter applied). */
type StatusPreset = '' | 'ACTIVE' | 'BENCH' | 'TERMINATED'

const STATUS_PRESETS: { value: StatusPreset; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'BENCH', label: 'Bench' },
	{ value: 'TERMINATED', label: 'Terminated' },
]

const MONTH_OPTIONS: { value: string; label: string }[] = [
	{ value: '1', label: 'January' },
	{ value: '2', label: 'February' },
	{ value: '3', label: 'March' },
	{ value: '4', label: 'April' },
	{ value: '5', label: 'May' },
	{ value: '6', label: 'June' },
	{ value: '7', label: 'July' },
	{ value: '8', label: 'August' },
	{ value: '9', label: 'September' },
	{ value: '10', label: 'October' },
	{ value: '11', label: 'November' },
	{ value: '12', label: 'December' },
]

const fullName = (e: EmployeeItem) => `${e.firstName} ${e.lastName}`.trim() || '—'

/** Whole years since the birth date, treating the birthdate as a
 *  calendar date (UTC) so a `2000-02-29` doesn't drift under local
 *  time. Returns null when the input is missing or unparseable. */
const computeAge = (iso: string | null | undefined): number | null => {
	if (!iso) return null
	const birth = new Date(iso)
	if (Number.isNaN(birth.getTime())) return null
	const now = new Date()
	let age = now.getUTCFullYear() - birth.getUTCFullYear()
	const m = now.getUTCMonth() - birth.getUTCMonth()
	if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--
	return age >= 0 && age < 150 ? age : null
}

/** True when today's month+day matches the birth's month+day (UTC). */
const isBirthdayToday = (iso: string | null | undefined): boolean => {
	if (!iso) return false
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return false
	const now = new Date()
	return d.getUTCMonth() === now.getUTCMonth() && d.getUTCDate() === now.getUTCDate()
}

/** Compact tenure stats {years, months} relative to today. Negative
 *  spans (future hire date) are clamped to 0. */
const tenureSince = (iso: string | null | undefined): { years: number; months: number } | null => {
	if (!iso) return null
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return null
	const now = new Date()
	let months = (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth())
	if (now.getUTCDate() < d.getUTCDate()) months--
	if (months < 0) return { years: 0, months: 0 }
	return { years: Math.floor(months / 12), months: months % 12 }
}

/** `5y 3m` / `11m` / `<1m`. Null-safe. */
const formatTenureShort = (iso: string | null | undefined): string => {
	const t = tenureSince(iso)
	if (!t) return '—'
	if (t.years === 0 && t.months === 0) return '<1m'
	if (t.years === 0) return `${t.months}m`
	if (t.months === 0) return `${t.years}y`
	return `${t.years}y ${t.months}m`
}

/** Stacked hired-cell: full date on top (strong), computed tenure
 *  below (muted). Mirrors the Birthday-cell layout so the row stays
 *  visually balanced between the two date columns. */
const HiredCell = ({ iso }: { iso: string | null | undefined }) => {
	if (!iso) return <Sub>—</Sub>
	return (
		<HiredStack>
			<HiredStackTop>{formatDate(iso, 'short')}</HiredStackTop>
			<HiredStackBottom>{formatTenureShort(iso)} tenure</HiredStackBottom>
		</HiredStack>
	)
}

/** Placeholder for an empty dateOfBirth — mirrors the real tear-off
 *  calendar block's silhouette so the row stays visually balanced,
 *  but muted + dashed and with `??` where the day should be. Hover
 *  tells the owner the field is actually missing. */
const BirthdayEmpty = () => (
	<BirthdayCalendarEmpty title='Date of birth unknown'>
		<BirthdayCalendarEmptyBlock>
			<BirthdayCalendarEmptyMonth>???</BirthdayCalendarEmptyMonth>
			<BirthdayCalendarEmptyDay>?</BirthdayCalendarEmptyDay>
		</BirthdayCalendarEmptyBlock>
		<BirthdayCalendarEmptyMeta>
			<span className='top'>unknown</span>
			<span className='bot'>add DOB</span>
		</BirthdayCalendarEmptyMeta>
	</BirthdayCalendarEmpty>
)

/** Mini tear-off calendar block: small 40px-wide widget with a rose
 *  (or brighter-rose when today) month strip, the day number as the
 *  main glyph and the year + computed age in whole years next to it.
 *  Renders `BirthdayEmpty` (dashed-muted mirror of the real calendar)
 *  when the row has no date of birth. */
const BirthdayCell = ({ iso }: { iso: string | null | undefined }) => {
	if (!iso) return <BirthdayEmpty />
	const age = computeAge(iso)
	const today = isBirthdayToday(iso)
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return <Sub>—</Sub>
	const day = String(d.getUTCDate())
	const month = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase()
	const year = String(d.getUTCFullYear())
	return (
		<BirthdayCalendar title={today ? 'Birthday today' : undefined}>
			<BirthdayCalendarBlock>
				<BirthdayCalendarMonth $today={today}>{month}</BirthdayCalendarMonth>
				<BirthdayCalendarDay>{day}</BirthdayCalendarDay>
			</BirthdayCalendarBlock>
			<BirthdayCalendarMeta>
				<BirthdayCalendarYear>{year}</BirthdayCalendarYear>
				{age !== null && <BirthdayCalendarAge>{age}y</BirthdayCalendarAge>}
			</BirthdayCalendarMeta>
		</BirthdayCalendar>
	)
}

/** Phone cell: country flag badge (from the number's `+country`
 *  prefix) + pretty-printed phone. Falls back to a muted phone icon
 *  when the country can't be resolved; falls back to the raw string
 *  when parsing fails entirely. Empty rows get a dashed "no phone"
 *  placeholder with a disabled-phone glyph. */
const PhoneCellRow = ({ raw }: { raw: string | null | undefined }) => {
	if (!raw) {
		return (
			<PhoneEmpty title='No phone on file'>
				<PhoneDisabledOutlined />
				<span>no phone</span>
			</PhoneEmpty>
		)
	}
	const iso = phoneCountryIso(raw)
	const flag = countryToFlag(iso)
	const pretty = formatPhoneDisplay(raw)
	return (
		<PhoneCell title={iso ?? undefined}>
			<span className='pin'>
				{flag ? <span className='flag'>{flag}</span> : <PhoneOutlined />}
			</span>
			<span className='num'>{pretty}</span>
		</PhoneCell>
	)
}

/** Email cell: plain mailto link, no icon. Empty renders as em-dash. */
const EmailCellRow = ({ email }: { email: string | null | undefined }) => {
	if (!email) return <Sub>—</Sub>
	return (
		<EmailCell>
			<a href={`mailto:${email}`} className='addr' onClick={(e) => e.stopPropagation()}>
				{email}
			</a>
		</EmailCell>
	)
}

/** Stacked salary cell: amount strong on top, `monthly` / `hourly`
 *  caption underneath. Null-safe — missing comp history reads as
 *  `$0` / `no rate` per the owner's spec. */
const SalaryCell = ({ row }: { row: EmployeeItem }) => {
	const current = row.compensationRates?.[0]
	if (!current) {
		return (
			<SalaryStack>
				<span className='amt'>$0</span>
				<span className='cap'>no rate</span>
			</SalaryStack>
		)
	}
	const value = Number.parseFloat(current.rate)
	const amount = Number.isFinite(value) ? value : 0
	const isMonthly = current.rateType === 'MONTHLY'
	const formatted = amount.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: isMonthly ? 0 : 2,
		maximumFractionDigits: isMonthly ? 0 : 2,
	})
	return (
		<SalaryStack>
			<span className='amt'>{formatted}</span>
			<span className='cap'>{isMonthly ? 'monthly' : 'hourly'}</span>
		</SalaryStack>
	)
}

const EmployeeList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { has } = usePermissions()
	const canViewSalary = has('employees:view_salary')
	const [searchParams, setSearchParams] = useSearchParams()

	// URL-synced filter values; the URL is the source of truth so a
	// deep link reproduces the exact filter configuration (same pattern
	// as JobPosts / Clients).
	const statusParam = (searchParams.get('status') ?? '') as EmployeeStatus | ''
	const positionParam = searchParams.get('position') ?? ''
	const birthdayMonthParam = searchParams.get('birthdayMonth') ?? ''

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

	const { data: positionsData } = useGetPositionsQuery()
	const positions = useMemo(() => positionsData ?? [], [positionsData])

	const { data, isLoading, isError, refetch } = useGetEmployeesQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: statusParam || undefined,
		position: positionParam || undefined,
		birthdayMonth: birthdayMonthParam
			? Number.parseInt(birthdayMonthParam, 10) || undefined
			: undefined,
		sortBy: (sort?.key as EmployeeSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams)
		if (value) next.set(key, value)
		else next.delete(key)
		setSearchParams(next, { replace: true })
		setPage(1)
	}

	const clearFilters = () => {
		const next = new URLSearchParams(searchParams)
		next.delete('status')
		next.delete('position')
		next.delete('birthdayMonth')
		setSearchParams(next, { replace: true })
		setSearchInput('')
		setPage(1)
	}

	const activeFilterCount =
		(statusParam ? 1 : 0) +
		(positionParam ? 1 : 0) +
		(birthdayMonthParam ? 1 : 0) +
		(searchInput ? 1 : 0)

	// Tape indicator slide — same pattern as ClientList.
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		const root = pillsRef.current
		if (!root) return
		const el = root.querySelector<HTMLButtonElement>(
			'[role="tab"][data-active="true"]',
		)
		if (!el) {
			setInd((p) => ({ ...p, opacity: 0 }))
			return
		}
		const rootRect = root.getBoundingClientRect()
		const r = el.getBoundingClientRect()
		setInd({
			left: r.left - rootRect.left - 2,
			width: r.width + 4,
			opacity: 1,
		})
	}, [statusParam])

	useEffect(() => {
		setPage(1)
	}, [search, statusParam, positionParam, birthdayMonthParam])

	const columns: DataTableColumn<EmployeeItem>[] = [
		{
			// Full name column shrinks to its content — no minWidth. Sort
			// key matches the backend enum (firstName is what BE actually
			// orders by).
			key: 'firstName',
			label: 'Full name',
			sortable: true,
			sortValue: (e) => fullName(e),
			render: (e) => (
				<NameCell>
					<NameText>{fullName(e)}</NameText>
				</NameCell>
			),
			skeleton: () => (
				<NameCell>
					<TableSkeleton $w='140px' $h='14px' />
				</NameCell>
			),
		},
		{
			/* Email first (per the owner's spec), then phone. Email is
			 * visible for every role; it's not gated by the view-salary
			 * perm or anything else. */
			key: 'email',
			label: 'Email',
			minWidth: 220,
			sortable: true,
			sortValue: (e) => e.email ?? '',
			render: (e) => <EmailCellRow email={e.email} />,
			skeleton: () => <TableSkeleton $w='160px' $h='18px' />,
		},
		{
			/* Phone cell mirrors the JobPosts location-cell layout:
			 * country flag badge → formatted number. The flag is
			 * resolved from the number's `+country` prefix via
			 * libphonenumber-js (phoneCountryIso), and the display
			 * string is pretty-printed through formatPhoneDisplay
			 * (which falls back to the raw string if parsing fails,
			 * so historical rows always render). */
			key: 'phone',
			label: 'Phone',
			minWidth: 180,
			render: (e) => <PhoneCellRow raw={e.phone} />,
			skeleton: () => <TableSkeleton $w='140px' $h='18px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (e) => e.status,
			render: (e) => <StatusPill $status={e.status}>{e.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'positions',
			label: 'Positions',
			minWidth: 220,
			render: (e) =>
				e.positions.length > 0 ? (
					<Tags>
						{e.positions.slice(0, 3).map((p) => (
							<Tag key={p.id}>{p.title}</Tag>
						))}
						{e.positions.length > 3 && <Sub>+{e.positions.length - 3}</Sub>}
					</Tags>
				) : (
					<PositionsEmpty title='No positions assigned'>
						<WorkOffOutlined />
						<span>no position</span>
					</PositionsEmpty>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='20px' style={{ borderRadius: 999 }} />,
		},
		{
			/* Birthday — tear-off calendar block. Placed BEFORE Hired
			 * so the owner reads personal/HR info (DOB) left of the
			 * employment-timeline (Hired) block. */
			key: 'dateOfBirth',
			label: 'Birthday',
			minWidth: 160,
			render: (e) => <BirthdayCell iso={e.dateOfBirth} />,
			skeleton: () => <TableSkeleton $w='120px' $h='40px' style={{ borderRadius: 8 }} />,
		},
		{
			/* Stacked hired-cell: date strong on top, computed tenure
			 * (e.g. "5y 3m tenure") muted below. Shares the stacked
			 * layout with Birthday-cell for visual rhythm. */
			key: 'hiredAt',
			label: 'Hired',
			minWidth: 170,
			sortable: true,
			sortValue: (e) => (e.hiredAt ? new Date(e.hiredAt) : new Date(0)),
			render: (e) => <HiredCell iso={e.hiredAt} />,
			skeleton: () => <TableSkeleton $w='120px' $h='32px' />,
		},
		{
			/* Current salary = latest EmployeeCompensationRate whose
			 * effectiveDate has arrived. Empty array ⇒ render 0 per
			 * owner's spec. Suffix (/mo vs /h) comes from rateType.
			 *
			 * Sort is handled on the backend (special-cased because
			 * Prisma can't orderBy a nested row). Hourly rates are
			 * normalised to monthly (rate × 160) so hourly and
			 * monthly employees sort against the same yardstick.
			 *
			 * Entire column is suppressed below the `employees:view_salary`
			 * permission gate; backend also strips `compensationRates`
			 * for anyone without the perm (defence in depth). */
			key: 'salary',
			label: 'Salary',
			minWidth: 130,
			sortable: true,
			sortValue: (e) => {
				const current = e.compensationRates?.[0]
				if (!current) return 0
				const v = Number.parseFloat(current.rate)
				if (!Number.isFinite(v)) return 0
				return current.rateType === 'HOURLY' ? v * 160 : v
			},
			render: (e) => <SalaryCell row={e} />,
			skeleton: () => <TableSkeleton $w='100px' $h='32px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (e) => (
				<Actions>
					<PermissionGate permission='employees:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/${e.id}`)}
							aria-label='View employee'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='employees:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/employees/edit/${e.id}`)}
							aria-label='Edit employee'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='employees:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: e.id, title: fullName(e) })}
							aria-label='Delete employee'
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
			await deleteEmployee(deleteTarget.id).unwrap()
			showToast('Employee deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete employee', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'People' }, { label: 'Employees', current: true }]}
				icon={<GroupsOutlined />}
				title='Employees'
				subtitle='Team directory — names, contacts and roles.'
				action={
					<PermissionGate permission='employees:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/employees/add')}>
							<AddRounded />
							New employee
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<EmployeeFiltersWrap role='region' aria-label='Employees filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Filter</span>
								<span className='bot'>
									{STATUS_PRESETS.find((p) => p.value === statusParam)?.label ??
										'All'}
								</span>
							</div>
						</div>

						<TapePills ref={pillsRef} role='tablist' aria-label='Status preset'>
							<TapeIndicator
								style={{
									transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
									width: `${ind.width}px`,
									opacity: ind.opacity,
								}}
							/>
							{STATUS_PRESETS.map((p) => (
								<TapePill
									key={p.value || 'all'}
									type='button'
									role='tab'
									data-active={statusParam === p.value || undefined}
									aria-selected={statusParam === p.value}
									$active={statusParam === p.value}
									onClick={() => updateParam('status', p.value)}
								>
									{p.label}
								</TapePill>
							))}
						</TapePills>

						<div className='filter-spacer' />

						<div className='upwork-hint' aria-hidden='true'>
							<span className='row'>
								<span className='w'>every</span>
								<span className='amber-wrap'>
									<span className='a'>PERSON</span>
									<svg
										className='squiggle'
										viewBox='0 0 120 12'
										width='120'
										height='12'
										preserveAspectRatio='none'
									>
										<path
											d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
									</svg>
								</span>
								<span className='w'>on file</span>
							</span>
							<span className='stars'>
								<svg
									className='s'
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
								</svg>
							</span>
						</div>

						<RowBreak />

						<BottomSlot>
							<SearchPill>
								<SearchOutlined className='ico' />
								<input
									type='text'
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder='Search by name or email'
									aria-label='Search employees'
								/>
							</SearchPill>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Position</span>
								<InlineSelect
									value={positionParam}
									onChange={(e) => updateParam('position', e.target.value)}
								>
									<option value=''>Any</option>
									{positions.map((p) => (
										<option key={p.id} value={p.id}>
											{p.title}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Birthday month</span>
								<InlineSelect
									value={birthdayMonthParam}
									onChange={(e) => updateParam('birthdayMonth', e.target.value)}
								>
									<option value=''>Any</option>
									{MONTH_OPTIONS.map((m) => (
										<option key={m.value} value={m.value}>
											{m.label}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<div className='filter-spacer' />

						<FreshClearBtn
							type='button'
							onClick={clearFilters}
							disabled={activeFilterCount === 0}
						>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</FreshClearBtn>
					</EmployeeFiltersWrap>
				}
			>
				<DataTable
					columns={canViewSalary ? columns : columns.filter((c) => c.key !== 'salary')}
					rows={items}
					rowKey={(e) => e.id}
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
					title='Delete employee?'
					description={
						<>
							Are you sure you want to delete{' '}
							<strong>&quot;{deleteTarget.title}&quot;</strong>? This action cannot be
							undone.
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

export default EmployeeList

/* Full-width extension of the shared FreshFiltersWrap: the base bar
 * only grows to its content, which left large blank gutters on wide
 * screens. Here we stretch to 100% so the right-side spacer actually
 * has room to push Clear to the far right. */
const EmployeeFiltersWrap = styled(FreshFiltersWrap)`
	width: 100%;
	padding: 18px 22px;
`

const NameCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`

const NameText = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
	white-space: nowrap;
`

const Sub = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

const Tags = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 6px;
	align-items: center;
`

/* Position pill — compact uppercase look matching StatusPill below.
 * Keeps a blue tint to distinguish "role catalogue reference" from
 * "lifecycle status". */
const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: rgba(3, 105, 161, 0.10);
	color: ${T.primary};
	border: 0;
`

/* Status pill tones:
 *  ACTIVE     — green  (operational, working)
 *  BENCH      — amber  (hired, idle — needs attention from sales/PM)
 *  TERMINATED — slate  (left, archive-tier)
 */
const STATUS_PILL_TONES: Record<string, { bg: string; fg: string }> = {
	ACTIVE: { bg: 'rgba(21, 128, 61, 0.12)', fg: '#15803d' },
	BENCH: { bg: 'rgba(217, 119, 6, 0.14)', fg: '#b45309' },
	TERMINATED: { bg: 'rgba(100, 116, 139, 0.14)', fg: '#475569' },
}

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $status }) =>
		(STATUS_PILL_TONES[$status] ?? STATUS_PILL_TONES.TERMINATED).bg};
	color: ${({ $status }) =>
		(STATUS_PILL_TONES[$status] ?? STATUS_PILL_TONES.TERMINATED).fg};
`

/* Phone cell — flag badge + formatted number. Mirrors the JobPosts
 * LocationCell shape but larger: 28×28 badge, 20px flag, 14px mono
 * number, so the phone column reads as a primary contact field, not
 * a secondary chip. */
const PhoneCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-size: 14px;
	line-height: 1.3;
	min-width: 0;

	.pin {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: rgba(15, 23, 42, 0.04);
		color: rgba(15, 23, 42, 0.55);
		flex-shrink: 0;

		svg {
			font-size: 18px;
		}
	}
	.flag {
		font-size: 20px;
		line-height: 1;
		color: initial;
	}
	.num {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 14px;
		font-weight: 400;
		color: ${T.textStrong};
		white-space: nowrap;
	}
`

/* Shared empty-state placeholder — dashed muted badge with a glyph.
 * Visually distinct from the plain em-dash so missing fields read as
 * "nothing here yet", not as broken data. Used for Phone + Positions
 * empty states; add other columns by styling the alias component
 * instead of duplicating the primitive. */
const EmptyBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.06);
	color: ${T.textSecondary};
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;

	svg {
		font-size: 15px;
		opacity: 0.7;
	}
`

const PhoneEmpty = EmptyBadge
const PositionsEmpty = EmptyBadge

/* Email cell — plain mailto link, no icon. */
const EmailCell = styled.span`
	display: inline-flex;
	align-items: center;
	font-size: 13.5px;
	line-height: 1.3;
	min-width: 0;
	max-width: 100%;

	.addr {
		color: ${T.textStrong};
		text-decoration: none;
		font-weight: 500;
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		&:hover {
			color: ${T.primary};
			text-decoration: underline;
		}
	}
`

/* Stacked salary-cell: mono amount strong on top, caption muted. */
const SalaryStack = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.15;
	white-space: nowrap;

	.amt {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 13.5px;
		font-weight: 700;
		color: ${T.textStrong};
		font-variant-numeric: tabular-nums;
	}
	.cap {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textSecondary};
	}
`

/* ─── Hired stacked-cell styled components. */

const HiredStack = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.15;
	white-space: nowrap;
`

const HiredStackTop = styled.span`
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: 0.1px;
`

const HiredStackBottom = styled.span`
	font-size: 11px;
	font-weight: 500;
	color: ${T.textSecondary};
	font-variant-numeric: tabular-nums;
`

/* ─── Birthday tear-off calendar block styled components. */

const BirthdayCalendar = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
	color: ${T.textStrong};
`

const BirthdayCalendarBlock = styled.span`
	display: inline-flex;
	flex-direction: column;
	width: 40px;
	border-radius: 6px;
	overflow: hidden;
	border: 1px solid ${T.border};
	background: #ffffff;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
	line-height: 1;
`

const BirthdayCalendarMonth = styled.span<{ $today: boolean }>`
	font-size: 9px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-align: center;
	padding: 2px 0;
	color: #ffffff;
	background: ${({ $today }) => ($today ? '#db2777' : '#f43f5e')};
`

const BirthdayCalendarDay = styled.span`
	font-size: 16px;
	font-weight: 700;
	text-align: center;
	padding: 2px 0 3px;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const BirthdayCalendarMeta = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.1;
`

const BirthdayCalendarYear = styled.span`
	font-size: 12px;
	font-weight: 600;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const BirthdayCalendarAge = styled.span`
	font-size: 11px;
	font-weight: 500;
	color: ${T.textSecondary};
`

/* ─── BirthdayEmpty — dashed-muted mirror of the real tear-off block
 *  for the "no DOB set" state. Keeps the same silhouette so the row
 *  stays visually balanced, but every colour drops to a muted/dashed
 *  tone and the day-number becomes "?". */

const BirthdayCalendarEmpty = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
	color: ${T.textSecondary};
`

const BirthdayCalendarEmptyBlock = styled.span`
	display: inline-flex;
	flex-direction: column;
	width: 40px;
	border-radius: 6px;
	overflow: hidden;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.04);
	line-height: 1;
`

const BirthdayCalendarEmptyMonth = styled.span`
	font-size: 9px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-align: center;
	padding: 2px 0;
	color: ${T.textSecondary};
	background: rgba(100, 116, 139, 0.12);
	opacity: 0.75;
`

const BirthdayCalendarEmptyDay = styled.span`
	font-size: 16px;
	font-weight: 700;
	text-align: center;
	padding: 2px 0 3px;
	color: ${T.textSecondary};
	opacity: 0.6;
`

const BirthdayCalendarEmptyMeta = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.1;

	.top {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textSecondary};
	}
	.bot {
		font-size: 10px;
		font-weight: 500;
		color: ${T.textSecondary};
		opacity: 0.7;
	}
`
