import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	VideocamOutlined,
	AddRounded,
	NorthEastRounded,
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
	DataTableSelection,
	SortState,
} from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import BulkActionBar from '../../../components/_shared/BulkActionBar'
import ClientCallDeleteModal from '../../../components/client-call/list/ProposalDeleteModal'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useToast } from '../../../context/toast/ToastContext'
import type {
	ClientCallItem,
	ClientCallSortBy,
} from '../../../store/clientCalls/types/definition'
import {
	useBulkDeleteClientCallsMutation,
	useGetClientCallListQuery,
} from '../../../store/clientCalls/clientCallsApi'
import { formatDate } from '../../../utils/format'
import { getTimezoneLabel } from '../../../utils/timezones'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const clientName = (c: ClientCallItem): string => {
	if (c.lead) {
		const n = [c.lead.firstName, c.lead.lastName].filter(Boolean).join(' ').trim()
		return n || c.lead.companyName || 'Lead'
	}
	if (c.crmClient) {
		const n = [c.crmClient.firstName, c.crmClient.lastName]
			.filter(Boolean)
			.join(' ')
			.trim()
		return n || c.crmClient.company || 'Client'
	}
	if (c.clientRequest) return c.clientRequest.name || c.clientRequest.company || 'Request'
	return '—'
}

// Owner column model: name/company + typed badge (Lead | Client |
// legacy Website Request) + target route for the carded link. The
// third variant is only shown for historical rows and never links
// to a request-owner form because new calls can no longer be
// created against a request.
type OwnerKind = 'lead' | 'client' | 'request' | 'unknown'
const ownerInfo = (
	c: ClientCallItem,
): { name: string; kind: OwnerKind; href: string | null } => {
	if (c.clientType === 'lead' && c.lead) {
		const n = [c.lead.firstName, c.lead.lastName].filter(Boolean).join(' ').trim()
		return {
			name: n || c.lead.companyName || 'Lead',
			kind: 'lead',
			href: c.leadId ? `/leads/view/${c.leadId}` : null,
		}
	}
	if (c.clientType === 'client' && c.crmClient) {
		const n = [c.crmClient.firstName, c.crmClient.lastName]
			.filter(Boolean)
			.join(' ')
			.trim()
		return {
			name: n || c.crmClient.company || 'Client',
			kind: 'client',
			href: c.crmClientId ? `/clients/${c.crmClientId}` : null,
		}
	}
	if (c.clientType === 'client_request' && c.clientRequest) {
		return {
			name: c.clientRequest.name || c.clientRequest.company || 'Request',
			kind: 'request',
			href: c.clientRequestId
				? `/client-requests/preview/${c.clientRequestId}`
				: null,
		}
	}
	return { name: '—', kind: 'unknown', href: null }
}

