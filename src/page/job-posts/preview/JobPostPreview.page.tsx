import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	AutoAwesomeOutlined,
	CheckCircleOutlined,
	ContentCopyRounded,
	LinkRounded,
	NotesOutlined,
	OpenInNewRounded,
	PaidOutlined,
	PlaceOutlined,
	RocketLaunchOutlined,
	SellOutlined,
	SpeedOutlined,
	TrendingUpOutlined,
	VisibilityOutlined,
	WarningAmberOutlined,
	WorkOutlineOutlined,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import JobPostToProposalModal from '../../../components/job-posts/JobPostToProposalModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useGetJobPostByIdQuery } from '../../../store/job-posts/jobPostsApi'
import { formatDate } from '../../../utils/formatDate'
import type {
	JobPostDecision,
	JobPostPriority,
	JobPostStatus,
} from '../../../store/job-posts/types/definition'
import { useToast } from '../../../context/toast/ToastContext'
import { getJobPostViewedAt, markJobPostViewed } from '../../../hooks/useViewedJobPosts'

/* ── Tokens ─────────────────────────────────────────────────────── */

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'
const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'
const DANGER = '#b91c1c'

/* ── Static maps ────────────────────────────────────────────────── */

const statusLabel: Record<JobPostStatus, string> = {
	NEW: 'New',
	PROCESSING: 'Processing',
	PROCESSED: 'Processed',
	FAILED: 'Failed',
}

const statusPalette: Record<JobPostStatus, { bg: string; fg: string; border: string }> = {
	NEW: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY, border: 'rgba(3, 105, 161, 0.32)' },
	PROCESSING: {
		bg: 'rgba(245, 158, 11, 0.14)',
		fg: '#a26608',
		border: 'rgba(245, 158, 11, 0.32)',
	},
	PROCESSED: {
		bg: 'rgba(34, 197, 94, 0.14)',
		fg: '#15803d',
		border: 'rgba(34, 197, 94, 0.32)',
	},
	FAILED: { bg: 'rgba(239, 68, 68, 0.12)', fg: DANGER, border: 'rgba(239, 68, 68, 0.32)' },
}

const decisionLabel: Record<JobPostDecision, string> = {
	approve: 'Approve',
	maybe: 'Maybe',
	decline: 'Decline',
}

const decisionPalette: Record<JobPostDecision, { bg: string; fg: string; border: string }> = {
	approve: {
		bg: 'rgba(34, 197, 94, 0.14)',
		fg: '#15803d',
		border: 'rgba(34, 197, 94, 0.32)',
	},
	maybe: {
		bg: 'rgba(245, 158, 11, 0.14)',
		fg: '#a26608',
		border: 'rgba(245, 158, 11, 0.32)',
	},
	decline: {
		bg: 'rgba(239, 68, 68, 0.12)',
		fg: DANGER,
		border: 'rgba(239, 68, 68, 0.32)',
	},
}

const priorityLabel: Record<JobPostPriority, string> = {
	high: 'High priority',
	medium: 'Medium priority',
	low: 'Low priority',
}

const priorityPalette: Record<JobPostPriority, { bg: string; fg: string; border: string }> = {
	high: { bg: 'rgba(239, 68, 68, 0.12)', fg: DANGER, border: 'rgba(239, 68, 68, 0.32)' },
	medium: {
		bg: 'rgba(245, 158, 11, 0.14)',
		fg: '#a26608',
		border: 'rgba(245, 158, 11, 0.32)',
	},
	low: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY, border: 'rgba(3, 105, 161, 0.32)' },
}

const scoreColor = (score: number): { fg: string; bg: string; border: string } => {
	if (score >= 80) {
		return {
			fg: '#15803d',
			bg: 'rgba(34, 197, 94, 0.14)',
			border: 'rgba(34, 197, 94, 0.32)',
		}
	}
	if (score >= 50) {
		return {
			fg: '#a26608',
			bg: 'rgba(245, 158, 11, 0.14)',
			border: 'rgba(245, 158, 11, 0.32)',
		}
	}
	return { fg: DANGER, bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.32)' }
}

/* ── Component ──────────────────────────────────────────────────── */

const JobPostPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [showProposalModal, setShowProposalModal] = useState(false)

	const { data: post, isLoading, isError } = useGetJobPostByIdQuery(id!, { skip: !id })

	const previouslyViewedAt = useMemo(() => (id ? getJobPostViewedAt(id) : null), [id])

	useEffect(() => {
		if (id) markJobPostViewed(id)
	}, [id])

	if (isLoading) {
		return (
			<Page>
				<Shell>
					<Center>
						<Loading label='Loading job post…' />
					</Center>
				</Shell>
			</Page>
		)
	}

	if (isError || !post) {
		return (
			<Page>
				<Shell>
					<Center>
						<ErrorState title='Job post not found' description='Could not load job post.' />
					</Center>
				</Shell>
			</Page>
		)
	}

	const ai = post.aiResponse
	const badge = statusPalette[post.status]
	const proposalUrl = post.proposal?.id
		? `${import.meta.env.VITE_APP_URL}/proposal/preview/${post.proposal.id}`
		: null

	const copyProposalUrl = () => {
		if (!proposalUrl) return
		navigator.clipboard.writeText(proposalUrl)
		showToast('Proposal URL copied', 'success')
	}

	return (
		<Page>
			<Shell>
				<TopRow>
					<BackChip type='button' onClick={() => navigate('/job-posts/list')}>
						<span className='arrow'>
							<ArrowBackRounded sx={{ fontSize: 16 }} />
						</span>
						<span>Back to job posts</span>
					</BackChip>

					<TopActions>
						{post.jobUrl && (
							<GhostButton href={post.jobUrl} target='_blank' rel='noopener noreferrer'>
								<OpenInNewRounded sx={{ fontSize: 18 }} />
								<span>Open source</span>
							</GhostButton>
						)}
						{!post.proposal?.id && (
							<PermissionGate permission='job_posts:convert'>
								<ProposalButton type='button' onClick={() => setShowProposalModal(true)}>
									<RocketLaunchOutlined />
									Start proposal
								</ProposalButton>
							</PermissionGate>
						)}
					</TopActions>
				</TopRow>

				<Header>
					<HeaderLeft>
						<HeaderIcon>
							<WorkOutlineOutlined />
						</HeaderIcon>
						<HeaderText>
							<HeaderName>{post.title || 'Untitled job post'}</HeaderName>
							<HeaderSub>
								Created <strong>{formatDate(post.createdAt)}</strong>
								{post.processedAt ? (
									<>
										{' '}
										<Bullet>·</Bullet> processed <strong>{formatDate(post.processedAt)}</strong>
									</>
								) : null}
							</HeaderSub>
						</HeaderText>
					</HeaderLeft>

					<StatusBadge $bg={badge.bg} $fg={badge.fg} $border={badge.border}>
						<Dot $color={badge.fg} />
						{statusLabel[post.status]}
					</StatusBadge>
				</Header>

				<ChipRow>
					{post.decision ? (
						<Pill
							$bg={decisionPalette[post.decision].bg}
							$fg={decisionPalette[post.decision].fg}
							$border={decisionPalette[post.decision].border}
						>
							<CheckCircleOutlined sx={{ fontSize: 14 }} />
							{decisionLabel[post.decision]}
						</Pill>
					) : null}
					{post.priority ? (
						<Pill
							$bg={priorityPalette[post.priority].bg}
							$fg={priorityPalette[post.priority].fg}
							$border={priorityPalette[post.priority].border}
						>
							<TrendingUpOutlined sx={{ fontSize: 14 }} />
							{priorityLabel[post.priority]}
						</Pill>
					) : null}
					{previouslyViewedAt ? (
						<Tooltip title={`Last opened ${formatDate(previouslyViewedAt)}`} placement='top'>
							<span>
								<Pill
									$bg={PRIMARY_TINT}
									$fg={PRIMARY}
									$border={'rgba(3, 105, 161, 0.32)'}
								>
									<VisibilityOutlined sx={{ fontSize: 14 }} />
									Viewed on {formatDate(previouslyViewedAt)}
								</Pill>
							</span>
						</Tooltip>
					) : null}
				</ChipRow>

				<HeroBand>
					<GaugeStack>
						<GaugeWrap>
							<GaugeSvg viewBox='0 0 132 132' aria-hidden='true'>
								<circle
									cx='66'
									cy='66'
									r='58'
									fill='none'
									stroke={INK_04}
									strokeWidth='10'
								/>
								{post.matchScore != null ? (
									<circle
										cx='66'
										cy='66'
										r='58'
										fill='none'
										stroke={scoreColor(post.matchScore).fg}
										strokeWidth='10'
										strokeLinecap='round'
										strokeDasharray={2 * Math.PI * 58}
										strokeDashoffset={
											2 *
											Math.PI *
											58 *
											(1 - Math.max(0, Math.min(100, post.matchScore)) / 100)
										}
										transform='rotate(-90 66 66)'
										style={{
											transition:
												'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
										}}
									/>
								) : null}
							</GaugeSvg>
							<GaugeCenter>
								<GaugeNum
									style={
										post.matchScore != null
											? { color: scoreColor(post.matchScore).fg }
											: undefined
									}
								>
									{post.matchScore ?? '—'}
								</GaugeNum>
							</GaugeCenter>
						</GaugeWrap>
						<GaugeCaption>
							<GaugeCaptionRule />
							Match score
							<GaugeCaptionRule />
						</GaugeCaption>
					</GaugeStack>

					<HeroRight>
						<HeroPrimaryRow>
							<HeroPrimaryStat>
								<HeroPrimaryLabel>
									<PaidOutlined sx={{ fontSize: 13 }} />
									Budget
								</HeroPrimaryLabel>
								<HeroPrimaryValue>{post.budget || '—'}</HeroPrimaryValue>
							</HeroPrimaryStat>
							<HeroVR />
							<HeroPrimaryStat>
								<HeroPrimaryLabel>
									<PlaceOutlined sx={{ fontSize: 13 }} />
									Location
								</HeroPrimaryLabel>
								<HeroPrimaryValue>{post.location || '—'}</HeroPrimaryValue>
							</HeroPrimaryStat>
							<HeroVR />
							<HeroPrimaryStat>
								<HeroPrimaryLabel>
									<SpeedOutlined sx={{ fontSize: 13 }} />
									GigRadar
								</HeroPrimaryLabel>
								<HeroPrimaryValue>{post.gigRadarScore ?? '—'}</HeroPrimaryValue>
							</HeroPrimaryStat>
						</HeroPrimaryRow>

						<HeroSecondaryRow>
							<HeroMiniStat>
								<HeroMiniLabel>Total spent</HeroMiniLabel>
								<HeroMiniValue>
									{post.totalSpent != null
										? `$${post.totalSpent.toLocaleString()}`
										: '—'}
								</HeroMiniValue>
							</HeroMiniStat>
							<HeroMiniStat>
								<HeroMiniLabel>Avg rate paid</HeroMiniLabel>
								<HeroMiniValue>
									{post.avgRatePaid != null ? `$${post.avgRatePaid}/hr` : '—'}
								</HeroMiniValue>
							</HeroMiniStat>
							<HeroMiniStat>
								<HeroMiniLabel>Hire rate</HeroMiniLabel>
								<HeroMiniValue>
									{post.hireRate != null ? `${post.hireRate}%` : '—'}
								</HeroMiniValue>
							</HeroMiniStat>
							<HeroMiniStat>
								<HeroMiniLabel>Scanner</HeroMiniLabel>
								<HeroMiniValue>{post.scanner || '—'}</HeroMiniValue>
							</HeroMiniStat>
						</HeroSecondaryRow>
					</HeroRight>
				</HeroBand>

				{post.hSkillsKeywords.length > 0 ? (
					<Section>
						<SectionHead>
							<SectionTitle>Skills</SectionTitle>
							<SectionRule />
						</SectionHead>
						<SkillsRow>
							{post.hSkillsKeywords.map((kw) => (
								<Skill key={kw}>
									<SellOutlined sx={{ fontSize: 12 }} />
									{kw}
								</Skill>
							))}
						</SkillsRow>
					</Section>
				) : null}

				{proposalUrl ? (
					<Section>
						<SectionHead>
							<SectionTitle>Linked proposal</SectionTitle>
							<SectionRule />
						</SectionHead>
						<LinkCard>
							<LinkIcon>
								<LinkRounded />
							</LinkIcon>
							<LinkBody>
								<LinkLabel>Open proposal</LinkLabel>
								<LinkUrl href={proposalUrl} target='_blank' rel='noopener noreferrer'>
									{proposalUrl}
								</LinkUrl>
							</LinkBody>
							<LinkAction
								type='button'
								onClick={copyProposalUrl}
								aria-label='Copy proposal URL'
							>
								<ContentCopyRounded sx={{ fontSize: 16 }} />
							</LinkAction>
							<LinkAction as='a' href={proposalUrl} target='_blank' rel='noopener noreferrer' aria-label='Open proposal'>
								<OpenInNewRounded sx={{ fontSize: 16 }} />
							</LinkAction>
						</LinkCard>
					</Section>
				) : null}

				{ai?.short_summary ? (
					<Section>
						<SectionHead>
							<SectionTitle>AI summary</SectionTitle>
							<SectionRule />
						</SectionHead>
						<AiCard>
							<AiIcon>
								<AutoAwesomeOutlined />
							</AiIcon>
							<AiBody>
								<AiText>{ai.short_summary}</AiText>
								{ai.hard_stop ? (
									<HardStop>
										<WarningAmberOutlined sx={{ fontSize: 16 }} />
										<span>
											Hard stop{ai.hard_stop_reason ? ` — ${ai.hard_stop_reason}` : ''}
										</span>
									</HardStop>
								) : null}
							</AiBody>
						</AiCard>
					</Section>
				) : null}

				{ai?.subscores && Object.keys(ai.subscores).length > 0 ? (
					<Section>
						<SectionHead>
							<SectionTitle>Subscores</SectionTitle>
							<SectionRule />
						</SectionHead>
						<SubscoresGrid>
							{Object.entries(ai.subscores).map(([key, value]) => {
								const n = Number(value)
								const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
								const c = scoreColor(pct)
								return (
									<SubscoreRow key={key}>
										<SubscoreLabel>{key.replace(/_/g, ' ')}</SubscoreLabel>
										<SubscoreBarWrap>
											<SubscoreBar $pct={pct} $fg={c.fg} />
										</SubscoreBarWrap>
										<SubscoreValue $fg={c.fg}>{Number.isFinite(n) ? n : value}</SubscoreValue>
									</SubscoreRow>
								)
							})}
						</SubscoresGrid>
					</Section>
				) : null}

				{ai?.reasons && ai.reasons.length > 0 ? (
					<Section>
						<SectionHead>
							<SectionTitle>Reasons</SectionTitle>
							<SectionRule />
						</SectionHead>
						<Bullets>
							{ai.reasons.map((r, i) => (
								<BulletRow key={i} $tone='info'>
									<BulletMarker $tone='info'>
										<CheckCircleOutlined sx={{ fontSize: 14 }} />
									</BulletMarker>
									<BulletText>{r}</BulletText>
								</BulletRow>
							))}
						</Bullets>
					</Section>
				) : null}

				{ai?.red_flags && ai.red_flags.length > 0 ? (
					<Section>
						<SectionHead>
							<SectionTitle>Red flags</SectionTitle>
							<SectionRule />
						</SectionHead>
						<Bullets>
							{ai.red_flags.map((r, i) => (
								<BulletRow key={i} $tone='danger'>
									<BulletMarker $tone='danger'>
										<WarningAmberOutlined sx={{ fontSize: 14 }} />
									</BulletMarker>
									<BulletText>{r}</BulletText>
								</BulletRow>
							))}
						</Bullets>
					</Section>
				) : null}

				{post.rawText ? (
					<Section>
						<SectionHead>
							<SectionTitle>Raw text</SectionTitle>
							<SectionRule />
						</SectionHead>
						<RawCard>
							<RawIcon>
								<NotesOutlined />
							</RawIcon>
							<RawBody>{post.rawText}</RawBody>
						</RawCard>
					</Section>
				) : null}
			</Shell>

			{showProposalModal && (
				<JobPostToProposalModal
					id={id!}
					onClose={() => setShowProposalModal(false)}
					onSuccess={() => navigate('/proposals')}
				/>
			)}
		</Page>
	)
}

