import { useCallback, useEffect, useRef, useState } from 'react'

export const ALLOWED_EXTENSIONS = [
	'.pdf', '.docx', '.txt', '.md', '.xlsx', '.csv', '.jpg', '.jpeg', '.png',
]
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])
const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_FILES = 10

export interface AttachedFile {
	id: string
	file: File
	name: string
	size: number
	ext: string
	previewUrl?: string
}

export const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const useFileAttachment = () => {
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
	const [fileErrors, setFileErrors] = useState<string[]>([])
	const currentFilesRef = useRef<AttachedFile[]>([])

	useEffect(() => {
		currentFilesRef.current = attachedFiles
	}, [attachedFiles])

	useEffect(() => {
		if (fileErrors.length === 0) return
		const t = setTimeout(() => setFileErrors([]), 4000)
		return () => clearTimeout(t)
	}, [fileErrors])

	const validateAndAdd = useCallback((files: File[]) => {
		const errors: string[] = []
		const toAdd: AttachedFile[] = []
		const current = currentFilesRef.current

		for (const file of files) {
			if (current.length + toAdd.length >= MAX_FILES) {
				if (!errors.some((e) => e.includes('максимум'))) {
					errors.push(`Можно прикрепить максимум ${MAX_FILES} файлов.`)
				}
				break
			}

			const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`

			if (!ALLOWED_EXTENSIONS.includes(ext)) {
				errors.push(`"${file.name}": этот тип файла не поддерживается.`)
				continue
			}

			if (file.size > MAX_FILE_SIZE) {
				errors.push(`"${file.name}": файл слишком большой. Максимальный размер — 100 MB.`)
				continue
			}

			const id = `${file.name}-${file.size}-${file.lastModified}`
			const isDup = current.some((f) => f.id === id) || toAdd.some((f) => f.id === id)
			if (isDup) continue

			toAdd.push({
				id,
				file,
				name: file.name,
				size: file.size,
				ext,
				previewUrl: IMAGE_EXTS.has(ext) ? URL.createObjectURL(file) : undefined,
			})
		}

		if (toAdd.length > 0) setAttachedFiles((prev) => [...prev, ...toAdd])
		if (errors.length > 0) setFileErrors(errors)
	}, [])

	const removeFile = useCallback((id: string) => {
		setAttachedFiles((prev) => {
			const f = prev.find((f) => f.id === id)
			if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl)
			return prev.filter((f) => f.id !== id)
		})
	}, [])

	const clearFiles = useCallback(() => {
		setAttachedFiles((prev) => {
			prev.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
			return []
		})
	}, [])

	return { attachedFiles, fileErrors, validateAndAdd, removeFile, clearFiles }
}
