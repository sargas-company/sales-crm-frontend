import { FC, useMemo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	Paper,
	TextField,
	Typography,
} from '@mui/material'
import { Add, ArrowBack, Close, Loop } from '@mui/icons-material'
import logo from '../../../assets/logo.png'
import {
	type InvoiceCreatePayload,
	type InvoiceLabels,
	useCreateInvoiceMutation,
} from '../../../store/invoices/invoicesApi'

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

type EditableLabelProps = {
	value: string
	onChange: (value: string) => void
	sx?: Record<string, unknown>
	inputSx?: Record<string, unknown>
	ariaLabel: string
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

const formatDateInputValue = (date: Date) => {
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')

	return `${year}-${month}-${day}`
}

const addDays = (dateValue: string, days: number) => {
	const date = new Date(`${dateValue}T00:00:00`)
	date.setDate(date.getDate() + days)

	return formatDateInputValue(date)
}

const DEFAULT_LABELS: InvoiceLabels = {
	from_title: '',
	to_title: 'Bill To',
	ship_to_title: 'Ship To',
	notes_title: 'Notes',
	terms_title: 'Terms',
	invoice_number_title: '#',
	date_title: 'Date',
	due_date_title: 'Due Date',
	payment_terms_title: 'Payment Terms',
	purchase_order_title: 'Purchase Order',
	item_header: 'Item',
	quantity_header: 'Quantity',
	unit_cost_header: 'Rate',
	amount_header: 'Amount',
	subtotal_title: 'Subtotal',
	tax_title: 'Tax',
	discounts_title: 'Discounts',
	shipping_title: 'Shipping',
	total_title: 'Total',
	amount_paid_title: 'Amount Paid',
	balance_title: 'Balance Due',
}

const buildInitialForm = (party: Party, selectedType: PartyType) => {
	const isContractor = selectedType === 'contractor'
	const issueDate = formatDateInputValue(new Date())

	return {
		header: 'INVOICE',
		number: '115',
		currency: party.currency || companyProfile.currency,
		date: issueDate,
		paymentTerms: '',
		dueDate: addDays(issueDate, 30),
		poNumber: '',
		fromValue: isContractor ? party.invoiceBlock : companyProfile.invoiceBlock,
		toValue: isContractor ? companyProfile.invoiceBlock : party.invoiceBlock,
		shipTo: party.defaultShipTo || '',
		notes: '',
		terms: '',
		amountPaid: 0,
		taxMode: 'percent' as 'percent' | 'fixed',
		tax: 0,
		discounts: 0,
		shipping: 0,
		showTax: true,
		showDiscounts: false,
		showShipping: false,
		showShipTo: Boolean(party.defaultShipTo),
	}
}

const buildChangedLabels = (labels: InvoiceLabels) => {
	return (Object.keys(labels) as Array<keyof InvoiceLabels>).reduce<Partial<InvoiceLabels>>(
		(acc, key) => {
			if (labels[key] !== DEFAULT_LABELS[key]) {
				acc[key] = labels[key]
			}

			return acc
		},
		{}
	)
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

const EditableLabel: FC<EditableLabelProps> = ({ value, onChange, sx, inputSx, ariaLabel }) => (
	<TextField
		variant='standard'
		value={value}
		onChange={(e) => onChange(e.target.value)}
		slotProps={{
			input: { disableUnderline: true },
			htmlInput: { 'aria-label': ariaLabel },
		}}
		sx={{
			width: '100%',
			minWidth: 0,
			...sx,
			'& .MuiInputBase-root': {
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
			},
			'& .MuiInputBase-input': {
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
				p: 0,
				textAlign: 'inherit',
				...inputSx,
			},
		}}
	/>
)

const InvoiceFormStep: FC<Props> = ({ selectedType, selectedParty, onBack }) => {
	const [form, setForm] = useState(() => buildInitialForm(selectedParty, selectedType))
	const [labels, setLabels] = useState<InvoiceLabels>(DEFAULT_LABELS)
	const [items, setItems] = useState<InvoiceItem[]>([
		{ id: '1', name: 'Web Development services', quantity: 160, unitCost: 1.87 },
		{ id: '2', name: 'Bonus', quantity: 1, unitCost: 252.8 },
	])
	const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation()

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
	}, [items])

	const taxAmount = useMemo(() => {
		if (!form.showTax) return 0

		return form.taxMode === 'percent' ? subtotal * (form.tax / 100) : form.tax
	}, [form.showTax, form.taxMode, form.tax, subtotal])

	const total = useMemo(() => {
		const discounts = form.showDiscounts ? form.discounts : 0
		const shipping = form.showShipping ? form.shipping : 0

		return subtotal + taxAmount + shipping - discounts
	}, [subtotal, taxAmount, form.showDiscounts, form.discounts, form.showShipping, form.shipping])

	const balanceDue = useMemo(() => {
		return Math.max(total - form.amountPaid, 0)
	}, [total, form.amountPaid])

	const updateItem = (id: string, key: keyof InvoiceItem, value: string | number) => {
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
		)
	}

	const updateLabel = (key: keyof InvoiceLabels, value: string) => {
		setLabels((current) => ({ ...current, [key]: value }))
	}

	const buildInvoicePayload = (): InvoiceCreatePayload => {
		const changedLabels = buildChangedLabels(labels)

		return {
			//counterpartyId: selectedParty.id,
			counterpartyId: '7aa7310e-cfa3-4efd-9205-c963ad3b42d4',
			number: form.number,
			currency: form.currency,
			date: form.date,
			dueDate: form.dueDate,
			paymentTerms: form.paymentTerms,
			poNumber: form.poNumber,
			header: form.header,
			fromValue: form.fromValue,
			toValue: form.toValue,
			shipTo: form.shipTo,
			notes: form.notes,
			terms: form.terms,
			tax: form.tax,
			discounts: form.showDiscounts ? form.discounts : 0,
			shipping: form.showShipping ? form.shipping : 0,
			amountPaid: form.amountPaid,
			showTax: form.showTax,
			showDiscounts: form.showDiscounts,
			showShipping: form.showShipping,
			showShipTo: form.showShipTo,
			lineItems: items.map((item, index) => ({
				name: item.name,
				quantity: item.quantity,
				unitCost: item.unitCost,
				sortOrder: index,
			})),
			...(Object.keys(changedLabels).length > 0 ? { labels: changedLabels } : {}),
		}
	}

	const handleCreateInvoice = async () => {
		try {
			await createInvoice(buildInvoicePayload()).unwrap()
		} catch (error) {
			console.error('Failed to create invoice', error)
		}
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
								<Button
									variant='contained'
									disabled={isSaving}
									onClick={handleCreateInvoice}
								>
									Create PDF
								</Button>
								<Button
									variant='outlined'
									disabled={isSaving}
									onClick={handleCreateInvoice}
								>
									Save Draft
								</Button>
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
										mb: '6px',
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

								<EditableLabel
									value={labels.from_title}
									onChange={(value) => updateLabel('from_title', value)}
									ariaLabel='From label'
									sx={{ ...labelSx, maxWidth: '448px', mb: '4px', height: '18px' }}
								/>

								<TextField
									multiline
									minRows={10}
									fullWidth
									value={form.fromValue}
									onChange={(e) =>
										setForm((current) => ({ ...current, fromValue: e.target.value }))
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
								<EditableLabel
									value={form.header}
									onChange={(value) =>
										setForm((current) => ({ ...current, header: value }))
									}
									ariaLabel='Document title'
									sx={{
										fontSize: '52px',
										lineHeight: 1,
										fontWeight: 800,
										textAlign: 'right',
										letterSpacing: '-0.03em',
										color: '#0d1730',
										mb: '22px',
									}}
								/>

								<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '84px' }}>
									<Box sx={{ width: '202px' }}>
										<Box
											sx={{
												position: 'relative',
												width: '202px',
											}}
										>
											<EditableLabel
												value={labels.invoice_number_title}
												onChange={(value) => updateLabel('invoice_number_title', value)}
												ariaLabel='Invoice number label'
												sx={{
													position: 'absolute',
													left: '14px',
													top: '50%',
													transform: 'translateY(-50%)',
													color: '#667085',
													fontSize: '18px',
													lineHeight: 1,
													zIndex: 1,
													width: '32px',
												}}
											/>

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
									<EditableLabel
										value={labels.date_title}
										onChange={(value) => updateLabel('date_title', value)}
										ariaLabel='Date label'
										sx={{ fontSize: '13px', color: '#475467' }}
									/>
									<TextField
										type='date'
										fullWidth
										value={form.date}
										onChange={(e) =>
											setForm((current) => ({ ...current, date: e.target.value }))
										}
										sx={outlinedSx}
									/>

									<EditableLabel
										value={labels.payment_terms_title}
										onChange={(value) => updateLabel('payment_terms_title', value)}
										ariaLabel='Payment terms label'
										sx={{ fontSize: '13px', color: '#475467' }}
									/>
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

									<EditableLabel
										value={labels.due_date_title}
										onChange={(value) => updateLabel('due_date_title', value)}
										ariaLabel='Due date label'
										sx={{ fontSize: '13px', color: '#475467' }}
									/>
									<TextField
										type='date'
										fullWidth
										value={form.dueDate}
										onChange={(e) =>
											setForm((current) => ({ ...current, dueDate: e.target.value }))
										}
										sx={outlinedSx}
									/>

									<EditableLabel
										value={labels.purchase_order_title}
										onChange={(value) => updateLabel('purchase_order_title', value)}
										ariaLabel='Purchase order label'
										sx={{ fontSize: '13px', color: '#475467' }}
									/>
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
								<EditableLabel
									value={labels.to_title}
									onChange={(value) => updateLabel('to_title', value)}
									ariaLabel='Bill to label'
									sx={labelSx}
								/>
								<TextField
									multiline
									minRows={3}
									fullWidth
									value={form.toValue}
									onChange={(e) =>
										setForm((current) => ({ ...current, toValue: e.target.value }))
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
								<EditableLabel
									value={labels.ship_to_title}
									onChange={(value) => updateLabel('ship_to_title', value)}
									ariaLabel='Ship to label'
									sx={labelSx}
								/>
								<TextField
									multiline
									minRows={3}
									fullWidth
									placeholder='(optional)'
									value={form.shipTo}
									onChange={(e) => {
										const shipTo = e.target.value

										setForm((current) => ({
											...current,
											shipTo,
											showShipTo: shipTo.trim().length > 0,
										}))
									}}
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
								<EditableLabel
									value={labels.item_header}
									onChange={(value) => updateLabel('item_header', value)}
									ariaLabel='Item header'
								/>
								<EditableLabel
									value={labels.quantity_header}
									onChange={(value) => updateLabel('quantity_header', value)}
									ariaLabel='Quantity header'
									sx={{ textAlign: 'center' }}
								/>
								<EditableLabel
									value={labels.unit_cost_header}
									onChange={(value) => updateLabel('unit_cost_header', value)}
									ariaLabel='Rate header'
									sx={{ textAlign: 'center' }}
								/>
								<EditableLabel
									value={labels.amount_header}
									onChange={(value) => updateLabel('amount_header', value)}
									ariaLabel='Amount header'
									sx={{ textAlign: 'center' }}
								/>
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
								<EditableLabel
									value={labels.notes_title}
									onChange={(value) => updateLabel('notes_title', value)}
									ariaLabel='Notes label'
									sx={{ ...labelSx, mb: '10px' }}
								/>
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

								<EditableLabel
									value={labels.terms_title}
									onChange={(value) => updateLabel('terms_title', value)}
									ariaLabel='Terms label'
									sx={{ ...labelSx, mt: '34px', mb: '10px' }}
								/>
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
									<EditableLabel
										value={labels.subtotal_title}
										onChange={(value) => updateLabel('subtotal_title', value)}
										ariaLabel='Subtotal label'
										sx={{ fontSize: '14px', color: '#475467' }}
									/>
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

									<EditableLabel
										value={labels.tax_title}
										onChange={(value) => updateLabel('tax_title', value)}
										ariaLabel='Tax label'
										sx={{ fontSize: '14px', color: '#475467' }}
									/>
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
											value={form.tax}
											onChange={(e) =>
												setForm((current) => ({
													...current,
													tax: Number(e.target.value),
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

									{form.showDiscounts ? (
										<>
											<EditableLabel
												value={labels.discounts_title}
												onChange={(value) => updateLabel('discounts_title', value)}
												ariaLabel='Discounts label'
												sx={{ fontSize: '14px', color: '#475467' }}
											/>
											<Box sx={{ justifySelf: 'end', width: '170px' }}>
												<Box sx={{ position: 'relative', width: '170px' }}>
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
														value={form.discounts}
														onChange={(e) =>
															setForm((current) => ({
																...current,
																discounts: Number(e.target.value),
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
										</>
									) : null}

									{form.showShipping ? (
										<>
											<EditableLabel
												value={labels.shipping_title}
												onChange={(value) => updateLabel('shipping_title', value)}
												ariaLabel='Shipping label'
												sx={{ fontSize: '14px', color: '#475467' }}
											/>
											<Box sx={{ justifySelf: 'end', width: '170px' }}>
												<Box sx={{ position: 'relative', width: '170px' }}>
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
														value={form.shipping}
														onChange={(e) =>
															setForm((current) => ({
																...current,
																shipping: Number(e.target.value),
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
										</>
									) : null}

									{!form.showDiscounts || !form.showShipping ? (
										<Box
											sx={{
												display: 'flex',
												gap: '24px',
												gridColumn: '1 / span 2',
												mt: '-6px',
												mb: '2px',
											}}
										>
											{!form.showDiscounts ? (
												<Typography
													onClick={() =>
														setForm((current) => ({
															...current,
															showDiscounts: true,
														}))
													}
													sx={{
														fontSize: '14px',
														fontWeight: 600,
														color: '#1976d2',
														cursor: 'pointer',
													}}
												>
													+ Discount
												</Typography>
											) : null}
											{!form.showShipping ? (
												<Typography
													onClick={() =>
														setForm((current) => ({
															...current,
															showShipping: true,
														}))
													}
													sx={{
														fontSize: '14px',
														fontWeight: 600,
														color: '#1976d2',
														cursor: 'pointer',
													}}
												>
													+ Shipping
												</Typography>
											) : null}
										</Box>
									) : null}
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
									<EditableLabel
										value={labels.total_title}
										onChange={(value) => updateLabel('total_title', value)}
										ariaLabel='Total label'
										sx={{ fontSize: '18px', fontWeight: 700, color: '#101828' }}
									/>
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

									<EditableLabel
										value={labels.amount_paid_title}
										onChange={(value) => updateLabel('amount_paid_title', value)}
										ariaLabel='Amount paid label'
										sx={{ fontSize: '14px', color: '#475467' }}
									/>
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
									<EditableLabel
										value={labels.balance_title}
										onChange={(value) => updateLabel('balance_title', value)}
										ariaLabel='Balance due label'
										sx={{ fontSize: '26px', fontWeight: 800, color: '#101828' }}
									/>
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
