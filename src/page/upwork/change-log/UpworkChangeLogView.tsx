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
import { SectionPill } from '../_shared/cells'
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
const NoteText = styled.p`
	margin: 0;
	max-width: 68ch;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 15.5px;
	line-height: 1.65;
	color: #1a1a1a;
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
					title={`${UPWORK_SECTION_LABEL[data.section]} — ${data.date.slice(0, 10)}`}
					subtitle={upworkProfileName(data.profile)}
					badgeLabel='View'
					badgeTone='view'
				/>

				<Section $delay={80}>
					<MetaRow>
						<MetaItem>{data.date.slice(0, 10)}</MetaItem>
						<MetaItem>{upworkProfileName(data.profile)}</MetaItem>
						<SectionPill $section={data.section}>
							{UPWORK_SECTION_LABEL[data.section]}
						</SectionPill>
					</MetaRow>

					<NoteText>{data.note}</NoteText>
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
