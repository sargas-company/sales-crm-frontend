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

	const isDiscord = report.source === 'DISCORD'
	const contributors = report.contributors ?? []

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/projects/reports'
					backLabel='Back to reports'
					icon={<AssessmentOutlined />}
					title={`${report.project.name} · ${formatDate(report.reportDate, 'short')}`}
					subtitle={
						isDiscord ? 'Posted via Discord' : 'Project daily report'
					}
					badgeLabel={`${report.hours}h`}
					badgeTone='new'
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Context' hint='Project, date and hours' />
					<Grid>
						<Field label='Project'>
							<TextField name='p' value={report.project.name} disable sizes='small' width='100%' />
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
						<Field label='Source'>
							<TextField
								name='src'
								value={isDiscord ? 'Posted via Discord' : 'Filed in CRM'}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</Grid>
				</Section>

				<Section $delay={120}>
					<SectionHead
						num='02'
						title='Contributors at submission'
						hint='Immutable snapshot of the project team at the moment this report was filed.'
					/>
					{contributors.length === 0 ? (
						<EmptySnapshot>No contributors recorded.</EmptySnapshot>
					) : (
						<ContributorList>
							{contributors.map((c) => {
								const name =
									`${c.firstNameSnapshot} ${c.lastNameSnapshot}`.trim() ||
									'Unknown contributor'
								if (c.employee) {
									return (
										<ContributorLink
											key={c.id}
											type='button'
											onClick={() => navigate(`/employees/${c.employee!.id}`)}
										>
											{name}
										</ContributorLink>
									)
								}
								return (
									<ContributorChip key={c.id} title='Employee no longer exists'>
										{name}
										<Muted> · Deleted employee</Muted>
									</ContributorChip>
								)
							})}
						</ContributorList>
					)}
				</Section>

				<Section $delay={160}>
					<SectionHead num='03' title='Summary' hint='Work description' />
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

const ContributorList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 4px 0 2px;
`

const ContributorLink = styled.button`
	appearance: none;
	border: 1px solid ${T.border};
	background: ${T.subtleBg};
	color: ${T.primary};
	border-radius: 999px;
	padding: 6px 12px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: background 160ms ease;
	&:hover {
		border-color: ${T.primary};
	}
`

const ContributorChip = styled.span`
	display: inline-flex;
	align-items: center;
	border: 1px solid ${T.border};
	background: ${T.subtleBg};
	color: ${T.textMuted};
	border-radius: 999px;
	padding: 6px 12px;
	font-size: 13px;
	font-weight: 500;
`

const Muted = styled.span`
	color: ${T.textMuted};
	font-weight: 400;
	margin-left: 6px;
`

const EmptySnapshot = styled.div`
	color: ${T.textMuted};
	font-size: 13px;
	padding: 10px 0 2px;
`
