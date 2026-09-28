import { FC, useEffect, useMemo, useState } from 'react'
import { Alert, Box, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import {
	Search,
	ArrowForwardRounded,
	BusinessOutlined,
	PeopleOutlined,
	CheckRounded,
	ReceiptLongOutlined,
} from '@mui/icons-material'
import {
	type CounterpartyItem,
	useGetCounterpartiesQuery,
} from '../../../store/counterparties/counterpartiesApi'
import {
	type InvoiceItem as ApiInvoiceItem,
	useGetInvoiceByIdQuery,
	useGetInvoiceListQuery,
} from '../../../store/invoices/invoicesApi'

type PartyType = 'contractor' | 'client'

type Party = {
	id: string
	type: PartyType
	displayName: string
	currency: 'USD' | 'EUR' | 'UAH'
	invoiceBlock: string
}

const COUNTERPARTY_LIMIT = 1000

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'
const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'
const CANVAS = 'transparent'

type ReuseLineItemLite = {
	name: string
	quantity: number
	unitCost: number
}

const getInvoiceTotal = (invoice: ApiInvoiceItem) => {
	const subtotal = (invoice.lineItems ?? []).reduce(
		(sum, item) => sum + item.quantity * item.unitCost,
		0
	)
	const tax = invoice.showTax ? subtotal * ((invoice.tax || 0) / 100) : 0
	const discounts = invoice.showDiscounts ? invoice.discounts || 0 : 0
	const shipping = invoice.showShipping ? invoice.shipping || 0 : 0
	return subtotal + tax + shipping - discounts
}

const formatMoney = (value: number, currency: string) => {
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

const SARGAS_BLOCK = [
	'Sargas Agency OÜ',
	'Narva mnt 7',
	'Tallinn, 10117',
	'Estonia',
	'ID 17146771 · VAT EE102840485',
].join('\n')

const getCounterpartyDisplayName = (c: CounterpartyItem) => {
	const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
	return fullName || c.info?.split('\n')[0]?.trim() || `Counterparty ${c.id.slice(0, 8)}`
}

const partyInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[1][0]).toUpperCase()
}

const mapCounterpartyToParty = (c: CounterpartyItem): Party => {
	const displayName = getCounterpartyDisplayName(c)
	const info = c.info?.trim()
	return {
		id: c.id,
		type: c.type,
		displayName,
		currency: 'USD',
		invoiceBlock: [displayName, info].filter(Boolean).join('\n'),
	}
}

type Props = {
	onContinue?: (payload: {
		type: PartyType
		party: Party
		reuseLineItems?: ReuseLineItemLite[]
	}) => void
}

