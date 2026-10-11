/**
 * Country-name display helpers for list cells.
 *
 * Vibe Worker's `client.location` is a free-form string ("City,
 * Country" / "Country" / ISO2). After the backend splits it, the
 * `country` field we get can be either an ISO-3166-1 alpha-2 code
 * ("US", "DE") or a full name ("United States", "Germany").
 *
 * `countryDisplayName` normalises that: ISO2 → full English name
 * via the browser's built-in `Intl.DisplayNames` (zero bundle
 * cost, zero data to maintain), anything else is returned as-is.
 */

const regionNames = (() => {
	if (typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') {
		return null
	}
	try {
		return new Intl.DisplayNames(['en'], { type: 'region' })
	} catch {
		return null
	}
})()

export function countryDisplayName(raw: string | null | undefined): string | null {
	if (!raw) return null
	const trimmed = raw.trim()
	if (!trimmed) return null
	// Only ISO-3166 alpha-2 codes qualify for lookup; longer
	// strings are already human names (or something we can't
	// safely rewrite) and are returned verbatim.
	if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
		const upper = trimmed.toUpperCase()
		if (regionNames) {
			try {
				const resolved = regionNames.of(upper)
				if (resolved && resolved !== upper) return resolved
			} catch {
				/* fall through to raw */
			}
		}
	}
	return trimmed
}

/**
 * Builds the final "City, Country" / "Country" / fallback string
 * the Job Posts list cell renders. Returns null when nothing
 * meaningful can be shown.
 *
 * Legacy posts (ingested before Phase A) have `city` and
 * `country` NULL — only the raw `client.location` string is
 * available. We split that string the same way the backend
 * mapper does (last comma = country) and normalise the country
 * segment through `countryDisplayName`, so "US" turns into
 * "United States" even on legacy data.
 */
/* Convert a 2-letter ISO-3166 alpha-2 code to its regional-indicator
 * flag emoji. Returns an empty string for anything that isn't a plain
 * two-letter code. Caller should still render the country name next
 * to it as the authoritative identifier. */
export function flagEmoji(iso2: string | null | undefined): string {
	if (!iso2 || iso2.length !== 2) return ''
	const code = iso2.toUpperCase()
	if (!/^[A-Z]{2}$/.test(code)) return ''
	return String.fromCodePoint(
		0x1f1e6 + code.charCodeAt(0) - 65,
		0x1f1e6 + code.charCodeAt(1) - 65,
	)
}

/* All ISO-3166 countries the current runtime knows about, resolved
 * to English names. Computed once on module load. Falls back to an
 * empty list when `Intl.supportedValuesOf` isn't available — the
 * autocomplete still works, just without preset suggestions. */
export interface CountryEntry {
	iso2: string
	name: string
	flag: string
}

/* Static ISO-3166 alpha-2 → English name map. Bundled instead of
 * relying solely on Intl.DisplayNames because some runtimes return
 * the code as-is (fallback behaviour) or ship without ICU region
 * data, which left the autocomplete showing "AD" / "AE" instead
 * of "Andorra" / "United Arab Emirates". */
