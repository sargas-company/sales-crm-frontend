import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	FolderOutlined,
	AddRounded,
	ArrowOutwardOutlined,
	FilterListOutlined,
	SearchOutlined,
	ClearRounded,
	PersonOffOutlined,
	HelpOutline,
	MoneyOffOutlined,
	HourglassEmptyRounded,
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
	FreshFiltersWrap,
	SearchPill,
	InlineField,
	InlineSelect,
	BottomSlot,
	RowBreak,
	ClearBtn as FreshClearBtn,
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
	ProjectItem,
	ProjectSortBy,
	ProjectStatus,
} from '../../../store/projects/projectsApi'
import {
	useGetProjectsQuery,
	useDeleteProjectMutation,
} from '../../../store/projects/projectsApi'
import { useGetClientsQuery } from '../../../store/clients/clientsApi'
import { formatDate } from '../../../utils/format'
import { formatDateTimeSec } from '../../../utils/formatDate'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

/* Which client is "the" client of a project. New Project create /
 * edit flow writes `crmClientId → Client`; legacy rows that pre-date
 * the Clients module may still carry only the old `clientId →
 * Counterparty`. Prefer the new link; fall back to the legacy one. */
const resolveClient = (p: ProjectItem) => {
	if (p.crmClient) {
		const name = [p.crmClient.firstName, p.crmClient.lastName]
			.filter(Boolean)
			.join(' ')
			.trim()
		return {
			kind: 'crm' as const,
			id: p.crmClient.id,
			label: name || p.crmClient.company || '—',
		}
	}
	if (p.client) {
		const name = `${p.client.firstName} ${p.client.lastName}`.trim()
		return { kind: 'counterparty' as const, id: p.client.id, label: name || '—' }
	}
	return null
}

type StatusPreset = '' | ProjectStatus
const STATUS_PRESETS: { value: StatusPreset; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'planned', label: 'Planned' },
	{ value: 'active', label: 'Active' },
	{ value: 'paused', label: 'Paused' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'archived', label: 'Archived' },
]

