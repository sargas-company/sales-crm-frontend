import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	EditOutlined,
	PictureAsPdfOutlined,
	OpenInNewRounded,
	ReceiptLongOutlined,
	CalendarMonthOutlined,
	EventAvailableOutlined,
	PaidOutlined,
} from '@mui/icons-material'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import { PrimarySolidButton } from '../../_shared/formShell.styled'
import {
	type InvoiceItem,
	useGenerateInvoicePdfMutation,
	useGetInvoiceByIdQuery,
	useLazyGetInvoicePdfQuery,
} from '../../../store/invoices/invoicesApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import { formatDate } from '../../../utils/formatDate'

type Props = { id: string }

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'
const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'

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

const getSubtotal = (invoice: InvoiceItem) =>
	(invoice.lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

const InvoicePreviewDetails = ({ id }: Props) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { data: invoice, isLoading, isError } = useGetInvoiceByIdQuery(id, { skip: !id })
	const [getInvoicePdf, { isLoading: isOpeningPdf }] = useLazyGetInvoicePdfQuery()
	const [generateInvoicePdf, { isLoading: isGenerating }] = useGenerateInvoicePdfMutation()

	const handleOpenPdf = async () => {
		try {
			const { url } = await getInvoicePdf(id).unwrap()
			window.open(url, '_blank')
		} catch (error) {
			showToast(parseServerError(error), 'error')
		}
	}

	const handleGeneratePdf = async () => {
		try {
			await generateInvoicePdf(id).unwrap()
			const { url } = await getInvoicePdf(id).unwrap()
			window.open(url, '_blank')
			showToast('Invoice PDF generated successfully', 'success')
		} catch (error) {
			showToast(parseServerError(error), 'error')
		}
	}

	const totals = useMemo(() => {
		if (!invoice) {
			return { subtotal: 0, tax: 0, discounts: 0, shipping: 0, total: 0, balanceDue: 0 }
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
			<Page>
				<Shell>
					<Center>
						<Loading label='Loading invoice…' />
					</Center>
				</Shell>
			</Page>
		)
	}

	if (isError || !invoice) {
		return (
			<Page>
				<Shell>
					<Center>
						<ErrorState title='Invoice not available' description='Could not load invoice.' />
					</Center>
				</Shell>
			</Page>
		)
	}

	const paidPercent = totals.total > 0 ? Math.min(invoice.amountPaid / totals.total, 1) : 0
	const status: 'paid' | 'partial' | 'open' =
		paidPercent >= 1 ? 'paid' : paidPercent > 0 ? 'partial' : 'open'
	const badgeMap: Record<
		typeof status,
		{ label: string; bg: string; fg: string; border: string }
	> = {
		paid: {
			label: 'Paid',
			bg: 'rgba(34, 197, 94, 0.14)',
			fg: '#15803d',
			border: 'rgba(34, 197, 94, 0.32)',
		},
		partial: {
			label: 'Partially paid',
			bg: 'rgba(245, 158, 11, 0.14)',
			fg: '#a26608',
			border: 'rgba(245, 158, 11, 0.32)',
		},
		open: {
			label: 'Open',
			bg: PRIMARY_TINT_STRONG,
			fg: PRIMARY,
			border: 'rgba(3, 105, 161, 0.32)',
		},
	}
	const badge = badgeMap[status]

	return (
		<Page>
			<Shell>
				<TopRow>
					<BackChip type='button' onClick={() => navigate('/invoices/list')}>
						<span className='arrow'>
							<ArrowBackRounded sx={{ fontSize: 16 }} />
						</span>
						<span>Back to invoices</span>
					</BackChip>

					<TopActions>
						{invoice.pdfUrl ? (
							<GhostButton type='button' disabled={isOpeningPdf} onClick={handleOpenPdf}>
								<OpenInNewRounded sx={{ fontSize: 18 }} />
								<span>Open PDF</span>
							</GhostButton>
						) : (
							<GhostButton
								type='button'
								disabled={isGenerating || isOpeningPdf}
								onClick={handleGeneratePdf}
							>
								<PictureAsPdfOutlined sx={{ fontSize: 18 }} />
								<span>Generate PDF</span>
							</GhostButton>
						)}
						<PrimarySolidButton
							type='button'
							onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
						>
							<EditOutlined />
							Edit invoice
						</PrimarySolidButton>
					</TopActions>
				</TopRow>

				<Header>
					<HeaderLeft>
						<HeaderIcon>
							<ReceiptLongOutlined />
						</HeaderIcon>
						<HeaderText>
							<HeaderTitle>{invoice.header || 'Invoice'}</HeaderTitle>
							{invoice.number ? (
								<HeaderNumber>
									<MonoChip>#{invoice.number}</MonoChip>
								</HeaderNumber>
							) : null}
							<HeaderName>{getCounterpartyName(invoice)}</HeaderName>
						</HeaderText>
					</HeaderLeft>

					<StatusBadge $bg={badge.bg} $fg={badge.fg} $border={badge.border}>
						<Dot $color={badge.fg} />
						{badge.label}
					</StatusBadge>
				</Header>

				<Meta>
					<MetaCard $delay={0}>
						<MetaIcon>
							<PaidOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Currency</MetaLabel>
							<MetaValue>{invoice.currency}</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={90}>
						<MetaIcon>
							<CalendarMonthOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Issue date</MetaLabel>
							<MetaValue>{formatDate(invoice.date)}</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={180}>
						<MetaIcon>
							<EventAvailableOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Due date</MetaLabel>
							<MetaValue>{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</MetaValue>
						</MetaText>
					</MetaCard>
				</Meta>

				<PartyGrid>
					<PartyBlock>
						<PartyLabel>From</PartyLabel>
						<PartyBody>{invoice.fromValue}</PartyBody>
					</PartyBlock>
					<PartyBlock>
						<PartyLabel>Bill to</PartyLabel>
						<PartyBody>{invoice.toValue}</PartyBody>
					</PartyBlock>
				</PartyGrid>

				<ItemsCard>
					<ItemsHead>
						<ItemsHeadCell>Description</ItemsHeadCell>
						<ItemsHeadCell $right>Quantity</ItemsHeadCell>
						<ItemsHeadCell $right>Rate</ItemsHeadCell>
						<ItemsHeadCell $right>Amount</ItemsHeadCell>
					</ItemsHead>
					<ItemsBody>
						{invoice.lineItems
							.slice()
							.sort((a, b) => a.sortOrder - b.sortOrder)
							.map((item, idx) => (
								<ItemsRow key={item.id ?? idx} $delay={idx * 60}>
									<ItemsCell>{item.name || '—'}</ItemsCell>
									<ItemsCell $right>
										<Num>{item.quantity}</Num>
									</ItemsCell>
									<ItemsCell $right>
										<Num>{formatMoney(item.unitCost, invoice.currency)}</Num>
									</ItemsCell>
									<ItemsCell $right>
										<Num>
											{formatMoney(item.quantity * item.unitCost, invoice.currency)}
										</Num>
									</ItemsCell>
								</ItemsRow>
							))}
					</ItemsBody>
				</ItemsCard>

				<TotalsRow>
					<Totals>
						<TotalLine>
							<span>Subtotal</span>
							<Num>{formatMoney(totals.subtotal, invoice.currency)}</Num>
						</TotalLine>
						{invoice.showTax ? (
							<TotalLine>
								<span>Tax</span>
								<Num>{formatMoney(totals.tax, invoice.currency)}</Num>
							</TotalLine>
						) : null}
						{invoice.showDiscounts ? (
							<TotalLine>
								<span>Discounts</span>
								<Num>-{formatMoney(totals.discounts, invoice.currency)}</Num>
							</TotalLine>
						) : null}
						{invoice.showShipping ? (
							<TotalLine>
								<span>Shipping</span>
								<Num>{formatMoney(totals.shipping, invoice.currency)}</Num>
							</TotalLine>
						) : null}
						<TotalDivider />
						<TotalLine $strong>
							<span>Total</span>
							<Num>{formatMoney(totals.total, invoice.currency)}</Num>
						</TotalLine>
						<TotalLine>
							<span>Amount paid</span>
							<Num>{formatMoney(invoice.amountPaid, invoice.currency)}</Num>
						</TotalLine>
						<BalanceBox>
							<span>Balance due</span>
							<BalanceValue>{formatMoney(totals.balanceDue, invoice.currency)}</BalanceValue>
						</BalanceBox>
					</Totals>
				</TotalsRow>
			</Shell>
		</Page>
	)
}

export default InvoicePreviewDetails

/* ── Styled ─────────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const metaIn = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	50%      { transform: translateY(-3px) rotate(-2deg); }
`

const dotPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px transparent; }
`

const Page = styled.div`
	width: 100%;
	padding: 0;
`

const Shell = styled.div`
	background: #fff;
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	padding: 34px 40px 36px;
	display: flex;
	flex-direction: column;
	gap: 28px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 22px;
		border-radius: 12px;
	}
`

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const TopRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
`

const BackChip = styled.button`
	appearance: none;
	background: transparent;
	border: none;
	padding: 8px 14px 8px 10px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	border-radius: 999px;

	.arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: ${PRIMARY};
		color: #fff;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover .arrow {
		transform: translateX(-3px);
	}
`

const TopActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const GhostButton = styled.button`
	appearance: none;
	background: #fff;
	border: 1px solid ${INK_10};
	border-radius: 12px;
	padding: 10px 16px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 26px;
	border-bottom: 1px solid ${INK_10};

	@media (max-width: 767px) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const HeaderLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 18px;
	min-width: 0;
`

const HeaderIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${PRIMARY_TINT};
	color: ${PRIMARY};
	flex-shrink: 0;
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 28px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;

	> * + * {
		margin-top: 0;
	}
	${'' /* Add extra breathing between number chip and the big name */}
	> :nth-child(3) {
		margin-top: 10px;
	}
`

const HeaderTitle = styled.h1`
	margin: 0;
	font-size: 30px;
	font-weight: 800;
	letter-spacing: -0.02em;
	color: ${INK};
	line-height: 1.15;
	text-transform: uppercase;
`

const HeaderName = styled.p`
	margin: 0;
	font-size: 26px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.15;
	text-transform: uppercase;
	word-break: break-word;

	@media (max-width: 767px) {
		font-size: 22px;
	}
`

const HeaderNumber = styled.div`
	display: inline-flex;
	align-items: center;
`

const MonoChip = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 14.5px;
	font-weight: 700;
	color: ${PRIMARY};
	background: ${PRIMARY_TINT};
	border: 1px solid ${PRIMARY_TINT_STRONG};
	padding: 6px 14px;
	border-radius: 10px;
	letter-spacing: 0.02em;
`

const StatusBadge = styled.div<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	flex-shrink: 0;
`

const Dot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${(p) => p.$color};
	color: ${(p) => p.$color};
	animation: ${dotPulse} 1.8s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Meta = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 18px;

	@media (max-width: 767px) {
		grid-template-columns: 1fr;
	}
`

const MetaCard = styled.div<{ $delay?: number }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 24px;
	padding: 24px 26px 22px;
	border-radius: 18px;
	background: #fff;
	border: 1px solid ${INK_10};
	overflow: hidden;
	min-height: 140px;
	animation: ${metaIn} 560ms cubic-bezier(0.22, 1, 0.36, 1) ${({ $delay }) => $delay ?? 0}ms both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const iconIdle = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	20%      { transform: translateY(-2px) rotate(-4deg); }
	40%      { transform: translateY(1px) rotate(3deg); }
	60%      { transform: translateY(-1px) rotate(-2deg); }
	80%      { transform: translateY(0) rotate(1deg); }
`

const MetaIcon = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 14px;
	background: ${PRIMARY};
	color: #fff;
	box-shadow: 0 8px 20px -10px rgba(3, 105, 161, 0.55);
	flex-shrink: 0;
	z-index: 1;
	animation: ${iconIdle} 5.6s ease-in-out infinite;

	${MetaCard}:nth-child(2) & {
		animation-delay: 0.9s;
	}
	${MetaCard}:nth-child(3) & {
		animation-delay: 1.8s;
	}

	svg {
		font-size: 24px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const MetaText = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	z-index: 1;
`

const MetaLabel = styled.span`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
`

const MetaValue = styled.span`
	font-size: 22px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.1;
	word-break: break-word;
`

const PartyGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;

	@media (max-width: 767px) {
		grid-template-columns: 1fr;
	}
`

const PartyBlock = styled.div`
	background: #fff;
	border: 1px solid ${INK_10};
	border-radius: 12px;
	padding: 18px 20px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const PartyLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: ${INK_45};
`

const PartyBody = styled.pre`
	margin: 0;
	font-family: inherit;
	font-size: 13.5px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
`

const ItemsCard = styled.div`
	background: #fff;
	border: 1px solid ${INK_10};
	border-radius: 14px;
	overflow: hidden;
`

const ItemsHead = styled.div`
	display: grid;
	grid-template-columns: 1fr 120px 140px 160px;
	background: ${PRIMARY};
	color: #fff;
	padding: 14px 22px;
	gap: 16px;

	@media (max-width: 767px) {
		grid-template-columns: 1fr 70px 90px 110px;
		padding: 12px 14px;
	}
`

const ItemsHeadCell = styled.div<{ $right?: boolean }>`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	text-align: ${(p) => (p.$right ? 'right' : 'left')};
`

const ItemsBody = styled.div``

const ItemsRow = styled.div<{ $delay?: number }>`
	display: grid;
	grid-template-columns: 1fr 120px 140px 160px;
	padding: 16px 22px;
	gap: 16px;
	border-bottom: 1px solid ${INK_10};
	transition: background 200ms ease;
	animation: ${rowIn} 380ms cubic-bezier(0.22, 1, 0.36, 1) ${({ $delay }) => $delay ?? 0}ms both;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: ${INK_04};
	}

	@media (max-width: 767px) {
		grid-template-columns: 1fr 70px 90px 110px;
		padding: 14px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const ItemsCell = styled.div<{ $right?: boolean }>`
	font-size: 14px;
	color: ${INK};
	text-align: ${(p) => (p.$right ? 'right' : 'left')};
	word-break: break-word;
`

const Num = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
	font-size: 14px;
	font-weight: 600;
	color: ${INK};
`

const TotalsRow = styled.div`
	display: flex;
	justify-content: flex-end;
`

const Totals = styled.div`
	width: 380px;
	max-width: 100%;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const TotalLine = styled.div<{ $strong?: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6px 4px;
	font-size: ${(p) => (p.$strong ? '15px' : '13.5px')};
	font-weight: ${(p) => (p.$strong ? 700 : 500)};
	color: ${(p) => (p.$strong ? INK : INK_60)};

	> span:first-child {
		letter-spacing: ${(p) => (p.$strong ? '-0.005em' : '0')};
	}
	${Num} {
		font-weight: ${(p) => (p.$strong ? 700 : 500)};
		font-size: ${(p) => (p.$strong ? '15px' : '13.5px')};
	}
`

const TotalDivider = styled.div`
	height: 1px;
	background: ${INK_10};
	margin: 6px 0;
`

const BalanceBox = styled.div`
	position: relative;
	margin-top: 8px;
	padding: 16px 18px;
	border-radius: 14px;
	background: linear-gradient(135deg, ${PRIMARY_TINT} 0%, #ffffff 60%, ${PRIMARY_TINT} 130%);
	background-size: 200% 200%;
	border: 1px solid ${PRIMARY_TINT_STRONG};
	display: flex;
	justify-content: space-between;
	align-items: center;
	overflow: hidden;
	animation: balanceShift 6s ease-in-out infinite;

	@keyframes balanceShift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	> span:first-child {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: ${PRIMARY};
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const BalanceValue = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 22px;
	font-weight: 800;
	color: ${PRIMARY};
	letter-spacing: -0.01em;
`
