export function mulberry32(seed: number): () => number {
	let t = seed >>> 0
	return () => {
		t = (t + 0x6d2b79f5) >>> 0
		let x = t
		x = Math.imul(x ^ (x >>> 15), x | 1)
		x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296
	}
}

export const pick = <T>(rng: () => number, arr: readonly T[]): T =>
	arr[Math.floor(rng() * arr.length)]!

export const pickWeighted = <T>(rng: () => number, arr: readonly [T, number][]): T => {
	const total = arr.reduce((s, [, w]) => s + w, 0)
	let r = rng() * total
	for (const [v, w] of arr) {
		if ((r -= w) <= 0) return v
	}
	return arr[arr.length - 1]![0]
}

export const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i)

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
