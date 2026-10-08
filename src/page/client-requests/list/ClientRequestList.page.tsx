import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DeleteOutline, VisibilityOutlined, EditOutlined, MailOutline } from '@mui/icons-material'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { T } from '../../../components/sales-analytics/_shared/tokens'

/** 2-letter ISO country code → Unicode flag emoji (regional indicators). */
const countryToFlag = (code: string): string => {
	if (!code || code.length !== 2) return ''
	const base = 0x1f1e6 - 'A'.charCodeAt(0)
	const chars = code.toUpperCase().split('')
	if (chars.some((c) => c < 'A' || c > 'Z')) return ''
	return String.fromCodePoint(...chars.map((c) => base + c.charCodeAt(0)))
}

/** Try to format a phone to the standard international shape for the
 *  given ISO country code. Falls back to the raw string if parsing
 *  fails — never throws. */
const formatPhone = (raw: string, country?: string | null): string => {
	if (!raw) return ''
	try {
		const cc =
			country && country.length === 2 ? (country.toUpperCase() as CountryCode) : undefined
		const parsed = parsePhoneNumberFromString(raw, cc)
		if (parsed) return parsed.formatInternational()
	} catch {
		// ignore and fall back
	}
	return raw
}
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type {
	DataTableColumn,
	DataTableSelection,
	SortState,
} from '../../../components/_shared/DataTable'
import BulkActionBar from '../../../components/_shared/BulkActionBar'
import ClientRequestDeleteModal from '../../../components/client-requests/list/ClientRequestDeleteModal'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useToast } from '../../../context/toast/ToastContext'
import type {
	ClientRequestItem,
	ClientRequestSortBy,
} from '../../../store/clientRequests/types/definition'
import {
	useBulkDeleteClientRequestsMutation,
	useGetClientRequestListQuery,
} from '../../../store/clientRequests/clientRequestsApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const prettyStatus = (s: string) => s.replace(/_/g, ' ')

const ClientRequestList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)

	const { data, isLoading, isError, refetch } = useGetClientRequestListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as ClientRequestSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [bulkDeleteRequests, { isLoading: bulkDeleting }] =
		useBulkDeleteClientRequestsMutation()
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	// Drop stale ids on page refetch so the bulk batch always matches
	// what the user actually sees on the current page.
	useEffect(() => {
		if (selected.size === 0) return
		const live = new Set(items.map((r) => r.id))
		let changed = false
		const next = new Set<string>()
		for (const id of selected) {
			if (live.has(id)) next.add(id)
			else changed = true
		}
		if (changed) setSelected(next)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items])

	const selection = useMemo<DataTableSelection<ClientRequestItem>>(
		() => ({
			selected,
			onToggleRow: (id, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					if (next) n.add(id)
					else n.delete(id)
					return n
				}),
			onToggleAllOnPage: (rows, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					for (const r of rows) {
						if (next) n.add(r.id)
						else n.delete(r.id)
					}
					return n
				}),
			headerLabel: 'Select every request on this page',
			rowLabel: (r) => `Select client request from ${r.name}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDeleteRequests(ids).unwrap()
			showToast(
				`Deleted ${res.deleted} client request${res.deleted === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkOpen(false)
			refetch()
		} catch {
			showToast('Bulk delete failed', 'error')
		}
	}

	const columns: DataTableColumn<ClientRequestItem>[] = [
		{
			key: 'name',
			label: 'Contact',
			minWidth: 200,
			sortable: true,
			sortValue: (r) => r.name,
			render: (r) => <ContactName>{r.name || '—'}</ContactName>,
			skeleton: () => <TableSkeleton $w='150px' $h='14px' />,
		},
		{
			key: 'company',
			label: 'Company',
			minWidth: 180,
			sortable: true,
			sortValue: (r) => r.company ?? '',
			render: (r) => (r.company ? <Muted>{r.company}</Muted> : <Muted>—</Muted>),
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'email',
			label: 'Email',
			minWidth: 220,
			sortable: true,
			sortValue: (r) => r.email,
			render: (r) => <Muted>{r.email}</Muted>,
			skeleton: () => <TableSkeleton $w='180px' $h='13px' />,
		},
		{
			key: 'phone',
			label: 'Phone',
			minWidth: 180,
			sortable: true,
			sortValue: (r) => `${r.phoneCountry}${r.phone}`,
			render: (r) =>
				r.phone ? (
					<PhoneCell>
						{r.phoneCountry && (
							<CountryFlag title={r.phoneCountry.toUpperCase()}>
								{countryToFlag(r.phoneCountry)}
							</CountryFlag>
						)}
						<PhoneNumber>{formatPhone(r.phone, r.phoneCountry)}</PhoneNumber>
					</PhoneCell>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='130px' $h='13px' />,
		},
		{
			key: 'files',
			label: 'Files',
			minWidth: 90,
			sortable: true,
			sortValue: (r) => r.files.length,
			render: (r) => <Num>{r.files.length}</Num>,
			skeleton: () => <TableSkeleton $w='30px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 170,
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => <StatusPill $status={r.status}>{prettyStatus(r.status)}</StatusPill>,
			skeleton: () => <TableSkeleton $w='110px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <Muted>{formatDate(r.createdAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/client-requests/preview/${r.id}`)}
						aria-label='View request'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='client_requests:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/client-requests/edit/${r.id}`)}
							aria-label='Edit request'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='client_requests:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: r.id, title: r.name })}
							aria-label='Delete request'
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
				crumbs={[{ label: 'Pipeline' }, { label: 'Client requests', current: true }]}
				icon={<MailOutline />}
				title='Client requests'
				subtitle='Inbound requests from prospective clients — with attachments and service tags.'
				action={
					<PermissionGate permission='client_requests:delete'>
						<BulkActionBar
							count={selected.size}
							onClear={() => setSelected(new Set())}
							onConfirm={() => setBulkOpen(true)}
							isLoading={bulkDeleting}
						/>
					</PermissionGate>
				}
				searchPlaceholder='Search by contact name'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={items}
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
					selection={selection}
				/>
			</ListPageShell>

			{deleteTarget && (
				<ClientRequestDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}

			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} client request${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> client
							request{selected.size === 1 ? '' : 's'}. Any{' '}
							<strong>related Client Calls will also be deleted</strong> via
							cascade. This cannot be undone.
						</>
					}
					confirmLabel={`Delete ${selected.size}`}
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setBulkOpen(false)}
					onConfirm={handleBulkDelete}
					isLoading={bulkDeleting}
				/>
			)}
		</>
	)
}

export default ClientRequestList

const ContactName = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

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
	width: 20px;
	height: 20px;
	border-radius: 4px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 14px;
	line-height: 1;
	user-select: none;
	flex-shrink: 0;
`

const PhoneNumber = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: 0.2px;
	white-space: nowrap;
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
		$status === 'archived'
			? 'rgba(148, 163, 184, 0.18)'
			: $status === 'conversation_ongoing'
				? 'rgba(34, 197, 94, 0.14)'
				: 'rgba(3, 105, 161, 0.12)'};
	color: ${({ $status }) =>
		$status === 'archived'
			? '#475569'
			: $status === 'conversation_ongoing'
				? '#15803d'
				: T.primary};
`
