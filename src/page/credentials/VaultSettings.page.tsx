import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	FingerprintOutlined,
	KeyOutlined,
	ShieldOutlined,
	AddRounded,
	RefreshRounded,
	CheckRounded,
	ContentCopyOutlined,
	FileDownloadOutlined,
	WarningAmberRounded,
	DeleteOutline,
} from '@mui/icons-material'
import {
	startRegistration,
} from '@simplewebauthn/browser'
import { usePageHeader } from './CredentialsLayout'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import {
	useGetVaultStatusQuery,
	usePasskeyRegisterOptionsMutation,
	usePasskeyRegisterVerifyMutation,
	useTotpEnrollMutation,
	useTotpConfirmMutation,
	useTotpRemoveMutation,
	useRecoveryGenerateMutation,
} from '../../store/credentials/vaultApi'

type Modal =
	| null
	| 'add-passkey'
	| 'add-totp-enroll'
	| 'add-totp-confirm'
	| 'remove-totp'
	| 'show-recovery'

const VaultSettings = () => {
	usePageHeader({
		crumbs: [
			{ label: 'Secure' },
			{ label: 'Credentials' },
			{ label: 'My vault access', current: true },
		],
		icon: <ShieldOutlined />,
		title: 'My vault access',
		subtitle:
			'Your personal MFA factors and recovery codes. Org-wide vault policy lives in Settings.',
	})

	const { data: status, refetch } = useGetVaultStatusQuery()
	const { showToast } = useToast()

	const [modal, setModal] = useState<Modal>(null)
	const [closing, setClosing] = useState(false)

	const closeModal = (afterReset?: () => void) => {
		if (closing) return
		setClosing(true)
		window.setTimeout(() => {
			setModal(null)
			setClosing(false)
			afterReset?.()
		}, 720)
	}
	const [totp, setTotp] = useState<{ secret: string; otpauth: string } | null>(
		null,
	)
	const [totpCode, setTotpCode] = useState('')
	const [codeInvalid, setCodeInvalid] = useState(false)
	const [newRecovery, setNewRecovery] = useState<string[] | null>(null)
	const [deviceLabel, setDeviceLabel] = useState('')
	const [copied, setCopied] = useState(false)
	const [codesSaved, setCodesSaved] = useState(false)
	const [busy, setBusy] = useState(false)

	const [passkeyOpts] = usePasskeyRegisterOptionsMutation()
	const [passkeyVerify] = usePasskeyRegisterVerifyMutation()
	const [totpEnroll] = useTotpEnrollMutation()
	const [totpConfirm] = useTotpConfirmMutation()
	const [totpRemove] = useTotpRemoveMutation()
	const [recoveryGen] = useRecoveryGenerateMutation()

	if (!status) return null

	const { mfa } = status
	const passkeyCount = mfa.webauthn.length
	const totpEnabled = mfa.hasTotp
	const recovery = mfa.recoveryCodes

	const beginAddPasskey = async () => {
		if (!deviceLabel.trim()) {
			showToast('Enter a device label first', 'warning')
			return
		}
		setBusy(true)
		try {
			const options = (await passkeyOpts().unwrap()) as never
			const response = await startRegistration({ optionsJSON: options })
			await passkeyVerify({
				response,
				deviceLabel: deviceLabel.trim(),
			}).unwrap()
			showToast('Passkey added', 'success')
			closeModal(() => setDeviceLabel(''))
			refetch()
		} catch (e) {
			showToast(parseServerError(e) || 'Passkey registration failed', 'error')
		} finally {
			setBusy(false)
		}
	}

	const beginAddTotp = async () => {
		setBusy(true)
		try {
			const result = await totpEnroll().unwrap()
			setTotp(result)
			setModal('add-totp-confirm')
		} catch (e) {
			showToast(parseServerError(e) || 'Could not start TOTP setup', 'error')
		} finally {
			setBusy(false)
		}
	}

	const confirmAddTotp = async () => {
		setBusy(true)
		try {
			await totpConfirm({ code: totpCode.trim() }).unwrap()
			showToast('Authenticator app linked', 'success')
			closeModal(() => {
				setTotp(null)
				setTotpCode('')
			})
			refetch()
		} catch (e) {
			showToast(parseServerError(e) || 'Code did not verify', 'error')
		} finally {
			setBusy(false)
		}
	}

	const confirmRemoveTotp = async () => {
		setBusy(true)
		try {
			await totpRemove({ code: totpCode.trim() }).unwrap()
			showToast('Authenticator removed', 'success')
			closeModal(() => {
				setTotpCode('')
				setCodeInvalid(false)
			})
			refetch()
		} catch (e) {
			setCodeInvalid(true)
			showToast(parseServerError(e) || 'Code did not verify', 'error')
		} finally {
			setBusy(false)
		}
	}

	const regenerateRecovery = async () => {
		if (
			!window.confirm(
				'Regenerating replaces ALL existing recovery codes. Any unused codes will stop working. Continue?',
			)
		) {
			return
		}
		setBusy(true)
		try {
			const { codes } = await recoveryGen().unwrap()
			setNewRecovery(codes)
			setCodesSaved(false)
			setModal('show-recovery')
			refetch()
		} catch (e) {
			showToast(parseServerError(e) || 'Could not generate codes', 'error')
		} finally {
			setBusy(false)
		}
	}

	const copyAll = async (codes: string[]) => {
		try {
			await navigator.clipboard.writeText(codes.join('\n'))
			setCopied(true)
			showToast('Recovery codes copied', 'success')
			window.setTimeout(() => setCopied(false), 2000)
		} catch {
			showToast('Could not copy — select manually', 'error')
		}
	}

	const downloadCodes = (codes: string[]) => {
		const body = [
			'Sargas CRM — Vault recovery codes',
			`Generated: ${new Date().toISOString()}`,
			'',
			'Each code can be used once. Keep this file safe.',
			'',
			...codes.map((c, i) => `${String(i + 1).padStart(2, ' ')}. ${c}`),
		].join('\n')
		const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `sargas-vault-recovery-codes-${new Date()
			.toISOString()
			.slice(0, 10)}.txt`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		window.setTimeout(() => URL.revokeObjectURL(url), 1000)
		showToast('Recovery codes downloaded', 'success')
	}

	const copySecret = async (secret: string) => {
		try {
			await navigator.clipboard.writeText(secret)
			showToast('Secret copied', 'success')
		} catch {
			showToast('Could not copy', 'error')
		}
	}

	return (
		<Grid>
			{/* ── Passkeys ─────────────────────────────────────────── */}
			<Card>
				<CardHead>
					<HeadIcon $tone='sky'>
						<FingerprintOutlined />
					</HeadIcon>
					<HeadText>
						<h3>Passkeys</h3>
						<p>
							Biometric or security-key sign-in. Preferred — fastest and
							phishing-resistant.
						</p>
					</HeadText>
				</CardHead>

				{passkeyCount > 0 && (
					<DeviceList>
						{mfa.webauthn.map((d, i) => (
							<DeviceRow key={i}>
								<FingerprintOutlined
									style={{ fontSize: 18, color: '#0369a1' }}
								/>
								<DeviceInfo>
									<strong>{d.label}</strong>
									<DeviceMeta>
										Added {new Date(d.createdAt).toLocaleDateString()}
										{d.lastUsedAt && (
											<>
												{' · '}Last used{' '}
												{new Date(d.lastUsedAt).toLocaleDateString()}
											</>
										)}
									</DeviceMeta>
								</DeviceInfo>
							</DeviceRow>
						))}
					</DeviceList>
				)}

				<CardActions>
					<PrimaryBtn
						type='button'
						onClick={() => setModal('add-passkey')}
						disabled={busy}
					>
						<AddRounded style={{ fontSize: 18 }} />
						Add passkey
					</PrimaryBtn>
					<StatusPill
						data-status-pill
						$tone={passkeyCount > 0 ? 'ok' : 'off'}
					>
						{passkeyCount > 0 ? `${passkeyCount} active` : 'None'}
					</StatusPill>
				</CardActions>
			</Card>

			{/* ── TOTP ─────────────────────────────────────────────── */}
			<Card>
				<CardHead>
					<HeadIcon $tone='violet'>
						<KeyOutlined />
					</HeadIcon>
					<HeadText>
						<h3>Authenticator app</h3>
						<p>
							Google Authenticator, 1Password, Authy — generate a rotating
							6-digit code.
						</p>
					</HeadText>
				</CardHead>

				<CardActions>
					{totpEnabled ? (
						<DangerBtn
							type='button'
							onClick={() => {
								setTotpCode('')
								setModal('remove-totp')
							}}
							disabled={busy}
						>
							<DeleteOutline style={{ fontSize: 18 }} />
							Remove authenticator
						</DangerBtn>
					) : (
						<PrimaryBtn
							type='button'
							onClick={beginAddTotp}
							disabled={busy}
						>
							<AddRounded style={{ fontSize: 18 }} />
							Set up authenticator
						</PrimaryBtn>
					)}
					<StatusPill
						data-status-pill
						$tone={totpEnabled ? 'ok' : 'off'}
					>
						{totpEnabled ? 'Enrolled' : 'Not set up'}
					</StatusPill>
				</CardActions>
			</Card>

			{/* ── Recovery codes ───────────────────────────────────── */}
			<Card>
				<CardHead>
					<HeadIcon $tone='amber'>
						<ShieldOutlined />
					</HeadIcon>
					<HeadText>
						<h3>Recovery codes</h3>
						<p>
							One-time backup codes to unlock the vault if you lose every
							device. Store them somewhere safe.
						</p>
					</HeadText>
				</CardHead>

				{recovery && recovery.remaining <= 2 && recovery.remaining > 0 && (
					<InlineWarn>
						<WarningAmberRounded style={{ fontSize: 16 }} />
						Only {recovery.remaining} code{recovery.remaining === 1 ? '' : 's'}{' '}
						left — generate a fresh set before you run out.
					</InlineWarn>
				)}

				<CardActions>
					<PrimaryBtn
						type='button'
						onClick={regenerateRecovery}
						disabled={busy}
						$variant='ghost'
					>
						<RefreshRounded style={{ fontSize: 18 }} />
						{recovery ? 'Regenerate codes' : 'Generate codes'}
					</PrimaryBtn>
					<StatusPill
						data-status-pill
						$tone={
							!recovery
								? 'off'
								: recovery.remaining <= 2
									? 'warn'
									: 'ok'
						}
					>
						{recovery
							? `${recovery.remaining} / ${recovery.total} remaining`
							: 'None'}
					</StatusPill>
				</CardActions>
			</Card>

			{/* ── Modals ───────────────────────────────────────────── */}
			{modal === 'add-passkey' && (
				<Scrim $closing={closing} onClick={() => !busy && closeModal()}>
					<Modal $closing={closing} onClick={(e) => e.stopPropagation()}>
						<ModalHead>
							<FingerprintOutlined />
							<h3>Add a passkey</h3>
						</ModalHead>
						<p>
							Give this device a label so you can identify it later (e.g.
							&quot;MacBook Pro&quot; or &quot;YubiKey 5C&quot;).
						</p>
						<LabelInput
							placeholder='Device label'
							value={deviceLabel}
							onChange={(e) => setDeviceLabel(e.target.value)}
							autoFocus
						/>
						<ModalActions>
							<GhostBtn
								type='button'
								onClick={() => closeModal()}
								disabled={busy}
							>
								Cancel
							</GhostBtn>
							<PrimaryBtn
								type='button'
								onClick={beginAddPasskey}
								disabled={busy || !deviceLabel.trim()}
							>
								{busy ? 'Working…' : 'Continue'}
							</PrimaryBtn>
						</ModalActions>
					</Modal>
				</Scrim>
			)}

			{modal === 'add-totp-confirm' && totp && (
				<Scrim $closing={closing} onClick={() => !busy && closeModal()}>
					<Modal $closing={closing} onClick={(e) => e.stopPropagation()}>
						<ModalHead>
							<KeyOutlined />
							<h3>Link authenticator app</h3>
						</ModalHead>
						<p>
							Scan this with your authenticator app or paste the secret.
							Then enter the 6-digit code to confirm.
						</p>
						<SecretBox>
							<code>{totp.secret}</code>
							<CopySecretBtn
								type='button'
								onClick={() => copySecret(totp.secret)}
							>
								<ContentCopyOutlined style={{ fontSize: 14 }} />
								Copy
							</CopySecretBtn>
						</SecretBox>
						<OtpauthLink href={totp.otpauth}>
							Open otpauth:// URL
						</OtpauthLink>
						<CodeInput
							value={totpCode}
							onChange={(e) => setTotpCode(e.target.value)}
							maxLength={6}
							placeholder='123456'
							inputMode='numeric'
						/>
						<ModalActions>
							<GhostBtn
								type='button'
								onClick={() =>
									closeModal(() => {
										setTotp(null)
										setTotpCode('')
									})
								}
								disabled={busy}
							>
								Cancel
							</GhostBtn>
							<PrimaryBtn
								type='button'
								onClick={confirmAddTotp}
								disabled={busy || totpCode.length < 6}
							>
								{busy ? 'Working…' : 'Confirm & save'}
							</PrimaryBtn>
						</ModalActions>
					</Modal>
				</Scrim>
			)}

			{modal === 'remove-totp' && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Remove authenticator app?'
					description={
						<RemoveTotpBody>
							<span>
								Enter the current 6-digit code from your authenticator
								to confirm. You can enroll again later from scratch.
							</span>
							<CodeInputConfirm
								value={totpCode}
								onChange={(e) => {
									// Keep only digits — handles direct typing,
									// mobile keyboards, and paste of mixed text.
									const digits = e.target.value.replace(/\D/g, '')
									setTotpCode(digits)
									if (codeInvalid) setCodeInvalid(false)
								}}
								onKeyDown={(e) => {
									const allowed = [
										'Backspace',
										'Delete',
										'ArrowLeft',
										'ArrowRight',
										'Tab',
										'Home',
										'End',
										'Enter',
									]
									if (
										!/^\d$/.test(e.key) &&
										!allowed.includes(e.key) &&
										!(e.metaKey || e.ctrlKey)
									) {
										e.preventDefault()
									}
								}}
								$invalid={codeInvalid}
								maxLength={6}
								placeholder='123456'
								inputMode='numeric'
								pattern='\d*'
								autoComplete='one-time-code'
								autoFocus
							/>
						</RemoveTotpBody>
					}
					confirmLabel='Remove'
					confirmLoadingLabel='Removing…'
					confirmColor='error'
					isLoading={busy}
					onClose={() => {
						setModal(null)
						setTotpCode('')
						setCodeInvalid(false)
					}}
					onConfirm={() => {
						if (totpCode.length < 6) return
						confirmRemoveTotp()
					}}
				/>
			)}

			{modal === 'show-recovery' && newRecovery && (
				<Scrim
					$closing={closing}
					onClick={() => codesSaved && closeModal()}
				>
					<Modal $closing={closing} onClick={(e) => e.stopPropagation()}>
						<ModalHead>
							<ShieldOutlined />
							<h3>Your new recovery codes</h3>
						</ModalHead>
						<p>
							Any previous codes have been invalidated. Save these somewhere
							safe — each works once and we won&apos;t show them again.
						</p>
						<RecoveryGrid>
							{newRecovery.map((c, i) => (
								<li key={c}>
									<span className='n'>{i + 1}.</span>
									<code>{c}</code>
								</li>
							))}
						</RecoveryGrid>
						<CodeActions>
							<CodeActionBtn
								type='button'
								onClick={() => copyAll(newRecovery)}
								$success={copied}
							>
								{copied ? (
									<>
										<CheckRounded style={{ fontSize: 16 }} />
										Copied
									</>
								) : (
									<>
										<ContentCopyOutlined style={{ fontSize: 16 }} />
										Copy all
									</>
								)}
							</CodeActionBtn>
							<CodeActionBtn
								type='button'
								onClick={() => downloadCodes(newRecovery)}
							>
								<FileDownloadOutlined style={{ fontSize: 16 }} />
								Download .txt
							</CodeActionBtn>
						</CodeActions>
						<ConfirmCheckbox>
							<input
								type='checkbox'
								checked={codesSaved}
								onChange={(e) => setCodesSaved(e.target.checked)}
							/>
							<span>
								I saved these codes and understand they won&apos;t be
								shown again
							</span>
						</ConfirmCheckbox>
						<ModalActions>
							<PrimaryBtn
								type='button'
								onClick={() =>
									closeModal(() => {
										setNewRecovery(null)
										setCodesSaved(false)
									})
								}
								disabled={!codesSaved}
							>
								Done
							</PrimaryBtn>
						</ModalActions>
					</Modal>
				</Scrim>
			)}
		</Grid>
	)
}

