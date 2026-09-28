import { useEffect, useState } from 'react'

/**
 * Debounce a rapidly-changing value (e.g. a search input) so downstream
 * consumers (e.g. RTK Query hooks with server-side filtering) don't fire
 * on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const handle = window.setTimeout(() => setDebounced(value), delayMs)
		return () => window.clearTimeout(handle)
	}, [value, delayMs])
	return debounced
}

export default useDebouncedValue
