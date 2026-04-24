import { useState } from 'react'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import CreateNewInvoice from '../../../components/invoices/list/CreateNewInvoice'
import InvoiceDeleteModal from '../../../components/invoices/list/InvoiceDeleteModal'
import InvoiceMarkPaidModal from '../../../components/invoices/list/InvoiceMarkPaidModal'
import InvoiceTable from '../../../components/invoices/list/InvoiceTable'
import {
	formatInvoiceMoney,
	getCounterpartyName,
	getInvoiceTotal,
} from '../../../components/invoices/list/utils'
import { useGetInvoiceListQuery } from '../../../store/invoices/invoicesApi'
import { TextField } from '../../../ui'

interface DeleteTarget {
	id: string
	title: string
}

const LIMIT_OPTIONS = [8, 20]

const InvoiceList = () => {
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [search, setSearch] = useState('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [paidTarget, setPaidTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, refetch } = useGetInvoiceListQuery({ page, limit })
	const allItems = data ? (Array.isArray(data) ? data : data.data) : []
	const total = data ? (Array.isArray(data) ? data.length : data.total) : 0

	const handleDelete = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) {
			setDeleteTarget({
				id,
				title: item.number ? `Invoice #${item.number}` : `Invoice ${item.id}`,
			})
		}
	}

	const handleMarkPaid = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) {
			setPaidTarget({
				id,
				title: item.number ? `Invoice #${item.number}` : `Invoice ${item.id}`,
			})
		}
	}

	const items = search
		? allItems.filter((item) => {
				const q = search.toLowerCase()
				const totalValue = formatInvoiceMoney(
					getInvoiceTotal(item),
					item.currency
				).toLowerCase()

				return (
					(item.number ?? '').toLowerCase().includes(q) ||
					item.currency.toLowerCase().includes(q) ||
					(item.status ?? '').toLowerCase().includes(q) ||
					item.date.toLowerCase().includes(q) ||
					(item.dueDate ?? '').toLowerCase().includes(q) ||
					getCounterpartyName(item).toLowerCase().includes(q) ||
					totalValue.includes(q)
				)
			})
		: allItems

	const passed = (page - 1) * limit + 1
	const next = Math.min(page * limit, total)

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	return (
		<>
			<Card padding={'30px'}>
				<Box display='flex' justify='space-between' padding={20}>
					<GridInnerContainer alignItems='center' justifyContent='space-between'>
						<GridItem xs={12} md={6}>
							<TextField
								type='text'
								name='search-invoice'
								placeholder='Search invoice'
								sizes='small'
								maxWidth='280px'
								onChange={(e) => setSearch(e.target.value)}
							/>
						</GridItem>
						<GridItem xs={12} md={6}>
							<Box display='flex' justify='flex-end'>
								<CreateNewInvoice />
							</Box>
						</GridItem>
					</GridInnerContainer>
				</Box>

				<InvoiceTable items={items} isLoading={isLoading} onDelete={handleDelete} onMarkPaid={handleMarkPaid} />

				{total > 0 && (
					<DataGridFooter
						total={total}
						rowPerPage={limit}
						rowPerPageOptions={LIMIT_OPTIONS}
						currentPage={page}
						next={next}
						passed={passed}
						handlePagination={setPage}
						handleRowOptSelect={handleLimitChange}
					/>
				)}
			</Card>

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
