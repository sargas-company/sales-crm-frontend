import { memo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	AccessTimeOutlined,
	ArrowBackRounded,
	CalendarMonthOutlined,
	CancelOutlined,
	DeleteOutline,
	EditCalendarOutlined,
	HourglassEmptyOutlined,
	NotesOutlined,
	PhoneInTalkOutlined,
	PublicOutlined,
	VideoCallOutlined,
	OpenInNewRounded,
	SummarizeOutlined,
	AutoAwesomeOutlined,
} from '@mui/icons-material'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { useGetClientCallByIdQuery } from '../../../store/clientCalls/clientCallsApi'
import ClientCallDeleteModal from '../../../components/client-call/list/ProposalDeleteModal'
import ClientCallCancelModal from '../../../components/client-call/preview/ClientCallCancelModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { formatDate } from '../../../utils/formatDate'
import type { ClientCallStatus } from '../../../store/clientCalls/types/definition'

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
const DANGER_BG = 'rgba(239, 68, 68, 0.10)'
const DANGER_BORDER = 'rgba(239, 68, 68, 0.28)'

/* ── Static maps ────────────────────────────────────────────────── */

const statusLabel: Record<ClientCallStatus, string> = {
	scheduled: 'Scheduled',
	completed: 'Completed',
	cancelled: 'Cancelled',
}

const statusPalette: Record<ClientCallStatus, { bg: string; fg: string; border: string }> = {
	scheduled: {
		bg: PRIMARY_TINT_STRONG,
		fg: PRIMARY,
		border: 'rgba(3, 105, 161, 0.32)',
	},
	completed: {
		bg: 'rgba(34, 197, 94, 0.14)',
		fg: '#15803d',
		border: 'rgba(34, 197, 94, 0.32)',
	},
	cancelled: {
		bg: 'rgba(239, 68, 68, 0.12)',
		fg: DANGER,
		border: 'rgba(239, 68, 68, 0.32)',
	},
}

/* ── Local formatter ─────────────────────────────────────────────── */

const formatCallDateTime = (str: string | null | undefined): string => {
	if (!str) return '—'
	const [datePart, timePart] = str.split(' ')
	if (!datePart || !timePart) return str
	const [year, month, day] = datePart.split('-').map(Number)
	const [hour, minute] = timePart.split(':').map(Number)
	const date = new Date(year, month - 1, day, hour, minute)
	const dateStr = date.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
	const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
	return `${dateStr} · ${timeStr}`
}

/* ── Component ──────────────────────────────────────────────────── */

const ClientCallPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showCancelModal, setShowCancelModal] = useState(false)

	const {
		data: call,
		isLoading,
		isError,
	} = useGetClientCallByIdQuery(id ?? '', { skip: !id })

	if (isLoading) {
		return (
			<Page>
				<Shell>
					<Center>
						<Loading label='Loading call…' />
					</Center>
				</Shell>
			</Page>
		)
	}

	if (isError || !call) {
		return (
			<Page>
				<Shell>
					<Center>
						<ErrorState title='Call not found' description='Could not load client call.' />
					</Center>
				</Shell>
			</Page>
		)
	}

	const clientName = call.lead
		? [call.lead.firstName, call.lead.lastName].filter(Boolean).join(' ') ||
			call.lead.companyName ||
			'—'
		: call.clientRequest?.name || call.clientRequest?.company || '—'
	const sourceLabel = call.clientType === 'lead' ? 'Lead' : 'Client request'
	const badge = statusPalette[call.status]
	const canReschedule = call.status === 'scheduled'

	return (
		<Page>
			<Shell>
				<TopRow>
					<BackChip type='button' onClick={() => navigate('/client-calls/list')}>
						<span className='arrow'>
							<ArrowBackRounded sx={{ fontSize: 16 }} />
						</span>
						<span>Back to calls</span>
					</BackChip>

					<TopActions>
						<PermissionGate permission='client_calls:delete'>
							<DangerGhostButton type='button' onClick={() => setShowDeleteModal(true)}>
								<DeleteOutline sx={{ fontSize: 18 }} />
								<span>Delete</span>
							</DangerGhostButton>
						</PermissionGate>
						{canReschedule && (
							<PermissionGate permission='client_calls:update'>
								<DangerGhostButton type='button' onClick={() => setShowCancelModal(true)}>
									<CancelOutlined sx={{ fontSize: 18 }} />
									<span>Cancel call</span>
								</DangerGhostButton>
							</PermissionGate>
						)}
						{canReschedule && (
							<PermissionGate permission='client_calls:update'>
								<ReschedButton
									type='button'
									onClick={() => navigate(`/client-calls/edit/${call.id}`)}
								>
									<EditCalendarOutlined />
									Reschedule
								</ReschedButton>
							</PermissionGate>
						)}
					</TopActions>
				</TopRow>

				<Header>
					<HeaderLeft>
						<HeaderIcon>
							<PhoneInTalkOutlined />
						</HeaderIcon>
						<HeaderText>
							<HeaderName>{call.callTitle}</HeaderName>
							<HeaderSub>
								{clientName} <Bullet>·</Bullet> {sourceLabel}
							</HeaderSub>
						</HeaderText>
					</HeaderLeft>

					<StatusBadge $bg={badge.bg} $fg={badge.fg} $border={badge.border}>
						<Dot $color={badge.fg} />
						{statusLabel[call.status]}
					</StatusBadge>
				</Header>

				<Meta>
					<MetaCard $delay={0}>
						<MetaIcon>
							<HourglassEmptyOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Duration</MetaLabel>
							<MetaValue>{call.duration} min</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={90}>
						<MetaIcon>
							<PublicOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Client TZ</MetaLabel>
							<MetaValue>{call.clientTimezone}</MetaValue>
						</MetaText>
					</MetaCard>
					<MetaCard $delay={180}>
						<MetaIcon>
							<CalendarMonthOutlined />
						</MetaIcon>
						<MetaText>
							<MetaLabel>Created</MetaLabel>
							<MetaValue>{formatDate(call.createdAt)}</MetaValue>
						</MetaText>
					</MetaCard>
				</Meta>

				<Section>
					<SectionHead>
						<SectionTitle>Time conversion</SectionTitle>
						<SectionRule />
					</SectionHead>
					<TimeBox>
						<TimeRow>
							<TimeTile>
								<AccessTimeOutlined sx={{ fontSize: 18 }} />
							</TimeTile>
							<TimeMeta>
								<TimeLabel>Client</TimeLabel>
								<TimeValue>
									{formatCallDateTime(call.clientDateTime)} · {call.clientTimezone}
								</TimeValue>
							</TimeMeta>
						</TimeRow>
						<TimeRow>
							<TimeTile>
								<AccessTimeOutlined sx={{ fontSize: 18 }} />
							</TimeTile>
							<TimeMeta>
								<TimeLabel>You</TimeLabel>
								<TimeValue>{formatCallDateTime(call.kyivDateTime)} · Kyiv</TimeValue>
							</TimeMeta>
						</TimeRow>
					</TimeBox>
				</Section>

				{call.meetingUrl ? (
					<Section>
						<SectionHead>
							<SectionTitle>Meeting link</SectionTitle>
							<SectionRule />
						</SectionHead>
						<LinkCard>
							<LinkIcon>
								<VideoCallOutlined />
							</LinkIcon>
							<LinkBody>
								<LinkLabel>Join call</LinkLabel>
								<LinkUrl
									href={call.meetingUrl}
									target='_blank'
									rel='noopener noreferrer'
								>
									{call.meetingUrl}
								</LinkUrl>
							</LinkBody>
							<LinkOpen
								href={call.meetingUrl}
								target='_blank'
								rel='noopener noreferrer'
								aria-label='Open meeting'
							>
								<OpenInNewRounded sx={{ fontSize: 16 }} />
							</LinkOpen>
						</LinkCard>
					</Section>
				) : null}

				{call.notes ? (
					<Section>
						<SectionHead>
							<SectionTitle>Notes</SectionTitle>
							<SectionRule />
						</SectionHead>
						<TextCard>
							<TextIcon $tone='muted'>
								<NotesOutlined sx={{ fontSize: 18 }} />
							</TextIcon>
							<TextBody>{call.notes}</TextBody>
						</TextCard>
					</Section>
				) : null}

				{call.summary ? (
					<Section>
						<SectionHead>
							<SectionTitle>Summary</SectionTitle>
							<SectionRule />
						</SectionHead>
						<TextCard>
							<TextIcon $tone='info'>
								<SummarizeOutlined sx={{ fontSize: 18 }} />
							</TextIcon>
							<TextBody>{call.summary}</TextBody>
						</TextCard>
					</Section>
				) : null}

				{call.aiSummary ? (
					<Section>
						<SectionHead>
							<SectionTitle>AI summary</SectionTitle>
							<SectionRule />
						</SectionHead>
						<TextCard>
							<TextIcon $tone='ai'>
								<AutoAwesomeOutlined sx={{ fontSize: 18 }} />
							</TextIcon>
							<TextBody>{call.aiSummary}</TextBody>
						</TextCard>
					</Section>
				) : null}
			</Shell>

			{showDeleteModal && (
				<ClientCallDeleteModal
					id={call.id}
					title={call.callTitle}
					onClose={() => setShowDeleteModal(false)}
					onSuccess={() => navigate('/client-calls/list/')}
				/>
			)}

			{showCancelModal && (
				<ClientCallCancelModal
					id={call.id}
					title={call.callTitle}
					onClose={() => setShowCancelModal(false)}
					onSuccess={() => {}}
				/>
			)}
		</Page>
	)
}

