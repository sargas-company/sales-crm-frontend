import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	FolderOutlined,
	EditOutlined,
	AddRounded,
	ArrowOutwardOutlined,
	ArrowBackRounded,
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
	PrimaryGhostButton,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetProjectByIdQuery, type ProjectRecentReport } from '../../store/projects/projectsApi'
import { formatDate } from '../../utils/format'
import { T } from '../sales-analytics/_shared/tokens'

/** Author label for a recent report row — MANUAL rows carry an
 * Employee relation; DISCORD rows carry a Discord username instead
 * (and leave `employee` null). Fall back to a dash if the server
 * returns neither — shouldn't happen in practice. */
const reportAuthorLabel = (r: ProjectRecentReport): string => {
	if (r.employee) {
		return `${r.employee.firstName} ${r.employee.lastName}`.trim() || '—'
	}
	if (r.discordUsername) return `@${r.discordUsername}`
	return '—'
}

/* Prefer the new CRM Client when present; fall back to the legacy
 * Counterparty link. Legacy projects without either stay as "—". */
const clientName = (p: {
	client?: { firstName: string; lastName: string } | null
	crmClient?: {
		firstName: string
		lastName: string | null
		company: string | null
	} | null
}) => {
	if (p.crmClient) {
		const name = [p.crmClient.firstName, p.crmClient.lastName]
			.filter(Boolean)
			.join(' ')
			.trim()
		return name || p.crmClient.company || '—'
	}
	if (p.client) {
		return `${p.client.firstName} ${p.client.lastName}`.trim() || '—'
	}
	return '—'
}

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const initials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

// Single brand-blue tint used by every member card: signature stripe,
// avatar background, hover border, focus ring, chevron. Kept as
// pre-baked rgba strings so styled-components can compose them without
// runtime string math.
const BLUE = {
	fg: 'rgb(3, 105, 161)', // primary
	border: 'rgba(3, 105, 161, 0.35)',
	bgSoft: 'rgba(3, 105, 161, 0.10)',
	bgMid: 'rgba(3, 105, 161, 0.18)',
	ring: 'rgba(3, 105, 161, 0.24)',
	focus: 'rgba(3, 105, 161, 0.18)',
} as const

const ProjectViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: project, isLoading, isError } = useGetProjectByIdQuery(id, { skip: !id })

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<Loading label='Loading project…' />
					</Center>
				</Surface>
			</Shell>
		)
	}

	if (isError || !project) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<ErrorState
							title='Project not available'
							description='Could not load project.'
							action={
								<Button onClick={() => navigate('/projects/list')}>Back to list</Button>
							}
						/>
					</Center>
				</Surface>
			</Shell>
		)
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/projects/list'
					backLabel='Back to projects'
					icon={<FolderOutlined />}
					title={project.name}
					subtitle={`${clientName(project)} · created ${formatDate(project.createdAt, 'short')}`}
					badgeLabel={statusLabel(project.status)}
					badgeTone={project.status === 'active' ? 'new' : 'edit'}
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Overview' hint='Client, timeline and status' />
					<Grid>
						<Field label='Client'>
							<TextField
								name='cli'
								value={clientName(project)}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Status'>
							<TextField
								name='st'
								value={statusLabel(project.status)}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Start date'>
							<TextField
								name='sd'
								value={project.startDate ? formatDate(project.startDate, 'short') : '—'}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='End date'>
							<TextField
								name='ed'
								value={project.endDate ? formatDate(project.endDate, 'short') : '—'}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Description' span='full'>
							<TextField
								name='desc'
								value={project.description ?? '—'}
								disable
								multiRow
								sizes='small'
								width='100%'
								style={{ minHeight: 80, resize: 'none' }}
							/>
						</Field>
					</Grid>
				</Section>

				<Section $delay={140}>
					<SectionHead
						num='02'
						title='Team'
						hint={`${project.members.length} member${project.members.length === 1 ? '' : 's'} assigned`}
					/>
					{project.members.length === 0 ? (
						<EmptyHint>No team members yet.</EmptyHint>
					) : (
						<MembersGrid>
							{project.members.map((m) => {
								const isInactive = m.employee.status === 'inactive'
								const positionsLine =
									m.employee.positions.length > 0 ? m.employee.positions.join(' · ') : null
								return (
									<MemberCard
										key={m.employeeId}
										type='button'
										onClick={() => navigate(`/employees/${m.employee.id}`)}
										aria-label={`Open ${m.employee.firstName} ${m.employee.lastName}`}
										$inactive={isInactive}
									>
										<MemberAvatarWrap>
											<MemberAvatar>
												{initials(m.employee.firstName, m.employee.lastName)}
												{isInactive && <MemberStatusDot title='Inactive' />}
											</MemberAvatar>
										</MemberAvatarWrap>
										<MemberBody>
											<MemberName>
												{m.employee.firstName} {m.employee.lastName}
											</MemberName>
											{positionsLine ? (
												<MemberMeta title={positionsLine}>{positionsLine}</MemberMeta>
											) : (
												<Sub>No positions</Sub>
											)}
										</MemberBody>
										<MemberChevron aria-hidden='true'>
											<ArrowOutwardOutlined />
										</MemberChevron>
									</MemberCard>
								)
							})}
						</MembersGrid>
					)}
				</Section>

				<Section $delay={200}>
					<SectionHead
						num='03'
						title='Latest reports'
						hint='Ten most recent reports for this project'
					/>
					{!project.reports || project.reports.length === 0 ? (
						<EmptyHint>No reports yet.</EmptyHint>
					) : (
						<ReportsList>
							{project.reports.map((r) => (
								<ReportRow
									key={r.id}
									type='button'
									onClick={() => navigate(`/projects/reports/${r.id}`)}
									aria-label={`Open report from ${formatDate(r.reportDate, 'short')}`}
								>
									<ReportBody>
										<ReportHead>
											<ReportDate>{formatDate(r.reportDate, 'short')}</ReportDate>
											<ReportAuthor>{reportAuthorLabel(r)}</ReportAuthor>
										</ReportHead>
										<ReportContent>{r.content}</ReportContent>
									</ReportBody>
									<ReportHours>
										<ReportHoursNum>{r.hours}</ReportHoursNum>
										<ReportHoursUnit>h</ReportHoursUnit>
									</ReportHours>
									<ReportChevron aria-hidden='true'>
										<ArrowOutwardOutlined />
									</ReportChevron>
								</ReportRow>
							))}
						</ReportsList>
					)}
					<ReportsActions>
						<PermissionGate permission='project_reports:create'>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate(`/projects/reports/add?projectId=${project.id}`)}
							>
								<AddRounded />
								New report
							</PrimaryGhostButton>
						</PermissionGate>
						<PrimaryGhostButton
							type='button'
							onClick={() => navigate(`/projects/reports?projectId=${project.id}`)}
						>
							View all reports
						</PrimaryGhostButton>
					</ReportsActions>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing project in read-only mode.
					</FootLeft>
					<FootActions>
						<BackGhostButton type='button' onClick={() => navigate('/projects/list')}>
							<ArrowBackRounded />
							Back to list
						</BackGhostButton>
						<PermissionGate permission='projects:update'>
							<EditSolidButton
								type='button'
								onClick={() => navigate(`/projects/edit/${project.id}`)}
							>
								<EditOutlined />
								Edit project
							</EditSolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default ProjectViewPage

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

