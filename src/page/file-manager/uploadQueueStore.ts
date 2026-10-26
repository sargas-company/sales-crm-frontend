import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import { fileManagerApi } from '../../store/file-manager/fileManagerApi'
import { store } from '../../store/store'

import {
	apiCancelUpload,
	apiFinalizeUpload,
	apiGetUpload,
	apiInitUpload,
	apiListMyUploads,
	apiUploadPart,
} from './uploadApi'
import { idbDelete, idbList, idbPut, type PersistedUpload } from './uploadIdb'

/* Resumable upload queue — module-level state driven via
 * useSyncExternalStore.
 *
 * Lifecycle of a single upload:
 *   enqueueUploads(files, folderId)
 *     -> queued → verifying (SHA-1 in Web Worker) → initializing
 *     -> uploading (16 MiB chunks, 2 parallel) → done
 *
 *   pauseUpload(id)              — aborts in-flight chunks → paused
 *   resumeUpload(id)             — paused: continue, or interrupted/
 *                                   error (file lost): opens picker
 *   resumeInterruptedWithFile(id, file)
 *                                — called after user picks the file
 *                                  for an interrupted/error upload;
 *                                  verifies SHA-1 then continues
 *
 * IDB persistence: paused / interrupted / error rows survive reload;
 * on page load, hydrateFromIdb() cross-checks with backend and marks
 * expired sessions as needing restart. */

export type UploadStatus =
	| 'queued'
	| 'verifying'
	| 'initializing'
	| 'uploading'
	| 'paused'
	| 'done'
	| 'error'
	| 'cancelled'
	| 'interrupted'

export interface UploadItem {
	/** Stable local id. Doesn't change across reload. */
	id: string
	/** Backend session id (set after init). May be undefined
	 *  briefly while in queued/verifying. */
	sessionId?: string
	folderId: string | null
	fileName: string
	mimeType: string
	size: number
	sha1?: string
	chunkSize?: number
	totalParts?: number
	/** Last known %  (0-100). For uploading: parts-done + current
	 *  chunk's in-flight bytes. For verifying: SHA-1 progress. */
	progress: number
	status: UploadStatus
	error?: string
	createdAt: number
	/** In-memory File. Undefined after reload (survives only within
	 *  one browser tab lifetime). */
	file?: File
	/** Parts already acknowledged by backend. Source of truth is
	 *  server-side; mirrored here for UI + resume math. */
	partsReceived: number[]
	/** Active abort controllers for in-flight chunks. */
	controllers: AbortController[]
}

interface State {
	items: UploadItem[]
	minimized: boolean
	dismissed: boolean
	hydrated: boolean
}

const STORAGE_KEY = 'sargas:file-manager:upload-tray'

const readPersisted = (): Partial<Pick<State, 'minimized' | 'dismissed'>> => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return {}
		return JSON.parse(raw) as Partial<Pick<State, 'minimized' | 'dismissed'>>
	} catch {
		return {}
	}
}

const writePersisted = (s: State) => {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ minimized: s.minimized, dismissed: s.dismissed }),
		)
	} catch {
		/* ignore */
	}
}

let state: State = {
	items: [],
	minimized: readPersisted().minimized ?? false,
	dismissed: readPersisted().dismissed ?? false,
	hydrated: false,
}

const listeners = new Set<() => void>()
const emit = () => {
	writePersisted(state)
	listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
	listeners.add(l)
	return () => listeners.delete(l)
}
const getSnapshot = () => state

export const useUploadQueue = (): State =>
	useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/* ─── Helpers ─────────────────────────────────────────────────────── */

