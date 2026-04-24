import type { InvoiceItem } from '../../../store/invoices/invoicesApi'

export const formatInvoiceMoney = (value: number, currency: InvoiceItem['currency']) => {
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

export const getCounterpartyName = (invoice: InvoiceItem) => {
	const name = [invoice.counterparty?.firstName, invoice.counterparty?.lastName]
		.filter(Boolean)
		.join(' ')

	return invoice.counterparty?.displayName || name || invoice.counterpartyId
}

export const getInvoiceTotal = (invoice: InvoiceItem) => {
	const subtotal = (invoice.lineItems ?? []).reduce(
		(sum, item) => sum + item.quantity * item.unitCost,
		0
	)
	const tax = invoice.showTax ? subtotal * ((invoice.tax || 0) / 100) : 0
	const discounts = invoice.showDiscounts ? invoice.discounts || 0 : 0
	const shipping = invoice.showShipping ? invoice.shipping || 0 : 0

	return subtotal + tax + shipping - discounts
}
