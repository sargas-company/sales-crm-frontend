import { useParams, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	EditOutlined,
	PhoneInTalkOutlined,
	PersonOutlineRounded,
	BusinessOutlined,
	LocationOnOutlined,
	PaidOutlined,
	CalendarMonthOutlined,
	ReplyRounded,
	CheckCircleOutlined,
	PauseCircleOutlined,
	LinkRounded,
	OpenInNewRounded,
} from '@mui/icons-material'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { useGetLeadByIdQuery } from '../../../store/leads/leadsApi'
import { formatDate } from '../../../utils/formatDate'
import type { ApiLeadStatus, ApiClientType } from '../../../store/leads/types/definition'

/* ── Tokens ─────────────────────────────────────────────────────── */

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'
const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'

/* ── Static maps ────────────────────────────────────────────────── */

const statusLabel: Record<ApiLeadStatus, string> = {
	conversation_ongoing: 'Conversation ongoing',
	trial: 'Trial',
	hold: 'On hold',
	contract_offer: 'Contract offer',
	accept_contract: 'Accepted',
	start_contract: 'Started',
	suspended: 'Suspended',
}

const statusPalette: Record<ApiLeadStatus, { bg: string; fg: string; border: string }> = {
	conversation_ongoing: {
		bg: PRIMARY_TINT_STRONG,
		fg: PRIMARY,
		border: 'rgba(3, 105, 161, 0.32)',
	},
	trial: {
		bg: 'rgba(245, 158, 11, 0.14)',
		fg: '#a26608',
		border: 'rgba(245, 158, 11, 0.32)',
	},
	hold: {
		bg: 'rgba(148, 163, 184, 0.18)',
		fg: '#475569',
		border: 'rgba(148, 163, 184, 0.35)',
	},
	contract_offer: {
		bg: 'rgba(139, 92, 246, 0.14)',
		fg: '#6d28d9',
		border: 'rgba(139, 92, 246, 0.32)',
	},
	accept_contract: {
		bg: 'rgba(34, 197, 94, 0.14)',
		fg: '#15803d',
		border: 'rgba(34, 197, 94, 0.32)',
	},
	start_contract: {
		bg: 'rgba(20, 184, 166, 0.14)',
		fg: '#0f766e',
		border: 'rgba(20, 184, 166, 0.32)',
	},
	suspended: {
		bg: 'rgba(100, 116, 139, 0.16)',
		fg: '#334155',
		border: 'rgba(100, 116, 139, 0.32)',
	},
}

const clientTypeLabel: Record<ApiClientType, string> = {
	company: 'Company',
	individual: 'Individual',
}

/* ── Component ──────────────────────────────────────────────────── */

const LeadPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { data: lead, isLoading, isError } = useGetLeadByIdQuery(id!, { skip: !id })

	if (isLoading) {
		return (
			<Page>
				<Shell>
					<Center>
						<Loading label='Loading lead…' />
					</Center>
				</Shell>
			</Page>
		)
	}

	if (isError || !lead) {
		return (
			<Page>
				<Shell>
					<Center>
						<ErrorState title='Lead not found' description='Could not load lead.' />
					</Center>
				</Shell>
			</Page>
		)
	}

	const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ')
	const displayName = fullName || lead.companyName || `Lead #${lead.number}`
	const badge = statusPalette[lead.status]
	const proposalUrl = lead.proposalId
		? `${import.meta.env.VITE_APP_URL}/proposal/preview/${lead.proposalId}`
		: null

	return (
		<Page>
			<Shell>
				<TopRow>
					<BackChip type='button' onClick={() => navigate('/leads/list')}>
						<span className='arrow'>
							<ArrowBackRounded sx={{ fontSize: 16 }} />
						</span>
						<span>Back to leads</span>
					</BackChip>

					<TopActions>
						<GhostButton
							type='button'
							onClick={() =>
								navigate(`/client-calls/add/?clientType=lead&clientId=${lead.id}`)
							}
						>
							<PhoneInTalkOutlined sx={{ fontSize: 18 }} />
							<span>Book a call</span>
						</GhostButton>
						<EditButton
							type='button'
							onClick={() => navigate(`/leads/edit/${lead.id}`)}
						>
							<EditOutlined />
							Edit lead
						</EditButton>
					</TopActions>
				</TopRow>

				<Header>
					<HeaderLeft>
						<HeaderIcon>
							{lead.clientType === 'company' ? <BusinessOutlined /> : <PersonOutlineRounded />}
						</HeaderIcon>
						<HeaderText>
							<HeaderName>{displayName}</HeaderName>
							{fullName && lead.companyName ? (
								<HeaderSub>@ {lead.companyName}</HeaderSub>
							) : null}
						</HeaderText>
					</HeaderLeft>

					<StatusBadge $bg={badge.bg} $fg={badge.fg} $border={badge.border}>
						<Dot $color={badge.fg} />
						{statusLabel[lead.status]}
					</StatusBadge>
				</Header>

				<Meta>
					<MetaCard $delay={0}>
						<MetaIcon>
							<PersonOutlineRounded />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Client type</MetaLabel>
							<MetaValue>
								{lead.clientType ? clientTypeLabel[lead.clientType] : '—'}
							</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={90}>
						<MetaIcon>
							<PaidOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Rate</MetaLabel>
							<MetaValue>{lead.rate != null ? `$${lead.rate} / hr` : '—'}</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={180}>
						<MetaIcon>
							<LocationOnOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Location</MetaLabel>
							<MetaValue>{lead.location || '—'}</MetaValue>
						</MetaText>
					</MetaCard>
				</Meta>

				<Section>
					<SectionHead>
						<SectionTitle>Timeline</SectionTitle>
						<SectionRule />
					</SectionHead>
					<TimelineGrid>
						<TimelineRow $delay={0}>
							<TLIcon $tone='info'>
								<ReplyRounded sx={{ fontSize: 18 }} />
							</TLIcon>
							<TLText>
								<TLLabel>Replied at</TLLabel>
								<TLValue>{formatDate(lead.repliedAt)}</TLValue>
							</TLText>
						</TimelineRow>
						<TimelineRow $delay={60}>
							<TLIcon $tone='success'>
								<CheckCircleOutlined sx={{ fontSize: 18 }} />
							</TLIcon>
							<TLText>
								<TLLabel>Accepted at</TLLabel>
								<TLValue>{lead.acceptedAt ? formatDate(lead.acceptedAt) : '—'}</TLValue>
							</TLText>
						</TimelineRow>
						<TimelineRow $delay={120}>
							<TLIcon $tone='warning'>
								<PauseCircleOutlined sx={{ fontSize: 18 }} />
							</TLIcon>
							<TLText>
								<TLLabel>Hold at</TLLabel>
								<TLValue>{lead.holdAt ? formatDate(lead.holdAt) : '—'}</TLValue>
							</TLText>
						</TimelineRow>
						<TimelineRow $delay={180}>
							<TLIcon $tone='muted'>
								<CalendarMonthOutlined sx={{ fontSize: 18 }} />
							</TLIcon>
							<TLText>
								<TLLabel>Created at</TLLabel>
								<TLValue>{formatDate(lead.createdAt)}</TLValue>
							</TLText>
						</TimelineRow>
					</TimelineGrid>
				</Section>

				{proposalUrl && (
					<Section>
						<SectionHead>
							<SectionTitle>Linked proposal</SectionTitle>
							<SectionRule />
						</SectionHead>
						<ProposalCard>
							<ProposalIcon>
								<LinkRounded />
							</ProposalIcon>
							<ProposalBody>
								<ProposalLabel>
									{lead.proposal?.title || 'Proposal'}
								</ProposalLabel>
								<ProposalUrl
									href={proposalUrl}
									target='_blank'
									rel='noopener noreferrer'
								>
									{proposalUrl}
								</ProposalUrl>
							</ProposalBody>
							<ProposalOpen
								href={proposalUrl}
								target='_blank'
								rel='noopener noreferrer'
								aria-label='Open proposal'
							>
								<OpenInNewRounded sx={{ fontSize: 16 }} />
							</ProposalOpen>
						</ProposalCard>
					</Section>
				)}
			</Shell>
		</Page>
	)
}

export default LeadPreview

