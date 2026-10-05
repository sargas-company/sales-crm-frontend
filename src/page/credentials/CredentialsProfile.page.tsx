import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	AddRounded,
	BusinessOutlined,
	CheckRounded,
	ContentCopyRounded,
	EditRounded,
	LaunchRounded,
	LockOpenRounded,
	PersonOutlined,
	TimerOutlined,
	VisibilityOffRounded,
	VisibilityRounded,
	VpnKeyOutlined,
} from '@mui/icons-material'
import {
	useCopyAuditMutation,
	useGetProfileQuery,
	useListAccountsQuery,
	useGetCredentialsPolicyQuery,
	type CredentialAccount,
	type SecretPayload,
} from '../../store/credentials/credentialsApi'
import { fetchAccountReveal } from '../../store/credentials/revealTransport'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { usePageHeader } from './CredentialsLayout'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import VaultSetupGate, { VAULT_REQUEST_UNLOCK } from './VaultSetupGate'
import VaultIsland from './VaultIsland'
import { useGetVaultStatusQuery } from '../../store/credentials/vaultApi'

const CredentialsProfilePage = () => {
	const { id = '' } = useParams()
	const navigate = useNavigate()
	const { data: profile } = useGetProfileQuery(id, { skip: !id })
	const { data: accounts, isLoading } = useListAccountsQuery(
		{ profileId: id, limit: 100 },
		{ skip: !id },
	)
	const { data: vaultStatus } = useGetVaultStatusQuery()

	const [revealing, setRevealing] = useState<CredentialAccount | null>(null)

	const items = accounts?.data ?? []

	const vaultUnlocked = (() => {
		if (!vaultStatus?.session) return false
		const expires = new Date(vaultStatus.session.expiresAt).getTime()
		return expires > Date.now()
	})()

	const handleReveal = (account: CredentialAccount) => {
		if (!vaultUnlocked) {
			window.dispatchEvent(new CustomEvent(VAULT_REQUEST_UNLOCK))
			return
		}
		setRevealing(account)
	}

	usePageHeader({
		crumbs: [
			{ label: 'Secure' },
			{ label: 'Credentials' },
			{
				label: profile?.name ?? 'Profile',
				current: true,
			},
		],
		icon:
			profile?.type === 'COMPANY' ? (
				<BusinessOutlined />
			) : profile?.type === 'PERSON' ? (
				<PersonOutlined />
			) : (
				<VpnKeyOutlined />
			),
		title: profile?.name ?? 'Loading…',
		subtitle: profile?.description || undefined,
		action: (
			<HeroActions>
				<VaultIsland />
				<PermissionGate permission='credentials:update'>
					<GhostAction to={`/credentials/profiles/${id}/edit`}>
						<EditRounded style={{ fontSize: 16 }} />
						Edit profile
					</GhostAction>
				</PermissionGate>
				<PermissionGate permission='credentials:create'>
					<PrimarySolidButton
						type='button'
						onClick={() =>
							navigate(
								`/credentials/profiles/${id}/accounts/new`,
							)
						}
					>
						<AddRounded />
						New account
					</PrimarySolidButton>
				</PermissionGate>
			</HeroActions>
		),
	})

	return (
		<>
			<VaultSetupGate />
			{profile && (profile.tags.length > 0 || profile.status === 'ARCHIVED') && (
					<ProfileMetaRow>
						{profile.status === 'ARCHIVED' && (
							<ArchivedChip>Archived</ArchivedChip>
						)}
						{profile.tags.map((t) => (
							<TagChip key={t}>{t}</TagChip>
						))}
					</ProfileMetaRow>
				)}

				<SectionTitle>
					<span>Accounts</span>
					<CountBadge>{items.length}</CountBadge>
				</SectionTitle>

				{isLoading ? (
					<AccountGrid>
						{Array.from({ length: 3 }).map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</AccountGrid>
				) : items.length === 0 ? (
					<EmptyState>
						<EmptyIcon>
							<VpnKeyOutlined style={{ fontSize: 28 }} />
						</EmptyIcon>
						<EmptyTitle>No accounts yet</EmptyTitle>
						<EmptyHint>
							Add the first service login for this profile.
						</EmptyHint>
						<PermissionGate permission='credentials:create'>
							<PrimarySolidButton
								type='button'
								onClick={() =>
									navigate(
										`/credentials/profiles/${id}/accounts/new`,
									)
								}
							>
								<AddRounded />
								New account
							</PrimarySolidButton>
						</PermissionGate>
					</EmptyState>
				) : (
					<AccountTerminal>
						<TermHeader>
							<TermDots>
								<span className='r' />
								<span className='y' />
								<span className='g' />
							</TermDots>
							<TermPath>
								vault@sargas:~/credentials/
								{profile?.name
									.toLowerCase()
									.replace(/\s+/g, '-') ?? ''}
							</TermPath>
						</TermHeader>
						{items.map((a) => (
							<TerminalRow
								key={a.id}
								account={a}
								onReveal={() => handleReveal(a)}
							/>
						))}
						<TermFooter>
							{items.length}{' '}
							{items.length === 1 ? 'account' : 'accounts'}
							<TermCursor />
						</TermFooter>
					</AccountTerminal>
				)}

			{revealing && (
				<RevealDrawer
					account={revealing}
					onClose={() => setRevealing(null)}
				/>
			)}
		</>
	)
}

export default CredentialsProfilePage

/* ─── Account card ─────────────────────────────────────────────── */

const TerminalRow = ({
	account,
	onReveal,
}: {
	account: CredentialAccount
	onReveal: () => void
}) => {
	let hostname: string | null = null
	if (account.serviceUrl) {
		try {
			hostname = new URL(account.serviceUrl).hostname.replace(/^www\./, '')
		} catch {
			hostname = account.serviceUrl
		}
	}
	return (
		<TermRow>
			<TermArrow>→</TermArrow>
			<TermName>{account.serviceName.toLowerCase()}</TermName>
			<TermCat>[{account.category.toUpperCase()}]</TermCat>
			<TermLogin>
				{account.usernameHint && (
					<span>{account.usernameHint}</span>
				)}
				{account.usernameHint && hostname && (
					<TermSep>·</TermSep>
				)}
				{hostname && (
					<TermUrl
						href={account.serviceUrl ?? '#'}
						target='_blank'
						rel='noreferrer'
					>
						{hostname}
					</TermUrl>
				)}
			</TermLogin>
			<TermActions>
				<TermEditLink
					to={`/credentials/accounts/${account.id}/edit`}
					aria-label='Edit account'
				>
					<EditRounded style={{ fontSize: 17 }} />
				</TermEditLink>
				<TermReveal type='button' onClick={onReveal}>
					<LockOpenRounded style={{ fontSize: 15 }} />
					reveal
				</TermReveal>
			</TermActions>
		</TermRow>
	)
}

/* ─── Reveal drawer ────────────────────────────────────────────── */

/* Fallback used when the policy endpoint has not yet responded or
 * fails outright. The server-driven value from
 * `GET /credentials/policy` overrides this once available. */
const REVEAL_FALLBACK_SECONDS = 30

const RevealDrawer = ({
	account,
	onClose,
}: {
	account: CredentialAccount
	onClose: () => void
}) => {
	const [copyAudit] = useCopyAuditMutation()
	const { data: policy } = useGetCredentialsPolicyQuery()
	const revealSeconds =
		policy?.revealAutoHideSeconds ?? REVEAL_FALLBACK_SECONDS
	const [secrets, setSecrets] = useState<SecretPayload | null>(null)
	const [remaining, setRemaining] = useState(REVEAL_FALLBACK_SECONDS)
	const [visible, setVisible] = useState<Record<string, boolean>>({})
	const [closing, setClosing] = useState(false)
	const [copiedKey, setCopiedKey] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [revealError, setRevealError] = useState<Error | null>(null)
	const timer = useRef<number | null>(null)
	const copyTimer = useRef<number | null>(null)

	const requestClose = () => {
		if (closing) return
		setClosing(true)
		window.setTimeout(() => {
			setSecrets(null)
			setVisible({})
			onClose()
		}, 720)
	}

	// Fetch secrets on mount via the imperative transport. Plaintext
	// is returned directly to component state — it never passes
	// through Redux / RTK Query cache.
	useEffect(() => {
		let alive = true
		setIsLoading(true)
		setRevealError(null)
		;(async () => {
			try {
				const result = await fetchAccountReveal(account.id)
				if (alive) setSecrets(result.secrets)
			} catch (e) {
				if (!alive) return
				// Vault session expired between click and request — close
				// the drawer and prompt the user to unlock. The 401 from
				// a locked vault must NOT trigger the global auth-logout
				// flow in axiosInstance.
				const status = (e as { status?: number }).status
				if (status === 401 || status === 423) {
					onClose()
					window.dispatchEvent(
						new CustomEvent(VAULT_REQUEST_UNLOCK),
					)
				} else {
					setRevealError(e as Error)
				}
			} finally {
				if (alive) setIsLoading(false)
			}
		})()
		return () => {
			alive = false
		}
	}, [account.id, onClose])

	// Auto-clear after countdown. The timer resets whenever a new
	// `secrets` fetch resolves (including a repeat reveal) because the
	// effect depends on both the payload identity and the configured
	// seconds; the vault-session itself is NOT closed when the timer
	// fires, so the user can reopen the drawer without a fresh MFA
	// while the session is still valid.
	useEffect(() => {
		if (!secrets) return
		setRemaining(revealSeconds)
		timer.current = window.setInterval(() => {
			setRemaining((r) => {
				if (r <= 1) {
					setSecrets(null)
					setVisible({})
					if (timer.current) window.clearInterval(timer.current)
					return 0
				}
				return r - 1
			})
		}, 1000)
		return () => {
			if (timer.current) window.clearInterval(timer.current)
		}
	}, [secrets, revealSeconds])

	// Scrub on unmount — belt & braces for account/profile change and
	// drawer close. Guarantees no plaintext lingers in state once the
	// component disappears, and that the timer is torn down even on an
	// unexpected unmount path.
	useEffect(
		() => () => {
			setSecrets(null)
			setVisible({})
			if (timer.current) window.clearInterval(timer.current)
			if (copyTimer.current) window.clearTimeout(copyTimer.current)
		},
		[],
	)

	// Clear secrets immediately if the account identity changes mid-
	// drawer (the parent re-mounts the drawer, but belt & braces for
	// the uncommon case where the same drawer is reused).
	useEffect(() => {
		setSecrets(null)
		setVisible({})
	}, [account.id])

	// Clear on manual vault lock or logout: both actions dispatch the
	// shared vault-lock event; listening here keeps the drawer honest
	// without pulling in Redux.
	useEffect(() => {
		const scrub = () => {
			setSecrets(null)
			setVisible({})
		}
		window.addEventListener('vault:locked', scrub)
		window.addEventListener('auth:logout', scrub)
		return () => {
			window.removeEventListener('vault:locked', scrub)
			window.removeEventListener('auth:logout', scrub)
		}
	}, [])

	const copy = async (field: string, value: string) => {
		try {
			await navigator.clipboard.writeText(value)
			copyAudit({ id: account.id, field }).catch(() => undefined)
			setCopiedKey(field)
			if (copyTimer.current) window.clearTimeout(copyTimer.current)
			copyTimer.current = window.setTimeout(
				() => setCopiedKey(null),
				1600,
			)
		} catch {
			/* clipboard blocked */
		}
	}

	const slug = account.serviceName.toLowerCase().replace(/\s+/g, '-')
	return (
		<Scrim onClick={requestClose} $closing={closing}>
			<TermPanel onClick={(e) => e.stopPropagation()} $closing={closing}>
				<TermPanelHead>
					<TermDots>
						<span className='r' />
						<span className='y' />
						<span className='g' />
					</TermDots>
					<TermPathPanel>
						vault@sargas:~/credentials/{slug}
					</TermPathPanel>
					<TermCountdown $urgent={remaining < 10}>
						● {remaining}s
					</TermCountdown>
				</TermPanelHead>
				<CollapsingBody $closing={closing}>
					<div>
				<TermCmd>
					<TermPrompt>$</TermPrompt> cat secrets --decrypt
				</TermCmd>
				{isLoading && <TermStatus>decrypting...</TermStatus>}
				{revealError && (
					<TermError>
						✗ {revealError.message || 'could not reveal secrets'}
					</TermError>
				)}
				{secrets && (
					<TermBody>
						{secrets.username && (
							<TermSecretRow
								keyLabel='username:'
								value={secrets.username}
								onCopy={() => copy('username', secrets.username!)}
								isVisible
								isCopied={copiedKey === 'username'}
							/>
						)}
						{secrets.email && (
							<TermSecretRow
								keyLabel='email:'
								value={secrets.email}
								onCopy={() => copy('email', secrets.email!)}
								isVisible
								isCopied={copiedKey === 'email'}
							/>
						)}
						{secrets.password && (
							<TermSecretRow
								keyLabel='password:'
								value={secrets.password}
								onCopy={() =>
									copy('password', secrets.password!)
								}
								isVisible={!!visible.password}
								onToggle={() =>
									setVisible((v) => ({
										...v,
										password: !v.password,
									}))
								}
								mask
								isCopied={copiedKey === 'password'}
							/>
						)}
						{secrets.totpSeed && (
							<TermSecretRow
								keyLabel='totp_seed:'
								value={secrets.totpSeed}
								onCopy={() => copy('totpSeed', secrets.totpSeed!)}
								isVisible={!!visible.totp}
								onToggle={() =>
									setVisible((v) => ({ ...v, totp: !v.totp }))
								}
								mask
								isCopied={copiedKey === 'totpSeed'}
							/>
						)}
						{secrets.pin && (
							<TermSecretRow
								keyLabel='pin:'
								value={secrets.pin}
								onCopy={() => copy('pin', secrets.pin!)}
								isVisible={!!visible.pin}
								onToggle={() =>
									setVisible((v) => ({ ...v, pin: !v.pin }))
								}
								mask
								isCopied={copiedKey === 'pin'}
							/>
						)}
						{secrets.secureNote && (
							<TermNote>
								<TermNoteKey># secure_note</TermNoteKey>
								<TermNoteBody>{secrets.secureNote}</TermNoteBody>
							</TermNote>
						)}
						{secrets.recoveryCodes &&
							secrets.recoveryCodes.length > 0 && (
								<TermNote>
									<TermNoteKey># recovery_codes</TermNoteKey>
									<TermRecoveryGrid>
										{secrets.recoveryCodes.map((c, i) => (
											<li key={i}>
												<span className='n'>
													{String(i + 1).padStart(2, '0')}
												</span>
												<code>{c}</code>
											</li>
										))}
									</TermRecoveryGrid>
								</TermNote>
							)}
						{secrets.customFields?.map((f, i) => (
							<TermSecretRow
								key={i}
								keyLabel={`${f.label.toLowerCase().replace(/\s+/g, '_')}:`}
								value={f.value}
								onCopy={() => copy(`custom:${f.label}`, f.value)}
								isVisible={!!visible[`c${i}`]}
								onToggle={() =>
									setVisible((v) => ({
										...v,
										[`c${i}`]: !v[`c${i}`],
									}))
								}
								mask
								isCopied={copiedKey === `custom:${f.label}`}
							/>
						))}
					</TermBody>
				)}
					</div>
				</CollapsingBody>
				<TermPanelFoot>
					<TermAudit>
						// logged to audit · auto-close in {remaining}s
					</TermAudit>
					<TermHide onClick={requestClose}>hide</TermHide>
				</TermPanelFoot>
			</TermPanel>
		</Scrim>
	)
}

const TermSecretRow = ({
	keyLabel,
	value,
	onCopy,
	isVisible,
	onToggle,
	mask,
	isCopied,
}: {
	keyLabel: string
	value: string
	onCopy: () => void
	isVisible: boolean
	onToggle?: () => void
	mask?: boolean
	isCopied?: boolean
}) => (
	<TermSRow>
		<TermSKey>{keyLabel}</TermSKey>
		<TermSVal $masked={!!mask && !isVisible}>
			{mask && !isVisible
				? '•'.repeat(Math.min(value.length, 14))
				: value}
		</TermSVal>
		<TermSActs>
			{onToggle && (
				<TermActBtn
					type='button'
					onClick={onToggle}
					title={isVisible ? 'Hide' : 'Show'}
					aria-label={isVisible ? 'Hide' : 'Show'}
				>
					{isVisible ? (
						<VisibilityOffRounded style={{ fontSize: 15 }} />
					) : (
						<VisibilityRounded style={{ fontSize: 15 }} />
					)}
				</TermActBtn>
			)}
			<TermCopyBtn
				type='button'
				onClick={onCopy}
				title={isCopied ? 'Copied' : 'Copy'}
				aria-label={isCopied ? 'Copied' : 'Copy'}
				$success={!!isCopied}
			>
				<CopyIconWrap>
					{isCopied ? (
						<CheckRounded style={{ fontSize: 15 }} />
					) : (
						<ContentCopyRounded style={{ fontSize: 14 }} />
					)}
				</CopyIconWrap>
				<CopiedLabel $show={!!isCopied}>Copied</CopiedLabel>
			</TermCopyBtn>
		</TermSActs>
	</TermSRow>
)


/* ─── Styles ──────────────────────────────────────────────────── */

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const HeroActions = styled.div`
	display: inline-flex;
	gap: 8px;
	align-items: center;
`

const GhostAction = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 14px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	color: ${T.textSecondary};
	background: #ffffff;
	font-weight: 600;
	font-size: 12.5px;
	text-decoration: none;
	transition:
		border-color 160ms,
		color 160ms;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`

const ProfileMetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 0 0 20px;
`

const ArchivedChip = styled.span`
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(234, 88, 12, 0.1);
	color: #c2410c;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
`

const TagChip = styled.span`
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textSecondary};
`

const SectionTitle = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin: 4px 0 16px;

	span {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.3px;
		color: ${T.textStrong};
	}
`

const CountBadge = styled.span`
	padding: 2px 9px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 700;
`

const SkeletonPulse = keyframes`
	0% { opacity: 0.5; }
	50% { opacity: 1; }
	100% { opacity: 0.5; }
`

const SkeletonCard = styled.div`
	height: 180px;
	border-radius: 16px;
	background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
	animation: ${SkeletonPulse} 1.4s ease-in-out infinite;
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 50px 24px;
	background: #ffffff;
	border: 1px dashed rgba(15, 23, 42, 0.14);
	border-radius: 16px;
	text-align: center;
`

const EmptyIcon = styled.div`
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 4px;
`

const EmptyTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 16px;
	font-weight: 700;
	color: ${T.textStrong};
`

const EmptyHint = styled.div`
	font-size: 13px;
	color: ${T.textSecondary};
	margin-bottom: 10px;
`

const AccountGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 14px;
`

/* ─── Terminal-style account list (light theme) ──────────────── */

const AccountTerminal = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	padding: 16px 22px 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.03),
		0 8px 24px rgba(15, 23, 42, 0.04);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
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
	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.r {
		background: #f87171;
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
	font-size: 11px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;
`

const termRowIn = keyframes`
	from { opacity: 0; transform: translateX(-6px); }
	to   { opacity: 1; transform: translateX(0); }
`

const TermRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	transition: background 160ms;
	animation: ${termRowIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-of-type(1)  { animation-delay: 80ms; }
	&:nth-of-type(2)  { animation-delay: 140ms; }
	&:nth-of-type(3)  { animation-delay: 200ms; }
	&:nth-of-type(4)  { animation-delay: 260ms; }
	&:nth-of-type(5)  { animation-delay: 320ms; }
	&:nth-of-type(6)  { animation-delay: 380ms; }
	&:nth-of-type(7)  { animation-delay: 440ms; }
	&:nth-of-type(8)  { animation-delay: 500ms; }
	&:nth-of-type(9)  { animation-delay: 560ms; }
	&:nth-of-type(10) { animation-delay: 620ms; }
	&:nth-of-type(n+11) { animation-delay: 680ms; }

	&:last-of-type {
		border-bottom: none;
	}

	&:hover {
		background: rgba(3, 105, 161, 0.04);
		border-radius: 8px;
		padding-left: 8px;
		padding-right: 8px;
		margin-left: -8px;
		margin-right: -8px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const TermArrow = styled.span`
	color: ${T.primary};
	font-weight: 700;
	font-size: 14px;
	flex-shrink: 0;
`

const TermName = styled.span`
	color: ${T.primary};
	font-weight: 700;
	font-size: 13.5px;
	letter-spacing: 0.2px;
	flex-shrink: 0;
`

const TermCat = styled.span`
	color: ${T.textMuted};
	font-size: 11px;
	font-weight: 500;
	letter-spacing: 0.4px;
	flex-shrink: 0;
`

const TermLogin = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${T.textSecondary};
	font-size: 11.5px;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const TermSep = styled.span`
	color: ${T.textMuted};
	opacity: 0.5;
`

const TermUrl = styled.a`
	color: ${T.primary};
	text-decoration: none;
	&:hover {
		text-decoration: underline;
	}
`

const TermActions = styled.div`
	display: inline-flex;
	gap: 12px;
	align-items: center;
	flex-shrink: 0;
`

const pencilWriteKf = keyframes`
	0% { transform: rotate(0) translate(0, 0); }
	20% { transform: rotate(-15deg) translate(-1px, 1px); }
	45% { transform: rotate(10deg) translate(1px, -1px); }
	70% { transform: rotate(-6deg) translate(-1px, 1px); }
	100% { transform: rotate(0) translate(0, 0); }
`

const TermEditLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	color: ${T.primary};
	background: transparent;
	border: 1px solid rgba(3, 105, 161, 0.2);
	text-decoration: none;
	transition: transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
		transform-origin: center 60%;
	}

	&:hover {
		transform: scale(1.05);
	}

	&:hover svg {
		animation: ${pencilWriteKf} 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover svg {
			animation: none;
		}
	}
`

const lockWiggleKf = keyframes`
	0% { transform: rotate(0) scale(1); }
	30% { transform: rotate(-12deg) scale(1.15); }
	55% { transform: rotate(8deg) scale(1.1); }
	80% { transform: rotate(-4deg) scale(1.08); }
	100% { transform: rotate(0) scale(1); }
`

const TermReveal = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	border-radius: 10px;
	border: none;
	background: rgba(3, 105, 161, 1);
	color: #ffffff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	cursor: pointer;
	transition: transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
		transform-origin: center 70%;
	}

	&:hover {
		transform: scale(1.05);
	}

	&:hover svg {
		animation: ${lockWiggleKf} 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}

	&:active {
		transform: scale(1.02) translateY(0.5px);
	}

	&:focus-visible {
		outline: 2px solid rgba(56, 189, 248, 0.65);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover svg {
			animation: none;
		}
	}
`

const cursorBlink = keyframes`
	0%, 50% { opacity: 1; }
	51%, 100% { opacity: 0; }
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

const TermFooter = styled.div`
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textMuted};
	display: inline-flex;
	align-items: center;
`

const scrimFadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`

const scrimFadeOut = keyframes`
	from { opacity: 1; }
	to { opacity: 0; }
`

const panelScaleIn = keyframes`
	from { opacity: 0; transform: scale(0.94) translateY(10px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
`

const panelScaleOut = keyframes`
	0% { opacity: 1; transform: scale(1) translateY(0); }
	50% { opacity: 0.95; transform: scale(0.99) translateY(2px); }
	80% { opacity: 0.5; transform: scale(0.95) translateY(10px); }
	100% { opacity: 0; transform: scale(0.9) translateY(18px); }
`

const Scrim = styled.div<{ $closing?: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.52);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: ${(p) => (p.$closing ? scrimFadeOut : scrimFadeIn)}
		${(p) => (p.$closing ? '400ms' : '220ms')}
		cubic-bezier(0.4, 0, 0.2, 1)
		${(p) => (p.$closing ? '320ms' : '0ms')}
		forwards;
`

/* ─── Terminal-style reveal panel (light theme) ─────────────── */

const TermPanel = styled.div<{ $closing?: boolean }>`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 16px;
	padding: 18px 24px 16px;
	max-width: 580px;
	width: calc(100% - 40px);
	max-height: 86vh;
	overflow-y: auto;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 24px 60px rgba(15, 23, 42, 0.18);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	animation: ${(p) => (p.$closing ? panelScaleOut : panelScaleIn)}
		${(p) => (p.$closing ? '400ms' : '240ms')}
		${(p) =>
			p.$closing
				? 'cubic-bezier(0.65, 0, 0.35, 1)'
				: 'cubic-bezier(0.4, 0, 0.2, 1)'}
		${(p) => (p.$closing ? '320ms' : '0ms')}
		forwards;
`

const TermPanelHead = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding-bottom: 14px;
	margin-bottom: 14px;
	border-bottom: 1px dashed rgba(15, 23, 42, 0.1);
`

const TermPathPanel = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
	letter-spacing: 0.2px;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const TermCountdown = styled.span<{ $urgent: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 4px 10px;
	border-radius: 6px;
	background: ${(p) =>
		p.$urgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 88, 12, 0.1)'};
	color: ${(p) => (p.$urgent ? '#dc2626' : '#c2410c')};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
`

const TermCmd = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	color: ${T.textStrong};
	margin-bottom: 10px;
`

const TermPrompt = styled.span`
	color: ${T.textMuted};
	margin-right: 6px;
`

const TermStatus = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: ${T.textMuted};
	padding: 10px 0;
`

const TermError = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	color: #dc2626;
	padding: 10px 12px;
	background: rgba(220, 38, 38, 0.06);
	border-radius: 6px;
	border-left: 2px solid #dc2626;
	margin: 6px 0 10px;
`

const CollapsingBody = styled.div<{ $closing?: boolean }>`
	display: grid;
	grid-template-rows: ${(p) => (p.$closing ? '0fr' : '1fr')};
	opacity: ${(p) => (p.$closing ? 0 : 1)};
	transition:
		grid-template-rows 320ms cubic-bezier(0.65, 0, 0.35, 1),
		opacity 220ms cubic-bezier(0.4, 0, 0.2, 1) 40ms;

	> div {
		overflow: hidden;
		min-height: 0;
	}
`

const TermBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const TermSRow = styled.div`
	display: grid;
	grid-template-columns: 110px 1fr auto;
	gap: 12px;
	align-items: center;
	padding: 8px 4px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	border-radius: 6px;
	transition: background 160ms;
	animation: ${termRowIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-of-type(1)  { animation-delay: 80ms; }
	&:nth-of-type(2)  { animation-delay: 140ms; }
	&:nth-of-type(3)  { animation-delay: 200ms; }
	&:nth-of-type(4)  { animation-delay: 260ms; }
	&:nth-of-type(5)  { animation-delay: 320ms; }
	&:nth-of-type(6)  { animation-delay: 380ms; }
	&:nth-of-type(7)  { animation-delay: 440ms; }
	&:nth-of-type(8)  { animation-delay: 500ms; }
	&:nth-of-type(n+9) { animation-delay: 560ms; }

	&:hover {
		background: rgba(3, 105, 161, 0.04);
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const TermSKey = styled.span`
	color: ${T.primary};
	font-weight: 600;
`

const TermSVal = styled.span<{ $masked: boolean }>`
	color: ${(p) => (p.$masked ? T.textMuted : T.textStrong)};
	letter-spacing: ${(p) => (p.$masked ? '2px' : '0.1px')};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	word-break: break-all;
`

const TermSActs = styled.span`
	display: inline-flex;
	flex-shrink: 0;
	border: 1px solid rgba(3, 105, 161, 0.2);
	border-radius: 999px;
	overflow: hidden;
	background: #ffffff;
`

const TermActBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 30px;
	padding: 0;
	background: transparent;
	border: none;
	color: ${T.primary};
	cursor: pointer;
	transition: all 140ms;

	& + & {
		border-left: 1px solid rgba(3, 105, 161, 0.15);
	}

	&:hover {
		background: ${T.primary};
		color: #ffffff;
	}

	&:active {
		filter: brightness(0.95);
	}
`

const TermCopyBtn = styled.button<{ $success: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	height: 30px;
	padding: ${(p) => (p.$success ? '0 10px' : '0')};
	width: ${(p) => (p.$success ? 'auto' : '34px')};
	background: ${(p) => (p.$success ? T.primary : 'transparent')};
	color: ${(p) => (p.$success ? '#ffffff' : T.primary)};
	border: none;
	cursor: pointer;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: lowercase;
	transition:
		background 220ms cubic-bezier(0.4, 0, 0.2, 1),
		color 180ms,
		width 240ms cubic-bezier(0.65, 0, 0.35, 1),
		padding 240ms cubic-bezier(0.65, 0, 0.35, 1);

	${TermActBtn} + & {
		border-left: 1px solid rgba(3, 105, 161, 0.15);
	}

	&:hover {
		background: ${T.primary};
		color: #ffffff;
	}

	&:active {
		filter: brightness(0.95);
	}
`

const CopyIconWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
`

const CopiedLabel = styled.span<{ $show: boolean }>`
	display: inline-block;
	max-width: ${(p) => (p.$show ? '60px' : '0')};
	opacity: ${(p) => (p.$show ? 1 : 0)};
	overflow: hidden;
	white-space: nowrap;
	transition:
		max-width 240ms cubic-bezier(0.65, 0, 0.35, 1),
		opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)
			${(p) => (p.$show ? '80ms' : '0ms')};
`

const TermNote = styled.div`
	margin: 6px 0;
	padding: 10px 4px;
`

const TermNoteKey = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
	margin-bottom: 6px;
	font-weight: 500;
`

const TermNoteBody = styled.pre`
	margin: 0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	color: ${T.textStrong};
	white-space: pre-wrap;
	line-height: 1.5;
	padding-left: 10px;
	border-left: 2px solid rgba(3, 105, 161, 0.2);
`

const TermRecoveryGrid = styled.ol`
	list-style: none;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4px 14px;
	padding: 0;
	margin: 0;
	li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12.5px;
	}
	.n {
		color: ${T.textMuted};
		font-size: 10.5px;
	}
	code {
		color: ${T.textStrong};
		font-weight: 500;
	}
`

const TermPanelFoot = styled.div`
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px dashed rgba(15, 23, 42, 0.1);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`

const TermAudit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	color: ${T.textMuted};
	font-style: italic;
`

const TermHide = styled.button`
	padding: 7px 16px;
	background: rgba(3, 105, 161, 0.08);
	border: 1px solid rgba(3, 105, 161, 0.3);
	color: ${T.primary};
	border-radius: 6px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	font-weight: 700;
	text-transform: lowercase;
	letter-spacing: 0.5px;
	cursor: pointer;
	transition: all 160ms;

	&:hover {
		background: ${T.primary};
		color: #ffffff;
		border-color: transparent;
	}
`