export default JobPostPreview

/* ── Styled ─────────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	50%      { transform: translateY(-3px) rotate(-2deg); }
`

const dotPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px transparent; }
`

const rocketBoost = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	20%  { rotate: -14deg; translate: -1px 2px; }
	50%  { rotate: 18deg; translate: 2px -3px; }
	75%  { rotate: 8deg; translate: -1px -2px; }
	100% { rotate: 0deg; translate: 0 0; }
`

const barFill = keyframes`
	from { transform: scaleX(0); }
	to   { transform: scaleX(1); }
`

const Page = styled.div`
	width: 100%;
	padding: 0;
`

const Shell = styled.div`
	background: #fff;
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	padding: 34px 40px 36px;
	display: flex;
	flex-direction: column;
	gap: 28px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 22px;
		border-radius: 12px;
	}
`

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const TopRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
`

const BackChip = styled.button`
	appearance: none;
	background: transparent;
	border: none;
	padding: 8px 14px 8px 10px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	border-radius: 999px;

	.arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: ${PRIMARY};
		color: #fff;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover .arrow {
		transform: translateX(-3px);
	}
`

const TopActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const GhostButton = styled.a`
	appearance: none;
	background: #fff;
	border: 1px solid ${INK_10};
	border-radius: 12px;
	padding: 10px 16px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	text-decoration: none;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		transition: rotate 300ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover {
		transform: translateY(-1px);
	}
	&:hover svg {
		rotate: 45deg;
	}
`

const ProposalButton = styled(PrimarySolidButton)`
	svg {
		transform-origin: 50% 60%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.18;
		animation: ${rocketBoost} 680ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 26px;
	border-bottom: 1px solid ${INK_10};

	@media (max-width: 767px) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const HeaderLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 18px;
	min-width: 0;
`

const HeaderIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${PRIMARY_TINT};
	color: ${PRIMARY};
	flex-shrink: 0;
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 28px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const HeaderName = styled.p`
	margin: 0;
	font-size: 24px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.2;
	word-break: break-word;

	@media (max-width: 767px) {
		font-size: 20px;
	}
`

const HeaderSub = styled.p`
	margin: 4px 0 0;
	font-size: 13.5px;
	font-weight: 500;
	color: ${INK_60};
	letter-spacing: 0.01em;

	strong {
		font-weight: 700;
		color: ${INK};
	}
`

const Bullet = styled.span`
	color: ${INK_45};
	margin: 0 2px;
`

const StatusBadge = styled.div<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	flex-shrink: 0;
`

const Dot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${(p) => p.$color};
	color: ${(p) => p.$color};
	animation: ${dotPulse} 1.8s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const ChipRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-top: -8px;
`

const Pill = styled.span<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 5px 12px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`

const heroIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`

const HeroBand = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 32px;
	align-items: center;
	padding: 30px 34px;
	border-radius: 20px;
	overflow: hidden;
	background:
		linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
		linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
		linear-gradient(140deg, #ffffff 0%, #f8fbff 60%, #f2f7fd 100%);
	border: 1px solid ${INK_10};
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	animation: ${heroIn} 560ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 767px) {
		grid-template-columns: 1fr;
		padding: 22px 20px;
		gap: 22px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const GaugeStack = styled.div`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	flex-shrink: 0;
`

const GaugeWrap = styled.div`
	position: relative;
	width: 132px;
	height: 132px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const GaugeSvg = styled.svg`
	position: relative;
	width: 132px;
	height: 132px;
	display: block;
	z-index: 1;
	filter: drop-shadow(0 6px 20px rgba(3, 105, 161, 0.14));
`

const GaugeCenter = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	z-index: 2;
`

const GaugeNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 44px;
	font-weight: 800;
	line-height: 1;
	color: ${INK};
	letter-spacing: -0.03em;
`

const GaugeCaption = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 0.24em;
	text-transform: uppercase;
	color: ${INK_60};
`

const GaugeCaptionRule = styled.span`
	width: 18px;
	height: 1px;
	background: ${INK_10};
`

const HeroRight = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
`

const HeroPrimaryRow = styled.div`
	display: flex;
	align-items: stretch;
	gap: 20px;
	flex-wrap: wrap;
`

const HeroVR = styled.div`
	width: 1px;
	background: ${INK_10};
	align-self: stretch;

	@media (max-width: 640px) {
		display: none;
	}
`

const HeroPrimaryStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
`

const HeroPrimaryLabel = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};

	svg {
		color: ${PRIMARY};
	}
`

const HeroPrimaryValue = styled.span`
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.15;
	word-break: break-word;
`

const HeroSecondaryRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 14px 24px;
	padding-top: 16px;
	border-top: 1px dashed ${INK_10};

	@media (max-width: 767px) {
		grid-template-columns: repeat(2, 1fr);
	}
`

const HeroMiniStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const HeroMiniLabel = styled.span`
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: ${INK_45};
`

const HeroMiniValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 14px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.005em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const SectionHead = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const SectionTitle = styled.h3`
	margin: 0;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
	flex-shrink: 0;
`

const SectionRule = styled.div`
	flex: 1;
	height: 1px;
	background: ${INK_10};
`

const SkillsRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

const Skill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 8px;
	background: ${PRIMARY_TINT};
	color: ${PRIMARY};
	border: 1px solid ${PRIMARY_TINT_STRONG};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.02em;
`

const LinkCard = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 14px;
	background: linear-gradient(135deg, ${PRIMARY_TINT} 0%, #ffffff 55%, ${PRIMARY_TINT} 130%);
	background-size: 200% 200%;
	border: 1px solid ${PRIMARY_TINT_STRONG};
	animation: linkShift 8s ease-in-out infinite;

	@keyframes linkShift {
		0%, 100% { background-position: 0% 50%; }
		50%      { background-position: 100% 50%; }
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const LinkIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: ${PRIMARY};
	color: #fff;
	flex-shrink: 0;
	box-shadow: 0 8px 20px -10px rgba(3, 105, 161, 0.55);
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 22px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const LinkBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
`

const LinkLabel = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.005em;
`

const LinkUrl = styled.a`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${PRIMARY};
	text-decoration: none;
	word-break: break-all;

	&:hover {
		text-decoration: underline;
	}
`

const LinkAction = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	background: #fff;
	border: 1px solid ${INK_10};
	color: ${INK};
	flex-shrink: 0;
	cursor: pointer;
	text-decoration: none;
	appearance: none;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		transform: translateY(-1px);
	}
`

const AiCard = styled.div`
	display: flex;
	gap: 14px;
	padding: 18px 20px;
	border-radius: 14px;
	background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, #ffffff 60%, rgba(139, 92, 246, 0.08) 130%);
	border: 1px solid rgba(139, 92, 246, 0.22);
`

const AiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: rgba(139, 92, 246, 0.14);
	color: #6d28d9;
	flex-shrink: 0;
	box-shadow: 0 6px 16px -10px rgba(139, 92, 246, 0.55);
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 22px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const AiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
	flex: 1;
`

const AiText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
`

const HardStop = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-radius: 10px;
	background: rgba(239, 68, 68, 0.10);
	border: 1px solid rgba(239, 68, 68, 0.28);
	color: ${DANGER};
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.02em;
`

const SubscoresGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
`

const SubscoreRow = styled.div`
	display: grid;
	grid-template-columns: 160px 1fr 60px;
	align-items: center;
	gap: 14px;
	padding: 10px 14px;
	border-radius: 10px;
	background: #fff;
	border: 1px solid ${INK_10};

	@media (max-width: 640px) {
		grid-template-columns: 120px 1fr 44px;
	}
`

const SubscoreLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${INK};
	text-transform: capitalize;
	letter-spacing: -0.005em;
`

const SubscoreBarWrap = styled.div`
	position: relative;
	height: 8px;
	border-radius: 999px;
	background: ${INK_04};
	overflow: hidden;
`

const SubscoreBar = styled.div<{ $pct: number; $fg: string }>`
	position: absolute;
	inset: 0;
	background: ${(p) => p.$fg};
	transform-origin: left center;
	transform: scaleX(${(p) => p.$pct / 100});
	animation: ${barFill} 700ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SubscoreValue = styled.span<{ $fg: string }>`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	font-weight: 800;
	color: ${(p) => p.$fg};
	text-align: right;
`

const bulletTonePalette: Record<'info' | 'danger', { fg: string; bg: string; border: string }> = {
	info: { fg: PRIMARY, bg: PRIMARY_TINT_STRONG, border: 'rgba(3, 105, 161, 0.28)' },
	danger: {
		fg: DANGER,
		bg: 'rgba(239, 68, 68, 0.10)',
		border: 'rgba(239, 68, 68, 0.28)',
	},
}

const Bullets = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const BulletRow = styled.div<{ $tone: 'info' | 'danger' }>`
	display: flex;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${({ $tone }) => bulletTonePalette[$tone].border};
`

const BulletMarker = styled.span<{ $tone: 'info' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: ${({ $tone }) => bulletTonePalette[$tone].bg};
	color: ${({ $tone }) => bulletTonePalette[$tone].fg};
	flex-shrink: 0;
`

const BulletText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
	flex: 1;
`

const RawCard = styled.div`
	display: flex;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${INK_10};
`

const RawIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	background: ${INK_04};
	color: ${INK_60};
	flex-shrink: 0;

	svg {
		font-size: 18px;
	}
`

const RawBody = styled.pre`
	margin: 0;
	font-family: inherit;
	font-size: 14px;
	line-height: 1.65;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
	flex: 1;
`
