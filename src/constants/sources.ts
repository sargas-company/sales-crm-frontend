/* Base dictionary for the Lead/Client "Source" selects. The
   `/leads/sources` and `/clients/sources` endpoints return only
   DISTINCT values already present in the DB (they were built for the
   list-page filter), so on a fresh/clean production DB they are empty
   and the create form had nothing to offer. Forms render this base
   list merged with the server values (deduped), so legacy free-text
   values still show up once they exist. */
export const BASE_SOURCES = [
	'Upwork',
	'LinkedIn',
	'Referral',
	'Website',
	'Cold outreach',
	'Conference',
	'Other',
] as const

export const mergeSources = (server: string[] | undefined): string[] =>
	Array.from(new Set([...BASE_SOURCES, ...(server ?? [])]))
