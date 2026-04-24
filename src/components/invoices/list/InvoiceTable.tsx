import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Box as MuiBox,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import Card from '../../../components/card/Card'
import {
	type InvoiceItem,
	useDeleteInvoiceMutation,
	useGetInvoiceListQuery,
} from '../../../store/invoices/invoicesApi'

interface DeleteTarget {
	id: string
	title: string
}

const LIMIT_OPTIONS = [8, 20]

const formatMoney = (value: number, currency: InvoiceItem['currency']) => {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
		}).format(Number.isFinite(value) ? value : 0)
	} catch {
		return `${(value || 0).toFixed(2)} ${currency}`
	}
}

const getCounterpartyName = (invoice: InvoiceItem) => {
	const name = [invoice.counterparty?.firstName, invoice.counterparty?.lastName]
		.filter(Boolean)
		.join(' ')

	return invoice.counterparty?.displayName || name || invoice.counterpartyId
}

const getInvoiceTotal = (invoice: InvoiceItem) => {
	const subtotal = (invoice.lineItems ?? []).reduce(
		(sum, item) => sum + item.quantity * item.unitCost,
		0
	)
	const tax = invoice.showTax ? subtotal * ((invoice.tax || 0) / 100) : 0
	const discounts = invoice.showDiscounts ? invoice.discounts || 0 : 0
	const shipping = invoice.showShipping ? invoice.shipping || 0 : 0

	return subtotal + tax + shipping - discounts
}

const InvoiceTable = () => {
	const navigate = useNavigate()
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [search, setSearch] = useState('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [page, setPage] = useState(1)

	const { data, isLoading, refetch } = useGetInvoiceListQuery({ page, limit })
	const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation()

	const allItems = useMemo(() => {
		if (!data) return []

		return Array.isArray(data) ? data : data.data
	}, [data])

	const total = Array.isArray(data) ? data.length : (data?.total ?? 0)

	const items = search
		? allItems.filter((item) => {
				const q = search.toLowerCase()
				const totalValue = formatMoney(getInvoiceTotal(item), item.currency).toLowerCase()

				return (
					item.number.toLowerCase().includes(q) ||
					item.currency.toLowerCase().includes(q) ||
					item.date.toLowerCase().includes(q) ||
					item.dueDate.toLowerCase().includes(q) ||
					getCounterpartyName(item).toLowerCase().includes(q) ||
					totalValue.includes(q)
				)
			})
		: allItems

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	const handleDelete = async () => {
		if (!deleteTarget) return

		await deleteInvoice(deleteTarget.id).unwrap()
		setDeleteTarget(null)

		if (allItems.length === 1 && page > 1) setPage(page - 1)
		else refetch()
	}

	return (
		<>
			<Card padding={'30px'}>
				<MuiBox
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 2,
						p: 2.5,
					}}
				>
					<TextField
						type='text'
						name='search-invoice'
						placeholder='Search invoice'
						size='small'
						onChange={(e) => setSearch(e.target.value)}
						sx={{ maxWidth: '280px', width: '100%' }}
					/>

					<Button variant='contained' onClick={() => navigate('/invoices/add/')}>
						Create invoice
					</Button>
				</MuiBox>

				<TableContainer component={Paper} variant='outlined' sx={{ mx: 3, width: 'auto' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Invoice #</TableCell>
								<TableCell>Counterparty</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>Due Date</TableCell>
								<TableCell>Currency</TableCell>
								<TableCell align='right'>Total</TableCell>
								<TableCell align='center'>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={7}>
										<MuiBox sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
											<CircularProgress size={28} />
										</MuiBox>
									</TableCell>
								</TableRow>
							) : null}

							{!isLoading && items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7}>
										<Typography
											variant='body2'
											color='text.secondary'
											align='center'
											sx={{ py: 5 }}
										>
											No invoices found.
										</Typography>
									</TableCell>
								</TableRow>
							) : null}

							{!isLoading
								? items.map((invoice) => (
										<TableRow
											key={invoice.id}
											hover
											onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
											sx={{ cursor: 'pointer' }}
										>
											<TableCell>
												<Typography sx={{ fontWeight: 700 }}>
													{invoice.number}
												</Typography>
											</TableCell>
											<TableCell>{getCounterpartyName(invoice)}</TableCell>
											<TableCell>{invoice.date}</TableCell>
											<TableCell>{invoice.dueDate}</TableCell>
											<TableCell>
												<Chip
													size='small'
													label={invoice.currency}
													variant='outlined'
												/>
											</TableCell>
											<TableCell align='right'>
												{formatMoney(getInvoiceTotal(invoice), invoice.currency)}
											</TableCell>
											<TableCell align='center'>
												<IconButton
													size='small'
													onClick={(event) => {
														event.stopPropagation()
														navigate(`/invoices/edit/${invoice.id}`)
													}}
												>
													<EditOutlined fontSize='small' />
												</IconButton>
												<IconButton
													size='small'
													onClick={(event) => {
														event.stopPropagation()
														setDeleteTarget({
															id: invoice.id,
															title: invoice.number,
														})
													}}
												>
													<DeleteOutline fontSize='small' />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								: null}
						</TableBody>
					</Table>
				</TableContainer>

				{total > 0 ? (
					<TablePagination
						component='div'
						count={total}
						page={page - 1}
						rowsPerPage={limit}
						rowsPerPageOptions={LIMIT_OPTIONS}
						onPageChange={(_, nextPage) => setPage(nextPage + 1)}
						onRowsPerPageChange={(event) => handleLimitChange(Number(event.target.value))}
					/>
				) : null}
			</Card>

			<Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
				<DialogTitle>Delete invoice?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete invoice "{deleteTarget?.title}"?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button variant='outlined' type='button' onClick={() => setDeleteTarget(null)}>
						Cancel
					</Button>
					<Button color='error' disabled={isDeleting} onClick={handleDelete}>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default InvoiceTable
