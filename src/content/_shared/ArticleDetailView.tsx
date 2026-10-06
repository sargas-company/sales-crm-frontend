import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowBackRounded, ScheduleRounded } from '@mui/icons-material'

import { type Article } from '../articles'
import { T } from '../../components/sales-analytics/_shared/tokens'

interface Props {
	article: Article
	basePath: string
}

const ArticleDetailView = ({ article, basePath }: Props) => {
	const navigate = useNavigate()
	return (
		<Wrap>
			<BackLink type='button' onClick={() => navigate(basePath)}>
				<ArrowBackRounded style={{ fontSize: 16 }} />
				Back to list
			</BackLink>

			<Header>
				<CategoryTag>{article.category}</CategoryTag>
				<Title>{article.title}</Title>
				{article.summary && <Summary>{article.summary}</Summary>}
				<MetaRow>
					{article.updatedAt && (
						<MetaItem>
							<ScheduleRounded style={{ fontSize: 13 }} />
							<span>updated {article.updatedAt}</span>
						</MetaItem>
					)}
					{article.keywords.length > 0 && (
						<KeywordRow>
							{article.keywords.map((k) => (
								<Keyword key={k}>#{k}</Keyword>
							))}
						</KeywordRow>
					)}
				</MetaRow>
			</Header>

			<Body>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
			</Body>
		</Wrap>
	)
}

export default ArticleDetailView

/* ─── Styles ──────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Wrap = styled.article`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.07);
	border-radius: 20px;
	padding: 28px 32px 36px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 640px) {
		padding: 22px 20px 28px;
	}
`

const BackLink = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	margin-bottom: 18px;
	transition:
		border-color 180ms ease,
		color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const Header = styled.header`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding-bottom: 20px;
	border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
	margin-bottom: 24px;
`

const CategoryTag = styled.span`
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	padding: 3px 11px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
`

const Title = styled.h1`
	margin: 2px 0 0;
	font-family: 'Fraunces', ui-serif, Georgia, serif;
	font-size: 32px;
	font-weight: 600;
	letter-spacing: -0.5px;
	color: ${T.textStrong};
	line-height: 1.2;

	@media (max-width: 640px) {
		font-size: 24px;
	}
`

const Summary = styled.p`
	margin: 2px 0 0;
	max-width: 70ch;
	font-size: 15px;
	line-height: 1.55;
	color: ${T.textSecondary};
`

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-top: 6px;
`

const MetaItem = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;

	svg {
		color: ${T.textMuted};
	}
`

const KeywordRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const Keyword = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textMuted};
`

/* Full markdown rendering surface. Covers the common cases: h1-h4,
 * paragraphs, lists, inline code, code blocks (dark terminal), tables,
 * blockquotes, images, hr, links. Images get rounded corners + shadow
 * so screenshots sit on the article cleanly. */
const Body = styled.div`
	font-size: 14.5px;
	line-height: 1.68;
	color: ${T.textStrong};

	h2 {
		margin: 28px 0 10px;
		font-family: 'Fraunces', ui-serif, Georgia, serif;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.3px;
		color: ${T.textStrong};
	}
	h3 {
		margin: 22px 0 8px;
		font-family: 'Fraunces', ui-serif, Georgia, serif;
		font-size: 18px;
		font-weight: 600;
		letter-spacing: -0.2px;
		color: ${T.textStrong};
	}
	h4 {
		margin: 18px 0 6px;
		font-size: 15px;
		font-weight: 700;
		color: ${T.textStrong};
	}

	p {
		margin: 10px 0;
	}

	ul,
	ol {
		margin: 10px 0;
		padding-left: 1.5em;
	}
	li + li {
		margin-top: 4px;
	}

	a {
		color: ${T.primary};
		text-decoration: none;
		border-bottom: 1px solid rgba(3, 105, 161, 0.3);
		transition: border-color 160ms ease;

		&:hover {
			border-bottom-color: ${T.primary};
		}
	}

	strong {
		color: ${T.textStrong};
		font-weight: 700;
	}

	code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12.5px;
		padding: 2px 6px;
		border-radius: 5px;
		background: rgba(15, 23, 42, 0.06);
		color: ${T.textStrong};
	}

	pre {
		margin: 14px 0;
		padding: 14px 16px;
		border-radius: 10px;
		background: #0f172a;
		color: #e2e8f0;
		overflow-x: auto;

		code {
			padding: 0;
			background: transparent;
			color: inherit;
			font-size: 12.5px;
			line-height: 1.55;
		}
	}

	blockquote {
		margin: 14px 0;
		padding: 10px 16px;
		border-left: 3px solid ${T.primary};
		background: rgba(3, 105, 161, 0.04);
		color: ${T.textSecondary};
	}

	table {
		border-collapse: collapse;
		margin: 14px 0;
		font-size: 13px;
		width: 100%;

		th,
		td {
			border: 1px solid rgba(15, 23, 42, 0.08);
			padding: 6px 10px;
			text-align: left;
		}
		th {
			background: rgba(15, 23, 42, 0.04);
			font-weight: 700;
		}
	}

	img {
		max-width: 100%;
		height: auto;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 6px 20px -14px rgba(15, 23, 42, 0.3);
		margin: 10px 0;
	}

	hr {
		border: 0;
		border-top: 1px dashed rgba(15, 23, 42, 0.1);
		margin: 24px 0;
	}
`
