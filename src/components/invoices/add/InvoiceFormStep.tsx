import { FC, useMemo, useState } from 'react'
import {
	Box,
	Button,
	Card,
	CardContent,
	Alert,
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
	type InvoiceItem as ApiInvoiceItem,
	type InvoiceLabels,
	useCreateInvoiceMutation,
	useGenerateInvoicePdfMutation,
	useUpdateInvoiceMutation,
} from '../../../store/invoices/invoicesApi'
import { API_BASE_URL } from '../../../api/baseApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import InvoiceStatusSelect from '../edit/InvoiceStatusSelect'

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
	invoice?: ApiInvoiceItem
	onBack?: () => void
	onSaved?: (invoice: ApiInvoiceItem) => void
}

type InvoiceFormLabels = InvoiceLabels & {
	from_title: string
	total_title: string
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

const normalizeDateInputValue = (dateValue: string | undefined, fallback: string) => {
	if (!dateValue) return fallback

	return dateValue.slice(0, 10)
}

const formatDisplayDate = (dateValue: string) => {
	if (!dateValue) return ''

	const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`)
	if (Number.isNaN(date.getTime())) return dateValue

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date)
}

const normalizeOptionalString = (value: string) => {
	const trimmedValue = value.trim()

	return trimmedValue.length > 0 ? trimmedValue : undefined
}

const normalizeOptionalDate = (value: string) => {
	return normalizeOptionalString(value)?.slice(0, 10)
}

const toNonNegativeNumber = (value: number) => {
	const numberValue = Number(value)

	if (!Number.isFinite(numberValue) || numberValue < 0) return 0

	return numberValue
}

const getInvoiceLogoUrl = () => {
	if (!logo) return undefined

	if (typeof window === 'undefined') return logo

	return new URL(logo, window.location.origin).toString()
}

const getGeneratedPdfUrl = (response: unknown) => {
	if (!response || typeof response !== 'object') return null

	const result = response as {
		url?: unknown
		pdfUrl?: unknown
		downloadUrl?: unknown
		path?: unknown
		filePath?: unknown
	}
	const url = result.pdfUrl ?? result.downloadUrl ?? result.url ?? result.path ?? result.filePath

	return typeof url === 'string' && url.trim() ? url : null
}

const resolveBackendUrl = (url: string) => {
	if (/^https?:\/\//i.test(url)) return url

	return new URL(url, API_BASE_URL).toString()
}

// const getFilenameFromUrl = (url: string) => {
// 	const pathname = new URL(url).pathname
// 	const filename = pathname.split('/').filter(Boolean).pop()
//
// 	return filename || 'invoice.pdf'
// }
//
// const downloadPdfFile = async (url: string) => {
// 	const pdfUrl = resolveBackendUrl(url)
// 	const response = await axiosInstance.get<Blob>(pdfUrl, { responseType: 'blob' })
// 	const objectUrl = URL.createObjectURL(response.data)
// 	const link = document.createElement('a')
//
// 	link.href = objectUrl
// 	link.download = getFilenameFromUrl(pdfUrl)
// 	document.body.appendChild(link)
// 	link.click()
// 	link.remove()
// 	URL.revokeObjectURL(objectUrl)
// }

const openPdfFile = (url: string) => {
	window.open(resolveBackendUrl(url), '_blank', 'noopener,noreferrer')
}

const API_LABEL_KEYS: Array<keyof InvoiceLabels> = [
	'to_title',
	'ship_to_title',
	'invoice_number_title',
	'date_title',
	'payment_terms_title',
	'due_date_title',
	'purchase_order_title',
	'item_header',
	'quantity_header',
	'unit_cost_header',
	'amount_header',
	'subtotal_title',
	'discounts_title',
	'tax_title',
	'shipping_title',
	'amount_paid_title',
	'balance_title',
	'notes_title',
	'terms_title',
]

const DEFAULT_LABELS: InvoiceFormLabels = {
	from_title: '',
	to_title: 'Bill To',
	ship_to_title: 'Ship To',
	notes_title: 'Notes',
	terms_title: 'Terms & Conditions',
	invoice_number_title: 'Invoice #',
	date_title: 'Date',
	due_date_title: 'Due Date',
	payment_terms_title: 'Payment Terms',
	purchase_order_title: 'PO Number',
	item_header: 'Description',
	quantity_header: 'Qty',
	unit_cost_header: 'Price',
	amount_header: 'Total',
	subtotal_title: 'Subtotal',
	tax_title: 'Tax',
	discounts_title: 'Discount',
	shipping_title: 'Shipping',
	total_title: 'Total',
	amount_paid_title: 'Amount Paid',
	balance_title: 'Balance Due',
}

const buildInitialForm = (party: Party, selectedType: PartyType, invoice?: ApiInvoiceItem) => {
	const isContractor = selectedType === 'contractor'
	const issueDate = formatDateInputValue(new Date())

	return {
		header: invoice?.header ?? 'INVOICE',
		number: invoice?.number ?? '',
		currency: invoice?.currency ?? party.currency ?? companyProfile.currency,
		date: normalizeDateInputValue(invoice?.date, issueDate),
		paymentTerms: invoice?.paymentTerms ?? '',
		dueDate: normalizeDateInputValue(invoice?.dueDate, ''),
		poNumber: invoice?.poNumber ?? '',
		fromValue:
			invoice?.fromValue ?? (isContractor ? party.invoiceBlock : companyProfile.invoiceBlock),
		toValue:
			invoice?.toValue ?? (isContractor ? companyProfile.invoiceBlock : party.invoiceBlock),
		shipTo: invoice?.shipTo ?? party.defaultShipTo ?? '',
		notes: invoice?.notes ?? '',
		terms: invoice?.terms ?? '',
		amountPaid: invoice?.amountPaid ?? 0,
		taxMode: 'percent' as 'percent' | 'fixed',
		tax: invoice?.tax ?? 0,
		discounts: invoice?.discounts ?? 0,
		shipping: invoice?.shipping ?? 0,
		showTax: invoice?.showTax ?? false,
		showDiscounts: invoice?.showDiscounts ?? false,
		showShipping: invoice?.showShipping ?? false,
		showShipTo: invoice?.showShipTo ?? Boolean(party.defaultShipTo),
	}
}

const buildChangedLabels = (labels: InvoiceFormLabels) => {
	return API_LABEL_KEYS.reduce<Partial<InvoiceLabels>>((acc, key) => {
		if (labels[key] !== DEFAULT_LABELS[key]) {
			acc[key] = labels[key]
		}

		return acc
	}, {})
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
			position: 'relative',
			width: '100%',
			minWidth: 0,
			cursor: 'text',
			zIndex: 0,
			...sx,
			'&::before': {
				content: '""',
				position: 'absolute',
				left: '-14px',
				right: '-14px',
				top: '50%',
				height: 'max(44px, calc(100% + 20px))',
				transform: 'translateY(-50%)',
				border: '1px solid transparent',
				borderRadius: '10px',
				backgroundColor: 'transparent',
				boxShadow: 'none',
				pointerEvents: 'none',
				transition:
					'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
				zIndex: 0,
			},
			'&:hover::before': {
				borderColor: '#d0d5dd',
				backgroundColor: '#fff',
			},
			'&:focus-within::before': {
				border: '2px solid #1c75d2',
				borderColor: '#1c75d2',
				backgroundColor: '#fff',
				boxShadow: '0 0 0 3px rgba(28, 117, 210, 0.14)',
			},
			'&:hover .MuiInputBase-input, &:focus-within .MuiInputBase-input': {
				color: '#101828',
			},
			'& .MuiInputBase-root': {
				position: 'relative',
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
				zIndex: 1,
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

const InvoiceFormStep: FC<Props> = ({ selectedType, selectedParty, invoice, onBack, onSaved }) => {
	const { showToast } = useToast()
	const [form, setForm] = useState(() => buildInitialForm(selectedParty, selectedType, invoice))
	const [labels, setLabels] = useState<InvoiceFormLabels>(() => ({
		...DEFAULT_LABELS,
		...(invoice?.labels ?? {}),
	}))
	const [formError, setFormError] = useState('')
	const [dateFocused, setDateFocused] = useState(false)
	const [items, setItems] = useState<InvoiceItem[]>(() => {
		if (invoice?.lineItems?.length) {
			return invoice.lineItems
				.slice()
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map((item, index) => ({
					id: item.id ?? `${index}`,
					name: item.name ?? '',
					quantity: toNonNegativeNumber(item.quantity),
					unitCost: toNonNegativeNumber(item.unitCost),
				}))
		}

		return [{ id: '1', name: '', quantity: 1, unitCost: 0 }]
	})
	const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation()
	const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation()
	const [generateInvoicePdf, { isLoading: isGenerating }] = useGenerateInvoicePdfMutation()
	const saving = isSaving || isUpdating || isGenerating

	const subtotal = useMemo(() => {
		return items.reduce(
			(sum, item) =>
				sum + toNonNegativeNumber(item.quantity) * toNonNegativeNumber(item.unitCost),
			0
		)
	}, [items])

	const taxAmount = useMemo(() => {
		if (!form.showTax) return 0

		const tax = toNonNegativeNumber(form.tax)

		return form.taxMode === 'percent' ? subtotal * (tax / 100) : tax
	}, [form.showTax, form.taxMode, form.tax, subtotal])

	const total = useMemo(() => {
		const discounts = form.showDiscounts ? toNonNegativeNumber(form.discounts) : 0
		const shipping = form.showShipping ? toNonNegativeNumber(form.shipping) : 0

		return subtotal + taxAmount + shipping - discounts
	}, [subtotal, taxAmount, form.showDiscounts, form.discounts, form.showShipping, form.shipping])

	const balanceDue = useMemo(() => {
		return Math.max(total - toNonNegativeNumber(form.amountPaid), 0)
	}, [total, form.amountPaid])

	const updateItem = (id: string, key: keyof InvoiceItem, value: string | number) => {
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
		)
	}

	const updateLabel = (key: keyof InvoiceFormLabels, value: string) => {
		setLabels((current) => ({ ...current, [key]: value }))
	}

	const buildInvoicePayload = (): InvoiceCreatePayload => {
		const changedLabels = buildChangedLabels(labels)
		const logoUrl = invoice ? undefined : getInvoiceLogoUrl()
		const tax = toNonNegativeNumber(form.tax)
		const discounts = toNonNegativeNumber(form.discounts)
		const shipping = toNonNegativeNumber(form.shipping)
		const amountPaid = toNonNegativeNumber(form.amountPaid)
		const lineItems = items
			.map((item, index) => ({
				name: normalizeOptionalString(item.name),
				quantity: toNonNegativeNumber(item.quantity),
				unitCost: toNonNegativeNumber(item.unitCost),
				sortOrder: index,
			}))
			.filter((item) => item.name || (item.quantity > 0 && item.unitCost > 0))

		return {
			counterpartyId: selectedParty.id,
			number: form.number.trim(),
			currency: form.currency,
			date: form.date,
			dueDate: form.dueDate.slice(0, 10),
			paymentTerms: form.paymentTerms.trim(),
			poNumber: form.poNumber.trim(),
			header: form.header,
			...(logoUrl ? { logoUrl } : {}),
			fromValue: form.fromValue,
			toValue: form.toValue,
			shipTo: form.shipTo.trim(),
			notes: form.notes.trim(),
			terms: form.terms.trim(),
			tax,
			discounts: form.showDiscounts ? discounts : 0,
			shipping: form.showShipping ? shipping : 0,
			amountPaid,
			showTax: form.showTax,
			showDiscounts: form.showDiscounts,
			showShipping: form.showShipping,
			showShipTo: form.showShipTo && Boolean(normalizeOptionalString(form.shipTo)),
			lineItems,
			...(Object.keys(changedLabels).length > 0 ? { labels: changedLabels } : {}),
		}
	}

	const saveInvoice = async () => {
		const payload = buildInvoicePayload()

		return invoice
			? await updateInvoice({ id: invoice.id, body: payload }).unwrap()
			: await createInvoice(payload).unwrap()
	}

	const handleSaveInvoice = async (shouldGeneratePdf = false) => {
		try {
			setFormError('')

			if (!form.date.trim()) {
				setFormError('Enter invoice date.')
				return
			}

			const savedInvoice = await saveInvoice()

			if (shouldGeneratePdf) {
				const generatedPdf = await generateInvoicePdf(savedInvoice.id).unwrap()
				const pdfUrl = getGeneratedPdfUrl(generatedPdf)

				if (pdfUrl) {
					openPdfFile(pdfUrl)
				}

				showToast('Invoice PDF generated successfully', 'success')
			} else {
				showToast(
					invoice ? 'Invoice updated successfully' : 'Invoice created successfully',
					'success'
				)
			}

			onSaved?.(savedInvoice)
		} catch (error) {
			setFormError(parseServerError(error))
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
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								{invoice ? (
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'flex-end',
											alignItems: 'center',
										}}
									>
										<InvoiceStatusSelect id={invoice.id} status={invoice.status} />
									</Box>
								) : null}
								<Box sx={{ display: 'flex', gap: 1.5 }}>
									<Button
										variant='contained'
										disabled={saving}
										onClick={() => handleSaveInvoice(true)}
									>
										Create PDF
									</Button>
									<Button
										variant='outlined'
										disabled={saving}
										onClick={() => handleSaveInvoice(false)}
									>
										{invoice ? 'Save Changes' : 'Save Draft'}
									</Button>
								</Box>
								{formError ? (
									<Alert severity='error' sx={{ maxWidth: 360, whiteSpace: 'pre-line' }}>
										{formError}
									</Alert>
								) : null}
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
													width: '82px',
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
														padding: '11px 14px 11px 104px',
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
										type={dateFocused ? 'date' : 'text'}
										fullWidth
										value={dateFocused ? form.date : formatDisplayDate(form.date)}
										onFocus={() => setDateFocused(true)}
										onBlur={() => setDateFocused(false)}
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
									const amount =
										toNonNegativeNumber(item.quantity) *
										toNonNegativeNumber(item.unitCost)
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

									{form.showTax ? (
										<>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												<EditableLabel
													value={labels.tax_title}
													onChange={(value) => updateLabel('tax_title', value)}
													ariaLabel='Tax label'
													sx={{ fontSize: '14px', color: '#475467', flex: 1, minWidth: 0 }}
												/>
												<IconButton
													size='small'
													onClick={() =>
														setForm((current) => ({
															...current,
															showTax: false,
															tax: 0,
														}))
													}
													sx={{ color: '#98a2b3', p: 0.25, flexShrink: 0 }}
												>
													<Close sx={{ fontSize: 14 }} />
												</IconButton>
											</Box>
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
										</>
									) : null}

									{form.showDiscounts ? (
										<>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												<EditableLabel
													value={labels.discounts_title}
													onChange={(value) => updateLabel('discounts_title', value)}
													ariaLabel='Discounts label'
													sx={{ fontSize: '14px', color: '#475467', flex: 1, minWidth: 0 }}
												/>
												<IconButton
													size='small'
													onClick={() =>
														setForm((current) => ({
															...current,
															showDiscounts: false,
															discounts: 0,
														}))
													}
													sx={{ color: '#98a2b3', p: 0.25, flexShrink: 0 }}
												>
													<Close sx={{ fontSize: 14 }} />
												</IconButton>
											</Box>
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
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												<EditableLabel
													value={labels.shipping_title}
													onChange={(value) => updateLabel('shipping_title', value)}
													ariaLabel='Shipping label'
													sx={{ fontSize: '14px', color: '#475467', flex: 1, minWidth: 0 }}
												/>
												<IconButton
													size='small'
													onClick={() =>
														setForm((current) => ({
															...current,
															showShipping: false,
															shipping: 0,
														}))
													}
													sx={{ color: '#98a2b3', p: 0.25, flexShrink: 0 }}
												>
													<Close sx={{ fontSize: 14 }} />
												</IconButton>
											</Box>
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

									{!form.showTax || !form.showDiscounts || !form.showShipping ? (
										<Box
											sx={{
												display: 'flex',
												gap: '24px',
												gridColumn: '1 / span 2',
												mt: '-6px',
												mb: '2px',
											}}
										>
											{!form.showTax ? (
												<Typography
													onClick={() =>
														setForm((current) => ({ ...current, showTax: true }))
													}
													sx={{
														fontSize: '14px',
														fontWeight: 600,
														color: '#1976d2',
														cursor: 'pointer',
													}}
												>
													+ Tax
												</Typography>
											) : null}
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
