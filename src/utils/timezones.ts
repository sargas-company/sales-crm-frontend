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

/* Build the absolute Day.js moment for a wall-clock date+time entered
   in the given `TimezoneOption`, and pin the resulting instance to
   that same zone/offset so later `.format(...)` calls render in it.

   Shared by the Call create and edit forms (and anything else that
   lets a user pick a tz option) so the two can't drift the way they
   did before: without `.utcOffset(offset)` on the offset-only branch,
   a `GMT±N` time was rendered in the browser's local zone and the
   previewed hour drifted by `(browser_tz − chosen_offset)`.

   The input `dayjs` is injected (callers already have the timezone-
   plugin-extended instance). Returns null when any of date / time /
   tz is missing so the caller can treat the whole form as pending. */
// `dayjs` is passed in (not imported here) because the callers already
// hold the timezone-plugin-extended instance.
type DayjsCtor = (date?: string) => import('dayjs').Dayjs
type DayjsWithTz = DayjsCtor & {
	tz: (date: string, format: string, zone: string) => import('dayjs').Dayjs
}

export const buildPinnedClientDateTime = (
	dayjs: DayjsWithTz,
	date: string,
	time: string,
	tz: TimezoneOption | undefined,
): import('dayjs').Dayjs | null => {
	if (!date || !time || !tz) return null
	if (tz.timezone) {
		return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', tz.timezone)
	}
	if (tz.offset) {
		return dayjs(`${date}T${time}${tz.offset}`).utcOffset(tz.offset)
	}
	return null
}
