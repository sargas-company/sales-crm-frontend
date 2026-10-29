import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Chip } from '@mui/material'
import { Edit } from '@mui/icons-material'

import { useGetUpworkChangeLogQuery } from '../../../store/upwork/upworkApi'

const PageWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`
const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
`
const Title = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #0f172a;
	margin: 0;
`
const MetaRow = styled.div`
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	color: #64748b;
	font-size: 14px;
`
const Reason = styled.div`
	color: #475569;
	font-size: 14px;
	padding: 10px 14px;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 3px solid #94a3b8;
`
const Grid2 = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`
const Panel = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`
const PanelHead = styled.div`
	font-size: 12px;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #94a3b8;
	font-weight: 700;
`
const PanelBody = styled.pre`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.55;
	color: #0f172a;
	white-space: pre-wrap;
	word-break: break-word;
	margin: 0;
`
const RefList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const UpworkChangeLogView = () => {
	const { id } = useParams<{ id: string }>()
	const { data, isLoading, error } = useGetUpworkChangeLogQuery(id ?? '', {
		skip: !id,
	})

	if (isLoading) return <div>Loading…</div>
	if (error || !data) return <div>Not found.</div>

	return (
		<PageWrap>
			<Header>
				<Title>{data.summary}</Title>
				<Button
					variant='outlined'
					startIcon={<Edit />}
					component={Link}
					to={`/upwork/change-log/${data.id}/edit`}
				>
					Edit
				</Button>
			</Header>

			<MetaRow>
				<span>Date: {data.date.slice(0, 10)}</span>
				<span>Profile: {data.profile.name}</span>
				<Chip label={data.section} size='small' />
				{data.item && <span>Item: {data.item}</span>}
			</MetaRow>

			{data.reason && <Reason>{data.reason}</Reason>}

			<Grid2>
				<Panel>
					<PanelHead>Before</PanelHead>
					<PanelBody>{data.before}</PanelBody>
				</Panel>
				<Panel>
					<PanelHead>After</PanelHead>
					<PanelBody>{data.after}</PanelBody>
				</Panel>
			</Grid2>

			<Panel>
				<PanelHead>Reference entries used ({data.references.length})</PanelHead>
				{data.references.length === 0 ? (
					<div style={{ color: '#94a3b8', fontSize: 14 }}>None attached.</div>
				) : (
					<RefList>
						{data.references.map((r) => (
							<Chip
								key={r.referenceData.id}
								size='small'
								label={`${r.referenceData.category}: ${r.referenceData.value}`}
							/>
						))}
					</RefList>
				)}
			</Panel>
		</PageWrap>
	)
}

export default UpworkChangeLogView
