import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import Fuse from 'fuse.js'
import { SearchOutlined, ClearRounded } from '@mui/icons-material'

import {
	type Article,
	type ArticleSection,
	getArticlesBySection,
	getCategoriesForSection,
} from '../articles'
import { T } from '../../components/sales-analytics/_shared/tokens'

interface Props {
	section: ArticleSection
	basePath: string
	emptyLabel: string
}

const ArticlesListView = ({ section, basePath, emptyLabel }: Props) => {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [category, setCategory] = useState<string>('')

	const articles = useMemo(() => getArticlesBySection(section), [section])
	const categories = useMemo(() => getCategoriesForSection(section), [section])

	const fuse = useMemo(
		() =>
			new Fuse(articles, {
				keys: [
					{ name: 'title', weight: 2 },
					{ name: 'summary', weight: 1.4 },
					{ name: 'keywords', weight: 1.2 },
					{ name: 'bodyText', weight: 0.8 },
				],
				threshold: 0.38,
				ignoreLocation: true,
			}),
		[articles]
	)

	const filtered = useMemo(() => {
		const q = query.trim()
		let base = q ? fuse.search(q).map((r) => r.item) : articles
		if (category) base = base.filter((a) => a.category === category)
		return base
	}, [query, category, fuse, articles])

	const activeFilterCount = (query.trim() ? 1 : 0) + (category ? 1 : 0)

	return (
		<>
			<Toolbar>
				<SearchPill>
					<SearchOutlined style={{ fontSize: 18 }} />
					<input
						type='text'
						placeholder='Search by keyword — e.g. “how to add a lead”'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label='Search articles'
					/>
					{query && (
						<SearchClear type='button' onClick={() => setQuery('')} aria-label='Clear search'>
							<ClearRounded style={{ fontSize: 15 }} />
						</SearchClear>
					)}
				</SearchPill>

				<ChipRow role='tablist' aria-label='Categories'>
					<CategoryChip
						type='button'
						$active={category === ''}
						aria-selected={category === ''}
						onClick={() => setCategory('')}
					>
						All
					</CategoryChip>
					{categories.map((c) => (
						<CategoryChip
							key={c}
							type='button'
							$active={category === c}
							aria-selected={category === c}
							onClick={() => setCategory(c)}
						>
							{c}
						</CategoryChip>
					))}
				</ChipRow>
			</Toolbar>

			{filtered.length === 0 ? (
				<EmptyState>
					<EmptyTitle>No articles yet</EmptyTitle>
					<EmptyText>
						{activeFilterCount > 0
							? 'Nothing matches these filters. Clear them to see the full list.'
							: emptyLabel}
					</EmptyText>
					{activeFilterCount > 0 && (
						<EmptyAction
							type='button'
							onClick={() => {
								setQuery('')
								setCategory('')
							}}
						>
							Clear filters
						</EmptyAction>
					)}
				</EmptyState>
			) : (
				<Grid>
					{filtered.map((a) => (
						<Card
							key={a.slug}
							onClick={() => navigate(`${basePath}/${a.slug}`)}
							tabIndex={0}
							role='link'
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									navigate(`${basePath}/${a.slug}`)
								}
							}}
						>
							<CardHead>
								<CategoryTag>{a.category}</CategoryTag>
								{a.updatedAt && <UpdatedTag>{formatRel(a.updatedAt)}</UpdatedTag>}
							</CardHead>
							<CardTitle>{highlight(a.title, query)}</CardTitle>
							{a.summary && <CardSummary>{a.summary}</CardSummary>}
							<CardFoot>
								<KeywordRow>
									{a.keywords.slice(0, 3).map((kw) => (
										<Keyword key={kw}>#{kw}</Keyword>
									))}
								</KeywordRow>
							</CardFoot>
						</Card>
					))}
				</Grid>
			)}
		</>
	)
}

export default ArticlesListView

/* ─── Helpers ─────────────────────────────────────────────────── */

const formatRel = (iso: string): string => {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return iso
	const diffMs = Date.now() - d.getTime()
	const diffDays = Math.floor(diffMs / 86_400_000)
	if (diffDays < 1) return 'today'
	if (diffDays < 2) return 'yesterday'
	if (diffDays < 7) return `${diffDays}d ago`
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
	if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
	return `${Math.floor(diffDays / 365)}y ago`
}

/** Wraps the matching substring in <mark> for the title line only.
 *  Case-insensitive; renders a plain string when no query. */