const genId = () => `up_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const patch = (id: string, p: Partial<UploadItem>) => {
	const prev = state.items.find((i) => i.id === id)
	const statusChanged = !!p.status && !!prev && p.status !== prev.status
	/* Which tray group the row belongs to — must stay in sync with
	 *  the filter in TrayCardView. We only trigger a View Transition
	 *  when the mutation actually crosses a group boundary; pause ↔
	 *  resume ↔ queued ↔ interrupted all stay in Active and must
	 *  NOT animate, otherwise the browser snapshots the row at its
	 *  viewport position and renders the ::view-transition-old/new
	 *  pseudo-elements at the document root (outside the tray's
	 *  overflow:auto clip). A row scrolled below the visible fold
	 *  then briefly flashes BELOW the tray card during the swap. */
	const groupOf = (s: UploadItem['status']): string => {
		if (s === 'done') return 'completed'
		if (s === 'error') return 'failed'
		if (s === 'cancelled') return 'cancelled'
		return 'active'
	}
	const groupChanged =
		statusChanged && !!prev && groupOf(p.status!) !== groupOf(prev.status)
	const mutate = () => {
		state = {
			...state,
			items: state.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
		}
		emit()
	}
	/* View Transitions only for cross-group moves (uploading → done,
	 *  → cancelled, → error). flushSync forces React to commit
	 *  synchronously so the browser's second snapshot sees the new
	 *  DOM. Non-chromium browsers fall through to the plain update. */
	const canViewTransition =
		groupChanged &&
		typeof document !== 'undefined' &&
		typeof (document as unknown as { startViewTransition?: unknown })
			.startViewTransition === 'function'
	if (canViewTransition) {
		const vtName = `upload-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
		/* Snapshot phase: find the row in its OLD group and tag only
		 *  it with the view-transition-name, so the browser doesn't
		 *  cross-fade every other row that happens to share a stable
		 *  name across the snapshot. */
		const before = document.querySelector<HTMLElement>(
			`[data-upload-row="${CSS.escape(id)}"]`,
		)
		if (before) before.style.setProperty('view-transition-name', vtName)
		;(
			document as unknown as {
				startViewTransition: (cb: () => void | Promise<void>) => {
					finished: Promise<void>
				}
			}
		)
			.startViewTransition(() => {
				flushSync(mutate)
				/* After the React commit, the NEW DOM has a fresh
				 *  element in the destination group. Give it the same
				 *  view-transition-name so the browser matches it to
				 *  the old one and animates the travel. */
				const after = document.querySelector<HTMLElement>(
					`[data-upload-row="${CSS.escape(id)}"]`,
				)
				if (after) after.style.setProperty('view-transition-name', vtName)
			})
			.finished.finally(() => {
				/* Clean up — leaving the name set would make the next
				 *  unrelated VT snapshot still consider this row
				 *  "named" and default-cross-fade it. */
				const cleanup = document.querySelector<HTMLElement>(
					`[data-upload-row="${CSS.escape(id)}"]`,
				)
				if (cleanup) cleanup.style.removeProperty('view-transition-name')
			})
	} else {
		mutate()
	}
}

const findItem = (id: string): UploadItem | undefined =>
	state.items.find((i) => i.id === id)

const persistItem = async (it: UploadItem) => {
	if (!it.sessionId || !it.sha1 || !it.chunkSize || !it.totalParts) return
	/* Only snapshot the statuses the owner wants to survive reload. */
	const persistableStatus =
		it.status === 'paused' || it.status === 'interrupted' || it.status === 'error'
	if (!persistableStatus) return
	const row: PersistedUpload = {
		id: it.id,
		sessionId: it.sessionId,
		folderId: it.folderId,
		fileName: it.fileName,
		mimeType: it.mimeType,
		size: it.size,
		sha1: it.sha1,
		chunkSize: it.chunkSize,
		totalParts: it.totalParts,
		partsReceived: it.partsReceived,
		status: it.status as 'paused' | 'interrupted' | 'error',
		error: it.error,
		createdAt: it.createdAt,
		updatedAt: Date.now(),
	}
	await idbPut(row)
}

const forgetItem = (it: UploadItem) => {
	void idbDelete(it.id)
}

const computeProgress = (totalParts: number, partsReceived: number[]): number => {
	if (totalParts === 0) return 0
	return Math.min(99, Math.round((partsReceived.length / totalParts) * 100))
}

/* ─── Worker (SHA-1) ──────────────────────────────────────────────── */

