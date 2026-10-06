import { useParams, useNavigate } from 'react-router-dom'
import { HelpOutlineOutlined } from '@mui/icons-material'
import ListPageShell from '../../components/_shared/ListPageShell/ListPageShell'
import ArticleDetailView from '../../content/_shared/ArticleDetailView'
import { getArticleBySlug } from '../../content/articles'

const HelpDetail = () => {
	const { slug } = useParams<{ slug: string }>()
	const navigate = useNavigate()
	const article = slug ? getArticleBySlug('help', slug) : undefined

	if (!article) {
		return (
			<ListPageShell
				crumbs={[
					{ label: 'Resources' },
					{ label: 'Help & FAQ', href: '/help' },
					{ label: 'Not found', current: true },
				]}
				icon={<HelpOutlineOutlined />}
				title='Article not found'
				subtitle='This article does not exist or has been removed.'
			>
				<EmptyAction onClick={() => navigate('/help')}>Back to Help & FAQ</EmptyAction>
			</ListPageShell>
		)
	}

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Resources' },
				{ label: 'Help & FAQ', href: '/help' },
				{ label: article.title, current: true },
			]}
			icon={<HelpOutlineOutlined />}
			title={article.title}
			subtitle={article.summary}
		>
			<ArticleDetailView article={article} basePath='/help' />
		</ListPageShell>
	)
}

export default HelpDetail

import styled from 'styled-components'

const EmptyAction = styled.button`
	margin-top: 12px;
	padding: 10px 18px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.12);
	background: #ffffff;
	color: #0369a1;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		border-color: #0369a1;
	}
`
