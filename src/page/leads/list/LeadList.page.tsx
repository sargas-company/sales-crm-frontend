import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	PersonSearchOutlined,
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
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import LeadDeleteModal from '../../../components/leads/list/LeadDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type { LeadItem, LeadSortBy } from '../../../store/leads/types/definition'
import { useGetLeadListQuery } from '../../../store/leads/leadsApi'
import { formatDate } from '../../../utils/format'
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

const LeadList = () => {
	const navigate = useNavigate()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetLeadListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
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
	}, [search])

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
				searchPlaceholder='Search by name'
				search={searchInput}
				onSearchChange={setSearchInput}
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
		$status === 'start_contract' || $status === 'accept_contract'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'hold' || $status === 'end_relationship' || $status === 'lost'
				? 'rgba(239, 68, 68, 0.12)'
				: $status === 'trial' || $status === 'contract_offer'
					? 'rgba(245, 158, 11, 0.16)'
					: 'rgba(3, 105, 161, 0.12)'};
	color: ${({ $status }) =>
		$status === 'start_contract' || $status === 'accept_contract'
			? '#15803d'
			: $status === 'hold' || $status === 'end_relationship' || $status === 'lost'
				? '#b91c1c'
				: $status === 'trial' || $status === 'contract_offer'
					? '#a26608'
					: T.primary};
`