const highlight = (text: string, q: string): React.ReactNode => {
	const trimmed = q.trim()
	if (!trimmed) return text
	const idx = text.toLowerCase().indexOf(trimmed.toLowerCase())
	if (idx < 0) return text
	const before = text.slice(0, idx)
	const match = text.slice(idx, idx + trimmed.length)
	const after = text.slice(idx + trimmed.length)
	return (
		<>
			{before}
			<HLMark>{match}</HLMark>
			{after}
		</>
	)
}

/* ─── Styles ──────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Toolbar = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 22px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const SearchPill = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	min-height: 46px;
	padding: 0 14px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	border-radius: 999px;
	background: #ffffff;
	transition:
		border-color 180ms ease,
		box-shadow 180ms ease;

	& > svg {
		color: ${T.textMuted};
	}

	&:focus-within {
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}

	input {
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		font-family: inherit;
		font-size: 14px;
		color: ${T.textStrong};
		min-width: 0;

		&::placeholder {
			color: ${T.textMuted};
		}
	}
`

const SearchClear = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 999px;
	border: 0;
	background: rgba(15, 23, 42, 0.06);
	color: ${T.textSecondary};
	cursor: pointer;
	transition: background 160ms ease;

	&:hover {
		background: rgba(15, 23, 42, 0.1);
		color: ${T.textStrong};
	}
`

const ChipRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const CategoryChip = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 6px 14px;
	border-radius: 999px;
	border: 1.5px solid ${(p) => (p.$active ? T.primary : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) => (p.$active ? T.primary : '#ffffff')};
	color: ${(p) => (p.$active ? '#ffffff' : T.textSecondary)};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	letter-spacing: 0.1px;
	cursor: pointer;
	transition:
		background 180ms ease,
		border-color 180ms ease,
		color 180ms ease,
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		border-color: ${T.primary};
		color: ${(p) => (p.$active ? '#ffffff' : T.primary)};
		transform: translateY(-1px);
	}
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 14px;
`

const cardIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Card = styled.article`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 18px 20px 16px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.07);
	border-radius: 16px;
	cursor: pointer;
	outline: none;
	animation: ${cardIn} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		border-color 180ms ease,
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 220ms ease;

	&:nth-child(1) {
		animation-delay: 40ms;
	}
	&:nth-child(2) {
		animation-delay: 90ms;
	}
	&:nth-child(3) {
		animation-delay: 140ms;
	}
	&:nth-child(4) {
		animation-delay: 190ms;
	}
	&:nth-child(5) {
		animation-delay: 240ms;
	}
	&:nth-child(6) {
		animation-delay: 290ms;
	}
	&:nth-child(n + 7) {
		animation-delay: 340ms;
	}

	&:hover,
	&:focus-visible {
		transform: translateY(-2px);
		box-shadow: 0 10px 24px -14px rgba(15, 23, 42, 0.14);
	}
`

const CardHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
`

const CategoryTag = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
`

const UpdatedTag = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	letter-spacing: 0.3px;
	color: ${T.textMuted};
`

const CardTitle = styled.h3`
	margin: 2px 0 0;
	font-family: 'Fraunces', ui-serif, Georgia, serif;
	font-size: 18px;
	font-weight: 600;
	letter-spacing: -0.2px;
	color: ${T.textStrong};
	line-height: 1.3;
	word-break: break-word;
`

const CardSummary = styled.p`
	margin: 0;
	font-size: 13px;
	line-height: 1.55;
	color: ${T.textSecondary};
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`

const CardFoot = styled.div`
	margin-top: auto;
	padding-top: 6px;
	display: flex;
	align-items: center;
	justify-content: space-between;
`

const KeywordRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 5px;
`

const Keyword = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;
`

const HLMark = styled.mark`
	background: rgba(232, 93, 47, 0.18);
	color: inherit;
	padding: 0 2px;
	border-radius: 3px;
`

const EmptyState = styled.div`
	padding: 56px 32px 72px;
	border: 1px dashed rgba(15, 23, 42, 0.1);
	border-radius: 20px;
	background: #ffffff;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	text-align: center;
`

const EmptyTitle = styled.div`
	font-family: 'Fraunces', ui-serif, Georgia, serif;
	font-size: 20px;
	font-weight: 600;
	color: ${T.textStrong};
`

const EmptyText = styled.p`
	margin: 0;
	max-width: 60ch;
	font-size: 13.5px;
	line-height: 1.55;
	color: ${T.textSecondary};
`

const EmptyAction = styled.button`
	margin-top: 4px;
	padding: 8px 16px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition:
		border-color 180ms ease,
		color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
