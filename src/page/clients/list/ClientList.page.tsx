import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
} from '@mui/icons-material'
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
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import {
	useDeleteClientMutation,
	useGetClientsQuery,
	type ApiClientStatus,
	type ClientItem,
	type ClientSortBy,
} from '../../../store/clients/clientsApi'
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
	const { showToast } = useToast()
	const [sp, setSp] = useSearchParams()

	const searchParam = sp.get('q') ?? ''
	const sourceParam = sp.get('source') ?? ''
	const sinceFromParam = sp.get('from') ?? ''
	const sinceToParam = sp.get('to') ?? ''
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
	}, [search, presetParam, sourceParam, sinceFromParam, sinceToParam])

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

	const { data, isLoading, isError, refetch } = useGetClientsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: presetToStatus[presetParam],
		source: sourceParam || undefined,
		clientSinceFrom: sinceFromParam || undefined,
		clientSinceTo: sinceToParam || undefined,
		sortBy: (sort?.key as ClientSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const [deleteClient] = useDeleteClientMutation()
	const [deleteTarget, setDeleteTarget] = useState<ClientItem | null>(null)
	const [deleting, setDeleting] = useState(false)

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
		(sourceParam ? 1 : 0) +
		(sinceFromParam ? 1 : 0) +
		(sinceToParam ? 1 : 0)

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
				key: 'email',
				label: 'Email',
				sortable: true,
				sortValue: (c) => c.email ?? '',
				render: (c) =>
					c.email ? (
						<a
							href={`mailto:${c.email}`}
							onClick={(e) => e.stopPropagation()}
						>
							{c.email}
						</a>
					) : (
						<Muted>—</Muted>
					),
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
							<a
								href={`tel:${c.phone}`}
								onClick={(e) => e.stopPropagation()}
							>
								{formatPhoneDisplay(c.phone)}
							</a>
						</PhoneCell>
					)
				},
				skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
			},
			{
				key: 'source',
				label: 'Source',
				sortable: false,
				render: (c) => c.source ?? <Muted>—</Muted>,
				skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
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
				key: 'clientSince',
				label: 'Client since',
				sortable: true,
				sortValue: (c) => c.clientSince ?? '',
				render: (c) =>
					c.clientSince ? (
						c.clientSince.slice(0, 10)
					) : (
						<Muted>—</Muted>
					),
				skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
			},
			{
				key: 'updatedAt',
				label: 'Updated',
				sortable: true,
				sortValue: (c) => c.updatedAt,
				render: (c) => c.updatedAt.slice(0, 10),
				skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
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

	const handleDelete = async () => {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			await deleteClient(deleteTarget.id).unwrap()
			showToast('Client deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		} finally {
			setDeleting(false)
		}
	}

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
							<span className='l'>Since from</span>
							<InlineSelect
								as='input'
								type='date'
								value={sinceFromParam}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateParam('from', e.target.value)
								}
							/>
						</InlineField>
					</BottomSlot>

					<BottomSlot>
						<InlineField>
							<span className='l'>Since to</span>
							<InlineSelect
								as='input'
								type='date'
								value={sinceToParam}
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
				<Backdrop onClick={() => setDeleteTarget(null)}>
					<Dialog onClick={(e) => e.stopPropagation()}>
						<h3>Delete «{nameOf(deleteTarget)}»?</h3>
						<p>
							The server will refuse if any Projects still reference this
							client.
						</p>
						<DialogActions>
							<ClearBtn onClick={() => setDeleteTarget(null)}>Cancel</ClearBtn>
							<DangerBtn disabled={deleting} onClick={handleDelete}>
								{deleting ? 'Deleting…' : 'Delete'}
							</DangerBtn>
						</DialogActions>
					</Dialog>
				</Backdrop>
			)}
		</ListPageShell>
	)
}

const Muted = styled.span`
	color: ${T.textSecondary};
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

const ClearBtn = styled.button`
	border: 1px solid rgba(15, 23, 42, 0.12);
	background: transparent;
	padding: 7px 12px;
	border-radius: 10px;
	font-size: 12px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	&:hover {
		background: rgba(15, 23, 42, 0.04);
	}
`
const DangerBtn = styled.button`
	border: 1px solid rgba(185, 28, 28, 0.3);
	color: #b91c1c;
	padding: 7px 14px;
	border-radius: 10px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	background: transparent;
	&:hover {
		background: rgba(185, 28, 28, 0.08);
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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
const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	display: grid;
	place-items: center;
	z-index: 50;
`
const Dialog = styled.div`
	background: #fff;
	border-radius: 16px;
	padding: 20px;
	min-width: 300px;
	max-width: 420px;
	h3 {
		margin: 0 0 8px;
		font-size: 16px;
	}
	p {
		margin: 0 0 16px;
		font-size: 13px;
		color: ${T.textSecondary};
	}
`
const DialogActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
`

export default ClientList
