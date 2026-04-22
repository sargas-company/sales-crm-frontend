import { FC, useMemo, useState } from 'react'
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { BusinessOutlined, PeopleOutlined, Search, RequestQuoteOutlined } from '@mui/icons-material'
import {
	type CounterpartyItem,
	useGetCounterpartiesQuery,
} from '../../../store/counterparties/counterpartiesApi'

type PartyType = 'contractor' | 'client'

type Party = {
	id: string
	type: PartyType
	displayName: string
	currency: 'USD' | 'EUR' | 'UAH'
	invoiceBlock: string
}

const COUNTERPARTY_LIMIT = 1000

const getCounterpartyDisplayName = (counterparty: CounterpartyItem) => {
	const fullName = [counterparty.firstName, counterparty.lastName].filter(Boolean).join(' ').trim()

	return (
		fullName ||
		counterparty.info?.split('\n')[0]?.trim() ||
		`Counterparty ${counterparty.id.slice(0, 8)}`
	)
}

const mapCounterpartyToParty = (counterparty: CounterpartyItem): Party => {
	const displayName = getCounterpartyDisplayName(counterparty)
	const info = counterparty.info?.trim()

	return {
		id: counterparty.id,
		type: counterparty.type,
		displayName,
		currency: 'USD',
		invoiceBlock: [displayName, info].filter(Boolean).join('\n'),
	}
}

type Props = {
	onContinue?: (payload: { type: PartyType; party: Party }) => void
}