const InvoicePartyStep: FC<Props> = ({ onContinue }) => {
	const [selectedType, setSelectedType] = useState<PartyType>('contractor')
	const [search, setSearch] = useState('')
	const [selectedPartyId, setSelectedPartyId] = useState('')
	const [reuseItems, setReuseItems] = useState(false)

	const { data, isLoading, isError } = useGetCounterpartiesQuery({
		page: 1,
		limit: COUNTERPARTY_LIMIT,
	})

	const { data: invoicesData } = useGetInvoiceListQuery({ page: 1, limit: 1000 })

	const allInvoices = useMemo(() => {
		if (!invoicesData) return [] as ApiInvoiceItem[]
		return Array.isArray(invoicesData) ? invoicesData : invoicesData.data
	}, [invoicesData])

	const parties = useMemo(() => (data?.data ?? []).map(mapCounterpartyToParty), [data?.data])
	const contractorCount = useMemo(
		() => parties.filter((p) => p.type === 'contractor').length,
		[parties]
	)
	const clientCount = useMemo(() => parties.filter((p) => p.type === 'client').length, [parties])

	const filteredParties = useMemo(() => {
		const q = search.toLowerCase()
		return parties.filter(
			(p) =>
				p.type === selectedType &&
				(p.displayName.toLowerCase().includes(q) || p.invoiceBlock.toLowerCase().includes(q))
		)
	}, [parties, selectedType, search])

	const selectedParty = useMemo(
		() => parties.find((p) => p.id === selectedPartyId) || null,
		[parties, selectedPartyId]
	)

	// The list endpoint does not populate lineItems — filter on counterpartyId
	// only, then fetch the full detail below to know real line items.
	const listedPartyInvoice = useMemo(() => {
		if (!selectedParty) return null as ApiInvoiceItem | null
		const matches = allInvoices
			.filter((i) => i.counterpartyId === selectedParty.id)
			.slice()
			.sort((a, b) => {
				const aT = new Date(a.createdAt || 0).getTime()
				const bT = new Date(b.createdAt || 0).getTime()
				return bT - aT
			})
		return matches[0] || null
	}, [allInvoices, selectedParty])

	// `currentData` reflects only the argument currently subscribed to; `data`
	// keeps the last non-skipped result and would linger after switching to a
	// party that has no invoices.
	const { currentData: fullLastInvoice } = useGetInvoiceByIdQuery(listedPartyInvoice?.id ?? '', {
		skip: !listedPartyInvoice?.id,
	})

	const lastPartyInvoice = useMemo(() => {
		if (!listedPartyInvoice || !selectedParty || !fullLastInvoice) return null as ApiInvoiceItem | null
		// Guard against a stale cross-party detail from RTK Query cache.
		if (fullLastInvoice.id !== listedPartyInvoice.id) return null
		if (fullLastInvoice.counterpartyId !== selectedParty.id) return null
		if (!fullLastInvoice.lineItems || fullLastInvoice.lineItems.length === 0) return null
		return fullLastInvoice
	}, [listedPartyInvoice, selectedParty, fullLastInvoice])

	// Reset the reuse toggle whenever the selected party changes.
	useEffect(() => {
		setReuseItems(false)
	}, [selectedPartyId])

	const handleContinue = () => {
		if (!selectedParty) return
		const payload: {
			type: PartyType
			party: Party
			reuseLineItems?: ReuseLineItemLite[]
		} = { type: selectedType, party: selectedParty }
		if (reuseItems && lastPartyInvoice?.lineItems?.length) {
			payload.reuseLineItems = lastPartyInvoice.lineItems.map((li) => ({
				name: li.name,
				quantity: li.quantity,
				unitCost: li.unitCost,
			}))
		}
		onContinue?.(payload)
	}

	const from = selectedParty
		? selectedType === 'contractor'
			? selectedParty.invoiceBlock
			: SARGAS_BLOCK
		: null
	const to = selectedParty
		? selectedType === 'contractor'
			? SARGAS_BLOCK
			: selectedParty.invoiceBlock
		: null

	return (
		<Box sx={{ background: CANVAS, p: 0 }}>
			<Box sx={{ width: '100%' }}>
				<Box
					sx={{
						background: '#fff',
						borderRadius: '18px',
						boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 40px rgba(39, 36, 45, 0.06)',
						overflow: 'hidden',
						animation: 'invoiceShellIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
						'@keyframes invoiceShellIn': {
							from: { opacity: 0, transform: 'translateY(10px)' },
							to: { opacity: 1, transform: 'translateY(0)' },
						},
						'@media (prefers-reduced-motion: reduce)': {
							animation: 'none',
						},
					}}
				>
					<Box
						sx={{
							p: { xs: 3, md: '38px 40px 36px 40px' },
							display: 'flex',
							flexDirection: 'column',
							gap: 4,
							position: 'relative',
						}}
					>
						{/* Hand-written corner accent — cursive tag with a doodle arrow
						    pointing back at the header, positioned in the top-right corner
						    like a margin note on a paper invoice. */}
						<Box
							aria-hidden
							sx={{
								position: 'absolute',
								top: { xs: 24, md: 56 },
								right: { xs: 14, md: 40 },
								pointerEvents: 'none',
								userSelect: 'none',
								display: { xs: 'none', sm: 'inline-flex' },
								flexDirection: 'column',
								alignItems: 'flex-end',
								gap: 0.25,
								zIndex: 2,
							}}
						>
							<Box
								component='span'
								className='invoice-hand-line'
								sx={{
									fontFamily: '"Caveat", "Brush Script MT", cursive',
									fontSize: { xs: 40, md: 54 },
									fontWeight: 700,
									lineHeight: 1,
									color: PRIMARY,
									transform: 'rotate(-6deg)',
									transformOrigin: 'right center',
									textShadow: '0 6px 22px rgba(2, 132, 199, 0.18)',
									whiteSpace: 'nowrap',
									animation:
										'invoiceHandDraw 900ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both',
									'@keyframes invoiceHandDraw': {
										from: { opacity: 0, transform: 'translate(6px, 4px) rotate(-6deg)' },
										to: { opacity: 1, transform: 'translate(0, 0) rotate(-6deg)' },
									},
								}}
							>
								ink it &amp; go
							</Box>
							<Box
								component='svg'
								viewBox='0 0 90 40'
								width='90'
								height='40'
								sx={{
									color: PRIMARY,
									opacity: 0.75,
									transform: 'rotate(-4deg) scaleX(-1)',
									mr: 2,
									mt: -0.5,
									'& path': {
										strokeDasharray: 220,
										strokeDashoffset: 220,
										animation:
											'invoiceFlourish 1100ms cubic-bezier(0.22, 1, 0.36, 1) 550ms forwards',
									},
									'@keyframes invoiceFlourish': {
										to: { strokeDashoffset: 0 },
									},
								}}
							>
								<path
									d='M4 6 C 22 18, 48 4, 76 26'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.2'
									strokeLinecap='round'
								/>
								<path
									d='M68 20 L 78 26 L 70 34'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</Box>
						</Box>

						{/* ── Editorial header ─────────────────────────── */}
						<Box sx={{ position: 'relative', pt: 1 }}>
							<Box
								aria-hidden
								sx={{
									position: 'absolute',
									top: -32,
									left: -10,
									fontFamily: 'inherit',
									fontSize: { xs: 140, md: 200 },
									fontWeight: 900,
									lineHeight: 1,
									color: 'transparent',
									WebkitTextStroke: `1.5px ${PRIMARY}18`,
									letterSpacing: '-0.03em',
									pointerEvents: 'none',
									userSelect: 'none',
								}}
							>
								01
							</Box>

							<Box sx={{ position: 'relative', zIndex: 1 }}>
								<Stack direction='row' spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
									<Box sx={{ width: 26, height: 2, background: PRIMARY }} />
									<Typography
										sx={{
											color: PRIMARY,
											fontSize: 12,
											fontWeight: 700,
											letterSpacing: '0.22em',
											textTransform: 'uppercase',
										}}
									>
										New invoice
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: { xs: 26, md: 34 },
										fontWeight: 800,
										lineHeight: 1.15,
										letterSpacing: '-0.02em',
										color: INK,
										maxWidth: 780,
									}}
								>
									Choose who this invoice is for.
								</Typography>
								<Typography sx={{ color: INK_60, fontSize: 15, mt: 1.5, maxWidth: 620 }}>
									Contractors bill you; clients pay you. Pick a party and we'll flip the
									bill-from / bill-to sides automatically.
								</Typography>
							</Box>
						</Box>

						{/* ── Full-width progress bar ─────────────────── */}
						<ProgressBar current={1} />

						{/* ── Two-column workspace ────────────────────── */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', lg: '440px minmax(0, 1fr)' },
								gap: 3,
								alignItems: 'stretch',
							}}
						>
							{/* Left: type toggle + list */}
							<Box
								sx={{
									background: '#fff',
									border: `1px solid ${INK_10}`,
									borderRadius: '10px',
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
									minHeight: 560,
								}}
							>
								{/* Segmented pill toggle */}
								<Box
									sx={{
										p: 3,
										pb: 0,
									}}
								>
									<SegmentedPill
										value={selectedType}
										onChange={(v) => {
											setSelectedType(v)
											setSelectedPartyId('')
										}}
										contractorCount={contractorCount}
										clientCount={clientCount}
									/>
								</Box>

								{/* Search */}
								<Box sx={{ p: 3, borderBottom: `1px solid ${INK_10}` }}>
									<Box sx={{ position: 'relative' }}>
										<Box
											sx={{
												position: 'absolute',
												left: 20,
												top: '50%',
												transform: 'translateY(-50%)',
												color: PRIMARY,
												pointerEvents: 'none',
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 22,
												height: 22,
											}}
										>
											<Search sx={{ fontSize: 22 }} />
										</Box>
										<TextField
											fullWidth
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder={`Search ${selectedType === 'contractor' ? 'contractors' : 'clients'} by name…`}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													background: '#fff',
													fontSize: 15,
													height: 56,
													boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
													transition: 'all 180ms ease',
													'& fieldset': { borderColor: INK_10, borderWidth: 1.5 },
													'&:hover fieldset': { borderColor: 'rgba(15,23,42,0.2)' },
													'&.Mui-focused': {
														boxShadow: `0 0 0 4px ${PRIMARY}22, 0 6px 18px -8px ${PRIMARY}44`,
													},
													'&.Mui-focused fieldset': {
														borderColor: PRIMARY,
														borderWidth: 2,
													},
												},
												'& .MuiOutlinedInput-input': {
													pl: '52px',
													py: '16px',
													fontWeight: 500,
													'&::placeholder': { color: INK_45, opacity: 1 },
												},
											}}
										/>
									</Box>
								</Box>

								{/* Error */}
								{isError ? (
									<Box sx={{ p: 2.5 }}>
										<Alert severity='error' sx={{ borderRadius: '8px' }}>
											Failed to load counterparties.
										</Alert>
									</Box>
								) : null}

								{/* Loading */}
								{isLoading ? (
									<Box
										sx={{
											flex: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											py: 10,
										}}
									>
										<CircularProgress size={28} sx={{ color: PRIMARY }} />
									</Box>
								) : null}

								{/* Empty result */}
								{!isLoading && filteredParties.length === 0 ? (
									<Box
										sx={{
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											py: 8,
											px: 3,
											textAlign: 'center',
											gap: 2,
										}}
									>
										<NoMatchIcon />
										<Box>
											<Typography
												sx={{ fontSize: 15, fontWeight: 600, color: INK, mb: 0.5 }}
											>
												Nothing matches
											</Typography>
											<Typography sx={{ fontSize: 13, color: INK_60, maxWidth: 320 }}>
												Try a different query or switch category above.
											</Typography>
										</Box>
									</Box>
								) : null}

								{/* List */}
								{!isLoading && filteredParties.length > 0 ? (
									<Box
										key={`list-${selectedType}-${search}`}
										sx={{ flex: 1, overflowY: 'auto', p: 0 }}
									>
										{filteredParties.map((party, idx) => {
											const active = selectedPartyId === party.id
											return (
												<PartyRow
													key={party.id}
													party={party}
													active={active}
													showTopBorder={idx > 0}
													delay={Math.min(idx * 26, 260)}
													onClick={() => setSelectedPartyId(party.id)}
												/>
											)
										})}
									</Box>
								) : null}
							</Box>

							{/* Right: mini-invoice preview */}
							<Box
								sx={{
									background: '#fff',
									border: `1px solid ${INK_10}`,
									borderRadius: '10px',
									overflow: 'hidden',
									display: 'flex',
									flexDirection: 'column',
									minHeight: 560,
								}}
							>
								{/* Preview header */}
								<Box
									sx={{
										p: 2.5,
										borderBottom: `1px solid ${INK_10}`,
										background: INK_04,
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Typography
										sx={{
											fontSize: 11,
											fontWeight: 700,
											letterSpacing: '0.18em',
											textTransform: 'uppercase',
											color: INK_60,
										}}
									>
										Preview
									</Typography>
									<Typography
										sx={{
											fontFamily: '"JetBrains Mono", monospace',
											fontSize: 11,
											color: INK_45,
										}}
									>
										INV-DRAFT
									</Typography>
								</Box>

								{/* Preview body */}
								{selectedParty ? (
									<Box
										key={selectedParty.id}
										sx={{
											p: 3,
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											animation:
												'invoicePreviewIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
											'@keyframes invoicePreviewIn': {
												from: { opacity: 0, transform: 'translateY(6px)' },
												to: { opacity: 1, transform: 'translateY(0)' },
											},
											'@media (prefers-reduced-motion: reduce)': {
												animation: 'none',
											},
										}}
									>
										{/* Big avatar block */}
										<Stack
											direction='row'
											spacing={2.5}
											sx={{ alignItems: 'center', mb: 3 }}
										>
											<Box
												sx={{
													width: 56,
													height: 56,
													borderRadius: '10px',
													background: PRIMARY,
													color: '#fff',
													display: 'inline-flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontFamily: '"JetBrains Mono", monospace',
													fontWeight: 800,
													fontSize: 18,
													letterSpacing: '0.05em',
													flexShrink: 0,
												}}
											>
												{partyInitials(selectedParty.displayName)}
											</Box>
											<Box sx={{ minWidth: 0, flex: 1 }}>
												<Typography
													sx={{
														fontSize: 18,
														fontWeight: 800,
														color: INK,
														lineHeight: 1.25,
														letterSpacing: '-0.01em',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{selectedParty.displayName}
												</Typography>
												<Typography sx={{ fontSize: 12.5, color: INK_60, mt: 0.5 }}>
													{selectedType === 'contractor' ? 'Contractor' : 'Client'} ·{' '}
													{selectedParty.currency}
												</Typography>
											</Box>
										</Stack>

										{/* Bill from / to blocks — like a real invoice preview */}
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: '1fr 1fr',
												gap: 2,
												mb: 3,
											}}
										>
											<PreviewBlock label='Bill from' body={from ?? '—'} />
											<PreviewBlock label='Bill to' body={to ?? '—'} />
										</Box>

										{/* Sum stub */}
										<Box
											sx={{
												borderTop: `1px dashed ${INK_10}`,
												pt: 2,
												display: 'flex',
												justifyContent: 'space-between',
												color: INK_45,
												fontSize: 12.5,
											}}
										>
											<Typography sx={{ fontSize: 12.5 }}>
												{reuseItems && lastPartyInvoice
													? `Line items · ${lastPartyInvoice.lineItems.length} reused`
													: 'Line items · pending'}
											</Typography>
											<Typography
												sx={{
													fontFamily: '"JetBrains Mono", monospace',
													fontSize: 12.5,
												}}
											>
												{selectedParty.currency} —
											</Typography>
										</Box>

										{/* Reuse-invoice suggestion — visible only when this party
										    already has at least one saved invoice. Toggle copies the
										    previous invoice's line items into Step 2. */}
										{lastPartyInvoice ? (
											<ReuseInvoiceCard
												invoice={lastPartyInvoice}
												checked={reuseItems}
												onToggle={() => setReuseItems((v) => !v)}
											/>
										) : null}

										<Box sx={{ flex: 1 }} />

										{/* Continue button */}
										<Box
											component='button'
											type='button'
											onClick={handleContinue}
											sx={{
												appearance: 'none',
												border: 'none',
												background: PRIMARY,
												color: '#fff',
												fontFamily: 'inherit',
												fontSize: 14.5,
												fontWeight: 700,
												letterSpacing: '0.02em',
												padding: '14px 20px',
												borderRadius: '8px',
												cursor: 'pointer',
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 1.5,
												boxShadow: `0 8px 22px -8px ${PRIMARY}66`,
												transition: 'all 160ms ease',
												mt: 3,
												'&:hover': {
													background: 'rgb(2, 124, 192)',
													transform: 'translateY(-1px)',
													boxShadow: `0 12px 28px -10px ${PRIMARY}77`,
												},
												'&:active': { transform: 'translateY(0)' },
											}}
										>
											<Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
												<CheckRounded sx={{ fontSize: 18 }} />
												<span>Fill invoice details</span>
											</Stack>
											<ArrowForwardRounded sx={{ fontSize: 20 }} />
										</Box>
									</Box>
								) : (
									<Box
										key='empty-preview'
										sx={{
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											px: 4,
											textAlign: 'center',
											gap: 2,
											animation:
												'invoicePreviewIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
											'@keyframes invoicePreviewIn': {
												from: { opacity: 0, transform: 'translateY(6px)' },
												to: { opacity: 1, transform: 'translateY(0)' },
											},
											'@media (prefers-reduced-motion: reduce)': {
												animation: 'none',
											},
										}}
									>
										<AnimatedPaper />
										<Box sx={{ maxWidth: 300 }}>
											<Typography sx={{ fontSize: 15, fontWeight: 700, color: INK }}>
												Nothing picked yet
											</Typography>
											<Typography
												sx={{ fontSize: 13, color: INK_60, mt: 0.5, lineHeight: 1.5 }}
											>
												Choose a contractor or client on the left and the invoice header
												will fill in here.
											</Typography>
										</Box>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

/* ── Sub-components ─────────────────────────────────────────────── */

const AnimatedPaper: FC = () => (
	<Box
		aria-hidden
		sx={{
			position: 'relative',
			width: 220,
			height: 280,
			flexShrink: 0,
			perspective: '600px',
			'@keyframes paperFloat': {
				'0%, 100%': { transform: 'translateY(0) rotate(-1.5deg)' },
				'50%': { transform: 'translateY(-6px) rotate(1deg)' },
			},
			'@keyframes paperShadow': {
				'0%, 100%': { transform: 'scale(1, 1) translateY(0)', opacity: 0.14 },
				'50%': { transform: 'scale(0.88, 0.7) translateY(4px)', opacity: 0.22 },
			},
			'@keyframes paperShimmer': {
				'0%': { transform: 'translateX(-40%) skewX(-14deg)', opacity: 0 },
				'20%': { opacity: 0.9 },
				'80%': { opacity: 0.9 },
				'100%': { transform: 'translateX(160%) skewX(-14deg)', opacity: 0 },
			},
			'@keyframes penDraw': {
				'0%': { strokeDashoffset: 200, opacity: 0 },
				'10%': { opacity: 1 },
				'70%, 100%': { strokeDashoffset: 0, opacity: 1 },
			},
			'@keyframes caretBlink': {
				'0%, 60%': { opacity: 1 },
				'80%, 100%': { opacity: 0 },
			},
			'@media (prefers-reduced-motion: reduce)': {
				'& *': { animation: 'none !important' },
			},
		}}
	>
		{/* Ground shadow beneath the sheet, "breathes" with the float */}
		<Box
			sx={{
				position: 'absolute',
				bottom: -14,
				left: 20,
				right: 20,
				height: 14,
				background: `radial-gradient(ellipse at center, ${PRIMARY}44 0%, transparent 70%)`,
				borderRadius: '50%',
				filter: 'blur(6px)',
				opacity: 0.14,
				animation: 'paperShadow 4200ms ease-in-out infinite',
			}}
		/>

		{/* Paper sheet */}
		<Box
			sx={{
				position: 'absolute',
				inset: 0,
				borderRadius: '6px',
				border: `1.5px dashed ${INK_10}`,
				background: `repeating-linear-gradient(0deg, ${INK_04} 0px, ${INK_04} 10px, transparent 10px, transparent 22px), #fff`,
				boxShadow: '0 12px 30px -18px rgba(15, 23, 42, 0.28)',
				overflow: 'hidden',
				animation: 'paperFloat 4200ms ease-in-out infinite',
				transformOrigin: 'center bottom',
				transformStyle: 'preserve-3d',
			}}
		>
			{/* Header bar (title placeholder) */}
			<Box
				sx={{
					position: 'absolute',
					top: 24,
					left: 24,
					right: 24,
					height: 14,
					background: PRIMARY,
					opacity: 0.16,
					borderRadius: 2,
				}}
			/>

			{/* Signature bar (bottom) with animated pen strokes */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 26,
					left: 24,
					width: '55%',
					height: 34,
					background: PRIMARY_TINT,
					border: `1px solid rgba(3, 105, 161, 0.24)`,
					borderRadius: 4,
					overflow: 'hidden',
				}}
			>
				{/* Handwritten stroke inside signature area */}
				<Box
					component='svg'
					viewBox='0 0 120 32'
					sx={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						color: PRIMARY,
						'& path': {
							strokeDasharray: 200,
							strokeDashoffset: 200,
							animation: 'penDraw 3400ms cubic-bezier(0.22, 1, 0.36, 1) 400ms infinite',
						},
					}}
				>
					<path
						d='M8 22 C 22 6, 36 22, 50 10 S 74 26, 88 12 S 108 22, 116 16'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
					/>
				</Box>
			</Box>

			{/* Blinking caret near the bottom right — like a form-writer's cursor */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 34,
					right: 28,
					width: 2,
					height: 16,
					background: PRIMARY,
					borderRadius: 1,
					animation: 'caretBlink 1100ms steps(1, end) infinite',
				}}
			/>

		</Box>

		{/* Curled corner — a tiny fold at top-right */}
		<Box
			sx={{
				position: 'absolute',
				top: 0,
				right: 0,
				width: 22,
				height: 22,
				background: `linear-gradient(225deg, ${INK_04} 0%, ${INK_04} 50%, transparent 50%)`,
				borderTopRightRadius: 6,
				borderLeft: `1px solid ${INK_10}`,
				borderBottom: `1px solid ${INK_10}`,
				pointerEvents: 'none',
			}}
		/>
	</Box>
)

const NoMatchIcon: FC = () => (
	<Box
		aria-hidden
		sx={{
			position: 'relative',
			width: 88,
			height: 88,
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			'@keyframes nmRipple': {
				'0%': { transform: 'scale(0.6)', opacity: 0.55 },
				'80%': { opacity: 0 },
				'100%': { transform: 'scale(1.35)', opacity: 0 },
			},
			'@keyframes nmFloat': {
				'0%, 100%': { transform: 'translateY(0) rotate(-4deg)' },
				'50%': { transform: 'translateY(-4px) rotate(2deg)' },
			},
			'@keyframes nmSweep': {
				'0%': { transform: 'translateX(-100%) skewX(-14deg)' },
				'100%': { transform: 'translateX(200%) skewX(-14deg)' },
			},
			'@media (prefers-reduced-motion: reduce)': {
				'& > *': { animation: 'none !important' },
			},
		}}
	>
		{/* Concentric ripple rings */}
		{[0, 1, 2].map((i) => (
			<Box
				key={i}
				sx={{
					position: 'absolute',
					inset: 0,
					borderRadius: '50%',
					border: `1.5px solid ${PRIMARY}`,
					opacity: 0,
					animation: `nmRipple 2200ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 700}ms infinite`,
				}}
			/>
		))}

		{/* Center tile */}
		<Box
			sx={{
				position: 'relative',
				width: 60,
				height: 60,
				borderRadius: '50%',
				background: PRIMARY_TINT,
				border: `1.5px solid rgba(3, 105, 161, 0.22)`,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: PRIMARY,
				overflow: 'hidden',
				boxShadow: `0 8px 24px -12px ${PRIMARY}66`,
				animation: 'nmFloat 3.8s ease-in-out infinite',
			}}
		>
			{/* Shine sweep */}
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '35%',
					height: '100%',
					background:
						'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 65%, transparent 100%)',
					animation: 'nmSweep 2600ms ease-in-out 500ms infinite',
					pointerEvents: 'none',
				}}
			/>
			<Search sx={{ fontSize: 30, position: 'relative', zIndex: 1 }} />
		</Box>
	</Box>
)

