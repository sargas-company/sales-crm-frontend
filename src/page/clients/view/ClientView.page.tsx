import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	EditOutlined,
	PhoneInTalkOutlined,
	ContactsOutlined,
	ScheduleRounded,
	WarningAmberRounded,
} from '@mui/icons-material'

import { T } from '../../../components/sales-analytics/_shared/tokens'
import ListPageShell from '../../../components/_shared/ListPageShell/ListPageShell'
import Loading from '../../../ui/state/Loading'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	PrimaryGhostButton,
	PrimarySolidButton,
} from '../../../components/_shared/formShell.styled'
import {
	useGetClientActivityQuery,
	useGetClientByIdQuery,
	type ApiClientStatus,
} from '../../../store/clients/clientsApi'
import ActivityTimeline, {
	ActivityHeading,
} from '../../../components/_shared/ActivityTimeline'
import AttachmentsSection from '../../../components/_shared/AttachmentsSection'
import { locationFlag } from '../../../utils/location'
import { formatDate } from '../../../utils/format'

const STATUS_LABEL: Record<ApiClientStatus, string> = {
	ACTIVE: 'active',
	ON_HOLD: 'on hold',
	FORMER: 'former',
}

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40) || 'client'

const ClientView = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()

	const {
		data: client,
		isLoading,
		isError,
	} = useGetClientByIdQuery(id ?? '', { skip: !id })
	const {
		data: activity,
		isLoading: activityLoading,
		isError: activityError,
	} = useGetClientActivityQuery(id ?? '', { skip: !id })

	if (!id) {
		return (
			<Shell>
				<ErrorBox onBack={() => navigate(-1)} message='Missing client id' />
			</Shell>
		)
	}
	if (isLoading && !client) {
		return (
			<Shell>
				<Terminal>
					<TermHeader>
						<TermDots>
							<span className='r' />
							<span className='y' />
							<span className='g' />
						</TermDots>
						<TermPath>loading…</TermPath>
					</TermHeader>
					<LoadingBlock>
						<Loading label='fetching client…' />
					</LoadingBlock>
				</Terminal>
			</Shell>
		)
	}
	if (isError || !client) {
		return (
			<Shell>
				<ErrorBox
					onBack={() => navigate('/clients/list/')}
					message='Client not found'
				/>
			</Shell>
		)
	}

	const fullName = [client.firstName, client.lastName]
		.filter(Boolean)
		.join(' ')
		.trim()
	const displayName = fullName || client.company || `Client #${client.number}`
	const createdStr = formatDate(client.createdAt, 'short')
	const updatedStr = formatDate(client.updatedAt, 'short')
	const sameTs = client.createdAt === client.updatedAt
	const termPath = `crm@sargas:~/clients/${STATUS_LABEL[client.status].replace(
		/\s+/g,
		'-',
	)}/${slugify(fullName || client.company || `client-${client.number}`)}`

	return (
		<Shell>
			<Terminal>
				<TermHeader>
					<TermDots>
						<span
							className='r'
							role='button'
							aria-label='Close'
							onClick={() => navigate(-1)}
						/>
						<span className='y' />
						<span className='g' />
					</TermDots>
					<TermPath>{termPath}</TermPath>
					<TermHeaderActions>
						<CallGhost
							type='button'
							onClick={() =>
								navigate(
									`/client-calls/add/?clientType=client&clientId=${client.id}`,
								)
							}
						>
							<PhoneInTalkOutlined />
							<span>Book a call</span>
						</CallGhost>
						<PermissionGate permission='clients:update'>
							<EditSolid
								type='button'
								onClick={() => navigate(`/clients/edit/${client.id}`)}
							>
								<EditOutlined />
								<span>Edit</span>
							</EditSolid>
						</PermissionGate>
					</TermHeaderActions>
				</TermHeader>

				<TermBody>
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> cat client --id {client.id.slice(0, 8)}
					</TermPromptLine>

					<HeroRow>
						<HeroIcon>
							<ContactsOutlined />
						</HeroIcon>
						<HeroText>
							<Hero>{displayName}</Hero>
							<HeroMeta>
								<KvMono>#{client.number}</KvMono>
								<Sep>·</Sep>
								<ScheduleRounded style={{ fontSize: 13 }} />
								<span>received {createdStr}</span>
								{client.company && (
									<>
										<Sep>·</Sep>
										<span>{client.company}</span>
									</>
								)}
							</HeroMeta>
						</HeroText>
					</HeroRow>

					<KeyLines>
						<KV label='name'>
							<KvMono>{fullName || '—'}</KvMono>
						</KV>
						<KV label='company'>
							<KvMono>{client.company || '—'}</KvMono>
						</KV>
						<KV label='email'>
							{client.email ? (
								<KvLink href={`mailto:${client.email}`}>{client.email}</KvLink>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='phone'>
							{client.phone ? (
								<KvLink href={`tel:${client.phone}`}>{client.phone}</KvLink>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='source'>
							{client.source ? <Chip>{client.source}</Chip> : <KvMono>—</KvMono>}
						</KV>
						<KV label='platform'>
							<KvMono>{client.platform?.title || '—'}</KvMono>
						</KV>
						<KV label='location'>
							{client.location ? (
								<LocationLine>
									{locationFlag(client.location) ? (
										<span className='flag'>{locationFlag(client.location)}</span>
									) : null}
									<span>{client.location}</span>
								</LocationLine>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='status'>
							<StatusTag $status={client.status}>
								{STATUS_LABEL[client.status]}
							</StatusTag>
						</KV>
						<KV label='client since'>
							<KvMono>
								{client.clientSince ? client.clientSince.slice(0, 10) : '—'}
							</KvMono>
						</KV>
						<KV label='profile'>
							{client.profileUrl ? (
								<KvLink
									href={client.profileUrl}
									target='_blank'
									rel='noopener noreferrer'
								>
									{client.profileUrl}
								</KvLink>
							) : (
								<KvMono>—</KvMono>
							)}
						</KV>
						<KV label='created'>
							<KvMono>{createdStr}</KvMono>
						</KV>
						{!sameTs && (
							<KV label='updated'>
								<KvMono>{updatedStr}</KvMono>
							</KV>
						)}
						<KV label='id'>
							<KvMono>{client.id}</KvMono>
						</KV>
					</KeyLines>

					<Divider />
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> cat notes.txt
					</TermPromptLine>
					<RawBlock>
						<pre>{client.notes?.trim() || '(empty — no notes recorded)'}</pre>
					</RawBlock>

					<Divider />
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> ls attachments/
					</TermPromptLine>
					<SectionShell>
						<AttachmentsSection ownerType='client' ownerId={client.id} />
					</SectionShell>

					<Divider />
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> tail activity.log
					</TermPromptLine>
					<SectionShell>
						<ActivityHeading />
						<ActivityTimeline
							events={activity}
							isLoading={activityLoading}
							isError={activityError}
							emptyLabel='No activity recorded for this client yet.'
						/>
					</SectionShell>
				</TermBody>

				<TermFooter>
					client · {createdStr} · {client.id}
					<TermCursor />
				</TermFooter>
			</Terminal>
		</Shell>
	)
}

export default ClientView

/* ─── KV row ───────────────────────────────────────────────────── */

const KV = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<KvRow>
		<KvArrow>→</KvArrow>
		<KvLabel>{label}</KvLabel>
		<KvValue>{children}</KvValue>
	</KvRow>
)

/* ─── Outer shell with the standard ListPageShell navigation ───── */

const Shell = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate()
	return (
		<ListPageShell
			crumbs={[
				{ label: 'Sales' },
				{ label: 'Clients', href: '/clients/list/' },
				{ label: 'Preview', current: true },
			]}
			icon={<ContactsOutlined />}
			title='Client'
			subtitle='Client card — contact, pipeline, attachments and activity.'
			action={
				<BackBtn type='button' onClick={() => navigate(-1)}>
					<ArrowBackRounded style={{ fontSize: 16 }} />
					Back
				</BackBtn>
			}
		>
			{children}
		</ListPageShell>
	)
}

const ErrorBox = ({ onBack, message }: { onBack: () => void; message: string }) => (
	<Terminal>
		<TermHeader>
			<TermDots>
				<span className='r' />
				<span className='y' />
				<span className='g' />
			</TermDots>
			<TermPath>crm@sargas:~/clients/error</TermPath>
		</TermHeader>
		<LoadingBlock>
			<WarningAmberRounded style={{ fontSize: 16, marginRight: 6 }} />
			{message}
		</LoadingBlock>
		<TermFooter>
			<BackBtn type='button' onClick={onBack}>
				<ArrowBackRounded style={{ fontSize: 16 }} />
				Back
			</BackBtn>
		</TermFooter>
	</Terminal>
)

/* ─── Styles (mirror of ClientRequestPreview / LeadPreview) ───── */

const terminalIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-6px); }
	to   { opacity: 1; transform: translateX(0); }
`

const cursorBlink = keyframes`
	0%, 50% { opacity: 1; }
	51%, 100% { opacity: 0; }
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

const Terminal = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	padding: 16px 22px 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.03),
		0 8px 24px rgba(15, 23, 42, 0.04);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	animation: ${terminalIn} 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const TermHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 14px;
	padding-bottom: 12px;
	border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
	flex-wrap: wrap;
