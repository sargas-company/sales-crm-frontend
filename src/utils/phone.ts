import {
	isValidPhoneNumber,
	parsePhoneNumberFromString,
	type CountryCode,
} from 'libphonenumber-js'

/**
 * Convert an ISO-3166-1 alpha-2 country code to a Unicode flag
 * emoji via the regional-indicator codepoints. Mirrors the inline
 * helper used in Client Request list/table/preview — promoted here
 * so Leads can reuse the exact same output without duplicating math.
 */
export const countryToFlag = (iso: string | null | undefined): string => {
	if (!iso || iso.length !== 2) return ''
	const upper = iso.toUpperCase()
	if (!/^[A-Z]{2}$/.test(upper)) return ''
	return String.fromCodePoint(
		...upper.split('').map((c) => c.charCodeAt(0) + 127397),
	)
}

/**
 * Country ISO-2 inferred from a raw phone number. Returns null when
 * the number is unparseable or does not carry a `+country` prefix.
 */
export const phoneCountryIso = (
	raw: string | null | undefined,
): string | null => {
	if (!raw) return null
	try {
		const parsed = parsePhoneNumberFromString(raw)
		return parsed?.country ?? null
	} catch {
		return null
	}
}

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
