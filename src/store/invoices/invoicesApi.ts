import { baseApi } from '../../api/baseApi'

export type InvoiceCurrency = 'USD' | 'EUR' | 'UAH'

export interface InvoiceLabels {
	from_title: string
	to_title: string
	ship_to_title: string
	notes_title: string
	terms_title: string
	invoice_number_title: string
	date_title: string
	due_date_title: string
	payment_terms_title: string
	purchase_order_title: string
	item_header: string
	quantity_header: string
	unit_cost_header: string
	amount_header: string
	subtotal_title: string
	tax_title: string
	discounts_title: string
	shipping_title: string
	total_title: string
	amount_paid_title: string
	balance_title: string
}

export interface InvoiceLineItemPayload {
	name: string
	description?: string
	quantity: number
	unitCost: number
	sortOrder: number
}

export interface InvoiceCreatePayload {
	counterpartyId: string
	number: string
	currency: InvoiceCurrency
	date: string
	dueDate: string
	paymentTerms: string
	poNumber: string
	header: string
	fromValue: string
	toValue: string
	shipTo: string
	notes: string
	terms: string
	tax: number
	discounts: number
	shipping: number
	amountPaid: number
	showTax: boolean
	showDiscounts: boolean
	showShipping: boolean
	showShipTo: boolean
	labels?: Partial<InvoiceLabels>
	lineItems: InvoiceLineItemPayload[]
}

export interface InvoiceItem extends InvoiceCreatePayload {
	id: string
	createdAt?: string
	updatedAt?: string
}

export const invoicesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		createInvoice: builder.mutation<InvoiceItem, InvoiceCreatePayload>({
			query: (body) => ({ url: '/invoices', method: 'POST', body }),
			invalidatesTags: ['Invoice'],
		}),
	}),
})

export const { useCreateInvoiceMutation } = invoicesApi
