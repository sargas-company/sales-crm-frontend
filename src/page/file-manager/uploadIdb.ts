/* Minimal IndexedDB wrapper for persisting resumable upload intents
 * across page reloads. Stores metadata only (name, size, sha1,
 * sessionId, status, folderId, partsReceived) — never the file
 * bytes. On reload the frontend reads this store, cross-checks each
 * entry with the backend `/file-manager/uploads/mine`, and shows
 * them in the tray with a Resume button. */

const DB_NAME = 'sargas-file-manager'
const DB_VERSION = 1
const STORE = 'uploads'

export interface PersistedUpload {
	/** Local id — stable across reloads, generated when upload is
	 *  first enqueued. */
	id: string
	/** Backend session id. */
	sessionId: string
	folderId: string | null
	fileName: string
	mimeType: string
	size: number
	sha1: string
	chunkSize: number
	totalParts: number
	partsReceived: number[]
	/** Only non-terminal statuses survive reload: paused, interrupted,
	 *  error. We never persist `uploading` (reload turns it into
	 *  `interrupted`), `queued` (reload drops it), or `done` (owner-
	 *  approved rule: done rows are ephemeral). */
	status: 'paused' | 'interrupted' | 'error'
	error?: string
	createdAt: number
	updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

const open = (): Promise<IDBDatabase> => {
	if (dbPromise) return dbPromise
	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = () => {
			const db = req.result
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: 'id' })
			}
		}
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
	return dbPromise
}

const tx = async (mode: IDBTransactionMode) => {
	const db = await open()
	const t = db.transaction(STORE, mode)
	return t.objectStore(STORE)
}

export const idbList = async (): Promise<PersistedUpload[]> => {
	try {
		const store = await tx('readonly')
		return await new Promise((resolve, reject) => {
			const req = store.getAll()
			req.onsuccess = () => resolve((req.result ?? []) as PersistedUpload[])
			req.onerror = () => reject(req.error)
		})
	} catch {
		return []
	}
}

export const idbPut = async (row: PersistedUpload): Promise<void> => {
	try {
		const store = await tx('readwrite')
		await new Promise<void>((resolve, reject) => {
			const req = store.put({ ...row, updatedAt: Date.now() })
			req.onsuccess = () => resolve()
			req.onerror = () => reject(req.error)
		})
	} catch {
		/* ignore — IDB failures should never break the main flow */
	}
}

export const idbDelete = async (id: string): Promise<void> => {
	try {
		const store = await tx('readwrite')
		await new Promise<void>((resolve, reject) => {
			const req = store.delete(id)
			req.onsuccess = () => resolve()
			req.onerror = () => reject(req.error)
		})
	} catch {
		/* ignore */
	}
}