const ProgressBar: FC<{ current: 1 | 2 }> = ({ current }) => {
	const steps = [
		{ n: 1, label: 'Party', hint: 'Contractor or client' },
		{ n: 2, label: 'Details', hint: 'Numbers, dates, line items' },
	]
	return (
		<Box sx={{ position: 'relative', width: '100%' }}>
			{/* Track */}
			<Box
				sx={{
					position: 'absolute',
					top: 26,
					left: 26,
					right: 26,
					height: 4,
					background: INK_10,
					borderRadius: 2,
					zIndex: 0,
				}}
			>
				<Box
					sx={{
						height: '100%',
						width: current === 1 ? '0%' : '100%',
						background: `linear-gradient(90deg, ${PRIMARY} 0%, rgb(56, 189, 248) 100%)`,
						borderRadius: 2,
						transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
					}}
				/>
			</Box>

			<Stack
				direction='row'
				sx={{
					position: 'relative',
					zIndex: 1,
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					gap: 3,
				}}
			>
				{steps.map((s) => {
					const active = current === s.n
					const done = current > s.n
					return (
						<Stack key={s.n} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
							<Box
								sx={{
									width: 56,
									height: 56,
									borderRadius: '50%',
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontFamily:
										'"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
									fontSize: 18,
									fontWeight: 700,
									letterSpacing: '0.02em',
									background: active || done ? PRIMARY : '#fff',
									color: active || done ? '#fff' : INK_45,
									border: `2px solid ${active || done ? PRIMARY : INK_10}`,
									boxShadow: active
										? `0 0 0 6px ${PRIMARY}20, 0 10px 24px -10px ${PRIMARY}77`
										: 'none',
									transition: 'all 240ms cubic-bezier(0.22, 1, 0.36, 1)',
									mb: 1.5,
								}}
							>
								{done ? <CheckRounded sx={{ fontSize: 24 }} /> : `0${s.n}`}
							</Box>
							<Typography
								sx={{
									fontSize: 14.5,
									fontWeight: 700,
									color: active || done ? INK : INK_45,
									letterSpacing: '-0.005em',
									lineHeight: 1.2,
								}}
							>
								{s.label}
							</Typography>
							<Typography
								sx={{
									fontSize: 12,
									color: active ? PRIMARY : INK_45,
									mt: 0.5,
									fontWeight: active ? 600 : 400,
									textAlign: 'center',
								}}
							>
								{active ? 'You are here' : s.hint}
							</Typography>
						</Stack>
					)
				})}
			</Stack>
		</Box>
	)
}

