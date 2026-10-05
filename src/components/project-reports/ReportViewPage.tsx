import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AssessmentOutlined, EditOutlined, ArrowBackRounded } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	BackGhostButton,
	DotMini,
	EditSolidButton,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetProjectReportByIdQuery } from '../../store/project-reports/projectReportsApi'
import { formatDate } from '../../utils/format'
import { T } from '../sales-analytics/_shared/tokens'

const ReportViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: report, isLoading, isError } = useGetProjectReportByIdQuery(id, { skip: !id })

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<Loading label='Loading report…' />
					</Center>
				</Surface>
			</Shell>
		)
	}

	if (isError || !report) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<ErrorState
							title='Report not available'
							description='Could not load report.'
							action={<Button onClick={() => navigate('/projects/reports')}>Back to list</Button>}
						/>
					</Center>
				</Surface>
			</Shell>
		)
	}

	const isDiscord = report.source === 'DISCORD' || !report.employee
	const authorName = isDiscord
		? report.discordUsername ?? 'Discord user'
		: `${report.employee!.firstName} ${report.employee!.lastName}`.trim()
	const authorFieldValue = isDiscord
		? `${authorName} · Posted via Discord`
		: authorName

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/projects/reports'
					backLabel='Back to reports'
					icon={<AssessmentOutlined />}
					title={`${report.project.name} · ${formatDate(report.reportDate, 'short')}`}
					subtitle={
						isDiscord
							? `Posted via Discord by ${authorName}`
							: `Report by ${authorName}`
					}
					badgeLabel={`${report.hours}h`}
					badgeTone='new'
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Context' hint='Project, author and date' />
					<Grid>
						<Field label='Project'>
							<TextField name='p' value={report.project.name} disable sizes='small' width='100%' />
						</Field>
						<Field label='Author'>
							<TextField name='au' value={authorFieldValue} disable sizes='small' width='100%' />
						</Field>
						<Field label='Report date'>
							<TextField
								name='dt'
								value={formatDate(report.reportDate, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Hours'>
							<TextField
								name='hr'
								value={String(report.hours)}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</Grid>
				</Section>

				<Section $delay={140}>
					<SectionHead num='02' title='Summary' hint='Work description' />
					<ContentBlock>{report.content}</ContentBlock>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing report in read-only mode.
					</FootLeft>
					<FootActions>
						<BackGhostButton type='button' onClick={() => navigate('/projects/reports')}>
							<ArrowBackRounded />
							Back to list
						</BackGhostButton>
						<PermissionGate permission='project_reports:update'>
							<EditSolidButton
								type='button'
								onClick={() => navigate(`/projects/reports/edit/${report.id}`)}
							>
								<EditOutlined />
								Edit report
							</EditSolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default ReportViewPage

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const ContentBlock = styled.div`
	white-space: pre-wrap;
	font-size: 14px;
	line-height: 1.55;
	color: ${T.textStrong};
	padding: 16px;
	border-radius: 12px;
	background: ${T.subtleBg};
	border: 1px solid ${T.border};
`
