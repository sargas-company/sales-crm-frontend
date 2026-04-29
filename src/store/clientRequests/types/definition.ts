export type ClientRequestStatus = 'on_review' | 'conversation_ongoing' | 'archived'

export interface ClientRequestFile {
	originalName: string
	fileName: string
	path: string
	mimetype: string
	size: number
}

export interface ClientRequestSignedFile {
	originalName: string
	url: string
	mimetype: string
	size: number
}

export interface ClientRequestItem {
	id: string
	name: string
	company: string
	email: string
	phone: string
	phoneCountry: string
	message: string
	services: string[]
	status: ClientRequestStatus
	files: ClientRequestFile[]
	createdAt: string
	updatedAt: string
}

export type UpdateClientRequestBody = Partial<{
	name: string
	company: string
	email: string
	phone: string
	phoneCountry: string
	message: string
	services: string[]
	status: ClientRequestStatus
}>

export interface ClientRequestPage {
	data: ClientRequestItem[]
	total: number
}

export interface ClientRequestListParams {
	page: number
	limit: number
}
