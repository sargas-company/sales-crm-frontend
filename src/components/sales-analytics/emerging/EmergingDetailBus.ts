type Listener = (id: string | null) => void

const listeners = new Set<Listener>()

export const emitEmergingDetail = (id: string | null): void => {
	for (const l of listeners) l(id)
}

export const subscribeEmergingDetail = (fn: Listener): (() => void) => {
	listeners.add(fn)
	return () => listeners.delete(fn)
}
