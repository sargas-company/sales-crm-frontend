import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	LaunchOutlined,
	WorkspacePremiumOutlined,
} from '@mui/icons-material'
import { useState } from 'react'

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
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { T } from '../../../components/sales-analytics/_shared/tokens'

import {
	upworkProfileName,
	useDeleteUpworkProfileMutation,
	useGetUpworkProfileQuery,
	useListUpworkChangeLogQuery,
	useListUpworkReferencesQuery,
	useListUpworkSnapshotsQuery,
} from '../../../store/upwork/upworkApi'
import { CategoryPill, DateTimeCell, EmptyBadge, StatusPill } from '../_shared/cells'

const Hero = styled.div`
	display: flex;
	gap: 20px;
	align-items: flex-start;
	padding: 4px 2px 14px;
`
const Avatar = styled.div`
	width: 72px;
	height: 72px;
	border-radius: 20px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #0369a1 0%, #7c3aed 100%);
	color: #ffffff;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 28px;
	font-weight: 800;
	letter-spacing: -0.5px;
	flex: 0 0 auto;
	box-shadow: 0 10px 24px -8px rgba(3, 105, 161, 0.45);
`
const HeroBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	flex: 1;
`
const HeroName = styled.h2`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 28px;
	font-weight: 800;
	color: ${T.textStrong};
	letter-spacing: -0.5px;
	line-height: 1.1;
	margin: 0;
`
const HeroTitle = styled.div`
	font-size: 14px;
	color: ${T.textSecondary};
`
const HeroMeta = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	align-items: center;
	margin-top: 4px;
`
const UrlLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border-radius: 999px;
	border: 1px solid ${T.border};
	background: ${T.cardBg};
	color: ${T.primary};
	font-size: 12.5px;
	font-weight: 600;
	text-decoration: none;
	transition:
		background 160ms ease,
		border-color 160ms ease;
	svg {
		font-size: 14px;
	}
	&:hover {
		background: ${T.primaryTint};
		border-color: rgba(3, 105, 161, 0.35);
	}
`
const StatsStrip = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 14px;
	margin: 10px 0 6px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`
const StatCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 16px 18px;
	border: 1px solid ${T.border};
	border-radius: 14px;
	background: ${T.cardBg};
	.k {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: ${T.textSecondary};
		font-weight: 700;
	}
	.v {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 32px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.8px;
		font-variant-numeric: tabular-nums;
	}
	.cap {
		font-size: 12px;
		color: ${T.textSecondary};
	}
`
const NoteCard = styled.div`
	padding: 14px 18px;
	border-left: 3px solid ${T.border};
	background: ${T.subtleBg};
	border-radius: 0 10px 10px 0;
	color: ${T.textPrimary};
	font-size: 13.5px;
	line-height: 1.55;
`
const RecentList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
`
const RecentRow = styled(Link)`
	display: grid;
	grid-template-columns: 120px auto 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 10px 4px;
	border-bottom: 1px solid ${T.border};
	color: ${T.textPrimary};
	text-decoration: none;
	transition: background 160ms ease;
	&:hover {
		background: ${T.subtleBg};
	}
	&:last-child {
		border-bottom: none;
	}
	.sum {
		font-size: 13.5px;
		font-weight: 600;
		color: ${T.textStrong};
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.arrow {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: ${T.textMuted};
	}
`
const SectionWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const SectionTitle = styled.h3`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 15px;
	font-weight: 700;
	color: ${T.textStrong};
	margin: 0;
`