export default memo(ClientCallPreview)

/* ── Styled ─────────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const metaIn = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
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

const trashShake = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	20%  { rotate: -12deg; translate: -1px 0; }
	40%  { rotate: 10deg; translate: 1px 0; }
	60%  { rotate: -8deg; translate: -1px 0; }
	80%  { rotate: 6deg; translate: 1px 0; }
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

const DangerGhostButton = styled.button`
	appearance: none;
	background: #fff;
	border: 1px solid ${DANGER_BORDER};
	border-radius: 12px;
	padding: 10px 16px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${DANGER};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 600;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition:
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
		background 160ms ease;

	svg {
		transform-origin: 50% 55%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		background: ${DANGER_BG};
	}
	&:hover:not(:disabled) svg {
		scale: 1.15;
		animation: ${trashShake} 640ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`

const ReschedButton = styled(PrimarySolidButton)`
	svg {
		transform-origin: 40% 60%;
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
	animation: ${phoneRing} 3.8s ease-in-out infinite;

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

const TimeBox = styled.div`
	position: relative;
	padding: 20px 22px;
	border-radius: 14px;
	background: linear-gradient(135deg, ${PRIMARY_TINT} 0%, #ffffff 60%, ${PRIMARY_TINT} 130%);
	background-size: 200% 200%;
	border: 1px solid ${PRIMARY_TINT_STRONG};
	overflow: hidden;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px 32px;
	animation: timeBoxShift 6s ease-in-out infinite;

	@keyframes timeBoxShift {
		0%, 100% { background-position: 0% 50%; }
		50%      { background-position: 100% 50%; }
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const TimeRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
`

const TimeTile = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	background: #fff;
	border: 1px solid ${PRIMARY_TINT_STRONG};
	color: ${PRIMARY};
	flex-shrink: 0;
	box-shadow: 0 4px 12px -6px rgba(3, 105, 161, 0.35);
`

const TimeMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const TimeLabel = styled.span`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${PRIMARY};
`

const TimeValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 14px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.005em;
	word-break: break-word;
`

const LinkCard = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
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

const LinkOpen = styled.a`
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

const textTonePalette: Record<'muted' | 'info' | 'ai', { bg: string; fg: string }> = {
	muted: { bg: INK_04, fg: INK_60 },
	info: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY },
	ai: { bg: 'rgba(139, 92, 246, 0.14)', fg: '#6d28d9' },
}

const TextCard = styled.div`
	display: flex;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${INK_10};
`

const TextIcon = styled.span<{ $tone: 'muted' | 'info' | 'ai' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	background: ${({ $tone }) => textTonePalette[$tone].bg};
	color: ${({ $tone }) => textTonePalette[$tone].fg};
	flex-shrink: 0;
`

const TextBody = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
	flex: 1;
`
