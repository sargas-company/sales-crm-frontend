export type PromptType = 'JOB_GATEKEEPER' | 'JOB_EVALUATION'

export interface PromptItem {
	id: string
	type: PromptType
	title: string
	content: string
	isActive: boolean
	version: number
	createdBy: string
	updatedBy: string | null
	createdAt: string
	updatedAt: string
}

export interface PromptPage {
	data: PromptItem[]
	total: number
}

export type PromptSortBy =
	| 'title'
	| 'type'
	| 'version'
	| 'isActive'
	| 'createdBy'
	| 'updatedAt'
	| 'createdAt'

export type PromptSortDirection = 'asc' | 'desc'

export interface PromptListParams {
	page: number
	limit: number
	type?: PromptType
	isActive?: boolean
	sortBy?: PromptSortBy
	sortDirection?: PromptSortDirection
	search?: string
}

export interface CreatePromptDto {
	type: PromptType
	title: string
	content: string
}

export interface UpdatePromptDto {
	content: string
}