const InvoicePartyStep: FC<Props> = ({ onContinue }) => {
	const [selectedType, setSelectedType] = useState<PartyType>('contractor')
	const [search, setSearch] = useState('')
	const [selectedPartyId, setSelectedPartyId] = useState('')
	const { data, isLoading, isError } = useGetCounterpartiesQuery({
		page: 1,
		limit: COUNTERPARTY_LIMIT,
	})

	const parties = useMemo(() => {
		return (data?.data ?? []).map(mapCounterpartyToParty)
	}, [data?.data])

	const contractorCount = useMemo(() => {
		return parties.filter((party) => party.type === 'contractor').length
	}, [parties])

	const clientCount = useMemo(() => {
		return parties.filter((party) => party.type === 'client').length
	}, [parties])

	const filteredParties = useMemo(() => {
		const q = search.toLowerCase()

		return parties.filter(
			(party) =>
				party.type === selectedType &&
				(party.displayName.toLowerCase().includes(q) ||
					party.invoiceBlock.toLowerCase().includes(q))
		)
	}, [parties, selectedType, search])

	const selectedParty = useMemo(() => {
		return parties.find((party) => party.id === selectedPartyId) || null
	}, [parties, selectedPartyId])

	const handleContinue = () => {
		if (!selectedParty) return

		onContinue?.({
			type: selectedType,
			party: selectedParty,
		})
	}

	return (
		<Box
			sx={{
				minHeight: '100vh',
				background: 'transparent',
				p: { xs: 2, md: 4 },
			}}
		>
			<Box sx={{ maxWidth: 1200, mx: 'auto' }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					sx={{
						mb: 3,
						justifyContent: 'space-between',
					}}
				>
					<Box>
						<Typography variant='h4' sx={{ fontWeight: 700 }}>
							Create invoice
						</Typography>

						<Typography color='text.secondary'>
							Сначала выбери категорию, потом конкретного contractor или client.
						</Typography>
					</Box>

					<Chip
						icon={<RequestQuoteOutlined />}
						label='Step 1 - Select party'
						color='primary'
						variant='outlined'
						sx={{
							height: 40,
							'& .MuiChip-label': {
								px: 2,
							},
							'& .MuiChip-icon': {
								ml: 1,
							},
						}}
					/>
				</Stack>

				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
					<Card
						sx={{
							flex: 1,
							borderRadius: 4,
							boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
						}}
					>
						<CardContent sx={{ p: 3 }}>
							<Typography variant='h6' sx={{ fontWeight: 700, mb: 3 }}>
								Who is this invoice for?
							</Typography>

							<Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 600 }}>
								Category
							</Typography>

							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
								<Button
									variant={selectedType === 'contractor' ? 'contained' : 'outlined'}
									startIcon={<PeopleOutlined />}
									onClick={() => {
										setSelectedType('contractor')
										setSelectedPartyId('')
									}}
									sx={{
										justifyContent: 'flex-start',
										borderRadius: 3,
										py: 1.4,
										flex: 1,
									}}
								>
									Contractors ({contractorCount})
								</Button>

								<Button
									variant={selectedType === 'client' ? 'contained' : 'outlined'}
									startIcon={<BusinessOutlined />}
									onClick={() => {
										setSelectedType('client')
										setSelectedPartyId('')
									}}
									sx={{
										justifyContent: 'flex-start',
										borderRadius: 3,
										py: 1.4,
										flex: 1,
									}}
								>
									Clients ({clientCount})
								</Button>
							</Stack>

							{isError ? (
								<Alert severity='error' sx={{ mb: 2 }}>
									Failed to load counterparties.
								</Alert>
							) : null}

							<Box
								sx={{
									position: 'relative',
									mb: 2,
								}}
							>
								<Box
									sx={{
										position: 'absolute',
										left: 12,
										top: '50%',
										transform: 'translateY(-50%)',
										display: 'flex',
										alignItems: 'center',
										pointerEvents: 'none',
										color: 'text.secondary',
										zIndex: 1,
									}}
								>
									<Search fontSize='small' />
								</Box>

								<TextField
									fullWidth
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder='Search by name'
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: 3,
										},
										'& .MuiOutlinedInput-input': {
											pl: '40px',
										},
									}}
								/>
							</Box>

							<Stack spacing={1.25} sx={{ maxHeight: 420, overflow: 'auto' }}>
								{isLoading ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
										<CircularProgress size={28} />
									</Box>
								) : null}

								{!isLoading && filteredParties.length === 0 ? (
									<Typography color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
										No {selectedType === 'contractor' ? 'contractors' : 'clients'} found.
									</Typography>
								) : null}

								{!isLoading
									? filteredParties.map((party) => {
											const active = selectedPartyId === party.id

											return (
												<Paper
													key={party.id}
													onClick={() => setSelectedPartyId(party.id)}
													variant='outlined'
													sx={{
														p: 2,
														borderRadius: 3,
														cursor: 'pointer',
														borderColor: active ? 'primary.main' : 'divider',
														backgroundColor: active
															? 'rgba(25,118,210,0.04)'
															: '#fff',
														transition: '0.2s ease',
													}}
												>
													<Stack
														direction='row'
														spacing={2}
														sx={{
															justifyContent: 'space-between',
															alignItems: 'center',
														}}
													>
														<Box>
															<Typography sx={{ fontWeight: 600 }}>
																{party.displayName}
															</Typography>

															<Typography variant='body2' color='text.secondary'>
																{party.currency}
															</Typography>
														</Box>

														<Chip size='small' label={party.type} />
													</Stack>
												</Paper>
											)
										})
									: null}
							</Stack>

							<Button
								fullWidth
								variant='contained'
								onClick={handleContinue}
								disabled={isLoading || !selectedParty}
								sx={{
									mt: 3,
									borderRadius: 3,
									py: 1.4,
								}}
							>
								Continue
							</Button>
						</CardContent>
					</Card>

					<Card
						sx={{
							width: { xs: '100%', lg: 360 },
							borderRadius: 4,
							boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
						}}
					>
						<CardContent sx={{ p: 3 }}>
							<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
								Preview
							</Typography>

							{selectedParty ? (
								<Stack spacing={2}>
									<Box>
										<Typography variant='caption' color='text.secondary'>
											Selected category
										</Typography>
										<Typography>{selectedType}</Typography>
									</Box>

									<Box>
										<Typography variant='caption' color='text.secondary'>
											Selected party
										</Typography>
										<Typography>{selectedParty.displayName}</Typography>
									</Box>

									<Box>
										<Typography variant='caption' color='text.secondary'>
											Next step mapping
										</Typography>
										<Typography variant='body2' color='text.secondary'>
											{selectedType === 'contractor'
												? 'From = contractor, To = Sargas'
												: 'From = Sargas, To = client'}
										</Typography>
									</Box>
								</Stack>
							) : (
								<Typography color='text.secondary'>
									Выбери категорию и запись слева.
								</Typography>
							)}
						</CardContent>
					</Card>
				</Stack>
			</Box>
		</Box>
	)
}

export default InvoicePartyStep
