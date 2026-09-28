const KEY = 'sargas.jobposts.viewed.v1'
const CAP = 500

type ViewedMap = Record<string, string>

const read = (): ViewedMap => {
	try {
		const raw = window.localStorage.getItem(KEY)
		if (!raw) return {}
		const parsed = JSON.parse(raw)
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return parsed as ViewedMap
		}
		return {}
	} catch {
		return {}
	}
}

const write = (map: ViewedMap): void => {
	try {
		const entries = Object.entries(map)
		if (entries.length > CAP) {
			const trimmed = entries.sort((a, b) => a[1].localeCompare(b[1])).slice(entries.length - CAP)
			window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(trimmed)))
		} else {
			window.localStorage.setItem(KEY, JSON.stringify(map))
		}
	} catch {
		// ignore quota / private-mode errors
	}
}

export const getViewedJobPosts = (): ViewedMap => read()

export const isJobPostViewed = (id: string): boolean => {
	if (!id) return false
	return typeof read()[id] === 'string'
}

export const getJobPostViewedAt = (id: string): string | null => {
	if (!id) return null
	return read()[id] ?? null
}

export const markJobPostViewed = (id: string): void => {
	if (!id) return
	const map = read()
	map[id] = new Date().toISOString()
	write(map)
}
