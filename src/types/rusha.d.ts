/* Minimal type shim for `rusha` — the npm package ships without its
 * own .d.ts. We only use `createHash().update(buffer).digest('hex')`
 * from the SHA-1 worker. */
declare module 'rusha' {
	interface RushaHash {
		update(data: ArrayBuffer | Uint8Array | string): RushaHash
		digest(encoding?: 'hex'): string
	}
	interface RushaStatic {
		createHash(): RushaHash
	}
	const Rusha: RushaStatic
	export default Rusha
}