const COUNTRY_NAMES: Record<string, string> = {
	AD: 'Andorra', AE: 'United Arab Emirates', AF: 'Afghanistan',
	AG: 'Antigua & Barbuda', AI: 'Anguilla', AL: 'Albania', AM: 'Armenia',
	AO: 'Angola', AQ: 'Antarctica', AR: 'Argentina', AS: 'American Samoa',
	AT: 'Austria', AU: 'Australia', AW: 'Aruba', AX: 'Åland Islands',
	AZ: 'Azerbaijan', BA: 'Bosnia & Herzegovina', BB: 'Barbados',
	BD: 'Bangladesh', BE: 'Belgium', BF: 'Burkina Faso', BG: 'Bulgaria',
	BH: 'Bahrain', BI: 'Burundi', BJ: 'Benin', BL: 'Saint Barthélemy',
	BM: 'Bermuda', BN: 'Brunei', BO: 'Bolivia', BQ: 'Caribbean Netherlands',
	BR: 'Brazil', BS: 'Bahamas', BT: 'Bhutan', BV: 'Bouvet Island',
	BW: 'Botswana', BY: 'Belarus', BZ: 'Belize', CA: 'Canada',
	CC: 'Cocos (Keeling) Islands', CD: 'Congo – Kinshasa',
	CF: 'Central African Republic', CG: 'Congo – Brazzaville',
	CH: 'Switzerland', CI: 'Côte d’Ivoire', CK: 'Cook Islands',
	CL: 'Chile', CM: 'Cameroon', CN: 'China', CO: 'Colombia',
	CR: 'Costa Rica', CU: 'Cuba', CV: 'Cape Verde', CW: 'Curaçao',
	CX: 'Christmas Island', CY: 'Cyprus', CZ: 'Czechia', DE: 'Germany',
	DJ: 'Djibouti', DK: 'Denmark', DM: 'Dominica', DO: 'Dominican Republic',
	DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt',
	EH: 'Western Sahara', ER: 'Eritrea', ES: 'Spain', ET: 'Ethiopia',
	FI: 'Finland', FJ: 'Fiji', FK: 'Falkland Islands',
	FM: 'Micronesia', FO: 'Faroe Islands', FR: 'France', GA: 'Gabon',
	GB: 'United Kingdom', GD: 'Grenada', GE: 'Georgia', GF: 'French Guiana',
	GG: 'Guernsey', GH: 'Ghana', GI: 'Gibraltar', GL: 'Greenland',
	GM: 'Gambia', GN: 'Guinea', GP: 'Guadeloupe', GQ: 'Equatorial Guinea',
	GR: 'Greece', GS: 'South Georgia & South Sandwich Islands',
	GT: 'Guatemala', GU: 'Guam', GW: 'Guinea-Bissau', GY: 'Guyana',
	HK: 'Hong Kong', HM: 'Heard & McDonald Islands', HN: 'Honduras',
	HR: 'Croatia', HT: 'Haiti', HU: 'Hungary', ID: 'Indonesia',
	IE: 'Ireland', IL: 'Israel', IM: 'Isle of Man', IN: 'India',
	IO: 'British Indian Ocean Territory', IQ: 'Iraq', IR: 'Iran',
	IS: 'Iceland', IT: 'Italy', JE: 'Jersey', JM: 'Jamaica',
	JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan',
	KH: 'Cambodia', KI: 'Kiribati', KM: 'Comoros',
	KN: 'St. Kitts & Nevis', KP: 'North Korea', KR: 'South Korea',
	KW: 'Kuwait', KY: 'Cayman Islands', KZ: 'Kazakhstan', LA: 'Laos',
	LB: 'Lebanon', LC: 'Saint Lucia', LI: 'Liechtenstein', LK: 'Sri Lanka',
	LR: 'Liberia', LS: 'Lesotho', LT: 'Lithuania', LU: 'Luxembourg',
	LV: 'Latvia', LY: 'Libya', MA: 'Morocco', MC: 'Monaco',
	MD: 'Moldova', ME: 'Montenegro', MF: 'Saint Martin', MG: 'Madagascar',
	MH: 'Marshall Islands', MK: 'North Macedonia', ML: 'Mali',
	MM: 'Myanmar (Burma)', MN: 'Mongolia', MO: 'Macao', MP: 'Northern Mariana Islands',
	MQ: 'Martinique', MR: 'Mauritania', MS: 'Montserrat', MT: 'Malta',
	MU: 'Mauritius', MV: 'Maldives', MW: 'Malawi', MX: 'Mexico',
	MY: 'Malaysia', MZ: 'Mozambique', NA: 'Namibia', NC: 'New Caledonia',
	NE: 'Niger', NF: 'Norfolk Island', NG: 'Nigeria', NI: 'Nicaragua',
	NL: 'Netherlands', NO: 'Norway', NP: 'Nepal', NR: 'Nauru',
	NU: 'Niue', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama',
	PE: 'Peru', PF: 'French Polynesia', PG: 'Papua New Guinea',
	PH: 'Philippines', PK: 'Pakistan', PL: 'Poland', PM: 'St. Pierre & Miquelon',
	PN: 'Pitcairn Islands', PR: 'Puerto Rico', PS: 'Palestinian Territories',
	PT: 'Portugal', PW: 'Palau', PY: 'Paraguay', QA: 'Qatar',
	RE: 'Réunion', RO: 'Romania', RS: 'Serbia', RU: 'Russia',
	RW: 'Rwanda', SA: 'Saudi Arabia', SB: 'Solomon Islands',
	SC: 'Seychelles', SD: 'Sudan', SE: 'Sweden', SG: 'Singapore',
	SH: 'St. Helena', SI: 'Slovenia', SJ: 'Svalbard & Jan Mayen',
	SK: 'Slovakia', SL: 'Sierra Leone', SM: 'San Marino', SN: 'Senegal',
	SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan',
	ST: 'São Tomé & Príncipe', SV: 'El Salvador', SX: 'Sint Maarten',
	SY: 'Syria', SZ: 'Eswatini', TC: 'Turks & Caicos Islands', TD: 'Chad',
	TF: 'French Southern Territories', TG: 'Togo', TH: 'Thailand',
	TJ: 'Tajikistan', TK: 'Tokelau', TL: 'Timor-Leste', TM: 'Turkmenistan',
	TN: 'Tunisia', TO: 'Tonga', TR: 'Turkey', TT: 'Trinidad & Tobago',
	TV: 'Tuvalu', TW: 'Taiwan', TZ: 'Tanzania', UA: 'Ukraine',
	UG: 'Uganda', UM: 'U.S. Outlying Islands', US: 'United States',
	UY: 'Uruguay', UZ: 'Uzbekistan', VA: 'Vatican City',
	VC: 'St. Vincent & Grenadines', VE: 'Venezuela', VG: 'British Virgin Islands',
	VI: 'U.S. Virgin Islands', VN: 'Vietnam', VU: 'Vanuatu',
	WF: 'Wallis & Futuna', WS: 'Samoa', YE: 'Yemen', YT: 'Mayotte',
	ZA: 'South Africa', ZM: 'Zambia', ZW: 'Zimbabwe',
}

