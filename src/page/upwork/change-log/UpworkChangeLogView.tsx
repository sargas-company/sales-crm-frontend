import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { EditNoteOutlined, EditOutlined } from '@mui/icons-material'

import useTheme from '../../../theme/useTheme'
import {
	FormHeader,
	FormLoading,
	FormNotFound,
} from '../../../components/_shared/FormShell'
import {
	FootActions,
	FootBar,
	FootLeft,
	DotMini,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../../components/_shared/formShell.styled'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	UPWORK_SECTION_LABEL,
	upworkProfileName,
	useGetUpworkChangeLogQuery,
} from '../../../store/upwork/upworkApi'

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
	align-items: center;
	color: #7a7686;
	font-size: 13px;
	margin: 4px 0 18px;
`
const MetaItem = styled.span`
	display: inline-flex;
	gap: 6px;
	align-items: center;
	font-family: 'JetBrains Mono', monospace;
	font-size: 12.5px;
`
const SectionBadge = styled.span`
	display: inline-flex;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: rgba(124, 58, 237, 0.1);
	color: #6d28d9;
`
const Reason = styled.div`
	border-left: 3px solid #d4cfe0;
	background: #f6f4fb;
	padding: 10px 16px;
	border-radius: 0 10px 10px 0;
	color: #3a3541;
	font-size: 13.5px;
	line-height: 1.55;
	margin-bottom: 20px;
`
const TwoCol = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`
const Panel = styled.article`
	background: #ffffff;
	border: 1px solid #eeecf3;
	border-radius: 14px;
	padding: 18px 20px 20px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-height: 220px;
`
const PanelHead = styled.h3`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #7a7686;
	margin: 0;
`
const PanelBody = styled.pre`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.6;
	color: #252d3a;
	white-space: pre-wrap;
	word-break: break-word;
	margin: 0;
`
const UpworkChangeLogView = () => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data, isLoading, isError } = useGetUpworkChangeLogQuery(id ?? '', {
		skip: !id,
	})

	if (isLoading) return <FormLoading label='Loading entry…' />
	if (isError || !data) return <FormNotFound label='Entry not found' />

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/upwork/change-log'
					backLabel='Back to change log'
					icon={<EditNoteOutlined />}
					title={data.summary}
					subtitle={data.item ?? 'Change-log entry'}
					badgeLabel='View'
					badgeTone='view'
				/>

				<Section $delay={80}>
					<MetaRow>
						<MetaItem>{data.date.slice(0, 10)}</MetaItem>
						<MetaItem>{upworkProfileName(data.profile)}</MetaItem>
						<SectionBadge>{UPWORK_SECTION_LABEL[data.section]}</SectionBadge>
					</MetaRow>

					{data.reason && <Reason>{data.reason}</Reason>}

					<TwoCol>
						<Panel>
							<PanelHead>Before</PanelHead>
							<PanelBody>{data.before || <em style={{ color: '#a5a1b0' }}>empty</em>}</PanelBody>
						</Panel>
						<Panel>
							<PanelHead>After</PanelHead>
							<PanelBody>{data.after || <em style={{ color: '#a5a1b0' }}>empty</em>}</PanelBody>
						</Panel>
					</TwoCol>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Created {new Date(data.createdAt).toLocaleDateString('en-GB')}
					</FootLeft>
					<FootActions>
						<PrimaryGhostButton type='button' onClick={() => nav('/upwork/change-log')}>
							Close
						</PrimaryGhostButton>
						<PermissionGate permission='upwork:update'>
							<PrimarySolidButton
								type='button'
								onClick={() => nav(`/upwork/change-log/${data.id}/edit`)}
							>
								<EditOutlined fontSize='small' />
								Edit
							</PrimarySolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default UpworkChangeLogView
