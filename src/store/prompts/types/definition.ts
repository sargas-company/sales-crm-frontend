export type PromptType = 'JOB_GATEKEEPER' | 'JOB_EVALUATION' | 'CHAT_SYSTEM' | 'CHAT_FALLBACK'

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

export interface PromptListParams {
	page: number
	limit: number
	type?: PromptType
	isActive?: boolean
}

export interface CreatePromptDto {
	type: PromptType
	title: string
	content: string
}

export interface UpdatePromptDto {
	content: string
}