`

const TermDots = styled.div`
	display: inline-flex;
	gap: 6px;
	flex-shrink: 0;

	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.r {
		background: #f87171;
		cursor: pointer;
		transition: filter 140ms ease;
	}
	.r:hover {
		filter: brightness(0.9);
	}
	.y {
		background: #fbbf24;
	}
	.g {
		background: #4ade80;
	}
`

const TermPath = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const TermHeaderActions = styled.div`
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-shrink: 0;
`

const EditSolid = styled(PrimarySolidButton)`
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

const CallGhost = styled(PrimaryGhostButton)`
	svg {
		transform-origin: 50% 65%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.15;
		animation: ${phoneRing} 720ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`

const TermBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const TermPromptLine = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const TermPrompt = styled.span`
	color: ${T.primary};
	font-weight: 700;
`

const HeroRow = styled.div`
	display: grid;
	grid-template-columns: 44px 1fr;
	gap: 14px;
	align-items: flex-start;
`

const HeroIcon = styled.div`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(3, 105, 161, 0.1);
	color: ${T.primary};

	svg {
		font-size: 22px;
	}
`

const HeroText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5px;
`

const Hero = styled.h2`
	margin: 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 18.5px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.35;
	letter-spacing: -0.1px;
	word-break: break-word;
`

const HeroMeta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	flex-wrap: wrap;

	svg {
		color: ${T.textMuted};
	}
`

