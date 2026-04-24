import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import InvoicePartyStep from './InvoicePartyStep'
import InvoiceFormStep from './InvoiceFormStep'

type PartyType = 'contractor' | 'client'

type Party = {
	id: string
	type: PartyType
	displayName: string
	currency: 'USD' | 'EUR' | 'UAH'
	invoiceBlock: string
	defaultPaymentTerms?: string
	defaultNotes?: string
	defaultTerms?: string
	defaultShipTo?: string
}

const InvoiceCreateForm: FC = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'select' | 'form'>('select')
	const [selectedType, setSelectedType] = useState<PartyType | null>(null)
	const [selectedParty, setSelectedParty] = useState<Party | null>(null)

	if (step === 'select') {
		return (
			<InvoicePartyStep
				onContinue={({ type, party }: { type: PartyType; party: Party }) => {
					setSelectedType(type)
					setSelectedParty(party)
					setStep('form')
				}}
			/>
		)
	}

	if (!selectedType || !selectedParty) return null

	return (
		<InvoiceFormStep
			selectedType={selectedType}
			selectedParty={selectedParty}
			onBack={() => setStep('select')}
			onSaved={() => navigate('/invoices/list')}
		/>
	)
}

export default InvoiceCreateForm
