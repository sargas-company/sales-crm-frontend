import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	PersonSearchOutlined,
	AddRounded,
	FilterListOutlined,
	SearchOutlined,
	ClearRounded,
} from '@mui/icons-material'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../analytics/filters/filters.styled'
import {
	BottomSlot,
	ClearBtn as FreshClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
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
import LeadDeleteModal from '../../../components/leads/list/LeadDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type {
	ApiLeadStatus,
	ApiLeadTemperature,
	LeadItem,
	LeadSortBy,
} from '../../../store/leads/types/definition'
import { useGetLeadListQuery } from '../../../store/leads/leadsApi'
import { formatDate } from '../../../utils/format'
import {
	countryToFlag,
	formatPhoneDisplay,
	phoneCountryIso,
} from '../../../utils/phone'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const leadName = (l: LeadItem) => {
	const p = [l.firstName, l.lastName].filter(Boolean).join(' ').trim()
	return p || l.companyName || '—'
}

const prettyStatus = (s: string) => s.replace(/_/g, ' ')

type LeadPreset = 'all' | 'active' | 'hot' | 'won' | 'lost'

const presetToStatus: Record<LeadPreset, ApiLeadStatus[] | undefined> = {
	all: undefined,
	active: ['NEW', 'CONTACTED', 'IN_CONVERSATION', 'ON_HOLD'],
	hot: undefined, // hot filters on temperature, not status
	won: ['WON'],
	lost: ['LOST'],
}
const presetToTemperature: Record<
	LeadPreset,
	ApiLeadTemperature[] | undefined
> = {
	all: undefined,
	active: undefined,
	hot: ['HOT'],
	won: undefined,
	lost: undefined,
}
const presetLabel: Record<LeadPreset, string> = {
	all: 'All',
	active: 'Active',
	hot: 'Hot',
	won: 'Won',
	lost: 'Lost',
}

