import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	VideocamOutlined,
	AddRounded,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn } from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import ClientCallDeleteModal from '../../../components/client-call/list/ProposalDeleteModal'
import type { ClientCallItem } from '../../../store/clientCalls/types/definition'
import { useGetClientCallListQuery } from '../../../store/clientCalls/clientCallsApi'
import { formatDate } from '../../../utils/format'

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
	if (c.clientRequest) return c.clientRequest.name || c.clientRequest.company || 'Request'
	return '—'
}

const ClientCallList = () => {
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetClientCallListQuery({
		page,
		limit: PAGE_SIZE,
	})
	const items = data?.data ?? []
	const total = data?.total ?? 0

	const filtered = search
		? items.filter((c) => {
				const q = search.toLowerCase()
				return c.callTitle.toLowerCase().includes(q) || clientName(c).toLowerCase().includes(q)
			})
		: items

	const columns: DataTableColumn<ClientCallItem>[] = [
		{
			key: 'callTitle',
			label: 'Call',
			minWidth: 300,
			sortable: true,
			sortValue: (c) => c.callTitle,
			render: (c) => (
				<CallCell>
					<CallTitle>{c.callTitle}</CallTitle>
					<CallMeta>
						{c.clientType === 'lead' ? 'Lead' : 'Client request'} · {clientName(c)}
					</CallMeta>
				</CallCell>
			),
			skeleton: () => (
				<>
					<TableSkeleton $w='220px' $h='14px' />
					<TableSkeleton $w='150px' $h='11px' style={{ marginTop: 6 }} />
				</>
			),
		},
		{
			key: 'scheduled',
			label: 'Scheduled',
			minWidth: 170,
			sortable: true,
			sortValue: (c) => new Date(c.scheduledAt),
			render: (c) => <Muted>{formatDate(c.scheduledAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
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
			minWidth: 140,
			sortable: true,
			sortValue: (c) => c.clientTimezone,
			render: (c) => <Muted>{c.clientTimezone}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
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
			key: 'createdBy',
			label: 'Created by',
			minWidth: 160,
			sortable: true,
			sortValue: (c) => `${c.createdBy.firstName} ${c.createdBy.lastName}`,
			render: (c) => (
				<Muted>
					{c.createdBy.firstName} {c.createdBy.lastName}
				</Muted>
			),
			skeleton: () => <TableSkeleton $w='110px' $h='13px' />,
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
					<IconAction
						type='button'
						onClick={() => navigate(`/client-calls/edit/${c.id}`)}
						aria-label='Edit call'
					>
						<EditOutlined />
					</IconAction>
					<IconAction
						type='button'
						$danger
						onClick={() => setDeleteTarget({ id: c.id, title: c.callTitle })}
						aria-label='Delete call'
					>
						<DeleteOutline />
					</IconAction>
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Pipeline' }, { label: 'Client calls', current: true }]}
				icon={<VideocamOutlined />}
				title='Client calls'
				subtitle='Scheduled meetings and past conversations with leads and clients.'
				action={
					<PrimarySolidButton type='button' onClick={() => navigate('/client-calls/add/')}>
						<AddRounded />
						New call
					</PrimarySolidButton>
				}
				searchPlaceholder='Search by title or client'
				search={search}
				onSearchChange={(v) => {
					setSearch(v)
					setPage(1)
				}}
			>
				<DataTable
					columns={columns}
					rows={filtered}
					rowKey={(c) => c.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
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
		</>
	)
}

export default ClientCallList

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
