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
