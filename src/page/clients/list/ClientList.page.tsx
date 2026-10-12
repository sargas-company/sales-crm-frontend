import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	ContactsOutlined,
	AddRounded,
	FilterListOutlined,
	SearchOutlined,
	ClearRounded,
	LocationOnOutlined,
} from '@mui/icons-material'
import { locationFlag } from '../../../utils/location'
import CountryAutocomplete from '../../../components/_shared/CountryAutocomplete'
import { formatDate } from '../../../utils/format'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type {
	DataTableColumn,
	SortState,
} from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	useGetClientSourcesQuery,
	useGetClientsQuery,
	type ApiClientStatus,
	type ClientItem,
	type ClientSortBy,
} from '../../../store/clients/clientsApi'
import ClientDeleteModal from '../../../components/clients/list/ClientDeleteModal'
import {
	countryToFlag,
	formatPhoneDisplay,
	phoneCountryIso,
} from '../../../utils/phone'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
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

const PAGE_SIZE = 20

type Preset = 'all' | 'active' | 'on_hold' | 'former'

const presetToStatus: Record<Preset, ApiClientStatus | undefined> = {
	all: undefined,
	active: 'ACTIVE',
	on_hold: 'ON_HOLD',
	former: 'FORMER',
}

const presetLabel: Record<Preset, string> = {
	all: 'All',
	active: 'Active',
	on_hold: 'On hold',
	former: 'Former',
}

const nameOf = (c: ClientItem) =>
	[c.firstName, c.lastName].filter(Boolean).join(' ').trim() || '—'

const statusLabel: Record<ApiClientStatus, string> = {
	ACTIVE: 'Active',
	ON_HOLD: 'On hold',
	FORMER: 'Former',
}

