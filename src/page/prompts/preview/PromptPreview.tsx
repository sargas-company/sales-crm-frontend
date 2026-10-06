import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	AutoAwesomeOutlined,
	BoltRounded,
	EditOutlined,
	ScheduleRounded,
	WarningAmberRounded,
} from '@mui/icons-material'

import { T } from '../../../components/sales-analytics/_shared/tokens'
import ListPageShell from '../../../components/_shared/ListPageShell/ListPageShell'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useActivatePromptMutation, useGetPromptByIdQuery } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

const TYPE_LABEL: Record<string, string> = {
	JOB_GATEKEEPER: 'Gatekeeper',
	JOB_EVALUATION: 'Evaluation',
}

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40) || 'prompt'

const PromptPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { showToast } = useToast()

	const {
		data: prompt,
		isLoading,
		isError,
		refetch,
	} = useGetPromptByIdQuery(id ?? '', { skip: !id })
	const [activatePrompt, { isLoading: isActivating }] = useActivatePromptMutation()

	const handleActivate = async () => {
		if (!id) return
		try {
			await activatePrompt(id).unwrap()
			showToast('Prompt activated successfully', 'success')
			refetch()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	if (!id) {
		return (
			<Shell>
				<ErrorBox onBack={() => navigate(-1)} message='Missing prompt id' />
			</Shell>
		)
	}
	if (isLoading && !prompt) {
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
					<Loading>fetching prompt…</Loading>
				</Terminal>
			</Shell>
		)
	}
	if (isError || !prompt) {
		return (
			<Shell>
				<ErrorBox onBack={() => navigate('/prompts/list')} message='Prompt not found' />
			</Shell>
		)
	}

	const typeLabel = TYPE_LABEL[prompt.type] ?? prompt.type
	const createdDate = new Date(prompt.createdAt)
	const updatedDate = new Date(prompt.updatedAt)
	const createdStr = createdDate.toLocaleString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
	const updatedStr = updatedDate.toLocaleString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
	const termPath = `prompts@sargas:~/prompts/${typeLabel.toLowerCase()}/${slugify(prompt.title)}`

	return (
		<>
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
							<PermissionGate permission='prompts:update'>
								{!prompt.isActive && (
									<HeaderBtn
										type='button'
										$tone='success'
										onClick={handleActivate}
										disabled={isActivating}
									>
										<BoltRounded style={{ fontSize: 13 }} />
										{isActivating ? 'Activating…' : 'Activate'}
									</HeaderBtn>
								)}
								<EditBtn
									type='button'
									onClick={() => navigate(`/prompts/edit/${prompt.id}`)}
								>
									<EditOutlined style={{ fontSize: 15 }} />
									Edit
								</EditBtn>
							</PermissionGate>
						</TermHeaderActions>
					</TermHeader>

					<TermBody>
						<TermPromptLine>
							<TermPrompt>$</TermPrompt> cat prompt --type {typeLabel.toLowerCase()}
						</TermPromptLine>

						<HeroRow>
							<HeroIcon $active={prompt.isActive}>
								<AutoAwesomeOutlined />
							</HeroIcon>
							<HeroText>
								<Hero>{prompt.title}</Hero>
								<HeroMeta>
									<ScheduleRounded style={{ fontSize: 13 }} />
									<span>created {createdStr}</span>
									<Sep>·</Sep>
									<span>v{prompt.version}</span>
								</HeroMeta>
							</HeroText>
						</HeroRow>

						<KeyLines>
							<KV label='type'>
								<KvMono>{typeLabel}</KvMono>
							</KV>
							<KV label='status'>
								<StatusPill $active={prompt.isActive}>
									{prompt.isActive ? 'active' : 'inactive'}
								</StatusPill>
							</KV>
							<KV label='version'>
								<KvMono>v{prompt.version}</KvMono>
							</KV>
							<KV label='created'>
								<KvMono>{createdStr}</KvMono>
							</KV>
							<KV label='updated'>
								<KvMono>{updatedStr}</KvMono>
							</KV>
							<KV label='id'>
								<KvMono>{prompt.id}</KvMono>
							</KV>
						</KeyLines>

						<Divider />
						<TermPromptLine>
							<TermPrompt>$</TermPrompt> cat content.txt
						</TermPromptLine>
						<RawBlock>
							<pre>{prompt.content}</pre>
						</RawBlock>
					</TermBody>

					<TermFooter>
						prompt · {updatedStr} · {prompt.id}
						<TermCursor />
					</TermFooter>
				</Terminal>
			</Shell>
		</>
	)
}

export default PromptPreview

/* ─── Reusable row ─────────────────────────────────────────────── */

const KV = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<KvRow>
		<KvArrow>→</KvArrow>
		<KvLabel>{label}</KvLabel>
		<KvValue>{children}</KvValue>
	</KvRow>
)

/* ─── Shell wrapper that keeps the standard ListPageShell nav ───── */

const Shell = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate()
	return (
		<ListPageShell
			crumbs={[
				{ label: 'Configuration' },
				{ label: 'Prompts', href: '/prompts/list' },
				{ label: 'Preview', current: true },
			]}
			icon={<AutoAwesomeOutlined />}
			title='Prompt'
			subtitle='Versioned instruction — content, status, and provenance of this prompt.'
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
			<TermPath>prompts@sargas:~/prompts/error</TermPath>
		</TermHeader>
		<Loading>
			<WarningAmberRounded style={{ fontSize: 16, marginRight: 6 }} />
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

/* ─── Styles (mirror of AuditEventPage) ────────────────────────── */

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
	flex-shrink: 0;
`

const EditBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border: 0;
	border-radius: 8px;
	background: ${T.primary};
	color: #ffffff;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition:
		filter 140ms ease,
		transform 140ms ease;

	&:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`

const HeaderBtn = styled.button<{ $tone: 'primary' | 'success' }>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 4px 10px;
	border-radius: 6px;
	border: 1px solid
		${(p) => (p.$tone === 'success' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(3, 105, 161, 0.3)')};
	background: ${(p) =>
		p.$tone === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(3, 105, 161, 0.08)'};
	color: ${(p) => (p.$tone === 'success' ? '#047857' : T.primary)};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	cursor: pointer;
	transition:
		filter 140ms ease,
		transform 140ms ease;

	&:hover:not(:disabled) {
		filter: brightness(1.04);
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

const HeroIcon = styled.div<{ $active: boolean }>`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${(p) => (p.$active ? 'rgba(5, 150, 105, 0.1)' : 'rgba(3, 105, 161, 0.1)')};
	color: ${(p) => (p.$active ? '#047857' : T.primary)};

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

	&:nth-child(1) {
		animation-delay: 60ms;
	}
	&:nth-child(2) {
		animation-delay: 110ms;
	}
	&:nth-child(3) {
		animation-delay: 160ms;
	}
	&:nth-child(4) {
		animation-delay: 210ms;
	}
	&:nth-child(5) {
		animation-delay: 260ms;
	}
	&:nth-child(6) {
		animation-delay: 310ms;
	}

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

const StatusPill = styled.span<{ $active: boolean }>`
	display: inline-flex;
	padding: 3px 11px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.3px;
	color: ${(p) => (p.$active ? '#047857' : T.textMuted)};
	background: ${(p) => (p.$active ? 'rgba(5, 150, 105, 0.1)' : 'rgba(15, 23, 42, 0.05)')};
`

/* ─── Divider / content block ───────────────────────────────── */

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
	transition:
		border-color 180ms ease,
		color 180ms ease;

	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