const EmptyHint = styled.div`
	font-size: 13px;
	color: ${T.textSecondary};
`

const MembersGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 10px;
`

const MemberCard = styled.button<{ $inactive: boolean }>`
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
	cursor: pointer;
	overflow: hidden;
	isolation: isolate;
	transition:
		border-color 260ms ${T.ease},
		background-color 260ms ${T.ease};
	opacity: ${({ $inactive }) => ($inactive ? 0.7 : 1)};

	/* Signature stripe — brand-blue runs down the left edge as a quiet
	   accent. */
	&::before {
		content: '';
		grid-column: 1;
		align-self: stretch;
		background: ${BLUE.fg};
		opacity: 0.35;
		transition: opacity 260ms ${T.ease};
	}

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

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&::before {
			transition: none;
		}
	}
`

const MemberAvatarWrap = styled.span`
	padding: 12px 0 12px 14px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const MemberAvatar = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: ${BLUE.bgSoft};
	color: ${BLUE.fg};
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.3px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	box-shadow: inset 0 0 0 1px ${BLUE.ring};
	transition: box-shadow 260ms ${T.ease};

	${MemberCard}:hover & {
		box-shadow:
			inset 0 0 0 1px ${BLUE.ring},
			0 0 0 4px ${BLUE.bgMid};
	}
`

const MemberStatusDot = styled.span`
	position: absolute;
	right: -2px;
	bottom: -2px;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #94a3b8;
	border: 2px solid #ffffff;
`

const MemberBody = styled.span`
	padding: 12px 12px 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-width: 0;
`

const MemberName = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.15px;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const MemberMeta = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
	line-height: 1.4;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	min-width: 0;
`

const MemberChevron = styled.span`
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

	${MemberCard}:hover & {
		opacity: 1;
		transform: translateX(0);
		color: ${BLUE.fg};
	}

	@media (prefers-reduced-motion: reduce) {
		transform: none;
	}
`

const Sub = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
	font-style: italic;
`

const ReportsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 16px;
`

const ReportRow = styled.button`
	position: relative;
	display: grid;
	grid-template-columns: 1fr auto auto;
	align-items: center;
	gap: 16px;
	padding: 12px 14px;
	border-radius: 12px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	text-align: left;
	font-family: inherit;
	cursor: pointer;
	transition:
		background-color 220ms ${T.ease},
		border-color 220ms ${T.ease};

	&:hover {
		border-color: ${BLUE.border};
	}

	&:focus-visible {
		outline: none;
		border-color: ${BLUE.fg};
		box-shadow: 0 0 0 3px ${BLUE.focus};
	}

	&:active {
		border-color: ${BLUE.fg};
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const ReportBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`

const ReportHead = styled.div`
	display: flex;
	gap: 14px;
	align-items: baseline;
	flex-wrap: wrap;
`

const ReportDate = styled.span`
	font-size: 13px;
	font-weight: 500;
	color: ${T.textStrong};
	white-space: nowrap;
`

const ReportAuthor = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

const ReportHours = styled.span`
	display: inline-flex;
	align-items: baseline;
	justify-content: center;
	align-self: center;
	gap: 2px;
	color: ${BLUE.fg};
	line-height: 1;
`

const ReportHoursNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 22px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.5px;
`

const ReportHoursUnit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	font-weight: 600;
	opacity: 0.6;
`

const ReportContent = styled.div`
	font-size: 13.5px;
	color: ${T.textSecondary};
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
`

const ReportChevron = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0;
	transform: translateX(-6px);
	transition:
		opacity 220ms ${T.ease},
		transform 220ms ${T.ease},
		color 220ms ${T.ease};

	svg {
		font-size: 16px;
	}

	${ReportRow}:hover & {
		opacity: 1;
		transform: translateX(0);
		color: ${BLUE.fg};
	}

	@media (prefers-reduced-motion: reduce) {
		transform: none;
	}
`

const ReportsActions = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
`
