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
	LocationOnOutlined,
	MailOutline,
	PhoneDisabledOutlined,
	HelpOutline,
	ThermostatOutlined,
	CallSplitOutlined,
	LocationOffOutlined,
	BusinessOutlined,
} from '@mui/icons-material'
import { locationFlag } from '../../../utils/location'
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
import {
	useGetLeadListQuery,
	useGetLeadSourcesQuery,
} from '../../../store/leads/leadsApi'
import { formatDate } from '../../../utils/format'
import { formatDateTimeSec } from '../../../utils/formatDate'
import {
	countryToFlag,
	formatPhoneDisplay,
	phoneCountryIso,
} from '../../../utils/phone'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import CountryAutocomplete from '../../../components/_shared/CountryAutocomplete'

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
	const locationParam = sp.get('location') ?? ''
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
		(locationParam ? 1 : 0)

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

	const { data: leadSources } = useGetLeadSourcesQuery()
	const { data, isLoading, isError, refetch } = useGetLeadListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: statusList,
		temperature: temperatureList,
		source: sourceParam || undefined,
		location: locationParam || undefined,
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
		locationParam,
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
			// Shrinks to content; `white-space: nowrap` keeps the name
			// on a single line (no two-line wrap in a wide table).
			key: 'name',
			label: 'Name',
			sortable: true,
			sortValue: (l) => leadName(l),
			render: (l) => <NameCell>{leadName(l)}</NameCell>,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			// Mirror of the Clients list — separate Company column, empty
			// cells get the dashed-pill `no company` placeholder.
			// `white-space: nowrap` prevents two-line wrap in dense rows.
			key: 'companyName',
			label: 'Company',
			sortable: true,
			sortValue: (l) => l.companyName ?? '',
			render: (l) =>
				l.companyName ? (
					<CompanyCell>{l.companyName}</CompanyCell>
				) : (
					<EmptyBadge title='No company on file'>
						<BusinessOutlined />
						no company
					</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='14px' />,
		},
		{
			key: 'email',
			label: 'Email',
			minWidth: 180,
			sortable: true,
			sortValue: (l) => l.email ?? '',
			render: (l) =>
				l.email ? (
					<EmailText title={l.email}>{l.email}</EmailText>
				) : (
					<EmptyBadge title='No email on file'>
						<MailOutline />
						no email
					</EmptyBadge>
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
				if (!l.phone)
					return (
						<EmptyBadge title='No phone on file'>
							<PhoneDisabledOutlined />
							no phone
						</EmptyBadge>
					)
				const iso = phoneCountryIso(l.phone)
				const flag = countryToFlag(iso)
				return (
					<PhoneCell>
						{flag && (
							<CountryFlag title={iso ?? undefined}>{flag}</CountryFlag>
						)}
						<PhoneText title={l.phone}>
							{formatPhoneDisplay(l.phone)}
						</PhoneText>
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
			render: (l) =>
				l.clientType ? (
					<ClientTypePill $kind={l.clientType}>
						{l.clientType === 'company' ? 'Company' : 'Individual'}
					</ClientTypePill>
				) : (
					<EmptyBadge title='Client type not set'>
						<HelpOutline />
						no type
					</EmptyBadge>
				),
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
					<EmptyBadge title='Temperature not rated'>
						<ThermostatOutlined />
						no temp
					</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='60px' $h='18px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'source',
			label: 'Source',
			minWidth: 60,
			sortable: false,
			render: (l) =>
				l.source ? (
					<SourcePill>{l.source}</SourcePill>
				) : (
					<EmptyBadge title='Source not recorded'>
						<CallSplitOutlined />
						no source
					</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'location',
			label: 'Location',
			minWidth: 80,
			sortable: true,
			sortValue: (l) => l.location ?? '',
			render: (l) => {
				if (!l.location)
					return (
						<EmptyBadge title='No location on file'>
							<LocationOffOutlined />
							no location
						</EmptyBadge>
					)
				const flag = locationFlag(l.location)
				return (
					<LocationCell>
						<LocationIcon>
							{flag ? <span className='flag'>{flag}</span> : <LocationOnOutlined />}
						</LocationIcon>
						<span className='value'>{l.location}</span>
					</LocationCell>
				)
			},
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'updatedAt',
			label: 'Updated',
			minWidth: 170,
			sortable: true,
			sortValue: (l) => new Date(l.updatedAt),
			render: (l) => <DateTimeCell iso={l.updatedAt} />,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 170,
			sortable: true,
			sortValue: (l) => new Date(l.createdAt),
			render: (l) => <DateTimeCell iso={l.createdAt} />,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (l) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/leads/view/${l.id}`)}
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
									<option value='CLIENT'>Client</option>
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
									value={sourceParam}
									onChange={(e) => updateParam('source', e.target.value)}
								>
									<option value=''>Any</option>
									{(leadSources ?? []).map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Country</span>
								<CountryAutocomplete
									variant='paper'
									value={locationParam}
									onChange={(v) => updateParam('location', v)}
									placeholder='Any'
									ariaLabel='Filter by country'
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

const LeadCellCompact = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	width: fit-content;
`

const NameCell = styled.strong`
	display: inline-block;
	font-weight: 700;
	color: ${T.textStrong};
	white-space: nowrap;
`

const CompanyCell = styled.span`
	display: inline-block;
	color: ${T.textStrong};
	white-space: nowrap;
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

const PhoneText = styled.span`
	display: inline-block;
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const EmailText = styled.span`
	display: inline-block;
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${T.textStrong};
`

const FitCell = styled.span`
	display: inline-block;
	width: fit-content;
	white-space: nowrap;
	font-size: 13px;
	color: ${T.textStrong};
`

const SourcePill = styled.span`
	display: inline-flex;
	align-items: center;
	width: fit-content;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	white-space: nowrap;
	background: rgba(148, 163, 184, 0.18);
	color: #475569;
`

const ClientTypePill = styled.span<{ $kind: 'company' | 'individual' }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	background: ${(p) =>
		p.$kind === 'company'
			? 'rgba(99, 102, 241, 0.14)'
			: 'rgba(148, 163, 184, 0.18)'};
	color: ${(p) => (p.$kind === 'company' ? '#4338ca' : '#475569')};
`

const LocationCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	width: fit-content;
	font-size: 13px;
	color: ${T.textStrong};

	.value {
		white-space: nowrap;
	}
`

const LocationIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: rgba(15, 23, 42, 0.04);
	color: rgba(15, 23, 42, 0.55);
	flex-shrink: 0;

	svg {
		font-size: 16px;
	}
	.flag {
		font-size: 18px;
		line-height: 1;
		/* Reset color so emoji renders at its native, full-colour
		   palette — same look as the phone-cell flag badge. */
		color: initial;
	}
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

/* Date + time cell. The DATE pops (semi-bold, dark slate) and the
 * time trails it in a lighter weight / muted colour — scannable at a
 * glance without hiding the exact timestamp. Mirrors the Projects
 * list implementation. */
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


/* Dashed muted badge for empty cells — mirrors the Employees /
 * Projects / Clients pattern. Thematic icon + lowercase label per
 * cell type, same visual shape across all list pages. */
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
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
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

