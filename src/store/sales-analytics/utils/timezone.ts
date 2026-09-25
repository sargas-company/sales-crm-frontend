import { DEFAULT_TIMEZONE } from '../config'

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const WEEKDAY_MAP: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
}

/**
 * Given a UTC Date, return the weekday index (Mon=0..Sun=6) and hour
 * (0..23) as observed in the configured analytics timezone.
 *
 * Uses Intl.DateTimeFormat so DST for Europe/Kyiv is handled by the runtime;
 * no dayjs plugin required.
 */
export function partsInZone(
	date: Date,
	timezone: string = DEFAULT_TIMEZONE
): { weekdayIndex: number; hour: number; weekLabel: string } {
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		weekday: 'short',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hour12: false,
	})
	const parts = fmt.formatToParts(date)
	const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
	const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00'
	const year = parts.find((p) => p.type === 'year')?.value ?? '2026'
	const month = parts.find((p) => p.type === 'month')?.value ?? '01'
	const day = parts.find((p) => p.type === 'day')?.value ?? '01'
	const weekdayIndex = WEEKDAY_MAP[weekday] ?? 0
	const hour = parseInt(hourStr, 10) % 24
	return {
		weekdayIndex,
		hour,
		weekLabel: `${year}-${month}-${day}`,
	}
}

export function isoWeekStartLabel(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
	const { weekdayIndex, weekLabel } = partsInZone(date, timezone)
	const [y, m, d] = weekLabel.split('-').map((v) => parseInt(v, 10))
	const utc = new Date(Date.UTC(y, m - 1, d))
	utc.setUTCDate(utc.getUTCDate() - weekdayIndex)
	const iso = utc.toISOString().slice(0, 10)
	return iso
}

export function formatTimezoneShort(tz: string): string {
	const parts = tz.split('/')
	return parts[parts.length - 1]?.replace(/_/g, ' ') ?? tz
}
