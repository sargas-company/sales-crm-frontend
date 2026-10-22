import { baseApi } from '../../api/baseApi'

export interface ProjectAttachment {
	id: string
	originalName: string
	mimeType: string
	size: number
	createdAt: string
	uploadedBy: {
		id: string
		name: string
		email: string | null
	} | null
}

/**
 * Attachments for Project records. 1:1 mirror of
 * `employeeAttachmentsApi` — Upload is FormData (axios base query
 * passes it through unchanged so the browser sets the multipart
 * boundary); download goes through a backend-issued presigned
 * Backblaze URL so bytes never touch our server on the read path.
 */
export const projectAttachmentsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listProjectAttachments: builder.query<ProjectAttachment[], string>({
			query: (projectId) => ({
				url: `/projects/${projectId}/attachments`,
			}),
			providesTags: (_r, _e, projectId) => [
				{ type: 'ProjectAttachment', id: projectId },
			],
		}),
		uploadProjectAttachment: builder.mutation<
			{ id: string },
			{ projectId: string; file: File }
		>({
			query: ({ projectId, file }) => {
				const body = new FormData()
				body.append('file', file)
				return {
					url: `/projects/${projectId}/attachments`,
					method: 'POST',
					body,
				}
			},
			invalidatesTags: (_r, _e, { projectId }) => [
				{ type: 'ProjectAttachment', id: projectId },
			],
		}),
		deleteProjectAttachment: builder.mutation<
			{ id: string },
			{ projectId: string; attachmentId: string }
		>({
			query: ({ projectId, attachmentId }) => ({
				url: `/projects/${projectId}/attachments/${attachmentId}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { projectId }) => [
				{ type: 'ProjectAttachment', id: projectId },
			],
		}),
	}),
})

export const {
	useListProjectAttachmentsQuery,
	useUploadProjectAttachmentMutation,
	useDeleteProjectAttachmentMutation,
} = projectAttachmentsApi

/**
 * Non-RTK fetch for signed-URL downloads — same reasoning as the
 * employee counterpart: no benefit in Redux-caching an ephemeral URL,
 * and we don't want it in DevTools.
 */
export async function fetchProjectAttachmentDownload(
	projectId: string,
	attachmentId: string,
): Promise<{ url: string; fileName: string }> {
	const { default: axios } = await import('../../api/axiosInstance')
	const res = await axios.get<{ url: string; fileName: string }>(
		`/projects/${projectId}/attachments/${attachmentId}/download-url`,
	)
	return res.data
}
