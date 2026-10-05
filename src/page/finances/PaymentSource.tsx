import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AccountBalanceWalletOutlined,
	DeleteOutline,
	EditOutlined,
	AddRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import {
	useGetPaymentSourcesQuery,
	useDeletePaymentSourceMutation,
	type PaymentSource as PaymentSourceItem,
} from '../../store/payment-sources/paymentSourcesApi'

const PAGE_SIZE = 20

const PaymentSource = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({ key: 'name', direction: 'asc' })
	const [search, setSearch] = useState('')
	const [toDelete, setToDelete] = useState<PaymentSourceItem | null>(null)

	const { data, isLoading, isError, refetch } = useGetPaymentSourcesQuery()
	const [deleteSource, { isLoading: deleting }] = useDeletePaymentSourceMutation()

	const all = data ?? []
	const filtered = search
		? all.filter(
				(s) =>
					s.name.toLowerCase().includes(search.toLowerCase()) ||
					(s.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
					s.currency.toLowerCase().includes(search.toLowerCase()),
			)
		: all

	const columns: DataTableColumn<PaymentSourceItem>[] = [
		{
			key: 'name',
			label: 'Name',
			sortable: true,
			sortValue: (r) => r.name,
			render: (r) => <NameText>{r.name}</NameText>,
			skeleton: () => <TableSkeleton $w='140px' $h='14px' />,
		},
		{
			key: 'currency',
			label: 'Currency',
			sortable: true,
			sortValue: (r) => r.currency,
			render: (r) => <CurrencyChip>{r.currency}</CurrencyChip>,
			skeleton: () => <TableSkeleton $w='50px' $h='20px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'description',
			label: 'Description',
			render: (r) =>
				r.description ? (
					<DescText title={r.description}>{r.description}</DescText>
				) : (
					<SubText>—</SubText>
				),
			skeleton: () => <TableSkeleton $w='200px' $h='14px' />,
		},
		{
			key: 'isActive',
			label: 'Status',
			sortable: true,
			sortValue: (r) => (r.isActive ? 1 : 0),
			render: (r) => (
				<StatusPill $active={r.isActive}>{r.isActive ? 'Active' : 'Inactive'}</StatusPill>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<PermissionGate permission='payment_sources:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/finances/payment-source/edit/${r.id}`)}
							aria-label='Edit payment source'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='payment_sources:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setToDelete(r)}
							aria-label='Delete payment source'
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
				crumbs={[{ label: 'Finances' }, { label: 'Payment sources', current: true }]}
				icon={<AccountBalanceWalletOutlined />}
				title='Payment Sources'
				subtitle='Directory of the accounts, wallets and cards used to collect client payments.'
				action={
					<PermissionGate permission='payment_sources:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/finances/payment-source/add')}>
							<AddRounded />
							New source
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by name, currency or description'
				search={search}
				onSearchChange={setSearch}
			>
				<DataTable
					columns={columns}
					rows={filtered}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					sort={sort}
					onSortChange={setSort}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total: filtered.length,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete payment source?'
					description={
						<>
							Delete <strong>&quot;{toDelete.name}&quot;</strong>? Sources are not yet linked to payments, so this is safe.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onConfirm={async () => {
						try {
							await deleteSource(toDelete.id).unwrap()
							showToast('Payment source deleted', 'success')
							setToDelete(null)
						} catch {
							showToast('Failed to delete payment source', 'error')
						}
					}}
					onClose={() => setToDelete(null)}
					isLoading={deleting}
				/>
			)}
		</>
	)
}

export default PaymentSource

const NameText = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
`

const DescText = styled.span`
	display: inline-block;
	max-width: 320px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 13px;
	color: ${T.textSecondary};
`

const SubText = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`

const CurrencyChip = styled.span`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.5px;
`

const StatusPill = styled.span<{ $active: boolean }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $active }) => ($active ? 'rgba(16, 185, 129, 0.15)' : '#f0edf9')};
	color: ${({ $active }) => ($active ? '#059669' : '#5a5476')};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
`
