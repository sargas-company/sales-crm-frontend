import { baseApi } from '../../api/baseApi'

export type PortfolioStatus = 'DRAFT' | 'READY' | 'ARCHIVED'
export type PortfolioAssetKind = 'COVER' | 'IMAGE' | 'FILE'

export interface PortfolioTag {
	id: string
	normalized: string
	displayName: string
}

export interface PortfolioAsset {
	id: string
	kind: PortfolioAssetKind
	fileName: string
	storageKey: string
	mimeType: string
	size: number
	createdAt: string
}

export interface PortfolioItem {
	id: string
	slug: string
	title: string
	shortSummary: string | null
	status: PortfolioStatus
	isNda: boolean
	contentMarkdown: string
	coverAsset: PortfolioAsset | null
	assets: PortfolioAsset[]
	tags: Array<{ tag: PortfolioTag }>
	createdAt: string
	updatedAt: string
	_count?: { assets: number }
}

interface Paginated<T> {
	data: T[]
	total: number
	page: number
	limit: number
}

export const portfolioApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listPortfolio: builder.query<
			Paginated<PortfolioItem>,
			{
				q?: string
				status?: PortfolioStatus
				isNda?: boolean
				tag?: string
				page?: number
				limit?: number
				sort?: 'updatedAt' | 'createdAt' | 'title' | 'status'
				direction?: 'asc' | 'desc'
			}
		>({
			query: (params) => ({ url: '/portfolio', params }),
			providesTags: ['PortfolioItem'],
		}),
		getPortfolioItem: builder.query<PortfolioItem, string>({
			query: (idOrSlug) => ({ url: `/portfolio/${idOrSlug}` }),
			providesTags: (_r, _e, id) => [{ type: 'PortfolioItem', id }],
		}),
		getPortfolioTags: builder.query<PortfolioTag[], void>({
			query: () => ({ url: '/portfolio/tags' }),
			providesTags: ['PortfolioTag'],
		}),
		createPortfolioItem: builder.mutation<PortfolioItem, {
			title: string
			slug?: string
			shortSummary?: string
			status?: PortfolioStatus
			isNda?: boolean
			contentMarkdown?: string
			tags?: string[]
		}>({
			query: (body) => ({ url: '/portfolio', method: 'POST', body }),
			invalidatesTags: ['PortfolioItem', 'PortfolioTag'],
		}),
		updatePortfolioItem: builder.mutation<
			PortfolioItem,
			{ id: string; body: Partial<PortfolioItem> & { tags?: string[] } }
		>({
			query: ({ id, body }) => ({
				url: `/portfolio/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['PortfolioItem', 'PortfolioTag'],
		}),
		archivePortfolioItem: builder.mutation<void, string>({
			query: (id) => ({ url: `/portfolio/${id}/archive`, method: 'POST' }),
			invalidatesTags: ['PortfolioItem'],
		}),
		deletePortfolioItem: builder.mutation<void, string>({
			query: (id) => ({ url: `/portfolio/${id}`, method: 'DELETE' }),
			invalidatesTags: ['PortfolioItem'],
		}),
		uploadPortfolioAsset: builder.mutation<
			PortfolioAsset,
			{ itemId: string; file: File; kind: PortfolioAssetKind }
		>({
			query: ({ itemId, file, kind }) => {
				const form = new FormData()
				form.append('file', file)
				return {
					url: `/portfolio/${itemId}/assets?kind=${kind}`,
					method: 'POST',
					body: form,
				}
			},
			invalidatesTags: ['PortfolioItem'],
		}),
		signAssetDownload: builder.mutation<{ url: string }, string>({
			query: (assetId) => ({
				url: `/portfolio/assets/${assetId}/download`,
			}),
		}),
		removePortfolioAsset: builder.mutation<void, string>({
			query: (assetId) => ({
				url: `/portfolio/assets/${assetId}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['PortfolioItem'],
		}),
	}),
})

export const {
	useListPortfolioQuery,
	useGetPortfolioItemQuery,
	useGetPortfolioTagsQuery,
	useCreatePortfolioItemMutation,
	useUpdatePortfolioItemMutation,
	useArchivePortfolioItemMutation,
	useDeletePortfolioItemMutation,
	useUploadPortfolioAssetMutation,
	useSignAssetDownloadMutation,
	useRemovePortfolioAssetMutation,
} = portfolioApi