export const COUNTRIES: CountryEntry[] = Object.entries(COUNTRY_NAMES)
	.map(([iso2, name]) => ({ iso2, name, flag: flagEmoji(iso2) }))
	.sort((a, b) => a.name.localeCompare(b.name))

/* Reverse name → ISO2 lookup (lowercased) built once. Used by
 * `locationFlag` so a free-text "City, Germany" cell can still
 * resolve to the German flag. */
const COUNTRY_NAMES_BY_LOWER: Record<string, string> = Object.fromEntries(
	COUNTRIES.map((c) => [c.name.toLowerCase(), c.iso2]),
)

/**
 * Resolve a flag emoji for a free-text location string that stores
 * either a country name, an ISO-3166-1 alpha-2 code, or `"City,
 * Country"`. Returns '' when the input doesn't match a known
 * country — the caller is expected to render the raw text next to
 * the flag either way.
 */
export function locationFlag(raw: string | null | undefined): string {
	if (!raw) return ''
	const trimmed = raw.trim()
	if (!trimmed) return ''
	// Country is always after the LAST comma; a comma-less string IS
	// the country.
	const tail = trimmed
		.split(',')
		.map((p) => p.trim())
		.filter(Boolean)
		.pop()
	if (!tail) return ''
	// ISO2 fast path.
	if (tail.length === 2 && /^[A-Za-z]{2}$/.test(tail)) {
		return flagEmoji(tail.toUpperCase())
	}
	const iso2 = COUNTRY_NAMES_BY_LOWER[tail.toLowerCase()]
	return iso2 ? flagEmoji(iso2) : ''
}

export function formatLocation(input: {
	city?: string | null
	country?: string | null
	location?: string | null
}): string | null {
	const country = countryDisplayName(input.country)
	const city = input.city?.trim() || null
	if (city || country) {
		return [city, country].filter(Boolean).join(', ')
	}
	// Legacy fallback — split "City, Country" by the LAST comma
	// (mirrors backend `splitLocation` in vibe-ingest-mapper).
	const legacy = input.location?.trim()
	if (!legacy) return null
	const parts = legacy.split(',').map((p) => p.trim()).filter(Boolean)
	if (parts.length === 0) return legacy
	const legacyCountry = countryDisplayName(parts[parts.length - 1])
	const legacyCity =
		parts.length > 1 ? parts.slice(0, -1).join(', ') : null
	return [legacyCity, legacyCountry].filter(Boolean).join(', ')
}
