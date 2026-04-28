/**
 * Formats an ISO 8601 date string to a human-readable format.
 * Example: "2026-04-15T12:35:40.981Z" → "15 Apr 2026"
 */
export const formatDate = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	return new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

/**
 * Formats an ISO 8601 date string with time.
 * Example: "2026-04-15T12:35:40.981Z" → "15 Apr 2026, 12:35"
 */
export const formatDateTime = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	return new Date(iso).toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * Formats a backend datetime string (YYYY-MM-DD HH:mm) for client timezone display.
 * Uses 12-hour clock with AM/PM.
 * Example: "2026-05-01 08:00" → "May 1, 2026 · 08:00 AM"
 */
export const formatClientDateTime = (str: string | null | undefined): string => {
	if (!str) return '—'
	const [datePart, timePart] = str.split(' ')
	if (!datePart || !timePart) return str
	const [year, month, day] = datePart.split('-').map(Number)
	const [hour, minute] = timePart.split(':').map(Number)
	const date = new Date(year, month - 1, day, hour, minute)
	const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
	return `${dateStr} · ${timeStr}`
}

/**
 * Formats a backend datetime string (YYYY-MM-DD HH:mm) for Kyiv time display.
 * Uses 24-hour clock.
 * Example: "2026-05-01 15:00" → "May 1, 2026 · 15:00"
 */
export const formatKyivDateTime = (str: string | null | undefined): string => {
	if (!str) return '—'
	const [datePart, timePart] = str.split(' ')
	if (!datePart || !timePart) return str
	const [year, month, day] = datePart.split('-').map(Number)
	const [hour, minute] = timePart.split(':').map(Number)
	const date = new Date(year, month - 1, day, hour, minute)
	const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
	return `${dateStr} · ${timeStr}`
}

/**
 * Shortens a UUID to its first 8 characters.
 * Example: "b251fbab-8e4b-4b6f-ab24-ac18e2666cbe" → "b251fbab"
 */
export const shortUuid = (uuid: string): string => uuid.slice(0, 8)