const UpworkProfileView = () => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data, isLoading, isError } = useGetUpworkProfileQuery(id ?? '', {
		skip: !id,
	})
	const { data: refs = [] } = useListUpworkReferencesQuery(
		{ profileId: id, active: true },
		{ skip: !id },
	)
	const { data: changeLog = [] } = useListUpworkChangeLogQuery(
		{ profileId: id },
		{ skip: !id },
	)
	const { data: snapshots = [] } = useListUpworkSnapshotsQuery(
		{ profileId: id ?? '' },
		{ skip: !id },
	)
	const [del, { isLoading: deleting }] = useDeleteUpworkProfileMutation()
	const [toDelete, setToDelete] = useState(false)

	if (isLoading) return <FormLoading label='Loading profile…' />
	if (isError || !data) return <FormNotFound label='Profile not found' />

	const initials =
		(data.firstName[0] ?? '').toUpperCase() +
		(data.lastName?.[0]?.toUpperCase() ?? '')
	const recent = [...changeLog]
		.sort((a, b) => (a.date < b.date ? 1 : -1))
		.slice(0, 6)

	return (
		<>
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<FormHeader
						backTo='/upwork/profiles'
						backLabel='Back to profiles'
						icon={<WorkspacePremiumOutlined />}
						title={upworkProfileName(data)}
						subtitle={data.title ?? 'Upwork profile'}
						badgeLabel='View'
						badgeTone='view'
					/>

					<Section $delay={60}>
						<Hero>
							<Avatar>{initials}</Avatar>
							<HeroBody>
								<HeroName>{upworkProfileName(data)}</HeroName>
								{data.title ? (
									<HeroTitle>{data.title}</HeroTitle>
								) : (
									<EmptyBadge>no title</EmptyBadge>
								)}
								<HeroMeta>
									<StatusPill $tone={data.active ? 'success' : 'muted'}>
										{data.active ? 'Active' : 'Archived'}
									</StatusPill>
									{data.url ? (
										<UrlLink href={data.url} target='_blank' rel='noreferrer'>
											<LaunchOutlined />
											Open on Upwork
										</UrlLink>
									) : (
										<EmptyBadge>no url</EmptyBadge>
									)}
								</HeroMeta>
							</HeroBody>
						</Hero>

						{data.note ? (
							<NoteCard>{data.note}</NoteCard>
						) : (
							<EmptyBadge>no note</EmptyBadge>
						)}

						<StatsStrip>
							<StatCell>
								<span className='k'>Reference entries</span>
								<span className='v'>{refs.length.toLocaleString()}</span>
								<span className='cap'>active rows for this profile</span>
							</StatCell>
							<StatCell>
								<span className='k'>Change log</span>
								<span className='v'>{changeLog.length.toLocaleString()}</span>
								<span className='cap'>recorded edits</span>
							</StatCell>
							<StatCell>
								<span className='k'>Snapshots</span>
								<span className='v'>{snapshots.length.toLocaleString()}</span>
								<span className='cap'>daily metrics captured</span>
							</StatCell>
						</StatsStrip>
					</Section>

					<Section $delay={160}>
						<SectionWrap>
							<SectionTitle>Recent changes</SectionTitle>
							{recent.length === 0 ? (
								<EmptyBadge>no change-log entries yet</EmptyBadge>
							) : (
								<RecentList>
									{recent.map((r) => (
										<RecentRow key={r.id} to={`/upwork/change-log/${r.id}`}>
											<DateTimeCell iso={r.date} />
											<CategoryPill>{r.section.replace(/_/g, ' ')}</CategoryPill>
											<span className='sum'>{r.summary}</span>
											<span className='arrow'>→</span>
										</RecentRow>
									))}
								</RecentList>
							)}
						</SectionWrap>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Updated{' '}
							{new Date(data.updatedAt).toLocaleDateString('en-GB')}
						</FootLeft>
						<FootActions>
							<PermissionGate permission='upwork:delete'>
								<PrimaryGhostButton
									type='button'
									onClick={() => setToDelete(true)}
									style={{ color: '#b91c1c', borderColor: 'rgba(185, 28, 28, 0.4)' }}
								>
									<DeleteOutline fontSize='small' />
									Delete
								</PrimaryGhostButton>
							</PermissionGate>
							<PermissionGate permission='upwork:update'>
								<PrimarySolidButton
									type='button'
									onClick={() => nav(`/upwork/profiles/${data.id}/edit`)}
								>
									<EditOutlined fontSize='small' />
									Edit
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</Surface>
			</Shell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title='Delete profile?'
					description={
						<>
							Delete <strong>{upworkProfileName(data)}</strong>? All change-log
							entries and snapshots for this profile will be removed too. This
							cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					isLoading={deleting}
					onConfirm={async () => {
						await del(data.id).unwrap()
						nav('/upwork/profiles')
					}}
					onClose={() => setToDelete(false)}
				/>
			)}
		</>
	)
}

export default UpworkProfileView