const Sep = styled.span`
	opacity: 0.5;
`

const KeyLines = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const KvRow = styled.div`
	display: grid;
	grid-template-columns: 14px 110px 1fr;
	gap: 10px;
	padding: 6px 0;
	align-items: center;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	transition: background 160ms;
	animation: ${rowIn} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:last-child {
		border-bottom: none;
	}
	&:hover {
		background: rgba(3, 105, 161, 0.03);
		border-radius: 6px;
		padding-left: 6px;
		padding-right: 6px;
		margin-left: -6px;
		margin-right: -6px;
	}
`

const KvArrow = styled.span`
	color: ${T.primary};
	font-weight: 700;
	font-size: 14px;
`

const KvLabel = styled.span`
	color: ${T.textMuted};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	letter-spacing: 0.4px;
`

const KvValue = styled.span`
	min-width: 0;
	font-size: 13.5px;
	color: ${T.textStrong};
	word-break: break-word;
`

const KvMono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	color: ${T.textStrong};
	word-break: break-all;
`

const KvLink = styled.a`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 600;
	color: ${T.primary};
	text-decoration: none;
	word-break: break-all;

	&:hover {
		text-decoration: underline;
	}
`

const Chip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 600;
	letter-spacing: 0.2px;
`

const LocationLine = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	color: ${T.textStrong};

	.flag {
		font-size: 16px;
		line-height: 1;
	}
`

const StatusTag = styled.span<{ $status: ApiClientStatus }>`
	display: inline-flex;
	padding: 3px 11px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	color: ${(p) =>
		p.$status === 'ACTIVE'
			? '#15803d'
			: p.$status === 'ON_HOLD'
				? '#a26608'
				: '#475569'};
	background: ${(p) =>
		p.$status === 'ACTIVE'
			? 'rgba(34, 197, 94, 0.14)'
			: p.$status === 'ON_HOLD'
				? 'rgba(245, 158, 11, 0.14)'
				: 'rgba(148, 163, 184, 0.18)'};
`

const Divider = styled.div`
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	margin: 6px 0;
`

const RawBlock = styled.div`
	padding: 14px 16px;
	border-radius: 10px;
	background: #0f172a;
	color: #e2e8f0;
	overflow-x: auto;

	pre {
		margin: 0;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12.5px;
		line-height: 1.65;
		white-space: pre-wrap;
		word-break: break-word;
	}
`

const SectionShell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const TermFooter = styled.div`
	margin-top: 14px;
	padding-top: 10px;
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	display: inline-flex;
	align-items: center;
	gap: 4px;
`

const TermCursor = styled.span`
	display: inline-block;
	width: 7px;
	height: 11px;
	background: ${T.primary};
	margin-left: 6px;
	vertical-align: middle;
	animation: ${cursorBlink} 1s steps(2) infinite;
`

const LoadingBlock = styled.div`
	padding: 18px 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	color: ${T.textSecondary};
	display: inline-flex;
	align-items: center;
`

const BackBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition:
		border-color 180ms ease,
		color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