const SegmentedPill: FC<{
	value: PartyType
	onChange: (v: PartyType) => void
	contractorCount: number
	clientCount: number
}> = ({ value, onChange, contractorCount, clientCount }) => (
	<Box
		sx={{
			position: 'relative',
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			background: INK_04,
			borderRadius: '12px',
			p: '4px',
			border: `1px solid ${INK_10}`,
			overflow: 'hidden',
		}}
	>
		{/* Sliding thumb */}
		<Box
			sx={{
				position: 'absolute',
				top: 4,
				bottom: 4,
				left: value === 'contractor' ? 4 : 'calc(50% + 0px)',
				width: 'calc(50% - 4px)',
				background: '#fff',
				borderRadius: '9px',
				boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px -4px rgba(15, 23, 42, 0.08)',
				border: `1px solid ${INK_10}`,
				transition: 'left 240ms cubic-bezier(0.22, 1, 0.36, 1)',
				zIndex: 0,
			}}
		/>
		<PillTab
			icon={<PeopleOutlined sx={{ fontSize: 18 }} />}
			label='Contractors'
			count={contractorCount}
			active={value === 'contractor'}
			onClick={() => onChange('contractor')}
		/>
		<PillTab
			icon={<BusinessOutlined sx={{ fontSize: 18 }} />}
			label='Clients'
			count={clientCount}
			active={value === 'client'}
			onClick={() => onChange('client')}
		/>
	</Box>
)

