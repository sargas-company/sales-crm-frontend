import { baseApi } from '../../api/baseApi'

export interface FileManagerCrumb {
	id: string
	name: string
}

export interface FileManagerFolder {
	id: string
	name: string
	parentId: string | null
	createdAt: string
	updatedAt: string
	childFolderCount: number
	fileCount: number
}

export interface FileManagerFile {
	id: string
	folderId: string | null
	originalName: string
	mimeType: string
	size: number
	createdAt: string
	updatedAt: string
	uploadedBy: { id: string; name: string; email: string } | null
}

export interface FileManagerListing {
	folderId: string | null
	breadcrumbs: FileManagerCrumb[]
	folders: FileManagerFolder[]
	files: FileManagerFile[]
}

export interface SignedUrl {
	url: string
	fileName?: string
	mimeType?: string
}

export interface FileManagerTreeNode {
	id: string
	name: string
	parentId: string | null
	fileCount: number
	childFolderCount: number
	children: FileManagerTreeNode[]
}

export interface FileManagerTree {
	roots: FileManagerTreeNode[]
	rootFileCount: number
}

export interface FileManagerStats {
	total: number
	count: number
	buckets: {
		images: number
		documents: number
		videos: number
		audio: number
		other: number
	}
}

export const fileManagerApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listFolder: builder.query<FileManagerListing, string | null>({
			query: (folderId) => ({
				url: folderId
					? `/file-manager/folders/${folderId}`
					: '/file-manager/folders/root',
			}),
			providesTags: (_r, _e, folderId) => [
				{ type: 'FileManager', id: folderId ?? 'root' },
			],
		}),

		getTree: builder.query<FileManagerTree, void>({
			query: () => ({ url: '/file-manager/tree' }),
			providesTags: [{ type: 'FileManager', id: 'TREE' }],
		}),

		getStats: builder.query<FileManagerStats, void>({
			query: () => ({ url: '/file-manager/stats' }),
			providesTags: [{ type: 'FileManager', id: 'STATS' }],
		}),

		createFolder: builder.mutation<
			{ id: string },
			{ name: string; parentId?: string | null }
		>({
			query: ({ name, parentId }) => ({
				url: '/file-manager/folders',
				method: 'POST',
				body: { name, parentId: parentId ?? undefined },
			}),
			invalidatesTags: (_r, _e, { parentId }) => [
				{ type: 'FileManager', id: parentId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
			],
		}),

		renameFolder: builder.mutation<
			{ id: string },
			{ id: string; name: string; parentId: string | null }
		>({
			query: ({ id, name }) => ({
				url: `/file-manager/folders/${id}/rename`,
				method: 'PATCH',
				body: { name },
			}),
			invalidatesTags: (_r, _e, { parentId }) => [
				{ type: 'FileManager', id: parentId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
			],
		}),

		moveFolder: builder.mutation<
			{ id: string },
			{
				id: string
				fromFolderId: string | null
				targetFolderId: string | null
			}
		>({
			query: ({ id, targetFolderId }) => ({
				url: `/file-manager/folders/${id}/move`,
				method: 'PATCH',
				body: { targetFolderId: targetFolderId ?? null },
			}),
			invalidatesTags: (_r, _e, { fromFolderId, targetFolderId }) => [
				{ type: 'FileManager', id: fromFolderId ?? 'root' },
				{ type: 'FileManager', id: targetFolderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
			],
		}),

		deleteFolder: builder.mutation<
			{ id: string },
			{ id: string; parentId: string | null }
		>({
			query: ({ id }) => ({
				url: `/file-manager/folders/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { parentId }) => [
				{ type: 'FileManager', id: parentId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			],
		}),

		uploadFile: builder.mutation<
			FileManagerFile,
			{ folderId: string | null; file: File }
		>({
			queryFn: async ({ folderId, file }, _api, _extraOptions, fetchWithBQ) => {
				const body = new FormData()
				body.append('file', file)
				const result = await fetchWithBQ({
					url: `/file-manager/files${folderId ? `?folderId=${folderId}` : ''}`,
					method: 'POST',
					body,
				})
				if (result.error) return { error: result.error as never }
				return { data: result.data as FileManagerFile }
			},
			invalidatesTags: (_r, _e, { folderId }) => [
				{ type: 'FileManager', id: folderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			],
		}),

		renameFile: builder.mutation<
			{ id: string },
			{ id: string; name: string; folderId: string | null }
		>({
			query: ({ id, name }) => ({
				url: `/file-manager/files/${id}/rename`,
				method: 'PATCH',
				body: { name },
			}),
			invalidatesTags: (_r, _e, { folderId }) => [
				{ type: 'FileManager', id: folderId ?? 'root' },
			],
		}),

		moveFile: builder.mutation<
			{ id: string },
			{
				id: string
				fromFolderId: string | null
				targetFolderId: string | null
			}
		>({
			query: ({ id, targetFolderId }) => ({
				url: `/file-manager/files/${id}/move`,
				method: 'PATCH',
				body: { targetFolderId: targetFolderId ?? null },
			}),
			invalidatesTags: (_r, _e, { fromFolderId, targetFolderId }) => [
				{ type: 'FileManager', id: fromFolderId ?? 'root' },
				{ type: 'FileManager', id: targetFolderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
			],
		}),

		deleteFile: builder.mutation<
			{ id: string },
			{ id: string; folderId: string | null }
		>({
			query: ({ id }) => ({
				url: `/file-manager/files/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { folderId }) => [
				{ type: 'FileManager', id: folderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			],
		}),

		getFileDownloadUrl: builder.query<SignedUrl, string>({
			query: (id) => ({ url: `/file-manager/files/${id}/download-url` }),
		}),

		getFilePreviewUrl: builder.query<SignedUrl, string>({
			query: (id) => ({ url: `/file-manager/files/${id}/preview-url` }),
		}),

		bulkDelete: builder.mutation<
			{
				deletedFolders: number
				deletedFiles: number
				failed: { id: string; kind: 'folder' | 'file'; reason: string }[]
			},
			{ folderIds: string[]; fileIds: string[]; folderId: string | null }
		>({
			query: ({ folderIds, fileIds }) => ({
				url: '/file-manager/bulk-delete',
				method: 'POST',
				body: { folderIds, fileIds },
			}),
			invalidatesTags: (_r, _e, { folderId }) => [
				{ type: 'FileManager', id: folderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			],
		}),

		bulkMove: builder.mutation<
			{
				movedFolders: number
				movedFiles: number
				failed: { id: string; kind: 'folder' | 'file'; reason: string }[]
			},
			{
				folderIds: string[]
				fileIds: string[]
				destinationFolderId: string | null
				sourceFolderId: string | null
			}
		>({
			query: ({ folderIds, fileIds, destinationFolderId }) => ({
				url: '/file-manager/bulk-move',
				method: 'POST',
				body: { folderIds, fileIds, destinationFolderId },
			}),
			invalidatesTags: (_r, _e, { destinationFolderId, sourceFolderId }) => [
				{ type: 'FileManager', id: sourceFolderId ?? 'root' },
				{ type: 'FileManager', id: destinationFolderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			],
		}),
	}),
})

export const {
	useListFolderQuery,
	useGetTreeQuery,
	useGetStatsQuery,
	useCreateFolderMutation,
	useRenameFolderMutation,
	useMoveFolderMutation,
	useDeleteFolderMutation,
	useUploadFileMutation,
	useRenameFileMutation,
	useMoveFileMutation,
	useDeleteFileMutation,
	useLazyGetFileDownloadUrlQuery,
	useLazyGetFilePreviewUrlQuery,
	useBulkDeleteMutation,
	useBulkMoveMutation,
} = fileManagerApi
