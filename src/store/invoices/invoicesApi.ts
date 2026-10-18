import { baseApi } from '../../api/baseApi'
import axiosInstance from '../../api/axiosInstance'

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
	pdfUrl?: string | null
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

export type InvoiceSortBy =
	| 'number'
	| 'counterparty'
	| 'status'
	| 'date'
	| 'dueDate'
	| 'currency'
	| 'createdAt'

export type InvoiceSortDirection = 'asc' | 'desc'

export interface InvoiceListParams {
	page: number
	limit: number
	sortBy?: InvoiceSortBy
	sortDirection?: InvoiceSortDirection
	search?: string
}

export const invoicesApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getInvoiceList: builder.query<InvoiceListResponse, InvoiceListParams>({
			query: ({ page, limit, sortBy, sortDirection, search }) => ({
				url: '/invoices',
				params: { page, limit, sortBy, sortDirection, search: search || undefined },
			}),
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

		getInvoicePdf: builder.query<{ url: string }, string>({
			query: (id) => ({ url: `/invoices/${id}/pdf` }),
		}),

		deleteInvoice: builder.mutation<void, string>({
			query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Invoice'],
		}),

		bulkDeleteInvoices: builder.mutation<
			{ deleted: number; skipped: string[] },
			string[]
		>({
			query: (ids) => ({
				url: '/invoices/bulk-delete',
				method: 'POST',
				body: { ids },
			}),
			invalidatesTags: ['Invoice'],
		}),

	}),
})

/**
 * Bulk download: the shared `axiosBaseQuery` returns only `data`
 * (no headers), and RTK Query doesn't surface response headers
 * either, so we bypass the generated endpoint and talk to axios
 * directly. Returns the ZIP blob plus the filename and skipped
 * count parsed off the response headers set by the backend
 * controller.
 */
export const bulkDownloadInvoicesZip = async (
	ids: string[],
): Promise<{ blob: Blob; filename: string; skippedCount: number }> => {
	const res = await axiosInstance.post<Blob>(
		'/invoices/bulk-download',
		{ ids },
		{ responseType: 'blob' },
	)
	const cd = String(res.headers['content-disposition'] ?? '')
	const match = /filename="?([^";]+)"?/.exec(cd)
	const filename =
		match?.[1] ?? `invoices-${new Date().toISOString().slice(0, 10)}.zip`
	const skippedRaw = Number(res.headers['x-skipped-count'] ?? 0)
	return {
		blob: res.data,
		filename,
		skippedCount: Number.isFinite(skippedRaw) ? skippedRaw : 0,
	}
}

export const {
	useGetInvoiceListQuery,
	useGetInvoiceByIdQuery,
	useCreateInvoiceMutation,
	useUpdateInvoiceMutation,
	useGenerateInvoicePdfMutation,
	useGetInvoicePdfQuery,
	useLazyGetInvoicePdfQuery,
	useDeleteInvoiceMutation,
	useBulkDeleteInvoicesMutation,
} = invoicesApi
