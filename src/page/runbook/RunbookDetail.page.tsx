import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { MenuBookOutlined } from '@mui/icons-material'
import ListPageShell from '../../components/_shared/ListPageShell/ListPageShell'
import ArticleDetailView from '../../content/_shared/ArticleDetailView'
import { getArticleBySlug } from '../../content/articles'

const RunbookDetail = () => {
	const { slug } = useParams<{ slug: string }>()
	const navigate = useNavigate()
	const article = slug ? getArticleBySlug('runbook', slug) : undefined

	if (!article) {
		return (
			<ListPageShell
				crumbs={[
					{ label: 'Resources' },
					{ label: 'Runbook', href: '/runbook' },
					{ label: 'Not found', current: true },
				]}
				icon={<MenuBookOutlined />}
				title='Article not found'
				subtitle='This runbook entry does not exist or has been removed.'
			>
				<EmptyAction onClick={() => navigate('/runbook')}>Back to Runbook</EmptyAction>
			</ListPageShell>
		)
	}

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Resources' },
				{ label: 'Runbook', href: '/runbook' },
				{ label: article.title, current: true },
			]}
			icon={<MenuBookOutlined />}
			title={article.title}
			subtitle={article.summary}
		>
			<ArticleDetailView article={article} basePath='/runbook' />
		</ListPageShell>
	)
}

export default RunbookDetail

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