const LeadList = () => {
	const navigate = useNavigate()
	const [sp, setSp] = useSearchParams()
	const [searchInput, setSearchInput] = useState(sp.get('q') ?? '')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const sortByParam = sp.get('sortBy') as LeadSortBy | null
	const sortDirParam = sp.get('sortDir') as 'asc' | 'desc' | null
	const [sort, setSort] = useState<SortState | null>(
		sortByParam && sortDirParam
			? { key: sortByParam, direction: sortDirParam }
			: null,
	)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const preset = (sp.get('preset') ?? 'all') as LeadPreset
	const sourceParam = sp.get('source') ?? ''
	const fromParam = sp.get('from') ?? ''
	const toParam = sp.get('to') ?? ''
	const statusParam = (sp.get('status') ?? '') as ApiLeadStatus | ''
	const temperatureParam = (sp.get('temperature') ?? '') as
		| ApiLeadTemperature
		| ''

	// Explicit status/temperature filters OVERRIDE the preset so the
	// user can refine within a preset (e.g. preset=Active + status=
	// CONTACTED narrows to one status only; otherwise the preset
	// contributes its own list).
	const statusList: ApiLeadStatus[] | undefined = statusParam
		? [statusParam]
		: presetToStatus[preset]
	const temperatureList: ApiLeadTemperature[] | undefined = temperatureParam
		? [temperatureParam]
		: presetToTemperature[preset]

	// Sync search + sort to URL for shareable list state.
	useEffect(() => {
		const next = new URLSearchParams(sp)
		if (search) next.set('q', search)
		else next.delete('q')
		if (sort?.key) {
			next.set('sortBy', sort.key)
			next.set('sortDir', sort.direction)
		} else {
			next.delete('sortBy')
			next.delete('sortDir')
		}
		setSp(next, { replace: true })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, sort])

	const setPreset = (p: LeadPreset) => {
		const next = new URLSearchParams(sp)
		if (p === 'all') next.delete('preset')
		else next.set('preset', p)
		setSp(next, { replace: true })
	}
	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(sp)
		if (value) next.set(key, value)
		else next.delete(key)
		setSp(next, { replace: true })
	}
	const clearFilters = () => {
		setSearchInput('')
		setSort(null)
		setSp(new URLSearchParams(), { replace: true })
	}

	const activeFilterCount =
		(search ? 1 : 0) +
		(preset !== 'all' ? 1 : 0) +
		(statusParam ? 1 : 0) +
		(temperatureParam ? 1 : 0) +
		(sourceParam ? 1 : 0) +
		(fromParam ? 1 : 0) +
		(toParam ? 1 : 0)

	// Tape indicator — same pattern as Audit Log + Clients list.
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
	}, [preset])

	const { data, isLoading, isError, refetch } = useGetLeadListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: statusList,
		temperature: temperatureList,
		source: sourceParam || undefined,
		createdFrom: fromParam || undefined,
		createdTo: toParam || undefined,
		sortBy: (sort?.key as LeadSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [
		search,
		preset,
		sourceParam,
		fromParam,
		toParam,
		statusParam,
		temperatureParam,
	])

	const columns: DataTableColumn<LeadItem>[] = [
		{
			key: 'number',
			label: '#',
			minWidth: 70,
			sortable: true,
			sortValue: (l) => l.number,
			render: (l) => <Num>#{l.number}</Num>,
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'name',
			label: 'Lead',
			minWidth: 260,
			sortable: true,
			sortValue: (l) => leadName(l),
			render: (l) => (
				<LeadCell>
					<Avatar>{leadName(l).slice(0, 2).toUpperCase()}</Avatar>
					<div>
						<LeadName>{leadName(l)}</LeadName>
						{l.companyName && <LeadMeta>{l.companyName}</LeadMeta>}
					</div>
				</LeadCell>
			),
			skeleton: () => (
				<LeadCell>
					<TableSkeleton $w='36px' $h='36px' style={{ borderRadius: 10, flexShrink: 0 }} />
					<TableSkeleton $w='140px' $h='14px' />
				</LeadCell>
			),
		},
		{
			key: 'email',
			label: 'Email',
			minWidth: 180,
			sortable: true,
			sortValue: (l) => l.email ?? '',
			render: (l) =>
				l.email ? (
					<ContactLink
						href={`mailto:${l.email}`}
						onClick={(e) => e.stopPropagation()}
						title={l.email}
					>
						{l.email}
					</ContactLink>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'phone',
			label: 'Phone',
			minWidth: 180,
			sortable: true,
			sortValue: (l) => l.phone ?? '',
			render: (l) => {
				if (!l.phone) return <Muted>—</Muted>
				const iso = phoneCountryIso(l.phone)
				const flag = countryToFlag(iso)
				return (
					<PhoneCell>
						{flag && (
							<CountryFlag title={iso ?? undefined}>{flag}</CountryFlag>
						)}
						<ContactLink
							href={`tel:${l.phone}`}
							onClick={(e) => e.stopPropagation()}
							title={l.phone}
						>
							{formatPhoneDisplay(l.phone)}
						</ContactLink>
					</PhoneCell>
				)
			},
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'clientType',
			label: 'Client type',
			minWidth: 120,
			sortable: true,
			sortValue: (l) => l.clientType ?? '',
			render: (l) => <Muted>{l.clientType ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 160,
			sortable: true,
			sortValue: (l) => l.status,
			render: (l) => <StatusPill $status={l.status}>{prettyStatus(l.status)}</StatusPill>,
			skeleton: () => <TableSkeleton $w='100px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'temperature',
			label: 'Temp',
			minWidth: 90,
			sortable: true,
			sortValue: (l) => l.temperature ?? '',
			render: (l) =>
				l.temperature ? (
					<TempBadge $t={l.temperature}>{l.temperature}</TempBadge>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='60px' $h='18px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'source',
			label: 'Source',
			minWidth: 110,
			sortable: false,
			render: (l) => l.source ?? <Muted>—</Muted>,
			skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
		},
		{
			key: 'rate',
			label: 'Rate',
			minWidth: 100,
			sortable: true,
			sortValue: (l) => l.rate,
			render: (l) => <Num>{l.rate != null ? `$${l.rate}/hr` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='50px' $h='13px' />,
		},
		{
			key: 'location',
			label: 'Location',
			minWidth: 140,
			sortable: true,
			sortValue: (l) => l.location ?? '',
			render: (l) => <Muted>{l.location ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'replied',
			label: 'Replied',
			minWidth: 140,
			sortable: true,
			sortValue: (l) => new Date(l.repliedAt),
			render: (l) => <Muted>{formatDate(l.repliedAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (l) => new Date(l.createdAt),
			render: (l) => <Muted>{formatDate(l.createdAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (l) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/leads/preview/${l.id}`)}
						aria-label='View lead'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='leads:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/leads/edit/${l.id}`)}
							aria-label='Edit lead'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='leads:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: l.id, title: leadName(l) })}
							aria-label='Delete lead'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Pipeline' }, { label: 'Leads', current: true }]}
				icon={<PersonSearchOutlined />}
				title='Leads'
				subtitle='Conversations with prospects — pipeline stages and outreach state.'
				action={
					<PermissionGate permission='leads:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/leads/add/')}>
							<AddRounded />
							New lead
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Leads filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Preset</span>
								<span className='bot'>{presetLabel[preset]}</span>
							</div>
						</div>

						<TapePills ref={pillsRef} role='tablist' aria-label='Lead preset'>
							<TapeIndicator
								style={{
									transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
									width: `${ind.width}px`,
									opacity: ind.opacity,
								}}
							/>
							{(Object.keys(presetToStatus) as LeadPreset[]).map((p) => (
								<TapePill
									key={p}
									type='button'
									role='tab'
									data-active={preset === p || undefined}
									aria-selected={preset === p}
									$active={preset === p}
									onClick={() => setPreset(p)}
								>
									{presetLabel[p]}
								</TapePill>
							))}
						</TapePills>

						<SearchPill>
							<SearchOutlined className='ico' />
							<input
								type='text'
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder='Search by name, company, email or phone'
								aria-label='Search leads'
							/>
						</SearchPill>

						<RowBreak />

						<BottomSlot>
							<InlineField>
								<span className='l'>Status</span>
								<InlineSelect
									value={statusParam}
									onChange={(e) => updateParam('status', e.target.value)}
								>
									<option value=''>Any</option>
									<option value='NEW'>New</option>
									<option value='CONTACTED'>Contacted</option>
									<option value='IN_CONVERSATION'>In Conversation</option>
									<option value='ON_HOLD'>On Hold</option>
									<option value='WON'>Won</option>
									<option value='LOST'>Lost</option>
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Temperature</span>
								<InlineSelect
									value={temperatureParam}
									onChange={(e) => updateParam('temperature', e.target.value)}
								>
									<option value=''>Any</option>
									<option value='COLD'>Cold</option>
									<option value='WARM'>Warm</option>
									<option value='HOT'>Hot</option>
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Source</span>
								<InlineSelect
									as='input'
									type='text'
									value={sourceParam}
									placeholder='Any'
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateParam('source', e.target.value)
									}
								/>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Created from</span>
								<InlineSelect
									as='input'
									type='date'
									value={fromParam}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateParam('from', e.target.value)
									}
								/>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Created to</span>
								<InlineSelect
									as='input'
									type='date'
									value={toParam}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateParam('to', e.target.value)
									}
								/>
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
					rowKey={(l) => l.id}
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
				<LeadDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</>
	)
}

export default LeadList

const LeadCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`

const Avatar = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${T.subtleBg};
	border: 1px solid ${T.border};
	color: ${T.textSecondary};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	flex-shrink: 0;
`

const LeadName = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const LeadMeta = styled.div`
	font-size: 12px;
	color: ${T.textSecondary};
`

/* Flag + formatted phone — mirrors the Client Request list cell so
   the two surfaces look identical. */
const PhoneCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
`

const CountryFlag = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 18px;
	line-height: 1;
	flex-shrink: 0;
`

const ContactLink = styled.a`
	display: inline-block;
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 13px;
	color: ${T.primary};
	text-decoration: none;
	transition: color 160ms ease, text-decoration-color 160ms ease;
	text-decoration: underline;
	text-decoration-color: transparent;
	&:hover {
		text-decoration-color: ${T.primary};
	}
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const Num = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

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
		$status === 'WON'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'ON_HOLD' || $status === 'LOST'
				? 'rgba(239, 68, 68, 0.12)'
				: $status === 'IN_CONVERSATION' || $status === 'CONTACTED'
					? 'rgba(245, 158, 11, 0.16)'
					: 'rgba(3, 105, 161, 0.12)'};
	color: ${({ $status }) =>
		$status === 'WON'
			? '#15803d'
			: $status === 'ON_HOLD' || $status === 'LOST'
				? '#b91c1c'
				: $status === 'IN_CONVERSATION' || $status === 'CONTACTED'
					? '#a26608'
					: T.primary};
`

const TempBadge = styled.span<{ $t: ApiLeadTemperature }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	background: ${({ $t }) =>
		$t === 'HOT'
			? 'rgba(239, 68, 68, 0.14)'
			: $t === 'WARM'
				? 'rgba(245, 158, 11, 0.16)'
				: 'rgba(59, 130, 246, 0.14)'};
	color: ${({ $t }) =>
		$t === 'HOT'
			? '#b91c1c'
			: $t === 'WARM'
				? '#a26608'
				: '#1e40af'};
`

