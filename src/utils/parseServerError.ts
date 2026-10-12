/**
 * Split a Nest/class-validator error payload into per-field messages
 * and general (unmapped) ones. class-validator default messages start
 * with the property name ("email must be …"), which is what the
 * mapping keys on; anything that doesn't match a known field lands in
 * `general` so nothing is silently dropped.
 */
export const parseServerFieldErrors = (
	error: unknown,
	knownFields: readonly string[],
): { fieldErrors: Record<string, string>; general: string[] } => {
	const data = (error as { data?: { message?: unknown } })?.data
	const raw = data?.message
	const messages: string[] = Array.isArray(raw)
		? raw.filter((m): m is string => typeof m === 'string')
		: typeof raw === 'string'
			? [raw]
			: []
	const fieldErrors: Record<string, string> = {}
	const general: string[] = []
	for (const msg of messages) {
		const field = knownFields.find(
			(f) => msg === f || msg.startsWith(`${f} `) || msg.startsWith(`${f}.`),
		)
		if (field && !fieldErrors[field]) fieldErrors[field] = msg
		else if (!field) general.push(msg)
	}
	return { fieldErrors, general }
}

const parseServerError = (error: unknown): string => {
	const data = (error as any)?.data
	if (!data) return 'Something went wrong. Please try again.'
	if (Array.isArray(data.message)) return data.message.join('\n')
	if (typeof data.message === 'string') return data.message
	if (Array.isArray(data.messages)) return data.messages.join('\n')
	if (typeof data.messages === 'string') return data.messages
	if (data.messages && typeof data.messages === 'object') {
		return Object.values(data.messages).flat().filter(Boolean).join('\n')
	}
	if (typeof data.error === 'string') return data.error
	return 'Something went wrong. Please try again.'
}

export default parseServerError
