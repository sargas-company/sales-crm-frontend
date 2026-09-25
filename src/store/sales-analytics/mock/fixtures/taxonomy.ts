import type { TaxonomyItem } from '../../types/taxonomy'

const NOW_ISO = '2026-08-01T00:00:00.000Z'

const slugify = (v: string): string =>
	v
		.toLowerCase()
		.replace(/[^\w]+/g, '-')
		.replace(/^-|-$/g, '')

const item = (
	type: 'technology' | 'direction',
	name: string,
	aliases: string[] = []
): TaxonomyItem => ({
	id: `${type}-${slugify(name)}`,
	type,
	name,
	slug: slugify(name),
	status: 'active',
	aliases,
	createdAt: NOW_ISO,
	updatedAt: NOW_ISO,
})

export const CANONICAL_TECHNOLOGIES: TaxonomyItem[] = [
	item('technology', 'React'),
	item('technology', 'Next.js', ['NextJS', 'Next JS']),
	item('technology', 'Node.js', ['Node', 'NodeJS']),
	item('technology', 'NestJS', ['Nest.js']),
	item('technology', 'TypeScript', ['TS']),
	item('technology', 'Python'),
	item('technology', 'n8n'),
	item('technology', 'Node-RED', ['NodeRED']),
	item('technology', 'OpenAI', ['ChatGPT API', 'GPT-4', 'GPT-4o']),
	item('technology', 'PostgreSQL', ['Postgres']),
	item('technology', 'AWS', ['Amazon Web Services']),
	item('technology', 'Supabase'),
	item('technology', 'Directus'),
	item('technology', 'Vue', ['Vue.js', 'Vuejs']),
	item('technology', 'Nuxt', ['Nuxt.js']),
	item('technology', 'Stripe'),
]

export const CANONICAL_DIRECTIONS: TaxonomyItem[] = [
	item('direction', 'SaaS Development'),
	item('direction', 'Marketplace Development'),
	item('direction', 'Internal Tools'),
	item('direction', 'AI Integration'),
	item('direction', 'Workflow Automation'),
	item('direction', 'CRM Development'),
	item('direction', 'E-commerce', ['Ecommerce']),
	item('direction', 'API / Integration', ['API Integration']),
	item('direction', 'MVP Development'),
	item('direction', 'Legacy Modernization'),
	item('direction', 'Existing Product Rescue'),
	item('direction', 'Maintenance'),
	item('direction', 'Bug Fixing'),
]

export const ALIAS_MAP: Record<string, string> = (() => {
	const map: Record<string, string> = {}
	for (const t of [...CANONICAL_TECHNOLOGIES, ...CANONICAL_DIRECTIONS]) {
		for (const alias of t.aliases) map[alias.toLowerCase()] = t.name
		map[t.name.toLowerCase()] = t.name
	}
	return map
})()

export const canonicalName = (raw: string): string | null => {
	const norm = raw.trim().toLowerCase()
	return ALIAS_MAP[norm] ?? null
}

export const TECHNOLOGY_NAMES = CANONICAL_TECHNOLOGIES.map((t) => t.name)
export const DIRECTION_NAMES = CANONICAL_DIRECTIONS.map((t) => t.name)
