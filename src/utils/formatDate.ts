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
 * Shortens a UUID to its first 8 characters.
 * Example: "b251fbab-8e4b-4b6f-ab24-ac18e2666cbe" → "b251fbab"
 */
export const shortUuid = (uuid: string): string => uuid.slice(0, 8)