const ClientList = () => {
	const navigate = useNavigate()
	const [sp, setSp] = useSearchParams()

	const searchParam = sp.get('q') ?? ''
	const sourceParam = sp.get('source') ?? ''
	const locationParam = sp.get('location') ?? ''
	const statusParam = (sp.get('status') ?? '') as ApiClientStatus | ''
	const presetParam = (sp.get('preset') ?? 'all') as Preset
	const sortByParam = sp.get('sortBy') as ClientSortBy | null
	const sortDirParam = sp.get('sortDir') as 'asc' | 'desc' | null

	const [searchInput, setSearchInput] = useState(searchParam)
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(
		sortByParam && sortDirParam
			? { key: sortByParam, direction: sortDirParam }
			: null,
	)

	useEffect(() => {
		setPage(1)
	}, [search, presetParam, statusParam, sourceParam, locationParam])

	// Keep URL params in sync for shareable list state.
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

	const { data: clientSources } = useGetClientSourcesQuery()
	const { data, isLoading, isError, refetch } = useGetClientsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		// Explicit status filter OVERRIDES the preset so the user can
		// refine within a preset (same contract as LeadList).
		status: (statusParam || presetToStatus[presetParam]) as ApiClientStatus | undefined,
		source: sourceParam || undefined,
		location: locationParam || undefined,
		sortBy: (sort?.key as ClientSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const [deleteTarget, setDeleteTarget] = useState<ClientItem | null>(null)

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	const setPreset = (p: Preset) => {
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
		const next = new URLSearchParams()
		setSearchInput('')
		setSort(null)
		setSp(next, { replace: true })
	}

	const activeFilterCount =
		(search ? 1 : 0) +
		(presetParam !== 'all' ? 1 : 0) +
		(statusParam ? 1 : 0) +
		(sourceParam ? 1 : 0) +
		(locationParam ? 1 : 0)

	// Tape indicator (ported from Audit Log): slide the paper strip
	// behind the active preset. Measured in a layout effect so the
	// first paint is correct.
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
	}, [presetParam])

	const columns: DataTableColumn<ClientItem>[] = useMemo(
		() => [
			{
				key: 'number',
				label: '#',
				minWidth: 70,
				sortable: true,
				sortValue: (c) => c.number,
				render: (c) => (
					<NumLink to={`/clients/${c.id}`}>#{c.number}</NumLink>
				),
				skeleton: () => <TableSkeleton $w='32px' $h='13px' />,
			},
			{
				key: 'firstName',
				label: 'Name',
				sortable: true,
				sortValue: (c) => nameOf(c),
				render: (c) => <strong>{nameOf(c)}</strong>,
				skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
			},
			{
				key: 'company',
				label: 'Company',
				sortable: true,
				sortValue: (c) => c.company ?? '',
				render: (c) =>
					c.company ? c.company : <Muted>—</Muted>,
				skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
			},
			{
				key: 'status',
				label: 'Status',
				sortable: true,
				sortValue: (c) => c.status,
				render: (c) => (
					<StatusPill $status={c.status}>{statusLabel[c.status]}</StatusPill>
				),
				skeleton: () => <TableSkeleton $w='70px' $h='18px' />,
			},
			{
				key: 'email',
				label: 'Email',
				sortable: true,
				sortValue: (c) => c.email ?? '',
				render: (c) =>
					c.email ? <EmailText title={c.email}>{c.email}</EmailText> : <Muted>—</Muted>,
				skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
			},
			{
				key: 'phone',
				label: 'Phone',
				sortable: true,
				sortValue: (c) => c.phone ?? '',
				render: (c) => {
					if (!c.phone) return <Muted>—</Muted>
					const iso = phoneCountryIso(c.phone)
					const flag = countryToFlag(iso)
					return (
						<PhoneCell>
							{flag && <Flag title={iso ?? undefined}>{flag}</Flag>}
							<PhoneText>{formatPhoneDisplay(c.phone)}</PhoneText>
						</PhoneCell>
					)
				},
				skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
			},
			{
				key: 'source',
				label: 'Source',
				sortable: false,
				render: (c) =>
					c.source ? <SourcePill>{c.source}</SourcePill> : <Muted>—</Muted>,
				skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
			},
			{
				key: 'location',
				label: 'Location',
				sortable: false,
				render: (c) => {
					if (!c.location) return <Muted>—</Muted>
					const flag = locationFlag(c.location)
					return (
						<LocationCell>
							<LocationIcon>
								{flag ? (
									<span className='flag'>{flag}</span>
								) : (
									<LocationOnOutlined />
								)}
							</LocationIcon>
							<span>{c.location}</span>
						</LocationCell>
					)
				},
				skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
			},
			{
				key: 'updatedAt',
				label: 'Updated',
				minWidth: 140,
				sortable: true,
				sortValue: (c) => new Date(c.updatedAt),
				render: (c) => <Muted>{formatDate(c.updatedAt, 'short')}</Muted>,
				skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
			},
			{
				key: 'createdAt',
				label: 'Created',
				minWidth: 140,
				sortable: true,
				sortValue: (c) => new Date(c.createdAt),
				render: (c) => <Muted>{formatDate(c.createdAt, 'short')}</Muted>,
				skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
			},
			{
				key: 'actions',
				label: '',
				align: 'right',
				render: (c) => (
					<Actions>
						<IconAction
							onClick={(e) => {
								e.stopPropagation()
								navigate(`/clients/${c.id}`)
							}}
							title='View'
						>
							<VisibilityOutlined fontSize='small' />
						</IconAction>
						<PermissionGate permission='clients:update'>
							<IconAction
								onClick={(e) => {
									e.stopPropagation()
									navigate(`/clients/edit/${c.id}`)
								}}
								title='Edit'
							>
								<EditOutlined fontSize='small' />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='clients:delete'>
							<IconAction
								$danger
								onClick={(e) => {
									e.stopPropagation()
									setDeleteTarget(c)
								}}
								title='Delete'
							>
								<DeleteOutline fontSize='small' />
							</IconAction>
						</PermissionGate>
					</Actions>
				),
			},
		],
		[navigate],
	)

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Dashboard', href: '/' },
				{ label: 'Leads' },
				{ label: 'Clients', current: true },
			]}
			icon={<ContactsOutlined />}
			title='Clients'
			subtitle='CRM Clients — independent of Counterparty and of Lead.'
			action={
				<PermissionGate permission='clients:create'>
					<PrimarySolidButton onClick={() => navigate('/clients/add/')}>
						<AddRounded fontSize='small' />
						New client
					</PrimarySolidButton>
				</PermissionGate>
			}
			filters={
				<FreshFiltersWrap role='region' aria-label='Clients filters'>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<FilterListOutlined />
						</span>
						<div className='lead-text'>
							<span className='top'>Preset</span>
							<span className='bot'>{presetLabel[presetParam]}</span>
						</div>
					</div>

					<TapePills ref={pillsRef} role='tablist' aria-label='Client preset'>
						<TapeIndicator
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
								opacity: ind.opacity,
							}}
						/>
						{(Object.keys(presetToStatus) as Preset[]).map((p) => (
							<TapePill
								key={p}
								type='button'
								role='tab'
								data-active={presetParam === p || undefined}
								aria-selected={presetParam === p}
								$active={presetParam === p}
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
							aria-label='Search clients'
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
								<option value='ACTIVE'>Active</option>
								<option value='ON_HOLD'>On hold</option>
								<option value='FORMER'>Former</option>
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
								{(clientSources ?? []).map((s) => (
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
			{isError ? (
				<ErrorBox>
					Could not load clients. {' '}
					<ErrorRetry onClick={() => refetch()}>Retry</ErrorRetry>
				</ErrorBox>
			) : (
				<AdaptiveTable>
					<DataTable<ClientItem>
						columns={columns}
						rows={items}
						rowKey={(r) => r.id}
						isLoading={isLoading}
						searchActive={!!search}
						emptyTitle='No clients yet.'
						emptyTitleSearch='No clients match the current filter.'
						sort={sort}
						onSortChange={handleSortChange}
						pagination={{
							page,
							pageSize: PAGE_SIZE,
							total,
							onPageChange: setPage,
						}}
					/>
				</AdaptiveTable>
			)}

			{deleteTarget && (
				<ClientDeleteModal
					id={deleteTarget.id}
					title={nameOf(deleteTarget)}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</ListPageShell>
	)
}

const Muted = styled.span`
	color: ${T.textSecondary};
`
const NumLink = styled(Link)`
	font-variant-numeric: tabular-nums;
	font-weight: 600;
	color: ${T.textStrong};
	text-decoration: none;
	&:hover {
		text-decoration: underline;
	}
`
const PhoneText = styled.span`
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`
const EmailText = styled.span`
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
const LocationCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${T.textStrong};
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
		color: initial;
	}
`
const PhoneCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`
const Flag = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 18px;
	line-height: 1;
`
const StatusPill = styled.span<{ $status: ApiClientStatus }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	background: ${({ $status }) =>
		$status === 'ACTIVE'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'FORMER'
				? 'rgba(100, 116, 139, 0.16)'
				: 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $status }) =>
		$status === 'ACTIVE'
			? '#15803d'
			: $status === 'FORMER'
				? '#334155'
				: '#a26608'};
`
/* Local override for the shared DataTable:
 *   • Hide the invisible `.col-spacer` column that would normally
 *     eat all free width and compress every data column to its
 *     minimum.
 *   • `table-layout: auto` + `width: auto` on the table itself so
 *     each column grows to fit its content instead of sharing a
 *     100% canvas evenly.
 *   • Single-line `nowrap` + tighter padding on data cells so long
 *     emails / phones / company names dictate the column width.
 *   • The outer wrapper gets `overflow-x: auto` so narrow screens
 *     scroll horizontally instead of wrapping.
 */
const AdaptiveTable = styled.div`
	overflow-x: auto;

	table {
		width: auto;
		min-width: 100%;
		table-layout: auto;
	}

	th.col-spacer,
	td.col-spacer {
		display: none;
	}

	thead th {
		padding: 15px 18px;
		white-space: nowrap;
	}

	tbody td {
		padding: 14px 18px;
		white-space: nowrap;
		vertical-align: middle;
	}

	tbody td a {
		white-space: nowrap;
	}
`

const ErrorBox = styled.div`
	padding: 24px;
	border-radius: 12px;
	border: 1px dashed rgba(185, 28, 28, 0.3);
	background: rgba(185, 28, 28, 0.04);
	color: #b91c1c;
	font-size: 13px;
`
const ErrorRetry = styled.button`
	appearance: none;
	background: transparent;
	border: 0;
	color: #b91c1c;
	cursor: pointer;
	text-decoration: underline;
	font-weight: 600;
`
export default ClientList
