import { baseApi } from '../../api/baseApi'

export interface EmployeeAttachment {
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
 * Attachments for Employee records. Upload is FormData (axios base
 * query passes it through unchanged, which skips the JSON serializer
 * and lets the browser set the multipart boundary itself). Download
 * goes through a backend-issued presigned Backblaze URL — bytes never
 * touch our server on the read path.
 */
export const employeeAttachmentsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		listEmployeeAttachments: builder.query<EmployeeAttachment[], string>({
			query: (employeeId) => ({
				url: `/employees/${employeeId}/attachments`,
			}),
			providesTags: (_r, _e, employeeId) => [
				{ type: 'EmployeeAttachment', id: employeeId },
			],
		}),
		uploadEmployeeAttachment: builder.mutation<
			{ id: string },
			{ employeeId: string; file: File }
		>({
			query: ({ employeeId, file }) => {
				const body = new FormData()
				body.append('file', file)
				return {
					url: `/employees/${employeeId}/attachments`,
					method: 'POST',
					body,
				}
			},
			invalidatesTags: (_r, _e, { employeeId }) => [
				{ type: 'EmployeeAttachment', id: employeeId },
			],
		}),
		deleteEmployeeAttachment: builder.mutation<
			{ id: string },
			{ employeeId: string; attachmentId: string }
		>({
			query: ({ employeeId, attachmentId }) => ({
				url: `/employees/${employeeId}/attachments/${attachmentId}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { employeeId }) => [
				{ type: 'EmployeeAttachment', id: employeeId },
			],
		}),
	}),
})

export const {
	useListEmployeeAttachmentsQuery,
	useUploadEmployeeAttachmentMutation,
	useDeleteEmployeeAttachmentMutation,
} = employeeAttachmentsApi

/**
 * Non-RTK fetch: ask the backend for a short-lived signed B2 URL, then
 * open it. We do NOT want the signed URL in Redux (it leaks into
 * DevTools + persists in the mutation cache), and we have no reason to
 * cache it — each click opens a new one.
 */
export async function fetchEmployeeAttachmentDownload(
	employeeId: string,
	attachmentId: string,
): Promise<{ url: string; fileName: string }> {
	const { default: axios } = await import('../../api/axiosInstance')
	const res = await axios.get<{ url: string; fileName: string }>(
		`/employees/${employeeId}/attachments/${attachmentId}/download-url`,
	)
	return res.data
}