export default VaultSettings

/* ─── Styles ────────────────────────────────────────────────────── */

const pageFadeIn = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
`

const cardFadeIn = keyframes`
	from { opacity: 0; transform: translateY(14px); }
	to { opacity: 1; transform: translateY(0); }
`

const Grid = styled.div`
	display: grid;
	gap: 16px;
	grid-template-columns: 1fr;
	animation: ${pageFadeIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (min-width: 900px) {
		grid-template-columns: 1fr 1fr;
	}
`

const Card = styled.section`
	background: #ffffff;
	border-radius: 14px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	padding: 20px 22px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	animation: ${cardFadeIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-child(1) {
		animation-delay: 80ms;
	}
	&:nth-child(2) {
		animation-delay: 160ms;
	}
	&:nth-child(3) {
		animation-delay: 240ms;
	}
`

const CardHead = styled.header`
	display: grid;
	grid-template-columns: 44px 1fr;
	gap: 14px;
	align-items: center;
`

const HeadIcon = styled.div<{ $tone: 'sky' | 'violet' | 'amber' }>`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${(p) =>
		p.$tone === 'sky'
			? 'linear-gradient(135deg, #38bdf8, #0284c7)'
			: p.$tone === 'violet'
				? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
				: 'linear-gradient(135deg, #fcd34d, #d97706)'};
	color: #ffffff;

	svg {
		font-size: 22px;
	}
`

const HeadText = styled.div`
	min-width: 0;

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 15.5px;
		letter-spacing: -0.2px;
		color: #0f172a;
	}

	p {
		margin: 3px 0 0;
		font-size: 12px;
		color: #64748b;
		line-height: 1.4;
	}
`

const StatusPill = styled.span<{ $tone: 'ok' | 'warn' | 'off' }>`
	padding: 4px 10px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${(p) =>
		p.$tone === 'ok'
			? 'rgba(5, 150, 105, 0.12)'
			: p.$tone === 'warn'
				? 'rgba(217, 119, 6, 0.14)'
				: 'rgba(100, 116, 139, 0.1)'};
	color: ${(p) =>
		p.$tone === 'ok'
			? '#047857'
			: p.$tone === 'warn'
				? '#b45309'
				: '#64748b'};
`

const DeviceList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const DeviceRow = styled.li`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 10px;
	background: rgba(3, 105, 161, 0.04);
`

const DeviceInfo = styled.div`
	strong {
		display: block;
		font-size: 12.5px;
		color: #0f172a;
		font-weight: 600;
	}
`

const DeviceMeta = styled.span`
	font-size: 10.5px;
	color: #64748b;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
`

const CardActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	/* StatusPill, when placed here, pushes to the right edge of the
	 * action row so it sits next to the primary button. */
	& > [data-status-pill] {
		margin-left: auto;
	}
`

const InlineWarn = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 9px 12px;
	border-radius: 10px;
	background: rgba(217, 119, 6, 0.1);
	border: 1px solid rgba(217, 119, 6, 0.22);
	color: #92400e;
	font-size: 12px;
`

const DisabledNote = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 9px 12px;
	border-radius: 10px;
	background: rgba(100, 116, 139, 0.06);
	color: #475569;
	font-size: 12px;
`

const PrimaryBtn = styled.button<{ $variant?: 'ghost' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 16px;
	border-radius: 10px;
	border: ${(p) =>
		p.$variant === 'ghost' ? '1.5px solid rgba(15, 23, 42, 0.12)' : 'none'};
	background: ${(p) =>
		p.$variant === 'ghost'
			? '#ffffff'
			: 'linear-gradient(135deg, #0284c7, #0369a1)'};
	color: ${(p) => (p.$variant === 'ghost' ? '#0369a1' : '#ffffff')};
	font: inherit;
	font-weight: 600;
	font-size: 12.5px;
	cursor: pointer;
	transition:
		transform 160ms,
		box-shadow 180ms,
		border-color 180ms;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		${(p) =>
			p.$variant === 'ghost'
				? 'border-color: #0369a1;'
				: 'box-shadow: 0 4px 14px rgba(3, 105, 161, 0.3);'}
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const GhostBtn = styled.button`
	padding: 9px 16px;
	border-radius: 10px;
	border: none;
	background: transparent;
	color: #64748b;
	font: inherit;
	font-size: 12.5px;
	font-weight: 500;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.04);
		color: #0f172a;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const DangerBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 9px 16px;
	border-radius: 10px;
	border: 1.5px solid rgba(220, 38, 38, 0.35);
	background: #ffffff;
	color: #b91c1c;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 180ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
		transform-origin: 50% 20%;
	}

	&:hover:not(:disabled) {
		border-color: #dc2626;
	}
	&:hover:not(:disabled) svg {
		transform: rotate(-16deg);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
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
	background: rgba(15, 23, 42, 0.5);
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

const Modal = styled.div<{ $closing?: boolean }>`
	background: #ffffff;
	border-radius: 16px;
	padding: 24px 26px;
	width: calc(100% - 40px);
	max-width: 460px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${(p) => (p.$closing ? panelScaleOut : panelScaleIn)}
		${(p) => (p.$closing ? '400ms' : '240ms')}
		${(p) =>
			p.$closing
				? 'cubic-bezier(0.65, 0, 0.35, 1)'
				: 'cubic-bezier(0.4, 0, 0.2, 1)'}
		${(p) => (p.$closing ? '320ms' : '0ms')}
		forwards;

	p {
		margin: 0;
		font-size: 13px;
		color: #475569;
		line-height: 1.5;
	}
`

const ModalHead = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	svg {
		color: #0369a1;
		font-size: 22px;
	}

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 17px;
	}
`

const ModalActions = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	margin-top: 4px;
`

const LabelInput = styled.input`
	padding: 10px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	font: inherit;
	font-size: 13px;
	outline: none;

	&:focus {
		border-color: #0369a1;
		box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.14);
	}
`

const SecretBox = styled.div`
	padding: 12px 14px;
	border-radius: 10px;
	background: #0f172a;
	color: #e2e8f0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;

	code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13.5px;
		font-weight: 700;
		letter-spacing: 1px;
		word-break: break-all;
	}
