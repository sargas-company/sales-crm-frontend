import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import InvoiceFormStep from '../add/InvoiceFormStep'
import { useGetInvoiceByIdQuery } from '../../../store/invoices/invoicesApi'
import { FormLoading, FormNotFound } from '../../_shared/FormShell'

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

	if (isLoading) return <FormLoading label='Loading invoice…' />
	if (isError || !invoice || !selectedParty) return <FormNotFound label='Invoice not found' />

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
