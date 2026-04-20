import { FC, useMemo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	IconButton,
	MenuItem,
	Paper,
	TextField,
	Typography,
} from '@mui/material'
import { Add, ArrowBack, Close, Loop, RequestQuoteOutlined } from '@mui/icons-material'
import logo from '../../../assets/logo.png'

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

type InvoiceItem = {
	id: string
	name: string
	quantity: number
	unitCost: number
}

type Props = {
	selectedType: PartyType
	selectedParty: Party
	onBack?: () => void
}

const companyProfile = {
	displayName: 'Sargas Agency OÜ',
	invoiceBlock:
		'Sargas Agency OÜ, 17146771\nHarju maakond, Tallinn, Kesklinna\nlinnaosa, Narva mnt 7, 10117',
	currency: 'USD' as const,
	defaultPaymentTerms: 'Due on receipt',
}

const today = () => new Date().toISOString().slice(0, 10)

const addDays = (base: string, days: number) => {
	const date = new Date(base)
	date.setDate(date.getDate() + days)
	return date.toISOString().slice(0, 10)
}

const formatMoney = (value: number, currency: 'USD' | 'EUR' | 'UAH') => {
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

const buildInitialForm = (party: Party, selectedType: PartyType) => {
	const issueDate = today()
	const isContractor = selectedType === 'contractor'

	return {
		number: '115',
		currency: party.currency || companyProfile.currency,
		date: '',
		paymentTerms: '',
		dueDate: '',
		poNumber: '',
		fromText: isContractor ? party.invoiceBlock : companyProfile.invoiceBlock,
		toText: isContractor ? companyProfile.invoiceBlock : party.invoiceBlock,
		shipToText: party.defaultShipTo || '',
		notes: '',
		terms: '',
		amountPaid: 0,
		taxMode: 'percent' as 'percent' | 'fixed',
		taxValue: 0,
		discountValue: 0,
		shippingValue: 0,
	}
}

const outlinedSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '10px',
		backgroundColor: '#fff',
		height: '44px',
	},
	'& .MuiOutlinedInput-input': {
		paddingTop: '11px',
		paddingBottom: '11px',
		fontSize: '14px',
	},
}

const areaSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '12px',
		backgroundColor: '#fff',
		alignItems: 'flex-start',
	},
	'& .MuiOutlinedInput-input': {
		fontSize: '14px',
		lineHeight: 1.5,
	},
}

const labelSx = {
	fontSize: '12px',
	lineHeight: '18px',
	color: '#475467',
	mb: 1,
}