type Sha1Message =
	| { kind: 'progress'; id: string; pct: number }
	| { kind: 'done'; id: string; sha1: string }
	| { kind: 'error'; id: string; message: string }

const sha1OfFile = (id: string, file: File, onProgress: (pct: number) => void) =>
	new Promise<string>((resolve, reject) => {
		const w = new Worker(new URL('./sha1.worker.ts', import.meta.url), {
			type: 'module',
		})
		w.addEventListener('message', (e: MessageEvent<Sha1Message>) => {
			const msg = e.data
			if (msg.id !== id) return
			if (msg.kind === 'progress') onProgress(msg.pct)
			else if (msg.kind === 'done') {
				w.terminate()
				resolve(msg.sha1)
			} else if (msg.kind === 'error') {
				w.terminate()
				reject(new Error(msg.message))
			}
		})
		w.postMessage({ kind: 'start', id, file })
	})

/* ─── Concurrency ─────────────────────────────────────────────────── */

/** Max files uploading simultaneously. Each file in turn uploads
 *  PARTS_PER_FILE parts in parallel. */
const MAX_CONCURRENT_FILES = 2
const PARTS_PER_FILE = 2
const PART_RETRIES = 3
const RETRY_BACKOFF_MS = [1_000, 4_000, 15_000]

const activeFileCount = () =>
	state.items.filter((i) => i.status === 'uploading').length

const runNext = () => {
	while (activeFileCount() < MAX_CONCURRENT_FILES) {
		const next = state.items.find(
			(i) => i.status === 'queued' || i.status === 'verifying',
		)
		if (!next) return
		if (next.status === 'queued') void startUpload(next.id)
		return // wait for queued to transition before kicking another
	}
}

/* ─── Enqueue (new upload) ────────────────────────────────────────── */

export const enqueueUploads = (
	files: File[] | FileList,
	folderId: string | null,
) => {
	const arr = Array.from(files)
	const added: UploadItem[] = arr.map((f) => ({
		id: genId(),
		folderId,
		fileName: f.name,
		mimeType: f.type || 'application/octet-stream',
		size: f.size,
		progress: 0,
		status: 'queued' as UploadStatus,
		createdAt: Date.now(),
		file: f,
		partsReceived: [],
		controllers: [],
	}))
	state = {
		...state,
		items: [...state.items, ...added],
		dismissed: false,
		minimized: false,
	}
	emit()
	queueMicrotask(runNext)
}

/* ─── Start / verify / init / push parts ──────────────────────────── */

const startUpload = async (id: string) => {
	const it = findItem(id)
	if (!it || !it.file) return
	patch(id, { status: 'verifying', progress: 0 })
	try {
		const sha1 =
			it.sha1 ??
			(await sha1OfFile(it.id, it.file, (pct) => patch(id, { progress: pct })))
		patch(id, { sha1, status: 'initializing', progress: 0 })

		const session = await apiInitUpload({
			fileName: it.fileName,
			mimeType: it.mimeType,
			size: it.size,
			sha1,
			folderId: it.folderId,
		})
		patch(id, {
			sessionId: session.id,
			chunkSize: session.chunkSize,
			totalParts: session.totalParts,
			partsReceived: session.partsReceived,
			status: 'uploading',
			progress: computeProgress(session.totalParts, session.partsReceived),
		})
		await drivePartsLoop(id)
	} catch (err: unknown) {
		const msg = (err as { message?: string })?.message ?? String(err)
		patch(id, { status: 'error', error: msg })
		await persistItem(findItem(id)!)
		queueMicrotask(runNext)
	}
}

const drivePartsLoop = async (id: string) => {
	/* Pump up to PARTS_PER_FILE parts concurrently for this file.
	 * Each worker loop pulls the next-missing part until the file is
	 * either paused/cancelled or all parts are through. On success →
	 * finalize. On failure of a part after retries → status error. */
	const workers = Array.from({ length: PARTS_PER_FILE }, () => partWorker(id))
	try {
		await Promise.all(workers)
		await maybeFinalize(id)
	} catch (err: unknown) {
		const it = findItem(id)
		if (!it) return
		if (it.status === 'paused' || it.status === 'cancelled') return
		const msg = (err as { message?: string })?.message ?? String(err)
		patch(id, { status: 'error', error: msg })
		await persistItem(findItem(id)!)
	} finally {
		queueMicrotask(runNext)
	}
}

