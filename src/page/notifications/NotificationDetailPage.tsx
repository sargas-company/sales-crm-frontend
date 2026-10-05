import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	ContentCopyRounded,
	ErrorOutlineOutlined,
	ExpandMoreRounded,
	InfoOutlined,
	NorthEastRounded,
	NotificationsNoneOutlined,
	ScheduleRounded,
	WarningAmberOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	useGetAttentionQuery,
	type AttentionItem,
	type AttentionSeverity,
} from '../../store/attention/attentionApi'

const severityIcon = (s: AttentionSeverity) =>
	s === 'critical' ? (
		<ErrorOutlineOutlined />
	) : s === 'warn' ? (
		<WarningAmberOutlined />
	) : (
		<InfoOutlined />
	)

const relTime = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime()
	if (diff < 0) return 'in the future'
	const s = Math.floor(diff / 1000)
	if (s < 60) return `${s}s ago`
	const m = Math.floor(s / 60)
	if (m < 60) return `${m}m ago`
	const h = Math.floor(m / 60)
	if (h < 24) return `${h}h ago`
	const d = Math.floor(h / 24)
	return `${d}d ago`
}

const NotificationDetailPage = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { data, isLoading } = useGetAttentionQuery(undefined, {
		pollingInterval: 120_000,
	})
	const [showRaw, setShowRaw] = useState(true)

	if (!id) {
		return (
			<Shell>
				<ErrorBox onBack={() => navigate(-1)} message='Missing notification id' />
			</Shell>
		)
	}
	if (isLoading && !data) {
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
					<Loading>fetching notification…</Loading>
				</Terminal>
			</Shell>
		)
	}

	const item: AttentionItem | undefined = data?.items.find(
		(x) => x.id === id,
	)

	if (!item) {
		return (
			<Shell>
				<ErrorBox
					onBack={() => navigate('/notifications/list')}
					message='Notification not found or already resolved'
				/>
			</Shell>
		)
	}

	const occurredDate = new Date(item.createdAt)
	const dateStr = occurredDate.toLocaleDateString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
	const timeStr = occurredDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})

	const slug = (item.title || 'notification')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40)
	const termPath = `attention@sargas:~/notifications/${item.category}/${slug}`

	const copyId = () => {
		navigator.clipboard?.writeText(item.id)
	}

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
						<CopyIdBtn
							type='button'
							onClick={copyId}
							title='Copy notification ID'
						>
							<ContentCopyRounded style={{ fontSize: 12 }} />
							{item.id.slice(0, 8)}
						</CopyIdBtn>
					</TermHeaderActions>
				</TermHeader>

				<TermBody>
					<TermPromptLine>
						<TermPrompt>$</TermPrompt> cat notification --id{' '}
						{item.id.slice(0, 8)}
					</TermPromptLine>

					<HeroRow>
						<HeroIcon $sev={item.severity}>
							{severityIcon(item.severity)}
						</HeroIcon>
						<HeroText>
							<Hero>{item.title}</Hero>
							<HeroMeta>
								<ScheduleRounded style={{ fontSize: 13 }} />
								<span>{dateStr}</span>
								<Sep>·</Sep>
								<span>{timeStr}</span>
								<Sep>·</Sep>
								<span>{relTime(item.createdAt)}</span>
							</HeroMeta>
						</HeroText>
					</HeroRow>

					<KeyLines>
						<KV label='severity'>
							<SevPill $sev={item.severity}>
								{item.severity}
							</SevPill>
						</KV>
						<KV label='category'>
							<KvMono>{item.category}</KvMono>
						</KV>
						<KV label='raised'>
							<KvMono>
								{dateStr} {timeStr}
								<KvFade> · {relTime(item.createdAt)}</KvFade>
							</KvMono>
						</KV>
						{item.description && (
							<KV label='details'>
								<KvValue>{item.description}</KvValue>
							</KV>
						)}
						{item.action && (
							<KV label='action'>
								<ActionLink to={item.action.route}>
									{item.action.label}
									<NorthEastRounded style={{ fontSize: 13 }} />
								</ActionLink>
							</KV>
						)}
						<KV label='id'>
							<KvMono>{item.id}</KvMono>
						</KV>
					</KeyLines>

					<Divider />

					<RawToggle
						type='button'
						$open={showRaw}
						onClick={() => setShowRaw((v) => !v)}
					>
						<TermPrompt>$</TermPrompt>
						<span>{showRaw ? 'hide' : 'show'} raw.json</span>
						<ExpandMoreRounded className='chev' />
					</RawToggle>
					{showRaw && (
						<RawBlock>
							<pre>{JSON.stringify(item, null, 2)}</pre>
						</RawBlock>
					)}
				</TermBody>

				<TermFooter>
					notification · {dateStr} {timeStr} · {item.id}
					<TermCursor />
				</TermFooter>
			</Terminal>
		</Shell>
	)
}

export default NotificationDetailPage

