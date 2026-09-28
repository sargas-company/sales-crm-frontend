import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { muiSargasTheme } from '../../_shared/muiSargasTheme'

import InvoicePartyStep from './InvoicePartyStep'
import InvoiceFormStep, { type ReuseLineItem } from './InvoiceFormStep'

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
	const [reuseLineItems, setReuseLineItems] = useState<ReuseLineItem[] | undefined>(undefined)

	if (step === 'select') {
		return (
			<ThemeProvider theme={muiSargasTheme}>
				<InvoicePartyStep
					onContinue={({
						type,
						party,
						reuseLineItems: reused,
					}: {
						type: PartyType
						party: Party
						reuseLineItems?: ReuseLineItem[]
					}) => {
						setSelectedType(type)
						setSelectedParty(party)
						setReuseLineItems(reused)
						setStep('form')
					}}
				/>
			</ThemeProvider>
		)
	}

	if (!selectedType || !selectedParty) return null

	return (
		<ThemeProvider theme={muiSargasTheme}>
			<InvoiceFormStep
				selectedType={selectedType}
				selectedParty={selectedParty}
				reuseLineItems={reuseLineItems}
				onBack={() => setStep('select')}
				onSaved={() => navigate('/invoices/list')}
			/>
		</ThemeProvider>
	)
}

export default InvoiceCreateForm
