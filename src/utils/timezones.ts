export type TimezoneOption = {
	label: string
	value: string
	timezone?: string
	offset?: string
}

export const timezones: TimezoneOption[] = [
	{ label: 'EST - Eastern Standard Time', value: 'EST', timezone: 'America/New_York' },
	{ label: 'EDT - Eastern Daylight Time', value: 'EDT', timezone: 'America/New_York' },
	{ label: 'CST - Central Standard Time', value: 'CST', timezone: 'America/Chicago' },
	{ label: 'CDT - Central Daylight Time', value: 'CDT', timezone: 'America/Chicago' },
	{ label: 'MST - Mountain Standard Time', value: 'MST', timezone: 'America/Denver' },
	{ label: 'MDT - Mountain Daylight Time', value: 'MDT', timezone: 'America/Denver' },
	{ label: 'PST - Pacific Standard Time', value: 'PST', timezone: 'America/Los_Angeles' },
	{ label: 'PDT - Pacific Daylight Time', value: 'PDT', timezone: 'America/Los_Angeles' },
	{ label: 'GMT - Greenwich Mean Time', value: 'GMT', offset: '+00:00' },
	...Array.from({ length: 27 }, (_, index) => {
		const hour = index - 12
		const sign = hour >= 0 ? '+' : '-'
		const absHour = Math.abs(hour)
		return {
			label: `GMT${sign}${absHour}`,
			value: `GMT${sign}${absHour}`,
			offset: `${sign}${String(absHour).padStart(2, '0')}:00`,
		}
	}),
]

const reverseMap = new Map<string, string>()
for (const tz of timezones) {
	if (tz.timezone && !reverseMap.has(tz.timezone)) reverseMap.set(tz.timezone, tz.value)
	if (tz.offset && !reverseMap.has(tz.offset)) reverseMap.set(tz.offset, tz.value)
	reverseMap.set(tz.value, tz.value)
}

export const getTimezoneLabel = (stored: string | null | undefined): string => {
	if (!stored) return '—'
	return reverseMap.get(stored) ?? stored
}