const InvoiceFormStep: FC<Props> = ({ selectedType, selectedParty, onBack }) => {
	const [form, setForm] = useState(() => buildInitialForm(selectedParty, selectedType))
	const [items, setItems] = useState<InvoiceItem[]>([
		{ id: '1', name: 'Web Development services', quantity: 160, unitCost: 1.87 },
		{ id: '2', name: 'Bonus', quantity: 1, unitCost: 252.8 },
	])

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
	}, [items])

	const taxAmount = useMemo(() => {
		return form.taxMode === 'percent' ? subtotal * (form.taxValue / 100) : form.taxValue
	}, [form.taxMode, form.taxValue, subtotal])

	const total = useMemo(() => {
		return subtotal + taxAmount + form.shippingValue - form.discountValue
	}, [subtotal, taxAmount, form.shippingValue, form.discountValue])

	const balanceDue = useMemo(() => {
		return Math.max(total - form.amountPaid, 0)
	}, [total, form.amountPaid])

	const updateItem = (id: string, key: keyof InvoiceItem, value: string | number) => {
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
		)
	}

	const addItem = () => {
		setItems((current) => [
			...current,
			{ id: Math.random().toString(36).slice(2), name: '', quantity: 1, unitCost: 0 },
		])
	}

	const removeItem = (id: string) => {
		setItems((current) => current.filter((item) => item.id !== id))
	}

	return (
		<Box sx={{ background: 'transparent', p: 2.5 }}>
			<Box sx={{ mx: 'auto' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 2,
					}}
				>
					<Button
						variant='outlined'
						startIcon={<ArrowBack />}
						onClick={onBack}
						sx={{ borderRadius: 2.5 }}
					>
						Back
					</Button>

					<Card sx={{ borderRadius: '12px' }}>
						<CardContent>
							<Box sx={{ display: 'flex', flexDirection: 'raw', gap: 1.5 }}>
								<Button variant='contained'>Create PDF</Button>
								<Button variant='outlined'>Save Draft</Button>
							</Box>
						</CardContent>
					</Card>
				</Box>

				<Card
					sx={{
						borderRadius: 4,
						background: 'white',
						boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
						paddingBottom: 4,
					}}
				>
					<CardContent sx={{ p: '34px 38px 36px 38px' }}>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: '1fr 420px',
								columnGap: '44px',
								alignItems: 'start',
								mb: '34px',
							}}
						>
							<Box>
								<Box
									sx={{
										height: '118px',
										width: '118px',
										borderRadius: '12px',
										overflow: 'hidden',
										mb: '28px',
									}}
								>
									<Box
										component='img'
										src={logo}
										alt='Invoice logo'
										sx={{
											width: '100%',
											height: '100%',
											objectFit: 'contain',
											display: 'block',
										}}
									/>
								</Box>

								<TextField
									multiline
									minRows={10}
									fullWidth
									value={form.fromText}
									onChange={(e) =>
										setForm((current) => ({ ...current, fromText: e.target.value }))
									}
									sx={{
										...areaSx,
										maxWidth: '448px',
										'& .MuiOutlinedInput-root': {
											...areaSx['& .MuiOutlinedInput-root'],
											minHeight: '286px',
										},
										'& .MuiOutlinedInput-input': {
											padding: '14px 16px',
											fontSize: '14px',
											lineHeight: '1.45',
										},
									}}
								/>
							</Box>

							<Box>
								<Typography
									variant='h1'
									sx={{
										fontSize: '52px',
										lineHeight: 1,
										fontWeight: 800,
										textAlign: 'right',
										letterSpacing: '-0.03em',
										color: '#0d1730',
										mb: '22px',
									}}
								>
									INVOICE
								</Typography>

								<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '84px' }}>
									<Box sx={{ width: '202px' }}>
										<Box
											sx={{
												position: 'relative',
												width: '202px',
											}}
										>
											<Box
												sx={{
													position: 'absolute',
													left: '14px',
													top: '50%',
													transform: 'translateY(-50%)',
													color: '#667085',
													fontSize: '18px',
													lineHeight: 1,
													zIndex: 1,
													pointerEvents: 'none',
												}}
											>
												#
											</Box>

											<TextField
												fullWidth
												value={form.number}
												onChange={(e) =>
													setForm((current) => ({
														...current,
														number: e.target.value,
													}))
												}
												placeholder='115'
												sx={{
													...outlinedSx,
													'& .MuiOutlinedInput-input': {
														padding: '11px 14px 11px 34px',
														fontSize: '14px',
														textAlign: 'right',
													},
													'& .MuiInputBase-input::placeholder': {
														opacity: 1,
													},
												}}
											/>
										</Box>
									</Box>
								</Box>

								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '160px 1fr',
										columnGap: '18px',
										rowGap: '10px',
										alignItems: 'center',
										pl: '72px',
									}}
								>
									<Typography sx={{ fontSize: '13px', color: '#475467' }}>Date</Typography>
									<TextField
										fullWidth
										value={form.date}
										onChange={(e) =>
											setForm((current) => ({ ...current, date: e.target.value }))
										}
										sx={outlinedSx}
									/>

									<Typography sx={{ fontSize: '13px', color: '#475467' }}>
										Payment Terms
									</Typography>
									<TextField
										fullWidth
										value={form.paymentTerms}
										onChange={(e) =>
											setForm((current) => ({
												...current,
												paymentTerms: e.target.value,
											}))
										}
										sx={outlinedSx}
									/>

									<Typography sx={{ fontSize: '13px', color: '#475467' }}>
										Due Date
									</Typography>
									<TextField
										fullWidth
										value={form.dueDate}
										onChange={(e) =>
											setForm((current) => ({ ...current, dueDate: e.target.value }))
										}
										sx={outlinedSx}
									/>

									<Typography sx={{ fontSize: '13px', color: '#475467' }}>
										PO Number
									</Typography>
									<TextField
										fullWidth
										value={form.poNumber}
										onChange={(e) =>
											setForm((current) => ({ ...current, poNumber: e.target.value }))
										}
										sx={outlinedSx}
									/>
								</Box>
							</Box>
						</Box>

						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '28px',
								mb: '38px',
								maxWidth: '706px',
							}}
						>
							<Box>
								<Typography sx={labelSx}>Bill To</Typography>
								<TextField
									multiline
									minRows={3}
									fullWidth
									value={form.toText}
									onChange={(e) =>
										setForm((current) => ({ ...current, toText: e.target.value }))
									}
									sx={{
										...areaSx,
										'& .MuiOutlinedInput-root': {
											...areaSx['& .MuiOutlinedInput-root'],
											minHeight: '92px',
										},
										'& .MuiOutlinedInput-input': {
											padding: '12px 14px',
											fontSize: '14px',
											lineHeight: '1.45',
										},
									}}
								/>
							</Box>

							<Box>
								<Typography sx={labelSx}>Ship To</Typography>
								<TextField
									multiline
									minRows={3}
									fullWidth
									placeholder='(optional)'
									value={form.shipToText}
									onChange={(e) =>
										setForm((current) => ({ ...current, shipToText: e.target.value }))
									}
									sx={{
										...areaSx,
										'& .MuiOutlinedInput-root': {
											...areaSx['& .MuiOutlinedInput-root'],
											minHeight: '92px',
										},
										'& .MuiOutlinedInput-input': {
											padding: '12px 14px',
											fontSize: '14px',
											lineHeight: '1.45',
										},
									}}
								/>
							</Box>
						</Box>

						<Paper
							variant='outlined'
							sx={{
								borderRadius: '10px',
								overflow: 'hidden',
								mb: '34px',
								borderColor: '#d0d5dd',
							}}
						>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: '1fr 104px 128px 154px 38px',
									alignItems: 'center',
									background: '#1976d2',
									color: '#fff',
									px: '16px',
									height: '42px',
									fontSize: '14px',
									fontWeight: 700,
								}}
							>
								<Box>Item</Box>
								<Box sx={{ textAlign: 'center' }}>Quantity</Box>
								<Box sx={{ textAlign: 'center' }}>Rate</Box>
								<Box sx={{ textAlign: 'center' }}>Amount</Box>
								<Box />
							</Box>

							<Box sx={{ p: '10px 0 0 0' }}>
								{items.map((item) => {
									const amount = item.quantity * item.unitCost
									return (
										<Box
											key={item.id}
											sx={{
												display: 'grid',
												gridTemplateColumns: '1fr 104px 128px 154px 38px',
												gap: '8px',
												alignItems: 'center',
												px: '12px',
												mb: '8px',
											}}
										>
											<TextField
												value={item.name}
												onChange={(e) => updateItem(item.id, 'name', e.target.value)}
												sx={outlinedSx}
											/>
											<TextField
												value={item.quantity}
												onChange={(e) =>
													updateItem(item.id, 'quantity', Number(e.target.value))
												}
												sx={outlinedSx}
											/>
											<Box
												sx={{
													position: 'relative',
												}}
											>
												<Box
													sx={{
														position: 'absolute',
														left: '12px',
														top: '50%',
														transform: 'translateY(-50%)',
														color: '#667085',
														fontSize: '14px',
														lineHeight: 1,
														zIndex: 1,
														pointerEvents: 'none',
													}}
												>
													$
												</Box>

												<TextField
													value={item.unitCost}
													onChange={(e) =>
														updateItem(item.id, 'unitCost', Number(e.target.value))
													}
													sx={{
														...outlinedSx,
														'& .MuiOutlinedInput-input': {
															padding: '11px 12px 11px 26px',
															fontSize: '14px',
														},
													}}
												/>
											</Box>
											<Box
												sx={{
													fontSize: '14px',
													color: '#111827',
													whiteSpace: 'nowrap',
												}}
											>
												{formatMoney(amount, form.currency)}
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'center' }}>
												{items.length > 1 && item.id === items[items.length - 1].id ? (
													<IconButton
														onClick={() => removeItem(item.id)}
														sx={{ color: '#98a2b3' }}
													>
														<Close fontSize='small' />
													</IconButton>
												) : null}
											</Box>
										</Box>
									)
								})}

								<Box sx={{ px: '12px', pb: '14px', pt: '4px' }}>
									<Button
										variant='outlined'
										startIcon={<Add />}
										onClick={addItem}
										sx={{
											borderRadius: '10px',
											textTransform: 'none',
											color: '#1976d2',
											borderColor: '#1976d2',
											fontWeight: 600,
											px: 1.75,
											py: 0.9,
										}}
									>
										Line Item
									</Button>
								</Box>
							</Box>
						</Paper>

						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: '1fr 544px',
								gap: '34px',
								alignItems: 'start',
							}}
						>
							<Box>
								<Typography sx={{ ...labelSx, mb: '10px' }}>Notes</Typography>
								<TextField
									multiline
									minRows={2}
									fullWidth
									placeholder='Notes - any relevant information not already covered'
									value={form.notes}
									onChange={(e) =>
										setForm((current) => ({ ...current, notes: e.target.value }))
									}
									sx={{
										...areaSx,
										'& .MuiOutlinedInput-root': {
											...areaSx['& .MuiOutlinedInput-root'],
											minHeight: '72px',
										},
										'& .MuiOutlinedInput-input': {
											padding: '14px 14px',
											fontSize: '14px',
										},
									}}
								/>

								<Typography sx={{ ...labelSx, mt: '34px', mb: '10px' }}>Terms</Typography>
								<TextField
									multiline
									minRows={2}
									fullWidth
									placeholder='Terms and conditions - late fees, payment methods, delivery schedule'
									value={form.terms}
									onChange={(e) =>
										setForm((current) => ({ ...current, terms: e.target.value }))
									}
									sx={{
										...areaSx,
										'& .MuiOutlinedInput-root': {
											...areaSx['& .MuiOutlinedInput-root'],
											minHeight: '72px',
										},
										'& .MuiOutlinedInput-input': {
											padding: '14px 14px',
											fontSize: '14px',
										},
									}}
								/>
							</Box>

							<Box>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr 230px',
										rowGap: '16px',
										alignItems: 'center',
									}}
								>
									<Typography sx={{ fontSize: '14px', color: '#475467' }}>
										Subtotal
									</Typography>
									<Typography
										sx={{
											fontSize: '14px',
											fontWeight: 600,
											textAlign: 'right',
											color: '#111827',
										}}
									>
										{formatMoney(subtotal, form.currency)}
									</Typography>

									<Typography sx={{ fontSize: '14px', color: '#475467' }}>Tax</Typography>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: '1fr 48px 40px',
											gap: '0px',
											justifySelf: 'end',
											width: '170px',
										}}
									>
										<TextField
											value={form.taxValue}
											onChange={(e) =>
												setForm((current) => ({
													...current,
													taxValue: Number(e.target.value),
												}))
											}
											sx={{
												...outlinedSx,
												'& .MuiOutlinedInput-root': {
													...outlinedSx['& .MuiOutlinedInput-root'],
													borderTopRightRadius: 0,
													borderBottomRightRadius: 0,
												},
											}}
										/>
										<Box
											sx={{
												border: '1px solid #d0d5dd',
												borderLeft: 'none',
												height: '44px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '14px',
												color: '#475467',
												background: '#fff',
											}}
										>
											%
										</Box>
										<Box
											sx={{
												border: '1px solid #d0d5dd',
												borderLeft: 'none',
												borderTopRightRadius: '10px',
												borderBottomRightRadius: '10px',
												height: '44px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: '#667085',
												background: '#fff',
											}}
										>
											<Loop fontSize='small' />
										</Box>
									</Box>

									<Box
										sx={{
											display: 'flex',
											gap: '24px',
											gridColumn: '1 / span 2',
											mt: '-6px',
											mb: '2px',
										}}
									>
										<Typography
											sx={{
												fontSize: '14px',
												fontWeight: 600,
												color: '#1976d2',
												cursor: 'pointer',
											}}
										>
											+ Discount
										</Typography>
										<Typography
											sx={{
												fontSize: '14px',
												fontWeight: 600,
												color: '#1976d2',
												cursor: 'pointer',
											}}
										>
											+ Shipping
										</Typography>
									</Box>
								</Box>

								<Divider sx={{ my: '16px', borderColor: '#d0d5dd' }} />

								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr 230px',
										rowGap: '18px',
										alignItems: 'center',
									}}
								>
									<Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#101828' }}>
										Total
									</Typography>
									<Typography
										sx={{
											fontSize: '18px',
											fontWeight: 800,
											textAlign: 'right',
											color: '#101828',
										}}
									>
										{formatMoney(total, form.currency)}
									</Typography>

									<Typography sx={{ fontSize: '14px', color: '#475467' }}>
										Amount Paid
									</Typography>
									<Box sx={{ justifySelf: 'end', width: '170px' }}>
										<Box
											sx={{
												position: 'relative',
												width: '170px',
											}}
										>
											<Box
												sx={{
													position: 'absolute',
													left: '12px',
													top: '50%',
													transform: 'translateY(-50%)',
													color: '#667085',
													fontSize: '14px',
													lineHeight: 1,
													zIndex: 1,
													pointerEvents: 'none',
												}}
											>
												$
											</Box>

											<TextField
												fullWidth
												value={form.amountPaid}
												onChange={(e) =>
													setForm((current) => ({
														...current,
														amountPaid: Number(e.target.value),
													}))
												}
												sx={{
													...outlinedSx,
													'& .MuiOutlinedInput-input': {
														padding: '11px 12px 11px 26px',
														fontSize: '14px',
														textAlign: 'right',
													},
												}}
											/>
										</Box>
									</Box>
								</Box>

								<Divider sx={{ my: '16px', borderColor: '#d0d5dd' }} />

								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr 230px',
										alignItems: 'center',
									}}
								>
									<Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#101828' }}>
										Balance Due
									</Typography>
									<Typography
										sx={{
											fontSize: '26px',
											fontWeight: 800,
											textAlign: 'right',
											color: '#101828',
										}}
									>
										{formatMoney(balanceDue, form.currency)}
									</Typography>
								</Box>
							</Box>
						</Box>
					</CardContent>
				</Card>
			</Box>
		</Box>
	)
}

export default InvoiceFormStep
