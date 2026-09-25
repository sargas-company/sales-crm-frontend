type Listener = (postId: string | null) => void

const listeners = new Set<Listener>()

export const emitPostDetail = (postId: string | null): void => {
	for (const l of listeners) l(postId)
}

export const subscribePostDetail = (fn: Listener): (() => void) => {
	listeners.add(fn)
	return () => listeners.delete(fn)
}