const ClientCallList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)

	const { data, isLoading, isError, refetch } = useGetClientCallListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as ClientCallSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [bulkDeleteCalls, { isLoading: bulkDeleting }] =
		useBulkDeleteClientCallsMutation()
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	useEffect(() => {
		if (selected.size === 0) return
		const live = new Set(items.map((c) => c.id))
		let changed = false
		const next = new Set<string>()
		for (const id of selected) {
			if (live.has(id)) next.add(id)
			else changed = true
		}
		if (changed) setSelected(next)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items])

	const selection = useMemo<DataTableSelection<ClientCallItem>>(
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
			headerLabel: 'Select every call on this page',
			rowLabel: (c) => `Select call ${clientName(c)}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDeleteCalls(ids).unwrap()
			showToast(
				`Deleted ${res.deleted} call${res.deleted === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkOpen(false)
			refetch()
		} catch {
			showToast('Bulk delete failed', 'error')
		}
	}

	const columns: DataTableColumn<ClientCallItem>[] = [
		{
			key: 'callTitle',
			label: 'Title',
			minWidth: 240,
			sortable: false,
			render: (c) => (
				<CallCell>
					<CallTitle>{c.callTitle}</CallTitle>
				</CallCell>
			),
			skeleton: () => <TableSkeleton $w='220px' $h='14px' />,
		},
		{
			key: 'contact',
			label: 'Contact',
			minWidth: 180,
			sortable: false,
			render: (c) => {
				const o = ownerInfo(c)
				return o.href ? (
					<OwnerLink to={o.href}>
						<span>{o.name}</span>
						<NorthEastRounded sx={{ fontSize: 14 }} />
					</OwnerLink>
				) : (
					<OwnerName>{o.name}</OwnerName>
				)
			},
			skeleton: () => <TableSkeleton $w='160px' $h='14px' />,
		},
		{
			key: 'contactType',
			label: 'Type',
			minWidth: 130,
			sortable: true,
			sortValue: (c) => ownerInfo(c).kind,
			render: (c) => {
				const o = ownerInfo(c)
				const badgeLabel =
					o.kind === 'lead'
						? 'Lead'
						: o.kind === 'client'
							? 'Client'
							: o.kind === 'request'
								? 'Website Request'
								: '—'
				return <OwnerBadge $kind={o.kind}>{badgeLabel}</OwnerBadge>
			},
			skeleton: () => (
				<TableSkeleton $w='70px' $h='18px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'scheduled',
			label: 'Scheduled',
			minWidth: 170,
			sortable: true,
			sortValue: (c) => new Date(c.scheduledAt),
			// Date on top, exact HH:mm underneath — same timeline the
			// `Timezone` column labels. `scheduledAt` is a UTC ISO
			// stored string; `clientDateTime` is the backend-formatted
			// value in the call's own timezone when available, so we
			// prefer it for the clock line.
			render: (c) => {
				const timeIso = c.clientDateTime || c.scheduledAt
				const date = new Date(timeIso)
				const time = Number.isNaN(date.getTime())
					? ''
					: date.toLocaleTimeString(undefined, {
							hour: '2-digit',
							minute: '2-digit',
							hour12: false,
						})
				return (
					<TwoLineCell>
						<span>{formatDate(c.scheduledAt, 'short')}</span>
						{time && <TwoLineSub>{time}</TwoLineSub>}
					</TwoLineCell>
				)
			},
			skeleton: () => <TableSkeleton $w='120px' $h='28px' />,
		},
		{
			key: 'duration',
			label: 'Duration',
			minWidth: 100,
			sortable: true,
			sortValue: (c) => c.duration,
			render: (c) => <Num>{c.duration} min</Num>,
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'timezone',
			label: 'Timezone',
			minWidth: 150,
			sortable: true,
			sortValue: (c) => c.clientTimezone,
			// Short code on top (PST / EDT / GMT+2), full IANA/raw
			// value underneath for operators who need to disambiguate.
			render: (c) => {
				const short = getTimezoneLabel(c.clientTimezone)
				const sameAsStored = short === c.clientTimezone
				return (
					<TwoLineCell>
						<TzCode>{short}</TzCode>
						{!sameAsStored && <TwoLineSub>{c.clientTimezone}</TwoLineSub>}
					</TwoLineCell>
				)
			},
			skeleton: () => <TableSkeleton $w='90px' $h='28px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 130,
			sortable: true,
			sortValue: (c) => c.status,
			render: (c) => <StatusPill $status={c.status}>{c.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (c) => new Date(c.createdAt),
			render: (c) => <Muted>{formatDate(c.createdAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (c) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/client-calls/preview/${c.id}`)}
						aria-label='View call'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='client_calls:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/client-calls/edit/${c.id}`)}
							aria-label='Edit call'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='client_calls:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: c.id, title: c.callTitle })}
							aria-label='Delete call'
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
				crumbs={[{ label: 'Pipeline' }, { label: 'Calls', current: true }]}
				icon={<VideocamOutlined />}
				title='Calls'
				subtitle='Scheduled meetings and past conversations with leads and clients.'
				action={
					<HeaderActions>
						<PermissionGate permission='client_calls:delete'>
							<BulkSlot>
								<BulkActionBar
									count={selected.size}
									onClear={() => setSelected(new Set())}
									onConfirm={() => setBulkOpen(true)}
									isLoading={bulkDeleting}
								/>
							</BulkSlot>
						</PermissionGate>
						<PermissionGate permission='client_calls:create'>
							<PrimarySolidButton type='button' onClick={() => navigate('/client-calls/add/')}>
								<AddRounded />
								New call
							</PrimarySolidButton>
						</PermissionGate>
					</HeaderActions>
				}
				searchPlaceholder='Search by title'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={items}
					rowKey={(c) => c.id}
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
				<ClientCallDeleteModal
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
					title={`Delete ${selected.size} client call${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> client
							call{selected.size === 1 ? '' : 's'}. This cannot be undone.
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

export default ClientCallList

const HeaderActions = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

/* Bulk bar lives OUTSIDE the normal flex row so the "New call"
 * button never shifts when the bar mounts / unmounts. Anchored to
 * the left-outer edge of the HeaderActions container. */
const BulkSlot = styled.div`
	position: absolute;
	top: 50%;
	right: calc(100% + 10px);
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
`

const CallCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const CallTitle = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const CallMeta = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`

const OwnerName = styled.span`
	font-size: 14px;
	color: ${T.textStrong};
	line-height: 1.3;
`

/* Two-line cell for Scheduled + Timezone columns: a strong primary
   line (date / tz short-code) with a quiet secondary caption below
   (exact HH:mm / full IANA string). */
const TwoLineCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	line-height: 1.25;
	font-size: 13px;
	color: ${T.textStrong};
`
const TwoLineSub = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textMuted};
`
const TzCode = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.4px;
	color: ${T.textStrong};
`

const OwnerLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: transparent;
	color: ${T.primary};
	font-size: 12.5px;
	font-weight: 600;
	padding: 6px 0;
	text-decoration: none;
	white-space: nowrap;
	width: fit-content;

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover svg {
		transform: translate(2px, -2px);
	}
`

const OwnerBadge = styled.span<{ $kind: 'lead' | 'client' | 'request' | 'unknown' }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	background: ${(p) =>
		p.$kind === 'lead'
			? 'rgba(3, 105, 161, 0.12)'
			: p.$kind === 'client'
				? 'rgba(34, 197, 94, 0.14)'
				: p.$kind === 'request'
					? 'rgba(245, 158, 11, 0.14)'
					: 'rgba(100, 116, 139, 0.14)'};
	color: ${(p) =>
		p.$kind === 'lead'
			? T.primary
			: p.$kind === 'client'
				? '#15803d'
				: p.$kind === 'request'
					? '#a26608'
					: '#475569'};
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
	background: ${({ $status }) =>
		$status === 'completed'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'cancelled'
				? 'rgba(239, 68, 68, 0.12)'
				: 'rgba(3, 105, 161, 0.12)'};
	color: ${({ $status }) =>
		$status === 'completed' ? '#15803d' : $status === 'cancelled' ? '#b91c1c' : T.primary};
`
