import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	HandshakeOutlined,
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
import CounterpartyDeleteModal from '../../../components/counterparties/list/CounterpartyDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import type {
	CounterpartyItem,
	CounterpartySortBy,
} from '../../../store/counterparties/counterpartiesApi'
import { useGetCounterpartiesQuery } from '../../../store/counterparties/counterpartiesApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import usePermissions from '../../../hooks/usePermissions'

const PAGE_SIZE = 20

interface DeleteTarget {
	id: string
	title: string
}

const fullName = (c: CounterpartyItem) => `${c.firstName} ${c.lastName}`.trim() || '—'

const personInitials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const CounterpartyList = () => {
	const navigate = useNavigate()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetCounterpartiesQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as CounterpartySortBy | undefined) ?? undefined,
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

	// Contractor rows are mutable only by callers with
	// `contractor_scope:manage`; backend enforces the same rule and
	// answers 403 otherwise, so hiding the row-level Edit/Delete
	// controls avoids submitting a request the API will reject.
	const { has } = usePermissions()
	const canManageContractor = has('contractor_scope:manage')
	const canMutateRow = (c: CounterpartyItem) =>
		c.type !== 'contractor' || canManageContractor

	const columns: DataTableColumn<CounterpartyItem>[] = [
		{
			key: 'name',
			label: 'Counterparty',
			minWidth: 180,
			sortable: true,
			sortValue: (c) => fullName(c),
			render: (c) => (
				<NameCell>
					<Avatar>{personInitials(c.firstName, c.lastName)}</Avatar>
					<NameText>{fullName(c)}</NameText>
				</NameCell>
			),
			skeleton: () => (
				<NameCell>
					<TableSkeleton $w='36px' $h='36px' style={{ borderRadius: 10, flexShrink: 0 }} />
					<TableSkeleton $w='150px' $h='14px' />
				</NameCell>
			),
		},
		{
			key: 'type',
			label: 'Type',
			minWidth: 130,
			sortable: true,
			sortValue: (c) => c.type,
			render: (c) => <TypePill $type={c.type}>{c.type}</TypePill>,
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
			key: 'updated',
			label: 'Updated',
			minWidth: 140,
			sortable: true,
			sortValue: (c) => new Date(c.updatedAt),
			render: (c) => <Muted>{formatDate(c.updatedAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (c) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/counterparties/${c.id}`)}
						aria-label='View counterparty'
					>
						<VisibilityOutlined />
					</IconAction>
					{canMutateRow(c) && (
						<PermissionGate permission='counterparties:update'>
							<IconAction
								type='button'
								onClick={() => navigate(`/counterparties/edit/${c.id}`)}
								aria-label='Edit counterparty'
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
					)}
					{canMutateRow(c) && (
						<PermissionGate permission='counterparties:delete'>
							<IconAction
								type='button'
								$danger
								onClick={() => setDeleteTarget({ id: c.id, title: fullName(c) })}
								aria-label='Delete counterparty'
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					)}
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Billing' }, { label: 'Counterparties', current: true }]}
				icon={<HandshakeOutlined />}
				title='Counterparties'
				subtitle='Clients and contractors who appear on invoices.'
				action={
					<PermissionGate permission='counterparties:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/counterparties/add/')}>
							<AddRounded />
							New counterparty
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
				/>
			</ListPageShell>

			{deleteTarget && (
				<CounterpartyDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</>
	)
}

export default CounterpartyList

const NameCell = styled.div`
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

const NameText = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.3;
	white-space: nowrap;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const TypePill = styled.span<{ $type: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $type }) =>
		$type === 'client' ? 'rgba(3, 105, 161, 0.12)' : 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $type }) => ($type === 'client' ? T.primary : '#a26608')};
`
