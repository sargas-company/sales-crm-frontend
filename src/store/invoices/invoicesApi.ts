import { baseApi } from '../../api/baseApi'

export type InvoiceCurrency = 'USD' | 'EUR' | 'UAH'
export type InvoiceStatus = 'draft' | 'open' | 'paid'

export interface InvoiceLabels {
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
	amount_paid_title: string
	balance_title: string
}

export interface InvoiceCustomField {
	name: string
	value: string
}

export interface InvoiceLineItemPayload {
	id?: string
	name?: string
	description?: string
	quantity?: number
	unitCost?: number
	sortOrder?: number
}

export interface InvoiceLineItem {
	id?: string
	name: string
	description?: string
	quantity: number
	unitCost: number
	sortOrder: number
}

export interface InvoiceCreatePayload {
	counterpartyId: string
	status?: InvoiceStatus
	header?: string
	logoUrl?: string | null
	number?: string
	currency?: InvoiceCurrency
	date?: string
	dueDate?: string
	paymentTerms?: string
	poNumber?: string
	fromValue?: string
	toValue?: string
	shipTo?: string
	notes?: string
	terms?: string
	tax?: number
	discounts?: number
	shipping?: number
	amountPaid?: number
	showTax?: boolean
	showDiscounts?: boolean
	showShipping?: boolean
	showShipTo?: boolean
	labels?: Partial<InvoiceLabels>
	customFields?: InvoiceCustomField[]
	lineItems?: InvoiceLineItemPayload[]
}

export type InvoiceUpdatePayload = Partial<InvoiceCreatePayload>

export interface InvoiceItem extends Omit<InvoiceCreatePayload, 'lineItems'> {
	id: string
	counterpartyId: string
	header: string
	number?: string
	currency: InvoiceCurrency
	date: string
	dueDate?: string
	paymentTerms?: string
	poNumber?: string
	fromValue: string
	toValue: string
	shipTo?: string
	notes?: string
	terms?: string
	tax: number
	discounts: number
	shipping: number
	amountPaid: number
	showTax: boolean
	showDiscounts: boolean
	showShipping: boolean
	showShipTo: boolean
	lineItems: InvoiceLineItem[]
	status?: InvoiceStatus
	counterparty?: {
		id: string
		firstName?: string
		lastName?: string
		displayName?: string
		type?: string
	}
	createdAt?: string
	updatedAt?: string
}

export interface InvoiceGenerateResponse {
	url?: string
	pdfUrl?: string
	downloadUrl?: string
	[key: string]: unknown
}

export interface InvoicePage {
	data: InvoiceItem[]
	total: number
}

export type InvoiceListResponse = InvoicePage | InvoiceItem[]

export interface InvoiceListParams {
	page: number
	limit: number
}

export const invoicesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getInvoiceList: builder.query<InvoiceListResponse, InvoiceListParams>({
			query: ({ page, limit }) => ({ url: '/invoices', params: { page, limit } }),
			providesTags: ['Invoice'],
		}),

		getInvoiceById: builder.query<InvoiceItem, string>({
			query: (id) => ({ url: `/invoices/${id}` }),
			providesTags: (_, __, id) => [{ type: 'Invoice', id }],
		}),

		createInvoice: builder.mutation<InvoiceItem, InvoiceCreatePayload>({
			query: (body) => ({ url: '/invoices', method: 'POST', body }),
			invalidatesTags: ['Invoice'],
		}),

		updateInvoice: builder.mutation<InvoiceItem, { id: string; body: InvoiceUpdatePayload }>({
			query: ({ id, body }) => ({ url: `/invoices/${id}`, method: 'PATCH', body }),
			invalidatesTags: (_, __, { id }) => ['Invoice', { type: 'Invoice', id }],
		}),

		generateInvoicePdf: builder.mutation<InvoiceGenerateResponse, string>({
			query: (id) => ({ url: `/invoices/${id}/generate`, method: 'POST' }),
			invalidatesTags: (_, __, id) => ['Invoice', { type: 'Invoice', id }],
		}),

		deleteInvoice: builder.mutation<void, string>({
			query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Invoice'],
		}),
	}),
})

export const {
	useGetInvoiceListQuery,
	useGetInvoiceByIdQuery,
	useCreateInvoiceMutation,
	useUpdateInvoiceMutation,
	useGenerateInvoicePdfMutation,
	useDeleteInvoiceMutation,
} = invoicesApi
