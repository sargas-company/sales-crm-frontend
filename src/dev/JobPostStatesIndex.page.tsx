import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { JOB_POST_FIXTURE_INDEX } from './jobPostFixtures'

/*
 * Dev-only index page listing the Job Post preview fixtures.
 * Mounted at /job-posts/dev-states behind an `import.meta.env.DEV`
 * guard — a prod build never renders this. Each link opens the
 * JobPostPreview page with a `demo-*` id; the preview page
 * substitutes fixture data for those ids and bypasses the API.
 */
const JobPostStatesIndex = () => {
	if (!import.meta.env.DEV) return null
	return (
		<Page>
			<Shell>
				<Title>Job Post detail — demo states</Title>
				<Note>
					Dev-only. Each link opens the preview page with a fixture, so you can
					visually verify the five analysis states without touching the backend
					or AI pipeline.
				</Note>
				<List>
					{JOB_POST_FIXTURE_INDEX.map((fx) => (
						<Row key={fx.id}>
							<RowHead>
								<Link to={`/job-posts/preview/${fx.id}`}>{fx.title}</Link>
								<Tag>{fx.id}</Tag>
							</RowHead>
							<RowNote>{fx.note}</RowNote>
						</Row>
					))}
				</List>
			</Shell>
		</Page>
	)
}

export default JobPostStatesIndex

const Page = styled.div`
	min-height: 100%;
	background: #fafafb;
	padding: 32px 20px 72px;
`
const Shell = styled.div`
	max-width: 720px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 20px;
`
const Title = styled.h1`
	margin: 0;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.3px;
`
const Note = styled.p`
	margin: 0;
	font-size: 13px;
	line-height: 1.55;
	color: rgba(15, 23, 42, 0.6);
`
const List = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const Row = styled.li`
	padding: 14px 16px;
	background: #fff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 10px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`
const RowHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;

	a {
		font-size: 14.5px;
		font-weight: 600;
		color: #0f172a;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}
`
const Tag = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.06);
	color: rgba(15, 23, 42, 0.6);
`
const RowNote = styled.div`
	font-size: 12.5px;
	color: rgba(15, 23, 42, 0.6);
`
