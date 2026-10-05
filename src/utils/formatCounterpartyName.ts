export interface CounterpartyLike {
	firstName?: string | null
	lastName?: string | null
	company?: string | null
}

/**
 * Display name for a counterparty/client.
 * "Acme Corp · John Doe" when both company and full name exist.
 * "John Doe" when only the name exists.
 * "Acme Corp" when only the company exists.
 * Empty string when nothing is provided.
 */
export function formatCounterpartyName(c: CounterpartyLike | null | undefined): string {
	if (!c) return ''
	const person = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
	const company = (c.company ?? '').trim()
	if (company && person) return `${company} · ${person}`
	return company || person
}
