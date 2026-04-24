import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowBackOutlined, ContentCopy, EditOutlined } from '@mui/icons-material'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material'
import { type InvoiceItem, useGetInvoiceByIdQuery } from '../../../store/invoices/invoicesApi'
import { shortUuid } from '../../../utils/formatDate'

type Props = {
	id: string
}

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

const getSubtotal = (invoice: InvoiceItem) => {
	return (invoice.lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
}

const InvoicePreviewDetails = ({ id }: Props) => {
	const navigate = useNavigate()
	const { data: invoice, isLoading, isError } = useGetInvoiceByIdQuery(id, { skip: !id })

	const totals = useMemo(() => {
		if (!invoice) {
			return {
				subtotal: 0,
				tax: 0,
				discounts: 0,
				shipping: 0,
				total: 0,
				balanceDue: 0,
			}
		}

		const subtotal = getSubtotal(invoice)
		const tax = invoice.showTax ? subtotal * ((invoice.tax || 0) / 100) : 0
		const discounts = invoice.showDiscounts ? invoice.discounts || 0 : 0
		const shipping = invoice.showShipping ? invoice.shipping || 0 : 0
		const total = subtotal + tax + shipping - discounts

		return {
			subtotal,
			tax,
			discounts,
			shipping,
			total,
			balanceDue: Math.max(total - invoice.amountPaid, 0),
		}
	}, [invoice])

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
				<CircularProgress />
			</Box>
		)
	}

	if (isError || !invoice) {
		return (
			<Card sx={{ m: 3 }}>
				<CardContent>
					<Typography variant='h6' sx={{ mb: 2 }}>
						Invoice not found
					</Typography>
					<Button variant='outlined' onClick={() => navigate('/invoices/list')}>
						Back to list
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card sx={{ m: 3, borderRadius: 3 }}>
			<CardContent sx={{ p: 4 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						mb: 4,
					}}
				>
					<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
						<IconButton onClick={() => navigate('/invoices/list')}>
							<ArrowBackOutlined />
						</IconButton>
						<Box>
							<Typography variant='h5' sx={{ fontWeight: 700 }}>
								{invoice.header || 'Invoice'} #{invoice.number}
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
								<Typography variant='body2' color='text.secondary'>
									{getCounterpartyName(invoice)}
								</Typography>
								<Tooltip title={invoice.id}>
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ fontFamily: 'monospace' }}
									>
										{shortUuid(invoice.id)}
									</Typography>
								</Tooltip>
								<IconButton
									size='small'
									onClick={() => navigator.clipboard.writeText(invoice.id)}
								>
									<ContentCopy sx={{ fontSize: 14 }} />
								</IconButton>
							</Box>
						</Box>
					</Box>

					<Button
						variant='outlined'
						startIcon={<EditOutlined />}
						onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
					>
						Edit
					</Button>
				</Box>

				<Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
					<Chip label={invoice.currency} variant='outlined' />
					<Chip label={`Date: ${invoice.date}`} variant='outlined' />
					<Chip label={`Due: ${invoice.dueDate}`} variant='outlined' />
				</Box>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
						gap: 3,
						mb: 4,
					}}
				>
					<Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2 }}>
						<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
							From
						</Typography>
						<Typography sx={{ whiteSpace: 'pre-line' }}>{invoice.fromValue}</Typography>
					</Paper>
					<Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2 }}>
						<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
							Bill To
						</Typography>
						<Typography sx={{ whiteSpace: 'pre-line' }}>{invoice.toValue}</Typography>
					</Paper>
				</Box>

				<TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Item</TableCell>
								<TableCell align='right'>Quantity</TableCell>
								<TableCell align='right'>Rate</TableCell>
								<TableCell align='right'>Amount</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{invoice.lineItems
								.slice()
								.sort((a, b) => a.sortOrder - b.sortOrder)
								.map((item, index) => (
									<TableRow key={item.id ?? index}>
										<TableCell>{item.name}</TableCell>
										<TableCell align='right'>{item.quantity}</TableCell>
										<TableCell align='right'>
											{formatMoney(item.unitCost, invoice.currency)}
										</TableCell>
										<TableCell align='right'>
											{formatMoney(item.quantity * item.unitCost, invoice.currency)}
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
					<Box sx={{ width: 360, maxWidth: '100%' }}>
						<TotalRow
							label='Subtotal'
							value={formatMoney(totals.subtotal, invoice.currency)}
						/>
						{invoice.showTax ? (
							<TotalRow label='Tax' value={formatMoney(totals.tax, invoice.currency)} />
						) : null}
						{invoice.showDiscounts ? (
							<TotalRow
								label='Discounts'
								value={`-${formatMoney(totals.discounts, invoice.currency)}`}
							/>
						) : null}
						{invoice.showShipping ? (
							<TotalRow
								label='Shipping'
								value={formatMoney(totals.shipping, invoice.currency)}
							/>
						) : null}
						<Divider sx={{ my: 1.5 }} />
						<TotalRow
							label='Total'
							value={formatMoney(totals.total, invoice.currency)}
							strong
						/>
						<TotalRow
							label='Amount Paid'
							value={formatMoney(invoice.amountPaid, invoice.currency)}
						/>
						<TotalRow
							label='Balance Due'
							value={formatMoney(totals.balanceDue, invoice.currency)}
							strong
						/>
					</Box>
				</Box>
			</CardContent>
		</Card>
	)
}

type TotalRowProps = {
	label: string
	value: string
	strong?: boolean
}

const TotalRow = ({ label, value, strong }: TotalRowProps) => (
	<Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, gap: 2 }}>
		<Typography
			color={strong ? 'text.primary' : 'text.secondary'}
			sx={{ fontWeight: strong ? 700 : 400 }}
		>
			{label}
		</Typography>
		<Typography sx={{ fontWeight: strong ? 700 : 400 }}>{value}</Typography>
	</Box>
)

export default InvoicePreviewDetails