const partWorker = async (id: string): Promise<void> => {
	for (;;) {
		const it = findItem(id)
		if (!it || !it.file || !it.sessionId || !it.chunkSize || !it.totalParts) return
		if (it.status !== 'uploading') return
		const next = pickNextMissingPart(it)
		if (next === null) return
		const chunk = sliceChunk(it.file, next, it.chunkSize, it.size)

		const controller = new AbortController()
		registerController(id, controller)
		try {
			await uploadPartWithRetry(it.sessionId, next, chunk, controller.signal)
			unregisterController(id, controller)

			const after = findItem(id)
			if (!after) return
			const partsReceived = after.partsReceived.includes(next)
				? after.partsReceived
				: [...after.partsReceived, next]
			patch(id, {
				partsReceived,
				progress: computeProgress(after.totalParts!, partsReceived),
			})
		} catch (err: unknown) {
			unregisterController(id, controller)
			const current = findItem(id)
			if (!current) return
			if (controller.signal.aborted && current.status !== 'uploading') {
				/* Expected abort from pause/cancel/unload. */
				return
			}
			throw err
		}
	}
}

const uploadPartWithRetry = async (
	sessionId: string,
	index: number,
	chunk: Blob,
	signal: AbortSignal,
): Promise<void> => {
	let lastErr: unknown
	for (let attempt = 0; attempt < PART_RETRIES; attempt++) {
		if (signal.aborted) throw new Error('aborted')
		try {
			await apiUploadPart(sessionId, index, chunk, { signal })
			return
		} catch (err: unknown) {
			lastErr = err
			if (signal.aborted) throw err
			const status = (err as { response?: { status?: number } })?.response?.status
			/* Non-retriable status codes: 400 / 401 / 403 / 404 / 413. */
			if (status && [400, 401, 403, 404, 413].includes(status)) throw err
			const delay = RETRY_BACKOFF_MS[attempt] ?? 15_000
			await sleep(delay)
		}
	}
	throw lastErr
}

const maybeFinalize = async (id: string) => {
	const it = findItem(id)
	if (!it || !it.sessionId || !it.totalParts) return
	if (it.partsReceived.length < it.totalParts) return
	if (it.status !== 'uploading') return
	try {
		await apiFinalizeUpload(it.sessionId)
		patch(id, { status: 'done', progress: 100 })
		forgetItem(it)
		store.dispatch(
			fileManagerApi.util.invalidateTags([
				{ type: 'FileManager', id: it.folderId ?? 'root' },
				{ type: 'FileManager', id: 'TREE' },
				{ type: 'FileManager', id: 'STATS' },
			]),
		)
	} catch (err: unknown) {
		const msg = (err as { message?: string })?.message ?? String(err)
		patch(id, { status: 'error', error: msg })
		await persistItem(findItem(id)!)
	}
}

const pickNextMissingPart = (it: UploadItem): number | null => {
	if (!it.totalParts) return null
	const got = new Set(it.partsReceived)
	for (let n = 1; n <= it.totalParts; n++) if (!got.has(n)) return n
	return null
}

const sliceChunk = (
	file: File,
	partIndex: number,
	chunkSize: number,
	totalSize: number,
): Blob => {
	const start = (partIndex - 1) * chunkSize
	const end = Math.min(start + chunkSize, totalSize)
	return file.slice(start, end)
}

