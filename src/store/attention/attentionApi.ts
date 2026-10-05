import { baseApi } from '../../api/baseApi'

export type AttentionSeverity = 'critical' | 'warn' | 'info'
export type AttentionCategory = 'system' | 'business' | 'admin'

export interface AttentionAction {
	route: string
	label: string
}

export interface AttentionItem {
	id: string
	severity: AttentionSeverity
	category: AttentionCategory
	title: string
	description: string | null
	action: AttentionAction | null
	createdAt: string
}

export interface AttentionResponse {
	items: AttentionItem[]
}

export const attentionApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getAttention: builder.query<AttentionResponse, void>({
			query: () => ({ url: '/attention', method: 'GET' }),
		}),
	}),
})

export const { useGetAttentionQuery } = attentionApi
