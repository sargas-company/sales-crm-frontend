import type { MockJobPost } from '../../types/jobPost'
import { CURATED_POSTS } from './curated'
import { generatePosts, materializePost } from './generator'

const SEED_VALUE = 20260923
const GENERATED_COUNT = 130
const WINDOW_HOURS = 30 * 24

const referenceNowMs = Date.now()

const generatedSeeds = generatePosts({
	seedValue: SEED_VALUE,
	count: GENERATED_COUNT,
	referenceNowMs,
	windowHours: WINDOW_HOURS,
})

const raw: MockJobPost[] = [...CURATED_POSTS, ...generatedSeeds]
	.map((seed) => materializePost(seed, referenceNowMs))
	.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

Object.freeze(raw)

export const POSTS: readonly MockJobPost[] = raw
export const REFERENCE_NOW_MS = referenceNowMs
