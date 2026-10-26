import axiosInstance from '../../api/axiosInstance'

/* Thin wrappers around the resumable upload REST endpoints. Isolated
 * here so the queue store stays focused on orchestration + state.
 * Shapes mirror the backend `UploadSessionService`. */

export interface InitUploadRequest {
	fileName: string
	mimeType: string
	size: number
	sha1: string
	folderId?: string | null
}

export interface UploadSessionDto {
	id: string
	folderId: string | null
	fileName: string
	mimeType: string
	size: number
	sha1: string
	chunkSize: number
	totalParts: number
	partsReceived: number[]
	status: 'OPEN' | 'FINALIZED' | 'ABORTED'
	expiresAt: string
	createdAt: string
}

export const apiInitUpload = async (
	req: InitUploadRequest,
): Promise<UploadSessionDto> => {
	const payload: InitUploadRequest = {
		fileName: req.fileName,
		mimeType: req.mimeType,
		size: req.size,
		sha1: req.sha1,
	}
	if (req.folderId) payload.folderId = req.folderId
	const { data } = await axiosInstance.post<UploadSessionDto>(
		'/file-manager/uploads',
		payload,
	)
	return data
}

export const apiUploadPart = async (
	sessionId: string,
	partIndex: number,
	chunk: Blob,
	opts: { signal?: AbortSignal; onProgress?: (loaded: number) => void } = {},
): Promise<{ received: number; total: number }> => {
	const body = new FormData()
	body.append('part', chunk, `part-${partIndex}`)
	const { data } = await axiosInstance.post<{ received: number; total: number }>(
		`/file-manager/uploads/${sessionId}/parts/${partIndex}`,
		body,
		{
			signal: opts.signal,
			onUploadProgress: (e) => {
				if (opts.onProgress && e.loaded) opts.onProgress(e.loaded)
			},
		},
	)
	return data
}

export const apiFinalizeUpload = async (
	sessionId: string,
): Promise<{ id: string; originalName: string }> => {
	const { data } = await axiosInstance.post<{ id: string; originalName: string }>(
		`/file-manager/uploads/${sessionId}/finalize`,
	)
	return data
}

export const apiCancelUpload = async (sessionId: string): Promise<void> => {
	await axiosInstance.delete(`/file-manager/uploads/${sessionId}`)
}

export const apiGetUpload = async (
	sessionId: string,
): Promise<UploadSessionDto | null> => {
	try {
		const { data } = await axiosInstance.get<UploadSessionDto>(
			`/file-manager/uploads/${sessionId}`,
		)
		return data
	} catch (err: unknown) {
		const status = (err as { response?: { status?: number } })?.response?.status
		if (status === 404) return null
		throw err
	}
}

export const apiListMyUploads = async (): Promise<UploadSessionDto[]> => {
	const { data } = await axiosInstance.get<UploadSessionDto[]>(
		'/file-manager/uploads/mine',
	)
	return data
}