/* ─── Reusable row ─────────────────────────────────────────────── */

const KV = ({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) => (
	<KvRow>
		<KvArrow>→</KvArrow>
		<KvLabel>{label}</KvLabel>
		<KvValue>{children}</KvValue>
	</KvRow>
)

/* ─── Shell wrapper ─────────────────────────────────────────────── */

const Shell = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate()
	return (
		<ListPageShell
			crumbs={[
				{ label: 'Workspace' },
				{ label: 'Notifications', href: '/notifications/list' },
				{ label: 'Detail', current: true },
			]}
			icon={<NotificationsNoneOutlined />}
			title='Notification'
			subtitle='Attention item — the specific signal, when it was raised and the next step.'
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

const ErrorBox = ({
	onBack,
	message,
}: {
	onBack: () => void
	message: string
}) => (
	<Terminal>
		<TermHeader>
			<TermDots>
				<span className='r' />
				<span className='y' />
				<span className='g' />
			</TermDots>
			<TermPath>attention@sargas:~/notifications/error</TermPath>
		</TermHeader>
		<Loading>
			<WarningAmberOutlined style={{ fontSize: 16, marginRight: 6 }} />
			{message}
		</Loading>
		<TermFooter>
			<BackBtn type='button' onClick={onBack}>
				<ArrowBackRounded style={{ fontSize: 16 }} />
				Back
			</BackBtn>
		</TermFooter>
	</Terminal>
)

/* ─── Styles (mirror AuditEventPage terminal card) ─────────────── */

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
	gap: 6px;
`

const CopyIdBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 9px;
	border-radius: 6px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 600;
	color: ${T.textSecondary};
	cursor: pointer;
	transition: border-color 160ms ease, color 160ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
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

/* ─── Hero ──────────────────────────────────────────────────── */

const HeroRow = styled.div`
	display: grid;
	grid-template-columns: 44px 1fr;
	gap: 14px;
	align-items: flex-start;
`

const HeroIcon = styled.div<{ $sev: AttentionSeverity }>`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${(p) =>
		p.$sev === 'critical'
			? 'rgba(220, 38, 38, 0.1)'
			: p.$sev === 'warn'
				? 'rgba(232, 93, 47, 0.12)'
				: 'rgba(3, 105, 161, 0.1)'};
	color: ${(p) =>
		p.$sev === 'critical'
			? '#c2410c'
			: p.$sev === 'warn'
				? '#e85d2f'
				: '#0369a1'};

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

/* ─── Key-value lines ───────────────────────────────────────── */

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

	&:nth-child(1)  { animation-delay: 60ms; }
	&:nth-child(2)  { animation-delay: 110ms; }
	&:nth-child(3)  { animation-delay: 160ms; }
	&:nth-child(4)  { animation-delay: 210ms; }
	&:nth-child(5)  { animation-delay: 260ms; }
	&:nth-child(6)  { animation-delay: 310ms; }
	&:nth-child(7)  { animation-delay: 360ms; }
	&:nth-child(8)  { animation-delay: 410ms; }

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

	@media (prefers-reduced-motion: reduce) {
		animation: none;
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

const KvFade = styled.span`
	color: ${T.textMuted};
	font-size: 12.5px;
	margin-left: 2px;
`

const SevPill = styled.span<{ $sev: AttentionSeverity }>`
	display: inline-flex;
	padding: 3px 11px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	color: ${(p) =>
		p.$sev === 'critical'
			? '#c2410c'
			: p.$sev === 'warn'
				? '#e85d2f'
				: '#0369a1'};
	background: ${(p) =>
		p.$sev === 'critical'
			? 'rgba(220, 38, 38, 0.1)'
			: p.$sev === 'warn'
				? 'rgba(232, 93, 47, 0.12)'
				: 'rgba(3, 105, 161, 0.1)'};
`

const ActionLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	color: ${T.primary};
	text-decoration: none;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 700;

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover {
		text-decoration: underline;
	}
	&:hover svg {
		transform: translate(2px, -2px);
	}
`

/* ─── Divider / raw ─────────────────────────────────────────── */

const Divider = styled.div`
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	margin: 6px 0;
`

const RawToggle = styled.button<{ $open: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 2px 0;
	border: 0;
	background: transparent;
	color: ${T.textSecondary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	cursor: pointer;
	align-self: flex-start;

	.chev {
		font-size: 16px;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
		transform: rotate(${(p) => (p.$open ? '180deg' : '0deg')});
	}

	&:hover {
		color: ${T.primary};
	}
`

const RawBlock = styled.div`
	padding: 12px 14px;
	border-radius: 10px;
	background: #0f172a;
	color: #e2e8f0;
	overflow-x: auto;

	pre {
		margin: 0;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12px;
		line-height: 1.55;
		white-space: pre;
	}
`

/* ─── Footer ─────────────────────────────────────────────────── */

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

const Loading = styled.div`
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
	transition: border-color 180ms ease, color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