const ProjectList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchParams, setSearchParams] = useSearchParams()
	const statusParam = (searchParams.get('status') ?? '') as StatusPreset
	const clientParam = searchParams.get('clientId') ?? ''

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

	// All CRM clients for the dropdown — 500 covers today's directory;
	// swap for typeahead when it grows past that.
	const { data: clientsData } = useGetClientsQuery({
		page: 1,
		limit: 500,
		sortBy: 'firstName',
		sortDirection: 'asc',
	})
	const clients = clientsData?.data ?? []

	const { data, isLoading, isError, refetch } = useGetProjectsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: statusParam || undefined,
		crmClientId: clientParam || undefined,
		sortBy: (sort?.key as ProjectSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

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
		next.delete('clientId')
		setSearchParams(next, { replace: true })
		setSearchInput('')
		setPage(1)
	}

	const activeFilterCount =
		(statusParam ? 1 : 0) + (clientParam ? 1 : 0) + (searchInput ? 1 : 0)

	// TapePills sliding indicator — same pattern as Reports / Invoices.
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

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search, statusParam, clientParam])

	const columns: DataTableColumn<ProjectItem>[] = [
		{
			// Project column shrinks to content — no minWidth.
			key: 'name',
			label: 'Project',
			sortable: true,
			sortValue: (p) => p.name,
			render: (p) => (
				<TitleLink onClick={() => navigate(`/projects/${p.id}`)}>
					<span>{p.name}</span>
					<LinkIcon aria-hidden='true'>
						<ArrowOutwardOutlined />
					</LinkIcon>
				</TitleLink>
			),
			skeleton: () => <TableSkeleton $w='200px' $h='14px' />,
		},
		{
			// Shows the CRM Client when the project is wired through the
			// new `crmClientId → Client` relation, with a legacy fallback
			// to the old `clientId → Counterparty` link. Clicking opens
			// the appropriate detail page.
			key: 'client',
			label: 'Client',
			render: (p) => {
				const c = resolveClient(p)
				if (!c)
					return (
						<EmptyBadge title='No client assigned'>
							<PersonOffOutlined />
							no client
						</EmptyBadge>
					)
				const href =
					c.kind === 'crm' ? `/clients/${c.id}` : `/counterparties/${c.id}`
				return (
					<ClientLink
						onClick={(e) => {
							e.stopPropagation()
							navigate(href)
						}}
					>
						<span>{c.label}</span>
						<LinkIcon aria-hidden='true'>
							<ArrowOutwardOutlined />
						</LinkIcon>
					</ClientLink>
				)
			},
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 120,
			sortable: true,
			sortValue: (p) => p.status,
			render: (p) => <StatusPill $status={p.status}>{p.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			// Not sortable server-side: backend ProjectSortBy enum has
			// no type/rate/hoursBudget keys. Clicking the header would
			// 400 the list query (see /release deep-review).
			key: 'type',
			label: 'Type',
			minWidth: 110,
			render: (p) =>
				p.type ? (
					<BillingTypePill $type={p.type}>{TYPE_LABEL[p.type]}</BillingTypePill>
				) : (
					<EmptyBadge title='Billing type not set'>
						<HelpOutline />
						no type
					</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'rate',
			label: 'Rate',
			minWidth: 120,
			render: (p) => <RateCell p={p} />,
			skeleton: () => <TableSkeleton $w='80px' $h='14px' />,
		},
		{
			key: 'hoursBudget',
			label: 'Budget',
			minWidth: 90,
			render: (p) => <BudgetCell p={p} />,
			skeleton: () => <TableSkeleton $w='50px' $h='14px' />,
		},
		{
			key: 'team',
			label: 'Team',
			minWidth: 90,
			render: (p) => <Muted>{p.members.length}</Muted>,
			skeleton: () => <TableSkeleton $w='30px' $h='13px' />,
		},
		{
			// When the project row was first created in the DB.
			key: 'createdAt',
			label: 'Created',
			minWidth: 170,
			sortable: true,
			sortValue: (p) => new Date(p.createdAt),
			render: (p) => <DateTimeCell iso={p.createdAt} />,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			// Last mutation on the row — rename, status change, member
			// shuffle. Useful for spotting stale projects at a glance.
			key: 'updatedAt',
			label: 'Updated',
			minWidth: 170,
			sortable: true,
			sortValue: (p) => new Date(p.updatedAt),
			render: (p) => <DateTimeCell iso={p.updatedAt} />,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (p) => (
				<Actions>
					<PermissionGate permission='projects:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/${p.id}`)}
							aria-label='View project'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='projects:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/edit/${p.id}`)}
							aria-label='Edit project'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='projects:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: p.id, title: p.name })}
							aria-label='Delete project'
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
			await deleteProject(deleteTarget.id).unwrap()
			showToast('Project deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete project', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Delivery' }, { label: 'Projects', current: true }]}
				icon={<FolderOutlined />}
				title='Projects'
				subtitle='Client engagements — status, team and timeline.'
				action={
					<PermissionGate permission='projects:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/projects/add')}>
							<AddRounded />
							New project
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Projects filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Filter</span>
								<span className='bot'>
									{STATUS_PRESETS.find((p) => p.value === statusParam)
										?.label ?? 'All'}
								</span>
							</div>
						</div>

						<TapePills
							ref={pillsRef}
							role='tablist'
							aria-label='Status preset'
						>
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
									<span className='a'>PROJECT</span>
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
								<span className='w'>in motion</span>
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
									placeholder='Search by name'
									aria-label='Search projects'
								/>
							</SearchPill>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Client</span>
								<InlineSelect
									value={clientParam}
									onChange={(e) =>
										updateParam('clientId', e.target.value)
									}
								>
									<option value=''>Any</option>
									{clients.map((c) => {
										const name =
											[c.firstName, c.lastName]
												.filter(Boolean)
												.join(' ')
												.trim() ||
											c.company ||
											c.id
										return (
											<option key={c.id} value={c.id}>
												{name}
											</option>
										)
									})}
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
					</FreshFiltersWrap>
				}
			>
				<DataTable
					columns={columns}
					rows={items}
					rowKey={(p) => p.id}
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
					title='Delete project?'
					description={
						<>
							Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This will remove all its team memberships and reports.
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

export default ProjectList

const TitleLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	&:hover {
		color: ${T.primary};
	}
`

const ClientLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;

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

	${TitleLink}:hover &,
	${ClientLink}:hover & {
		opacity: 1;
		color: ${T.primary};
	}
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

/* Dashed muted badge for empty cells — mirrors the Employees list
 * pattern (`EmptyBadge` there). Visually distinct from a plain em-dash
 * so missing fields read as "nothing here yet", not broken data. */
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
	cursor: default;

	svg {
		font-size: 15px;
		opacity: 0.7;
	}
`

/** Date + time cell. The DATE pops (semi-bold, dark slate) and the
 *  time trails it in a lighter weight / muted colour — scannable at a
 *  glance without hiding the exact timestamp. */
const DateTimeCell = ({ iso }: { iso: string }) => {
	const d = new Date(iso)
	const timeStr = d.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
	return (
		<DateTimeWrap title={formatDateTimeSec(iso)}>
			<DatePart>{formatDate(iso, 'short')}</DatePart>
			<TimePart>{timeStr}</TimePart>
		</DateTimeWrap>
	)
}

const DateTimeWrap = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	white-space: nowrap;
`

const DatePart = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: #0f172a;
	letter-spacing: -0.1px;
`

const TimePart = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 11.5px;
	font-weight: 400;
	color: ${T.textMuted};
	font-variant-numeric: tabular-nums;
`

/* ─── Billing cell ─────────────────────────────────────────────── */

/** Compact money renderer: compacts large sums to `12.5k` / `1.2m`
 *  so the pill stays readable in a dense table. Pass currency as a
 *  short symbol / code suffix. */
const compactMoney = (n: number): string => {
	if (!Number.isFinite(n)) return '—'
	const abs = Math.abs(n)
	if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
	if (abs >= 10_000) return `${Math.round(n / 1_000)}k`
	if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
	// Under 1k — show up to two decimals, trimmed.
	const whole = Math.trunc(n)
	if (n === whole) return whole.toLocaleString('en-US')
	return n
		.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		.replace(/0+$/, '')
		.replace(/\.$/, '')
}

const CURRENCY_SYMBOL: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	UAH: '₴',
}

const TYPE_LABEL: Record<string, string> = {
	HOURLY: 'Hourly',
	FIXED: 'Fixed',
	RETAINER: 'Retainer',
}

/** Rate cell — formatted amount + muted cadence suffix. Shows the
 *  full exact amount in the hover title. */
const RateCell = ({ p }: { p: ProjectItem }) => {
	if (!p.rate || !p.type)
		return (
			<EmptyBadge title='Rate not set'>
				<MoneyOffOutlined />
				no rate
			</EmptyBadge>
		)
	const num = Number(p.rate)
	if (!Number.isFinite(num))
		return (
			<EmptyBadge title='Rate not set'>
				<MoneyOffOutlined />
				no rate
			</EmptyBadge>
		)
	const sym = p.rateCurrency ? CURRENCY_SYMBOL[p.rateCurrency] ?? '' : ''
	const text = sym
		? `${sym}${compactMoney(num)}`
		: `${compactMoney(num)} ${p.rateCurrency ?? ''}`.trim()
	const suffix =
		p.type === 'HOURLY' ? '/hr' : p.type === 'RETAINER' ? '/mo' : ' flat'
	const exact = `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p.rateCurrency ?? ''}`.trim()
	return (
		<BillingAmount title={exact}>
			{text}
			<BillingSuffix>{suffix}</BillingSuffix>
		</BillingAmount>
	)
}

/** Hours budget cell — only populated for HOURLY projects. */
const BudgetCell = ({ p }: { p: ProjectItem }) => {
	if (p.type !== 'HOURLY' || p.hoursBudget == null)
		return (
			<EmptyBadge
				title={
					p.type === 'HOURLY'
						? 'No hour cap set'
						: 'Hours budget applies only to hourly projects'
				}
			>
				<HourglassEmptyRounded />
				no cap
			</EmptyBadge>
		)
	return (
		<BudgetValue>
			{p.hoursBudget}
			<BudgetUnit>h</BudgetUnit>
		</BudgetValue>
	)
}

const BudgetValue = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.2px;
`

const BudgetUnit = styled.span`
	font-size: 10.5px;
	font-weight: 600;
	color: ${T.textMuted};
`

const BillingTypePill = styled.span<{ $type: 'HOURLY' | 'FIXED' | 'RETAINER' }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	white-space: nowrap;
	background: ${({ $type }) =>
		$type === 'HOURLY'
			? 'rgba(234, 88, 12, 0.12)'
			: $type === 'FIXED'
				? 'rgba(14, 165, 233, 0.12)'
				: 'rgba(139, 92, 246, 0.12)'};
	color: ${({ $type }) =>
		$type === 'HOURLY' ? '#c2410c' : $type === 'FIXED' ? '#0369a1' : '#6d28d9'};
`

const BillingAmount = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.2px;
`

const BillingSuffix = styled.span`
	font-size: 10.5px;
	font-weight: 600;
	color: ${T.textMuted};
`

type StatusKey = 'planned' | 'active' | 'paused' | 'completed' | 'archived'

const TYPE_COLOR: Record<string, { solid: string; soft: string }> = {
	HOURLY: { solid: '#c2410c', soft: 'rgba(234, 88, 12, 0.12)' },
	FIXED: { solid: '#0369a1', soft: 'rgba(14, 165, 233, 0.12)' },
	RETAINER: { solid: '#6d28d9', soft: 'rgba(139, 92, 246, 0.12)' },
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
	background: ${({ $status }) => {
		if ($status === 'active') return 'rgba(21, 128, 61, 0.14)'
		if ($status === 'planned') return 'rgba(3, 105, 161, 0.14)'
		if ($status === 'paused') return 'rgba(245, 158, 11, 0.16)'
		if ($status === 'completed') return 'rgba(139, 92, 246, 0.14)'
		return 'rgba(100, 116, 139, 0.14)'
	}};
	color: ${({ $status }) => {
		if ($status === 'active') return '#15803d'
		if ($status === 'planned') return '#0369a1'
		if ($status === 'paused') return '#a26608'
		if ($status === 'completed') return '#6d28d9'
		return '#475569'
	}};
`
