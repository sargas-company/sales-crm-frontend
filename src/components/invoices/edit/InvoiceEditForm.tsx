import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import InvoiceFormStep from '../add/InvoiceFormStep'
import { useGetInvoiceByIdQuery } from '../../../store/invoices/invoicesApi'

type PartyType = 'contractor' | 'client'

type Props = {
	id: string
}

const InvoiceEditForm = ({ id }: Props) => {
	const navigate = useNavigate()
	const { data: invoice, isLoading, isError } = useGetInvoiceByIdQuery(id!, { skip: !id })

	const selectedType = useMemo<PartyType>(() => {
		return invoice?.counterparty?.type === 'contractor' ? 'contractor' : 'client'
	}, [invoice?.counterparty?.type])

	const selectedParty = useMemo(() => {
		if (!invoice) return null

		const counterpartyName = [invoice.counterparty?.firstName, invoice.counterparty?.lastName]
			.filter(Boolean)
			.join(' ')

		return {
			id: invoice.counterparty?.id ?? invoice.counterpartyId,
			type: selectedType,
			displayName: invoice.counterparty?.displayName ?? counterpartyName,
			currency: invoice.currency,
			invoiceBlock: invoice.toValue,
		}
	}, [invoice, selectedType])

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
				<CircularProgress />
			</Box>
		)
	}

	if (isError || !invoice || !selectedParty) {
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
		<InvoiceFormStep
			selectedType={selectedType}
			selectedParty={selectedParty}
			invoice={invoice}
			onBack={() => navigate('/invoices/list')}
			onSaved={() => navigate('/invoices/list')}
		/>
	)
}

export default InvoiceEditForm
