/* SHA-1 worker — streaming hash of a File via `rusha` (pure-JS
 * incremental SHA-1 implementation). Reads the file in 16 MiB slices
 * and feeds each slice directly into the hasher, so the worker's
 * memory peak stays at one slice (~16 MB) instead of growing to the
 * full file size. Lets us hash multi-GB files without the
 * SubtleCrypto / ArrayBuffer "size exceeds the supported range"
 * failure that killed earlier large-file uploads.
 *
 * Message protocol:
 *   -> { kind: 'start', id: string, file: File }
 *   <- { kind: 'progress', id: string, pct: number }
 *   <- { kind: 'done', id: string, sha1: string }
 *   <- { kind: 'error', id: string, message: string }
 */

import Rusha from 'rusha'

type Inbound = { kind: 'start'; id: string; file: File }

type Outbound =
	| { kind: 'progress'; id: string; pct: number }
	| { kind: 'done'; id: string; sha1: string }
	| { kind: 'error'; id: string; message: string }

/* Slice size — same 16 MiB we use for upload chunking; keeps I/O
 * patterns coherent and bounds the per-slice allocation. */
const READ_SLICE = 16 * 1024 * 1024

const post = (msg: Outbound) => {
	;(self as unknown as { postMessage: (m: Outbound) => void }).postMessage(msg)
}

const compute = async (id: string, file: File) => {
	const total = file.size
	const hasher = Rusha.createHash()
	let offset = 0
	let lastPostedPct = 0
	while (offset < total) {
		const end = Math.min(offset + READ_SLICE, total)
		const slice = file.slice(offset, end)
		const buf = await slice.arrayBuffer()
		/* Rusha accepts ArrayBuffer / Uint8Array / string. Pass the
		 * raw buffer so no extra copy is made. */
		hasher.update(buf)
		offset = end
		const pct = Math.round((offset / total) * 100)
		if (pct !== lastPostedPct) {
			lastPostedPct = pct
			post({ kind: 'progress', id, pct })
		}
	}
	const sha1 = hasher.digest('hex')
	post({ kind: 'done', id, sha1 })
}

self.addEventListener('message', (ev: MessageEvent<Inbound>) => {
	const msg = ev.data
	if (msg.kind === 'start') {
		compute(msg.id, msg.file).catch((err: unknown) => {
			post({
				kind: 'error',
				id: msg.id,
				message: (err as { message?: string })?.message ?? String(err),
			})
		})
	}
})
