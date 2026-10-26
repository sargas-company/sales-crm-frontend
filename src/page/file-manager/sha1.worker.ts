/* SHA-1 worker — computes the hex digest of a File by streaming it
 * in 2 MiB slices through SubtleCrypto. SubtleCrypto.digest cannot
 * accept chunks (it's one-shot), so we buffer each slice into a
 * Uint8Array, concat into one big ArrayBuffer, then digest. For
 * files up to ~1 GiB this is acceptable; progress events fire while
 * the slicing happens.
 *
 * Message protocol:
 *   -> { kind: 'start', id: string, file: File }
 *   <- { kind: 'progress', id: string, pct: number }
 *   <- { kind: 'done', id: string, sha1: string }
 *   <- { kind: 'error', id: string, message: string }
 */

export {} // make this a module under --isolatedModules

type Inbound = { kind: 'start'; id: string; file: File }

type Outbound =
	| { kind: 'progress'; id: string; pct: number }
	| { kind: 'done'; id: string; sha1: string }
	| { kind: 'error'; id: string; message: string }

const READ_SLICE = 2 * 1024 * 1024 // 2 MiB

const post = (msg: Outbound) => {
	;(self as unknown as { postMessage: (m: Outbound) => void }).postMessage(msg)
}

const toHex = (buf: ArrayBuffer): string => {
	const bytes = new Uint8Array(buf)
	let out = ''
	for (let i = 0; i < bytes.length; i++) {
		const h = bytes[i].toString(16)
		out += h.length === 1 ? '0' + h : h
	}
	return out
}

const compute = async (id: string, file: File) => {
	const total = file.size
	const chunks: Uint8Array[] = []
	let offset = 0
	let lastPostedPct = 0
	while (offset < total) {
		const end = Math.min(offset + READ_SLICE, total)
		const slice = file.slice(offset, end)
		const buf = await slice.arrayBuffer()
		chunks.push(new Uint8Array(buf))
		offset = end
		const pct = Math.round((offset / total) * 100)
		if (pct !== lastPostedPct) {
			lastPostedPct = pct
			post({ kind: 'progress', id, pct })
		}
	}
	const combined = new Uint8Array(total)
	let cursor = 0
	for (const c of chunks) {
		combined.set(c, cursor)
		cursor += c.length
	}
	const digest = await crypto.subtle.digest('SHA-1', combined.buffer)
	post({ kind: 'done', id, sha1: toHex(digest) })
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