/* ── Styled ─────────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const metaIn = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-6px); }
	to   { opacity: 1; transform: translateX(0); }
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	50%      { transform: translateY(-3px) rotate(-2deg); }
`

const iconIdle = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	20%      { transform: translateY(-2px) rotate(-4deg); }
	40%      { transform: translateY(1px) rotate(3deg); }
	60%      { transform: translateY(-1px) rotate(-2deg); }
	80%      { transform: translateY(0) rotate(1deg); }
`

const dotPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px transparent; }
`

const phoneRing = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	15%  { rotate: -18deg; translate: -1px 0; }
	30%  { rotate: 14deg; translate: 1px 0; }
	45%  { rotate: -12deg; translate: -1px 0; }
	60%  { rotate: 10deg; translate: 1px 0; }
	80%  { rotate: -6deg; translate: 0 0; }
	100% { rotate: 0deg; translate: 0 0; }
`

const editWiggle = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	25%  { rotate: -22deg; translate: -1px 2px; }
	55%  { rotate: 14deg; translate: 1px -1px; }
	80%  { rotate: -6deg; translate: 0 1px; }
	100% { rotate: 0deg; translate: 0 0; }
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

const GhostButton = styled.button`
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
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		transform-origin: 50% 65%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	&:hover:not(:disabled) svg {
		scale: 1.15;
		animation: ${phoneRing} 720ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`

const EditButton = styled(PrimarySolidButton)`
	svg {
		transform-origin: 30% 70%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.18;
		animation: ${editWiggle} 640ms cubic-bezier(0.22, 1, 0.36, 1);
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
	font-size: 26px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.15;
	text-transform: uppercase;
	word-break: break-word;

	@media (max-width: 767px) {
		font-size: 22px;
	}
`

const HeaderSub = styled.p`
	margin: 4px 0 0;
	font-size: 13.5px;
	font-weight: 500;
	color: ${INK_60};
	letter-spacing: 0.01em;
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

const Meta = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 18px;

	@media (max-width: 767px) {
		grid-template-columns: 1fr;
	}
`

const MetaCard = styled.div<{ $delay?: number }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 24px;
	padding: 24px 26px 22px;
	border-radius: 18px;
	background: #fff;
	border: 1px solid ${INK_10};
	overflow: hidden;
	min-height: 140px;
	animation: ${metaIn} 560ms cubic-bezier(0.22, 1, 0.36, 1) ${({ $delay }) => $delay ?? 0}ms both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const MetaIcon = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 14px;
	background: ${PRIMARY};
	color: #fff;
	box-shadow: 0 8px 20px -10px rgba(3, 105, 161, 0.55);
	flex-shrink: 0;
	z-index: 1;
	animation: ${iconIdle} 5.6s ease-in-out infinite;

	${MetaCard}:nth-child(2) & {
		animation-delay: 0.9s;
	}
	${MetaCard}:nth-child(3) & {
		animation-delay: 1.8s;
	}

	svg {
		font-size: 24px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const MetaText = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	z-index: 1;
`

const MetaLabel = styled.span`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
`

const MetaValue = styled.span`
	font-size: 18px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.15;
	word-break: break-word;
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

const TimelineGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px 16px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const tonePalette: Record<'info' | 'success' | 'warning' | 'muted', { bg: string; fg: string }> = {
	info: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY },
	success: { bg: 'rgba(34, 197, 94, 0.14)', fg: '#15803d' },
	warning: { bg: 'rgba(245, 158, 11, 0.16)', fg: '#a26608' },
	muted: { bg: INK_04, fg: INK_60 },
}

const TimelineRow = styled.div<{ $delay?: number }>`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${INK_10};
	animation: ${rowIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) ${({ $delay }) => $delay ?? 0}ms both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const TLIcon = styled.span<{ $tone: 'info' | 'success' | 'warning' | 'muted' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 9px;
	background: ${({ $tone }) => tonePalette[$tone].bg};
	color: ${({ $tone }) => tonePalette[$tone].fg};
	flex-shrink: 0;
`

const TLText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const TLLabel = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: ${INK_45};
`

const TLValue = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${INK};
	letter-spacing: -0.005em;
`

const ProposalCard = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 14px;
	background: linear-gradient(135deg, ${PRIMARY_TINT} 0%, #ffffff 55%, ${PRIMARY_TINT} 130%);
	background-size: 200% 200%;
	border: 1px solid ${PRIMARY_TINT_STRONG};
	animation: proposalShift 8s ease-in-out infinite;

	@keyframes proposalShift {
		0%, 100% { background-position: 0% 50%; }
		50%      { background-position: 100% 50%; }
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const ProposalIcon = styled.span`
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

	svg {
		font-size: 22px;
	}
`

const ProposalBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
`

const ProposalLabel = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.005em;
`

const ProposalUrl = styled.a`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${PRIMARY};
	text-decoration: none;
	word-break: break-all;

	&:hover {
		text-decoration: underline;
	}
`

const ProposalOpen = styled.a`
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
	text-decoration: none;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		transform: translateY(-1px);
	}
`
