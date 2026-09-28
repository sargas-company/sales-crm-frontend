import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DeleteOutline, VisibilityOutlined, EditOutlined, MailOutline } from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import ClientRequestDeleteModal from '../../../components/client-requests/list/ClientRequestDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type {
	ClientRequestItem,
	ClientRequestSortBy,
} from '../../../store/clientRequests/types/definition'
import { useGetClientRequestListQuery } from '../../../store/clientRequests/clientRequestsApi'
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
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetClientRequestListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as ClientRequestSortBy | undefined) ?? undefined,
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
	}, [search])

	const columns: DataTableColumn<ClientRequestItem>[] = [
		{
			key: 'name',
			label: 'Contact',
			minWidth: 240,
			sortable: true,
			sortValue: (r) => r.name,
			render: (r) => (
				<ContactCell>
					<ContactName>{r.name}</ContactName>
					<ContactMeta>{r.company}</ContactMeta>
				</ContactCell>
			),
			skeleton: () => (
				<>
					<TableSkeleton $w='150px' $h='14px' />
					<TableSkeleton $w='110px' $h='11px' style={{ marginTop: 6 }} />
				</>
			),
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
			minWidth: 160,
			sortable: true,
			sortValue: (r) => `${r.phoneCountry}${r.phone}`,
			render: (r) => (
				<Muted>
					{r.phoneCountry}
					{r.phone}
				</Muted>
			),
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
		},
		{
			key: 'services',
			label: 'Services',
			minWidth: 220,
			render: (r) => (
				<TagRow>
					{r.services.slice(0, 3).map((s) => (
						<Tag key={s}>{s}</Tag>
					))}
					{r.services.length > 3 && <Tag $more>+{r.services.length - 3}</Tag>}
				</TagRow>
			),
			skeleton: () => <TableSkeleton $w='160px' $h='20px' style={{ borderRadius: 6 }} />,
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
		</>
	)
}

export default ClientRequestList

const ContactCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const ContactName = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
`

const ContactMeta = styled.span`
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

const TagRow = styled.div`
	display: inline-flex;
	gap: 4px;
	flex-wrap: nowrap;
`

const Tag = styled.span<{ $more?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 6px;
	background: ${({ $more }) => ($more ? T.primaryTint : T.subtleBg)};
	border: 1px solid ${({ $more }) => ($more ? '#d5e5f3' : T.border)};
	font-size: 11px;
	color: ${({ $more }) => ($more ? T.primary : T.textSecondary)};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-weight: ${({ $more }) => ($more ? 700 : 500)};
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