`

const CopySecretBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 6px 10px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: #e2e8f0;
	font: inherit;
	font-size: 11px;
	cursor: pointer;
	flex-shrink: 0;

	&:hover {
		background: rgba(255, 255, 255, 0.18);
	}
`

const OtpauthLink = styled.a`
	display: inline-block;
	padding: 7px 14px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font-weight: 600;
	font-size: 12px;
	text-decoration: none;
	align-self: flex-start;
`

const CodeInput = styled.input`
	padding: 12px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 18px;
	letter-spacing: 4px;
	text-align: center;
	outline: none;

	&:focus {
		border-color: #0369a1;
		box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.14);
	}
`

const RemoveTotpBody = styled.span`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 12px;
	text-align: left;
`

const CodeInputConfirm = styled.input<{ $invalid?: boolean }>`
	width: 100%;
	padding: 12px 14px;
	border-radius: 10px;
	border: 1.5px solid
		${(p) => (p.$invalid ? '#dc2626' : 'rgba(15, 23, 42, 0.14)')};
	background: #ffffff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 20px;
	font-weight: 700;
	letter-spacing: 6px;
	text-align: center;
	color: #0f172a;
	outline: none;
	box-sizing: border-box;
	transition: border-color 180ms cubic-bezier(0.22, 1, 0.36, 1);

	&:focus {
		border-color: ${(p) =>
			p.$invalid ? '#dc2626' : 'rgba(15, 23, 42, 0.3)'};
		box-shadow: none;
	}

	&::placeholder {
		color: #a5a1b0;
		letter-spacing: 6px;
		font-weight: 500;
	}
`

const RecoveryGrid = styled.ol`
	list-style: none;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	padding: 14px;
	border-radius: 12px;
	background: #0f172a;
	color: #e2e8f0;
	margin: 0;

	li {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.n {
		font-size: 11px;
		color: rgba(203, 213, 225, 0.5);
		font-family: 'JetBrains Mono', ui-monospace, monospace;
	}

	code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13px;
		letter-spacing: 1px;
	}
`

const CodeActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

const CodeActionBtn = styled.button<{ $success?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1.5px solid
		${(p) => (p.$success ? '#047857' : 'rgba(15, 23, 42, 0.12)')};
	background: ${(p) => (p.$success ? 'rgba(5, 150, 105, 0.08)' : '#ffffff')};
	color: ${(p) => (p.$success ? '#047857' : '#334155')};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
`

const ConfirmCheckbox = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px 14px;
	border-radius: 10px;
	background: rgba(3, 105, 161, 0.08);
	border: 1px solid rgba(3, 105, 161, 0.25);
	cursor: pointer;

	input {
		margin-top: 2px;
		accent-color: #0369a1;
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	span {
		font-size: 12.5px;
		color: #0c4a6e;
		line-height: 1.45;
	}
`
