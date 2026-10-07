import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	ArrowBackRounded,
	ArrowOutwardOutlined,
	AssessmentOutlined,
	EditOutlined,
} from '@mui/icons-material'
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

/** Two-letter initials for the avatar tile — mirrors ProjectViewPage. */
const initials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

/** Shared brand-blue tint the project-team card uses. Kept in sync so
    both pages feel like one visual family. */
const BLUE = {
	fg: 'rgb(3, 105, 161)',
	border: 'rgba(3, 105, 161, 0.35)',
	bgSoft: 'rgba(3, 105, 161, 0.10)',
	bgMid: 'rgba(3, 105, 161, 0.18)',
	ring: 'rgba(3, 105, 161, 0.24)',
	focus: 'rgba(3, 105, 161, 0.18)',
} as const

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
							action={
								<Button onClick={() => navigate('/projects/reports')}>Back to list</Button>
							}
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
					subtitle={isDiscord ? 'Posted via Discord' : 'Project daily report'}
					badgeLabel={`${report.hours}h`}
					badgeTone='new'
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Context' hint='Project, date and hours' />
					<Grid>
						<Field label='Project'>
							<TextField
								name='p'
								value={report.project.name}
								disable
								sizes='small'
								width='100%'
							/>
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
						hint={
							contributors.length === 0
								? 'Immutable snapshot of the project team at the moment this report was filed.'
								: `${contributors.length} contributor${contributors.length === 1 ? '' : 's'} snapshotted when the report was filed`
						}
					/>
					{contributors.length === 0 ? (
						<EmptySnapshot>No contributors recorded.</EmptySnapshot>
					) : (
						<ContributorsGrid>
							{contributors.map((c) => {
								const name =
									`${c.firstNameSnapshot} ${c.lastNameSnapshot}`.trim() ||
									'Unknown contributor'
								const isDeleted = c.employee === null
								if (!isDeleted) {
									return (
										<ContributorCard
											key={c.id}
											type='button'
											onClick={() => navigate(`/employees/${c.employee!.id}`)}
											aria-label={`Open ${name}`}
											$deleted={false}
										>
											<ContributorAvatarWrap>
												<ContributorAvatar>
													{initials(c.firstNameSnapshot, c.lastNameSnapshot)}
												</ContributorAvatar>
											</ContributorAvatarWrap>
											<ContributorBody>
												<ContributorName>{name}</ContributorName>
												<ContributorMeta>Open employee</ContributorMeta>
											</ContributorBody>
											<ContributorChevron aria-hidden='true'>
												<ArrowOutwardOutlined />
											</ContributorChevron>
										</ContributorCard>
									)
								}
								return (
									<ContributorCard
										key={c.id}
										as='span'
										$deleted={true}
										title='Employee no longer exists'
									>
										<ContributorAvatarWrap>
											<ContributorAvatar $muted>
												{initials(c.firstNameSnapshot, c.lastNameSnapshot)}
											</ContributorAvatar>
										</ContributorAvatarWrap>
										<ContributorBody>
											<ContributorName>{name}</ContributorName>
											<ContributorMetaMuted>Deleted employee</ContributorMetaMuted>
										</ContributorBody>
									</ContributorCard>
								)
							})}
						</ContributorsGrid>
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

const EmptySnapshot = styled.div`
	color: ${T.textMuted};
	font-size: 13px;
	padding: 10px 0 2px;
`

/* ─── Contributor card grid — mirrors ProjectViewPage team cards.
       The snapshot is historical; we reuse the exact look so the two
       pages feel like one visual family. ─── */

const ContributorsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 10px;
`

const ContributorCard = styled.button<{ $deleted: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 3px auto 1fr auto;
	align-items: center;
	gap: 0;
	padding: 0;
	border-radius: 14px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	text-align: left;
	font-family: inherit;
	cursor: ${({ $deleted }) => ($deleted ? 'default' : 'pointer')};
	overflow: hidden;
	isolation: isolate;
	transition:
		border-color 260ms ${T.ease},
		background-color 260ms ${T.ease};
	opacity: ${({ $deleted }) => ($deleted ? 0.7 : 1)};

	&::before {
		content: '';
		grid-column: 1;
		align-self: stretch;
		background: ${BLUE.fg};
		opacity: 0.35;
		transition: opacity 260ms ${T.ease};
	}

	${({ $deleted }) =>
		$deleted
			? ''
			: `
	&:hover {
		border-color: ${BLUE.border};
	}

	&:hover::before {
		opacity: 1;
	}

	&:focus-visible {
		outline: none;
		border-color: ${BLUE.fg};
		box-shadow: 0 0 0 3px ${BLUE.focus};
	}

	&:active {
		background: rgba(15, 23, 42, 0.02);
	}
	`}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&::before {
			transition: none;
		}
	}
`

const ContributorAvatarWrap = styled.span`
	padding: 12px 0 12px 14px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const ContributorAvatar = styled.span<{ $muted?: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: ${({ $muted }) => ($muted ? 'rgba(100, 116, 139, 0.12)' : BLUE.bgSoft)};
	color: ${({ $muted }) => ($muted ? '#64748b' : BLUE.fg)};
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.3px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	box-shadow: inset 0 0 0 1px ${({ $muted }) => ($muted ? 'rgba(100, 116, 139, 0.24)' : BLUE.ring)};
	transition: box-shadow 260ms ${T.ease};

	${ContributorCard}:hover & {
		box-shadow:
			inset 0 0 0 1px ${BLUE.ring},
			0 0 0 4px ${BLUE.bgMid};
	}
`

const ContributorBody = styled.span`
	padding: 12px 12px 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-width: 0;
`

const ContributorName = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.15px;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const ContributorMeta = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
	line-height: 1.4;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	min-width: 0;
`

const ContributorMetaMuted = styled(ContributorMeta)`
	font-style: italic;
	color: ${T.textMuted};
`

const ContributorChevron = styled.span`
	padding: 12px 14px 12px 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0;
	transform: translateX(-6px);
	transition:
		opacity 260ms ${T.ease},
		transform 260ms ${T.ease},
		color 260ms ${T.ease};

	svg {
		font-size: 16px;
	}

	${ContributorCard}:hover & {
		opacity: 1;
		transform: translateX(0);
		color: ${BLUE.fg};
	}

	@media (prefers-reduced-motion: reduce) {
		transform: none;
	}
`
