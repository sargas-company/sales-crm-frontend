/**
 * Markdown-article loader shared by `/help` and `/runbook`.
 *
 * Articles live as plain Markdown files in `src/content/{section}/_articles/*.md`
 * with a YAML-ish frontmatter header. Vite's `import.meta.glob` with
 * `?raw` + `eager: true` pulls every file at build time, so lookups
 * are purely in-memory — no runtime fetch, no route-level loader.
 *
 * Frontmatter example:
 *
 *   ---
 *   title: How to add a lead
 *   slug: how-to-add-a-lead
 *   category: leads
 *   summary: Short one-liner shown on the card.
 *   keywords: [lead, add, create, pipeline]
 *   order: 1
 *   updatedAt: 2026-10-06
 *   ---
 *
 *   ...markdown body...
 */

export type ArticleSection = 'help' | 'runbook'

export interface Article {
	section: ArticleSection
	slug: string
	title: string
	summary: string
	category: string
	keywords: string[]
	order: number
	updatedAt: string
	body: string
	/** Plain-text version of the body, used for search indexing. */
	bodyText: string
}

/* Vite build-time import. The `as: 'raw'` option is deprecated in
 * favour of `query: '?raw', import: 'default'` on newer Vite versions,
 * but both forms are supported through Vite 6. We use the modern form. */
const helpFiles = import.meta.glob('./help/_articles/*.md', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>

const runbookFiles = import.meta.glob('./runbook/_articles/*.md', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>

/* ─── Frontmatter parsing ─────────────────────────────────────── */

/** Hand-rolled subset of YAML frontmatter: `key: value` pairs where
 *  value is a quoted/unquoted string, a `[a, b, c]` array, or a plain
 *  number. Keeps the loader zero-dependency.
 */
const parseFrontmatter = (raw: string): { data: Record<string, unknown>; body: string } => {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
	if (!match) return { data: {}, body: raw }
	const [, head, body] = match
	const data: Record<string, unknown> = {}
	for (const line of head.split('\n')) {
		const kv = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.*?)\s*$/)
		if (!kv) continue
		const [, key, rawVal] = kv
		if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
			data[key] = rawVal
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
				.filter(Boolean)
		} else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
			data[key] = Number(rawVal)
		} else {
			data[key] = rawVal.replace(/^['"]|['"]$/g, '')
		}
	}
	return { data, body }
}

/* Lossy markdown-to-text for the search index — strips fences, code,
 * images, links, headings and emphasis markers. Not perfect, but
 * enough to feed Fuse without indexing syntax noise. */
const stripMarkdown = (md: string): string =>
	md
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]+`/g, ' ')
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/[*_~>]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

/* ─── Section loader ──────────────────────────────────────────── */

const slugFromPath = (path: string): string => {
	const base = path.replace(/^.*\//, '').replace(/\.md$/, '')
	return base.replace(/^\d+-/, '')
}

const toArticles = (section: ArticleSection, files: Record<string, string>): Article[] => {
	const list: Article[] = Object.entries(files).map(([path, raw]) => {
		const { data, body } = parseFrontmatter(raw)
		const fallbackSlug = slugFromPath(path)
		return {
			section,
			slug: String(data.slug ?? fallbackSlug),
			title: String(data.title ?? 'Untitled'),
			summary: String(data.summary ?? ''),
			category: String(data.category ?? 'General'),
			keywords: Array.isArray(data.keywords) ? (data.keywords as string[]) : [],
			order: typeof data.order === 'number' ? data.order : 999,
			updatedAt: String(data.updatedAt ?? ''),
			body: body.trim(),
			bodyText: stripMarkdown(body),
		}
	})
	list.sort((a, b) => (a.order !== b.order ? a.order - b.order : a.title.localeCompare(b.title)))
	return list
}

export const helpArticles: Article[] = toArticles('help', helpFiles)
export const runbookArticles: Article[] = toArticles('runbook', runbookFiles)

export const getArticlesBySection = (section: ArticleSection): Article[] =>
	section === 'help' ? helpArticles : runbookArticles

export const getArticleBySlug = (section: ArticleSection, slug: string): Article | undefined =>
	getArticlesBySection(section).find((a) => a.slug === slug)

/** Unique category list for the given section, preserving insertion
 *  order and prepending the pseudo-category "All" for the UI filter. */
export const getCategoriesForSection = (section: ArticleSection): string[] => {
	const seen = new Set<string>()
	for (const a of getArticlesBySection(section)) seen.add(a.category)
	return Array.from(seen)
}
