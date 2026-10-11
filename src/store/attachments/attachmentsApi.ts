import { API_BASE_URL, baseApi } from '../../api/baseApi'

export type AttachmentOwnerType = 'lead' | 'client'

export interface AttachmentItem {
	id: string
	ownerType: AttachmentOwnerType
	ownerId: string
	originalName: string
	mimeType: string
	size: number
	uploadedById: string | null
	uploadedBy: { id: string; firstName: string; lastName: string } | null
	createdAt: string
}

interface UploadArgs {
	ownerType: AttachmentOwnerType
	ownerId: string
	file: File
}

export const attachmentsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getAttachments: builder.query<
			AttachmentItem[],
			{ ownerType: AttachmentOwnerType; ownerId: string }
		>({
			query: ({ ownerType, ownerId }) => ({
				url:
					ownerType === 'lead'
						? `/leads/${ownerId}/attachments`
						: `/clients/${ownerId}/attachments`,
			}),
			providesTags: (_, __, { ownerType, ownerId }) => [
				{ type: 'Attachment', id: `${ownerType}:${ownerId}` },
			],
		}),

		uploadAttachment: builder.mutation<AttachmentItem, UploadArgs>({
			query: ({ ownerType, ownerId, file }) => {
				const form = new FormData()
				form.append('file', file, file.name)
				return {
					url:
						ownerType === 'lead'
							? `/leads/${ownerId}/attachments`
							: `/clients/${ownerId}/attachments`,
					method: 'POST',
					body: form,
				}
			},
			invalidatesTags: (_, __, { ownerType, ownerId }) => [
				{ type: 'Attachment', id: `${ownerType}:${ownerId}` },
			],
		}),

		deleteAttachment: builder.mutation<
			void,
			{ id: string; ownerType: AttachmentOwnerType; ownerId: string }
		>({
			query: ({ id }) => ({
				url: `/attachments/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_, __, { ownerType, ownerId }) => [
				{ type: 'Attachment', id: `${ownerType}:${ownerId}` },
			],
		}),
	}),
})

export const {
	useGetAttachmentsQuery,
	useUploadAttachmentMutation,
	useDeleteAttachmentMutation,
} = attachmentsApi

/* Download URL — the browser follows the backend redirect / stream
 * and the authenticated axios interceptor doesn't apply here, so we
 * assemble the URL with the raw API base. Caller renders this as a
 * plain <a href> with `download` attribute. */
export const attachmentDownloadUrl = (id: string): string =>
	`${API_BASE_URL}/attachments/${id}/download`
