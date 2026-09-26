/**
 * Formatting utilities for numbers, currency, dates and percentages.
 *
 * Rules (per work/active/ui-foundation/specification.md §6):
 * - Numbers align right in table cells (caller's concern; helpers
 *   only return the string).
 * - Multi-currency lists: currency CODE renders AFTER the number
 *   (e.g. "1 234.56 USD"), invoked via `formatCurrency(v, code, { position: 'code-after' })`.
 * - Single-currency contexts: currency SYMBOL renders BEFORE the
 *   number (e.g. "$1,234.56"), invoked via `formatCurrency(v, code, { position: 'symbol-before' })`
 *   or the default which mirrors `Intl.NumberFormat`.
 * - Negative amounts are NOT wrapped in parentheses; callers should
 *   colour them via `theme.colors.status.danger` instead. This util
 *   just returns the plain string with a leading minus.
 * - Currency is data-driven; helpers accept an explicit `currency`
 *   code and never assume a default.
 *
 * All helpers are pure and locale-aware via the browser's `Intl`
 * APIs. Locale defaults to the caller's runtime locale (`undefined`
 * passed to `Intl.*`); callers can override via `locale` when
 * needed.
 *
 * Call signatures (top-level index):
 *
 *   formatNumber(value: number, options?: { decimals?: number; locale?: string }): string
 *   formatCurrency(amount: number, currency: string, options?: { position?: 'symbol-before' | 'code-after'; decimals?: number; locale?: string }): string
 *   formatDate(value: Date | string | number, preset?: DatePreset, options?: { locale?: string }): string
 *   formatPercent(value: number, options?: { decimals?: number; locale?: string }): string
 *
 * `DatePreset` = 'short' | 'long' | 'dateTime' | 'relative'.
 */

export type DatePreset = 'short' | 'long' | 'dateTime' | 'relative'

export interface FormatNumberOptions {
	decimals?: number
	locale?: string
}

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
	const { decimals, locale } = options
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value)
}

export type CurrencyPosition = 'symbol-before' | 'code-after'

export interface FormatCurrencyOptions {
	position?: CurrencyPosition
	decimals?: number
	locale?: string
}

export function formatCurrency(
	amount: number,
	currency: string,
	options: FormatCurrencyOptions = {}
): string {
	const { position = 'symbol-before', decimals, locale } = options
	// When `decimals` is omitted, let `Intl.NumberFormat` choose the
	// currency-appropriate default (USD/EUR → 2, JPY/KRW/VND/CLP → 0,
	// KWD/BHD → 3). An explicit value overrides that.
	const fractionDigits =
		decimals !== undefined
			? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
			: {}
	if (position === 'code-after') {
		// `Intl.NumberFormat` in `style: 'decimal'` does not know about
		// currency-specific fractional digits, so when the caller omits
		// `decimals` we derive them from the currency itself via a
		// throwaway `style: 'currency'` format resolvedOptions call.
		const resolved =
			decimals !== undefined
				? { min: decimals, max: decimals }
				: resolveCurrencyFractionDigits(currency, locale)
		const num = new Intl.NumberFormat(locale, {
			minimumFractionDigits: resolved.min,
			maximumFractionDigits: resolved.max,
		}).format(amount)
		return `${num} ${currency}`
	}
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		...fractionDigits,
	}).format(amount)
}

function resolveCurrencyFractionDigits(
	currency: string,
	locale: string | undefined
): { min: number; max: number } {
	const opts = new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
	return {
		min: opts.minimumFractionDigits ?? 2,
		max: opts.maximumFractionDigits ?? 2,
	}
}

export interface FormatDateOptions {
	locale?: string
}

const RELATIVE_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
	{ amount: 60, unit: 'second' },
	{ amount: 60, unit: 'minute' },
	{ amount: 24, unit: 'hour' },
	{ amount: 7, unit: 'day' },
	{ amount: 4.34524, unit: 'week' },
	{ amount: 12, unit: 'month' },
	{ amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

const DATE_PRESETS: Record<Exclude<DatePreset, 'relative'>, Intl.DateTimeFormatOptions> = {
	short: { year: 'numeric', month: '2-digit', day: '2-digit' },
	long: { year: 'numeric', month: 'long', day: 'numeric' },
	dateTime: {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	},
}

function toDate(value: Date | string | number): Date {
	if (value instanceof Date) return value
	return new Date(value)
}

function formatRelative(date: Date, locale?: string): string {
	const now = Date.now()
	let diffSeconds = (date.getTime() - now) / 1000
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
	for (const { amount, unit } of RELATIVE_DIVISIONS) {
		if (Math.abs(diffSeconds) < amount) {
			return rtf.format(Math.round(diffSeconds), unit)
		}
		diffSeconds /= amount
	}
	return rtf.format(Math.round(diffSeconds), 'year')
}

export function formatDate(
	value: Date | string | number,
	preset: DatePreset = 'short',
	options: FormatDateOptions = {}
): string {
	const { locale } = options
	const date = toDate(value)
	if (isNaN(date.getTime())) return ''
	if (preset === 'relative') return formatRelative(date, locale)
	return new Intl.DateTimeFormat(locale, DATE_PRESETS[preset]).format(date)
}

export interface FormatPercentOptions {
	decimals?: number
	locale?: string
}

/**
 * `value` is a fraction: `0.15` → `"15%"`. Pass whole percentages
 * (e.g. `15` for 15%) by dividing on the caller side; this helper
 * treats the input as a ratio, matching `Intl.NumberFormat`'s
 * `style: 'percent'`.
 */
export function formatPercent(value: number, options: FormatPercentOptions = {}): string {
	const { decimals = 0, locale } = options
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value)
}