const registerController = (id: string, c: AbortController) => {
	const it = findItem(id)
	if (!it) return
	patch(id, { controllers: [...it.controllers, c] })
}
const unregisterController = (id: string, c: AbortController) => {
	const it = findItem(id)
	if (!it) return
	patch(id, { controllers: it.controllers.filter((x) => x !== c) })
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ─── Public actions ──────────────────────────────────────────────── */

export const pauseUpload = (id: string) => {
	const it = findItem(id)
	if (!it) return
	if (it.status === 'uploading') {
		for (const c of it.controllers) c.abort()
	}
	patch(id, { status: 'paused', controllers: [] })
	void persistItem(findItem(id)!)
}

export const resumeUpload = (id: string) => {
	const it = findItem(id)
	if (!it) return
	if (!it.file) {
		/* No bytes in memory — caller should trigger file picker and
		 * then call resumeInterruptedWithFile(). We mark the row as
		 * interrupted so the UI knows to open the picker. */
		patch(id, { status: 'interrupted' })
		void persistItem(findItem(id)!)
		return
	}
	if (it.status === 'paused' || it.status === 'error') {
		patch(id, { status: 'uploading', error: undefined })
		void drivePartsLoop(id)
	}
}

/** Call this after the user re-selects the file for an
 *  interrupted / error row. Verifies size + name + SHA-1 then
 *  continues uploading from the next missing part. */
export const resumeInterruptedWithFile = async (
	id: string,
	file: File,
): Promise<
	{ ok: true } | { ok: false; reason: 'size-name-mismatch' | 'sha1-mismatch' | 'session-gone' }
> => {
	const it = findItem(id)
	if (!it) return { ok: false, reason: 'session-gone' }
	if (file.size !== it.size || file.name !== it.fileName) {
		return { ok: false, reason: 'size-name-mismatch' }
	}
	patch(id, { status: 'verifying', file, progress: 0, error: undefined })
	let sha1: string
	try {
		sha1 = await sha1OfFile(it.id, file, (pct) => patch(id, { progress: pct }))
	} catch (err: unknown) {
		patch(id, {
			status: 'error',
			error: (err as { message?: string })?.message ?? 'hash failed',
		})
		return { ok: false, reason: 'session-gone' }
	}
	if (it.sha1 && sha1 !== it.sha1) {
		patch(id, { status: 'interrupted' })
		return { ok: false, reason: 'sha1-mismatch' }
	}

	/* Session may have expired on the backend — re-check. */
	if (!it.sessionId) {
		patch(id, { status: 'error', error: 'no session id on record' })
		return { ok: false, reason: 'session-gone' }
	}
	const live = await apiGetUpload(it.sessionId)
	if (!live || live.status !== 'OPEN') {
		/* Session gone — start a brand-new session for this file. */
		try {
			const session = await apiInitUpload({
				fileName: it.fileName,
				mimeType: it.mimeType,
				size: it.size,
				sha1,
				folderId: it.folderId,
			})
			patch(id, {
				sessionId: session.id,
				chunkSize: session.chunkSize,
				totalParts: session.totalParts,
				partsReceived: session.partsReceived,
				sha1,
				status: 'uploading',
				progress: 0,
			})
			void drivePartsLoop(id)
			return { ok: true }
		} catch (err: unknown) {
			patch(id, {
				status: 'error',
				error: (err as { message?: string })?.message ?? 're-init failed',
			})
			return { ok: false, reason: 'session-gone' }
		}
	}
	/* Session still alive — pick up where backend left off. */
	patch(id, {
		sessionId: live.id,
		chunkSize: live.chunkSize,
		totalParts: live.totalParts,
		partsReceived: live.partsReceived,
		sha1,
		status: 'uploading',
		progress: computeProgress(live.totalParts, live.partsReceived),
	})
	void drivePartsLoop(id)
	return { ok: true }
}

export const retryUpload = (id: string) => resumeUpload(id)

export const cancelUpload = async (id: string) => {
	const it = findItem(id)
	if (!it) return
	for (const c of it.controllers) c.abort()
	if (it.sessionId) {
		try {
			await apiCancelUpload(it.sessionId)
		} catch {
			/* ignore — best effort */
		}
	}
	patch(id, { status: 'cancelled', controllers: [] })
	forgetItem(it)
}

export const removeUpload = (id: string) => {
	const it = findItem(id)
	if (!it) return
	state = { ...state, items: state.items.filter((i) => i.id !== id) }
	forgetItem(it)
	emit()
}

export const clearFinished = () => {
	const kept: UploadItem[] = []
	for (const i of state.items) {
		if (i.status === 'done' || i.status === 'cancelled') {
			forgetItem(i)
			continue
		}
		kept.push(i)
	}
	state = { ...state, items: kept }
	emit()
}

export const toggleMinimize = () => {
	/* The tray renders as a bar whenever EITHER minimized or
	 *  dismissed is true. Previously this toggled only `minimized`
	 *  and cleared `dismissed` — so the state (minimized:false,
	 *  dismissed:true) needed two clicks on the floating pill to
	 *  expand: first click flipped minimized false→true (still a
	 *  bar), second click flipped it back. Decide from the effective
	 *  mode instead: if we're in a bar in any form, expand fully;
	 *  otherwise minimize. */
	const inBar = state.minimized || state.dismissed
	state = inBar
		? { ...state, minimized: false, dismissed: false }
		: { ...state, minimized: true, dismissed: false }
	emit()
}
export const dismissTray = () => {
	state = { ...state, dismissed: true }
	emit()
}
export const showTray = () => {
	state = { ...state, dismissed: false, minimized: false }
	emit()
}

/* ─── Reload-time hydration ───────────────────────────────────────── */

/** Loads non-terminal persisted items from IDB, cross-checks the
 *  backend session for each, and re-populates the queue. Rows get
 *  status `interrupted` (meaning "needs re-pick") on success,
 *  `error` if the session is gone. Rows whose session is already
 *  FINALIZED are quietly dropped (file was uploaded earlier). */
export const hydrateFromIdb = async (): Promise<void> => {
	if (state.hydrated) return
	state = { ...state, hydrated: true }

	const [persisted, mine] = await Promise.all([
		idbList(),
		apiListMyUploads().catch(() => [] as Awaited<ReturnType<typeof apiListMyUploads>>),
	])
	const mineById = new Map(mine.map((m) => [m.id, m] as const))
	const restored: UploadItem[] = []
	for (const row of persisted) {
		const live = mineById.get(row.sessionId)
		if (!live) {
			/* Backend doesn't know this session (expired / aborted) —
			 * drop it; owner can't do anything without a fresh session,
			 * and the file bytes are gone anyway. */
			void idbDelete(row.id)
			continue
		}
		if (live.status === 'FINALIZED') {
			void idbDelete(row.id)
			continue
		}
		restored.push({
			id: row.id,
			sessionId: row.sessionId,
			folderId: row.folderId,
			fileName: row.fileName,
			mimeType: row.mimeType,
			size: row.size,
			sha1: row.sha1,
			chunkSize: row.chunkSize,
			totalParts: row.totalParts,
			partsReceived: live.partsReceived,
			progress: computeProgress(row.totalParts, live.partsReceived),
			status: 'interrupted',
			error: row.error,
			createdAt: row.createdAt,
			controllers: [],
		})
	}
	if (restored.length > 0) {
		state = {
			...state,
			items: [...restored, ...state.items],
			dismissed: false,
		}
		emit()
	}
}

/* ─── Pre-unload: mark uploading rows as interrupted ──────────────── */

if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		for (const it of state.items) {
			if (it.status === 'uploading' || it.status === 'initializing') {
				const row: PersistedUpload | null =
					it.sessionId && it.sha1 && it.chunkSize && it.totalParts
						? {
								id: it.id,
								sessionId: it.sessionId,
								folderId: it.folderId,
								fileName: it.fileName,
								mimeType: it.mimeType,
								size: it.size,
								sha1: it.sha1,
								chunkSize: it.chunkSize,
								totalParts: it.totalParts,
								partsReceived: it.partsReceived,
								status: 'interrupted',
								createdAt: it.createdAt,
								updatedAt: Date.now(),
							}
						: null
				if (row) void idbPut(row)
			}
		}
	})
}