const PillTab: FC<{
	icon: React.ReactNode
	label: string
	count: number
	active: boolean
	onClick: () => void
}> = ({ icon, label, count, active, onClick }) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			position: 'relative',
			zIndex: 1,
			appearance: 'none',
			background: 'transparent',
			border: 'none',
			padding: '10px 14px',
			cursor: 'pointer',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 1.25,
			transition: 'color 160ms ease',
			fontFamily: 'inherit',
			color: active ? PRIMARY : INK_60,
			fontWeight: active ? 700 : 600,
			fontSize: 13.5,
			letterSpacing: '0.005em',
			borderRadius: '9px',
			'&:hover': { color: active ? PRIMARY : INK },
		}}
	>
		{icon}
		<span>{label}</span>
		<Box
			component='span'
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				minWidth: 22,
				height: 20,
				borderRadius: '999px',
				background: active ? PRIMARY_TINT : INK_10,
				color: active ? PRIMARY : INK_60,
				fontSize: 11.5,
				fontWeight: 700,
				padding: '0 6px',
				fontVariantNumeric: 'tabular-nums',
				transition: 'all 160ms ease',
			}}
		>
			{count}
		</Box>
	</Box>
)

const PartyRow: FC<{
	party: Party
	active: boolean
	showTopBorder: boolean
	delay?: number
	onClick: () => void
}> = ({ party, active, showTopBorder, delay = 0, onClick }) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			appearance: 'none',
			background: active ? PRIMARY_TINT : 'transparent',
			borderTop: showTopBorder ? `1px solid ${INK_10}` : 'none',
			borderLeft: `3px solid ${active ? PRIMARY : 'transparent'}`,
			borderRight: 'none',
			borderBottom: 'none',
			padding: '16px 20px 16px 17px',
			cursor: 'pointer',
			width: '100%',
			display: 'flex',
			alignItems: 'center',
			gap: 2,
			transition:
				'background 140ms ease, border-color 140ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
			fontFamily: 'inherit',
			textAlign: 'left',
			animation: `invoicePartyRowIn 380ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
			'@keyframes invoicePartyRowIn': {
				from: { opacity: 0, transform: 'translateY(6px)' },
				to: { opacity: 1, transform: 'translateY(0)' },
			},
			'&:hover': {
				background: active ? PRIMARY_TINT : '#fafafa',
				transform: 'translateX(2px)',
			},
			'@media (prefers-reduced-motion: reduce)': {
				animation: 'none',
				'&:hover': { transform: 'none' },
			},
		}}
	>
		<Box
			sx={{
				width: 40,
				height: 40,
				borderRadius: '8px',
				background: active ? PRIMARY : '#f1f5f9',
				color: active ? '#fff' : INK_60,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: '"JetBrains Mono", monospace',
				fontWeight: 700,
				fontSize: 13,
				letterSpacing: '0.05em',
				flexShrink: 0,
				transition: 'all 140ms ease',
			}}
		>
			{partyInitials(party.displayName)}
		</Box>
		<Box sx={{ flex: 1, minWidth: 0 }}>
			<Typography
				sx={{
					fontSize: 14.5,
					fontWeight: 600,
					color: INK,
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					lineHeight: 1.3,
				}}
			>
				{party.displayName}
			</Typography>
			<Typography sx={{ fontSize: 12, color: INK_45, mt: 0.25 }}>
				<Box component='span' sx={{ fontFamily: '"JetBrains Mono", monospace', color: INK_60 }}>
					{party.currency}
				</Box>{' '}
				· {party.type}
			</Typography>
		</Box>
		{active ? (
			<CheckRounded sx={{ fontSize: 18, color: PRIMARY, flexShrink: 0 }} />
		) : (
			<ArrowForwardRounded sx={{ fontSize: 16, color: INK_10, flexShrink: 0 }} />
		)}
	</Box>
)

const ReuseInvoiceCard: FC<{
	invoice: ApiInvoiceItem
	checked: boolean
	onToggle: () => void
}> = ({ invoice, checked, onToggle }) => {
	const itemCount = invoice.lineItems?.length ?? 0
	const total = getInvoiceTotal(invoice)
	const numberLabel = invoice.number ? `#${invoice.number}` : `${invoice.id.slice(0, 8)}`
	return (
		<Box
			component='button'
			type='button'
			onClick={onToggle}
			sx={{
				appearance: 'none',
				display: 'flex',
				alignItems: 'center',
				gap: 1.5,
				padding: '12px 14px',
				borderRadius: '12px',
				background: checked ? PRIMARY_TINT : '#fff',
				border: `1px solid ${checked ? PRIMARY_TINT_STRONG : INK_10}`,
				boxShadow: checked ? `0 6px 18px -10px ${PRIMARY}55` : 'none',
				cursor: 'pointer',
				textAlign: 'left',
				fontFamily: 'inherit',
				width: '100%',
				mt: 2,
				transition:
					'background 200ms ease, border-color 200ms ease, box-shadow 200ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
				'&:hover': {
					borderColor: checked ? PRIMARY_TINT_STRONG : 'rgba(15, 23, 42, 0.18)',
					transform: 'translateY(-1px)',
				},
			}}
		>
			<Box
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 36,
					height: 36,
					borderRadius: '10px',
					background: checked ? PRIMARY : PRIMARY_TINT,
					color: checked ? '#fff' : PRIMARY,
					flexShrink: 0,
					transition: 'all 200ms ease',
					boxShadow: checked ? `0 6px 16px -8px ${PRIMARY}88` : 'none',
				}}
			>
				<ReceiptLongOutlined sx={{ fontSize: 20 }} />
			</Box>
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography
					sx={{
						fontSize: 13,
						fontWeight: 700,
						color: INK,
						letterSpacing: '-0.005em',
						lineHeight: 1.25,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					Reuse last invoice
				</Typography>
				<Typography
					sx={{
						fontSize: 11.5,
						color: INK_60,
						mt: 0.25,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					<Box
						component='span'
						sx={{ fontFamily: '"JetBrains Mono", monospace', color: PRIMARY, fontWeight: 700 }}
					>
						{numberLabel}
					</Box>{' '}
					· {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatMoney(total, invoice.currency)}
				</Typography>
			</Box>
			<Toggle checked={checked} />
		</Box>
	)
}

const Toggle: FC<{ checked: boolean }> = ({ checked }) => (
	<Box
		aria-hidden
		sx={{
			position: 'relative',
			width: 38,
			height: 22,
			borderRadius: '999px',
			background: checked ? PRIMARY : INK_10,
			transition: 'background 200ms ease',
			flexShrink: 0,
		}}
	>
		<Box
			sx={{
				position: 'absolute',
				top: 2,
				left: checked ? 18 : 2,
				width: 18,
				height: 18,
				borderRadius: '50%',
				background: '#fff',
				boxShadow: '0 1px 3px rgba(15, 23, 42, 0.22)',
				transition: 'left 220ms cubic-bezier(0.22, 1, 0.36, 1)',
			}}
		/>
	</Box>
)

const PreviewBlock: FC<{ label: string; body: string }> = ({ label, body }) => (
	<Box sx={{ minWidth: 0 }}>
		<Typography
			sx={{
				fontSize: 10,
				fontWeight: 700,
				letterSpacing: '0.18em',
				textTransform: 'uppercase',
				color: INK_45,
				mb: 1,
			}}
		>
			{label}
		</Typography>
		<Typography
			component='pre'
			sx={{
				fontFamily: 'inherit',
				fontSize: 12.5,
				lineHeight: 1.55,
				color: INK,
				whiteSpace: 'pre-wrap',
				wordBreak: 'break-word',
				overflowWrap: 'anywhere',
				margin: 0,
			}}
		>
			{body}
		</Typography>
	</Box>
)

export default InvoicePartyStep
