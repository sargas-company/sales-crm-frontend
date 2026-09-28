import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	ReceiptLongOutlined,
	AddRounded,
	PaidOutlined,
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
import InvoiceDeleteModal from '../../../components/invoices/list/InvoiceDeleteModal'
import InvoiceMarkPaidModal from '../../../components/invoices/list/InvoiceMarkPaidModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	formatInvoiceMoney,
	getCounterpartyName,
	getInvoiceTotal,
} from '../../../components/invoices/list/utils'
import type { InvoiceItem, InvoiceSortBy } from '../../../store/invoices/invoicesApi'
import { useGetInvoiceListQuery } from '../../../store/invoices/invoicesApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import usePermissions from '../../../hooks/usePermissions'

const PAGE_SIZE = 20

interface Target {
	id: string
	title: string
}

const invoiceLabel = (i: InvoiceItem) => (i.number ? `Invoice #${i.number}` : `Invoice ${i.id}`)

const InvoiceList = () => {
	const navigate = useNavigate()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Target | null>(null)
	const [paidTarget, setPaidTarget] = useState<Target | null>(null)

	const { data, isLoading, isError, refetch } = useGetInvoiceListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as InvoiceSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const allItems = data ? (Array.isArray(data) ? data : data.data) : []
	const total = data ? (Array.isArray(data) ? data.length : data.total) : 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	// Invoice scope inherits from the linked counterparty. Callers
	// without `contractor_scope:manage` cannot mutate a contractor
	// invoice — backend returns 403 — so hide row-level Edit /
	// Mark-Paid / Delete on those rows to keep the UI honest.
	const { has } = usePermissions()
	const canManageContractor = has('contractor_scope:manage')
	const canMutateRow = (i: InvoiceItem) =>
		i.counterparty?.type !== 'contractor' || canManageContractor

	const columns: DataTableColumn<InvoiceItem>[] = [
		{
			key: 'number',
			label: 'Invoice',
			minWidth: 140,
			sortable: true,
			sortValue: (i) => i.number ?? '',
			render: (i) => <InvoiceNum>{i.number ?? '—'}</InvoiceNum>,
			skeleton: () => <TableSkeleton $w='90px' $h='14px' />,
		},
		{
			key: 'counterparty',
			label: 'Counterparty',
			minWidth: 220,
			sortable: true,
			sortValue: (i) => getCounterpartyName(i),
			render: (i) => <Muted>{getCounterpartyName(i)}</Muted>,
			skeleton: () => <TableSkeleton $w='160px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (i) => i.status ?? '',
			render: (i) => (
				<StatusPill $status={i.status ?? 'draft'}>{i.status ?? 'draft'}</StatusPill>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'date',
			label: 'Date',
			minWidth: 130,
			sortable: true,
			sortValue: (i) => new Date(i.date),
			render: (i) => <Muted>{formatDate(i.date, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'dueDate',
			label: 'Due',
			minWidth: 130,
			sortable: true,
			sortValue: (i) => (i.dueDate ? new Date(i.dueDate) : null),
			render: (i) => <Muted>{i.dueDate ? formatDate(i.dueDate, 'short') : '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'total',
			label: 'Total',
			minWidth: 140,
			render: (i) => <MoneyPill>{formatInvoiceMoney(getInvoiceTotal(i), i.currency)}</MoneyPill>,
			skeleton: () => <TableSkeleton $w='100px' $h='24px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'currency',
			label: 'Currency',
			minWidth: 100,
			sortable: true,
			sortValue: (i) => i.currency,
			render: (i) => <Muted>{i.currency}</Muted>,
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (i) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/invoices/preview/${i.id}`)}
						aria-label='View invoice'
					>
						<VisibilityOutlined />
					</IconAction>
					{canMutateRow(i) && (
						<PermissionGate permission='invoices:update'>
							<IconAction
								type='button'
								onClick={() => navigate(`/invoices/edit/${i.id}`)}
								aria-label='Edit invoice'
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
					)}
					{canMutateRow(i) && i.status !== 'paid' && (
						<PermissionGate permission='invoices:update'>
							<IconAction
								type='button'
								onClick={() => setPaidTarget({ id: i.id, title: invoiceLabel(i) })}
								aria-label='Mark as paid'
							>
								<PaidOutlined />
							</IconAction>
						</PermissionGate>
					)}
					{canMutateRow(i) && (
						<PermissionGate permission='invoices:delete'>
							<IconAction
								type='button'
								$danger
								onClick={() => setDeleteTarget({ id: i.id, title: invoiceLabel(i) })}
								aria-label='Delete invoice'
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
				crumbs={[{ label: 'Billing' }, { label: 'Invoices', current: true }]}
				icon={<ReceiptLongOutlined />}
				title='Invoices'
				subtitle='Client invoices, totals and payment status.'
				action={
					<PermissionGate permission='invoices:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/invoices/add/')}>
							<AddRounded />
							New invoice
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by invoice number'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={allItems}
					rowKey={(i) => i.id}
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
				<InvoiceDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (allItems.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}

			{paidTarget && (
				<InvoiceMarkPaidModal
					id={paidTarget.id}
					title={paidTarget.title}
					onClose={() => setPaidTarget(null)}
					onSuccess={refetch}
				/>
			)}
		</>
	)
}

export default InvoiceList

const InvoiceNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	white-space: nowrap;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const MoneyPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 5px 12px;
	border-radius: 8px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.primary};
	background: ${T.primaryTint};
	border: 1px solid rgba(3, 105, 161, 0.28);
	white-space: nowrap;
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
		$status === 'paid'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'draft'
				? 'rgba(148, 163, 184, 0.18)'
				: 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $status }) =>
		$status === 'paid' ? '#15803d' : $status === 'draft' ? '#475569' : '#a26608'};
`
