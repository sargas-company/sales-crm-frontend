import {
	isValidPhoneNumber,
	parsePhoneNumberFromString,
	type CountryCode,
} from 'libphonenumber-js'

/**
 * Convert raw phone input into E.164 for backend persistence. Any
 * ISO-2 country hint narrows parsing (`38 097 123 45 67` with hint
 * `UA` becomes `+380971234567`); without a hint only inputs that
 * already carry a `+country` prefix parse.
 *
 * Returns `null` when the input is empty / unparseable so callers
 * can treat the field as "clear me" rather than "crash".
 */
export const normalisePhoneToE164 = (
	raw: string,
	country?: string | null,
): string | null => {
	if (!raw) return null
	const trimmed = raw.trim()
	if (!trimmed) return null
	try {
		const cc =
			country && country.length === 2
				? (country.toUpperCase() as CountryCode)
				: undefined
		const parsed = parsePhoneNumberFromString(trimmed, cc)
		if (parsed && parsed.isValid()) return parsed.number
	} catch {
		// swallow — treat as unparseable
	}
	return null
}

/**
 * Pretty-print an E.164 (or raw) phone number for display. Falls
 * back to the raw string when parsing fails so historical values
 * are never hidden from the UI.
 */
export const formatPhoneDisplay = (
	raw: string | null | undefined,
	country?: string | null,
): string => {
	if (!raw) return ''
	try {
		const cc =
			country && country.length === 2
				? (country.toUpperCase() as CountryCode)
				: undefined
		const parsed = parsePhoneNumberFromString(raw, cc)
		if (parsed) return parsed.formatInternational()
	} catch {
		// swallow
	}
	return raw
}

/**
 * Minimal "will the backend accept this?" check — used by inline
 * form validation so the manager sees the error before submit.
 */
export const isLikelyValidPhone = (
	raw: string,
	country?: string | null,
): boolean => {
	if (!raw) return true // empty is "no phone", not invalid
	try {
		const cc =
			country && country.length === 2
				? (country.toUpperCase() as CountryCode)
				: undefined
		return isValidPhoneNumber(raw, cc)
	} catch {
		return false
	}
}

/**
 * Basic email shape check — intentionally lenient to match the
 * backend's `class-validator` IsEmail rules without over-constraining.
 * Server is the final arbiter.
 */
export const isLikelyValidEmail = (raw: string): boolean => {
	if (!raw) return true
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())
}
