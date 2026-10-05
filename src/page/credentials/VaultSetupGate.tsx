import { useEffect, useRef, useState } from 'react'
import type {
	ClipboardEvent as ReactClipboardEvent,
	KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import styled, { css, keyframes } from 'styled-components'
import {
	ShieldOutlined,
	LockOpenOutlined,
	FingerprintOutlined,
	KeyOutlined,
	ContentCopyOutlined,
	FileDownloadOutlined,
	CheckRounded,
} from '@mui/icons-material'
import { useToast } from '../../context/toast/ToastContext'
import {
	startAuthentication,
	startRegistration,
} from '@simplewebauthn/browser'
import {
	useGetVaultStatusQuery,
	usePasskeyAssertOptionsMutation,
	usePasskeyRegisterOptionsMutation,
	usePasskeyRegisterVerifyMutation,
	useRecoveryGenerateMutation,
	useTotpConfirmMutation,
	useTotpEnrollMutation,
	useUnlockVaultMutation,
} from '../../store/credentials/vaultApi'
import parseServerError from '../../utils/parseServerError'

type DrawerMode = null | 'setup' | 'unlock'

/**
 * Invisible gate — renders no bar / UI chrome. Shows:
 *   • MFA setup drawer, once, when the user has no second factor yet.
 *   • Unlock drawer when the user tries to use the vault without an
 *     active session (triggered externally; see `openUnlock()`).
 *
 * The visible status indicator (Dynamic Island floating pill) lives in
 * `CredentialsLanding.page.tsx` so it does not steal layout space here.
 */
export const VAULT_REQUEST_UNLOCK = 'vault:request-unlock'

const VaultSetupGate = () => {
	const { data: status, refetch } = useGetVaultStatusQuery()
	const [drawer, setDrawer] = useState<DrawerMode>(null)
	const { showToast } = useToast()
	const prevExpiresAtRef = useRef<string | null>(null)
	const expiredNotifiedRef = useRef(false)

	useEffect(() => {
		if (!status) return
		if (!status.mfa?.hasAnyFactor && drawer === null) setDrawer('setup')
	}, [status, drawer])

	useEffect(() => {
		const onReq = () => {
			if (!status) return
			if (!status.mfa?.hasAnyFactor) setDrawer('setup')
			else setDrawer('unlock')
		}
		window.addEventListener(VAULT_REQUEST_UNLOCK, onReq)
		return () => window.removeEventListener(VAULT_REQUEST_UNLOCK, onReq)
	}, [status])

	// Detect session expiry mid-work and toast once per session.
	// A session that we previously saw as active (expiresAt in the future)
	// and now shows as expired → surface a toast so the user knows why
	// their next click fails. Reset the flag whenever a NEW session is
	// seen so the toast fires again next time it expires.
	useEffect(() => {
		if (!status) return
		const currentExpiresAt = status.session?.expiresAt ?? null
		const prevExpiresAt = prevExpiresAtRef.current
		if (currentExpiresAt && currentExpiresAt !== prevExpiresAt) {
			expiredNotifiedRef.current = false
		}
		prevExpiresAtRef.current = currentExpiresAt
	}, [status])

	useEffect(() => {
		const id = window.setInterval(() => {
			const expiresAt = prevExpiresAtRef.current
			if (!expiresAt || expiredNotifiedRef.current) return
			if (new Date(expiresAt).getTime() <= Date.now()) {
				expiredNotifiedRef.current = true
				showToast(
					'Vault session expired — unlock again to continue',
					'warning',
				)
				refetch()
			}
		}, 1000)
		return () => window.clearInterval(id)
	}, [showToast, refetch])

	if (!status) return null
	const mfa = status.mfa

	return (
		<>
			{drawer === 'setup' && (
				<MfaSetupDrawer
					onClose={() => {
						setDrawer(null)
						refetch()
					}}
					onDone={() => {
						setDrawer('unlock')
						refetch()
					}}
				/>
			)}
			{drawer === 'unlock' && (
				<UnlockDrawer
					mfa={mfa}
					onClose={() => setDrawer(null)}
					onSuccess={() => {
						setDrawer(null)
						refetch()
					}}
				/>
			)}
		</>
	)
}

export default VaultSetupGate

/* ─── MFA setup drawer ────────────────────────────────────────────── */

const MfaSetupDrawer = ({
	onClose,
	onDone,
}: {
	onClose: () => void
	onDone: () => void
}) => {
	const [stage, setStage] = useState<
		| 'intro'
		| 'passkey-label'
		| 'passkey'
		| 'totp-enroll'
		| 'totp-confirm'
		| 'recovery'
	>('intro')
	const [totp, setTotp] = useState<{ secret: string; otpauth: string } | null>(null)
	const [confirmCode, setConfirmCode] = useState('')
	const [recovery, setRecovery] = useState<string[] | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const [passkeyLabel, setPasskeyLabel] = useState('')
	const [codesConfirmed, setCodesConfirmed] = useState(false)
	const [copiedCodes, setCopiedCodes] = useState(false)
	const { showToast } = useToast()

	const copyRecoveryCodes = async () => {
		if (!recovery) return
		try {
			await navigator.clipboard.writeText(recovery.join('\n'))
			setCopiedCodes(true)
			showToast('Recovery codes copied to clipboard', 'success')
			window.setTimeout(() => setCopiedCodes(false), 2000)
		} catch {
			showToast('Could not copy — select and copy manually', 'error')
		}
	}

	const downloadRecoveryCodes = () => {
		if (!recovery) return
		const body = [
			'Sargas CRM — Vault recovery codes',
			`Generated: ${new Date().toISOString()}`,
			'',
			'Each code can be used once. Keep this file safe.',
			'',
			...recovery.map((c, i) => `${String(i + 1).padStart(2, ' ')}. ${c}`),
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

	const [passkeyOpts] = usePasskeyRegisterOptionsMutation()
	const [passkeyVerify] = usePasskeyRegisterVerifyMutation()
	const [totpEnroll] = useTotpEnrollMutation()
	const [totpConfirm] = useTotpConfirmMutation()
	const [recoveryGen] = useRecoveryGenerateMutation()

	const beginPasskey = async () => {
		setErr(null)
		if (!passkeyLabel.trim()) {
			setErr('Enter a device label first')
			return
		}
		try {
			const options = (await passkeyOpts().unwrap()) as never
			const response = await startRegistration({ optionsJSON: options })
			await passkeyVerify({
				response,
				deviceLabel: passkeyLabel.trim(),
			}).unwrap()
			setStage('recovery')
			const { codes } = await recoveryGen().unwrap()
			setRecovery(codes)
		} catch (e) {
			setErr((e as Error).message ?? 'Passkey registration failed')
		}
	}

	const beginTotp = async () => {
		setErr(null)
		const result = await totpEnroll().unwrap()
		setTotp(result)
		setStage('totp-confirm')
	}

	const confirmTotp = async () => {
		setErr(null)
		try {
			await totpConfirm({ code: confirmCode.trim() }).unwrap()
			const { codes } = await recoveryGen().unwrap()
			setRecovery(codes)
			setStage('recovery')
		} catch (e) {
			setErr((e as Error).message ?? 'TOTP code did not verify')
		}
	}

	return (
		<Scrim onClick={onClose}>
			<Panel onClick={(e) => e.stopPropagation()}>
				<PanelHead>
					<span className='ico'>
						<ShieldOutlined />
					</span>
					<div>
						<h2>Protect your vault</h2>
						<p>Set up a second factor to access credentials.</p>
					</div>
				</PanelHead>
				{stage === 'intro' && (
					<FactorGrid>
						<FactorCard onClick={() => setStage('passkey-label')}>
							<FingerprintOutlined />
							<strong>Passkey</strong>
							<span>Device biometrics or security key. Preferred.</span>
						</FactorCard>
						<FactorCard onClick={beginTotp}>
							<KeyOutlined />
							<strong>Authenticator app</strong>
							<span>Google Authenticator, 1Password, Authy…</span>
						</FactorCard>
					</FactorGrid>
				)}
				{stage === 'passkey-label' && (
					<PasskeyLabelStage>
						<p>
							Name this device so you can recognize it later (e.g.
							&quot;MacBook Pro&quot;, &quot;iPhone 15&quot;, or
							&quot;YubiKey&quot;).
						</p>
						<LabelInput
							placeholder='Device label'
							value={passkeyLabel}
							onChange={(e) => setPasskeyLabel(e.target.value)}
							autoFocus
						/>
						<PrimaryBtn
							onClick={beginPasskey}
							disabled={!passkeyLabel.trim()}
						>
							Register passkey
						</PrimaryBtn>
					</PasskeyLabelStage>
				)}
				{stage === 'totp-confirm' && totp && (
					<TotpConfirm>
						<p>
							Scan this with your authenticator app or paste the shared
							secret below. Then enter the 6-digit code to confirm.
						</p>
						<SecretBox>
							<SecretTop>
								<code>{totp.secret}</code>
								<CopySecretBtn
									type='button'
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(totp.secret)
											showToast('Secret copied', 'success')
										} catch {
											showToast('Could not copy', 'error')
										}
									}}
								>
									<ContentCopyOutlined style={{ fontSize: 14 }} />
									Copy
								</CopySecretBtn>
							</SecretTop>
							<span>Shared secret (keep private)</span>
						</SecretBox>
						<OtpauthLink href={totp.otpauth}>
							Open otpauth:// URL
						</OtpauthLink>
						<CodeInput
							value={confirmCode}
							onChange={(e) => setConfirmCode(e.target.value)}
							maxLength={6}
							placeholder='123456'
						/>
						<PrimaryBtn
							onClick={confirmTotp}
							disabled={confirmCode.length < 6}
						>
							Confirm & save
						</PrimaryBtn>
					</TotpConfirm>
				)}
				{stage === 'recovery' && recovery && (
					<RecoveryList>
						<h3>Save your recovery codes</h3>
						<p>
							These codes let you back into the vault if you lose your
							device. Store them somewhere safe — each code works once.
							We&apos;ll never show them again.
						</p>
						<RecoveryGrid>
							{recovery.map((c, i) => (
								<li key={c}>
									<span className='n'>{i + 1}.</span>
									<code>{c}</code>
								</li>
							))}
						</RecoveryGrid>
						<CodeActions>
							<CodeActionBtn
								type='button'
								onClick={copyRecoveryCodes}
								$success={copiedCodes}
							>
								{copiedCodes ? (
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
								onClick={downloadRecoveryCodes}
							>
								<FileDownloadOutlined style={{ fontSize: 16 }} />
								Download .txt
							</CodeActionBtn>
						</CodeActions>
						<ConfirmCheckbox>
							<input
								type='checkbox'
								checked={codesConfirmed}
								onChange={(e) => setCodesConfirmed(e.target.checked)}
							/>
							<span>
								I saved these codes in a safe place and understand they
								won&apos;t be shown again
							</span>
						</ConfirmCheckbox>
						<PrimaryBtn onClick={onDone} disabled={!codesConfirmed}>
							Continue to unlock
						</PrimaryBtn>
					</RecoveryList>
				)}
				{err && <ErrBanner>{err}</ErrBanner>}
			</Panel>
		</Scrim>
	)
}

/* ─── Unlock drawer ──────────────────────────────────────────────── */

const OTP_LEN = 6

const UnlockDrawer = ({
	mfa,
	onClose,
	onSuccess,
}: {
	mfa: { hasAnyFactor: boolean; webauthn: unknown[]; hasTotp: boolean }
	onClose: () => void
	onSuccess: () => void
}) => {
	const hasPasskey = mfa.webauthn.length > 0
	const [mode, setMode] = useState<'totp' | 'recovery'>(
		mfa.hasTotp ? 'totp' : 'recovery',
	)
	const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''))
	const [recoveryCode, setRecoveryCode] = useState('')
	const [err, setErr] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [success, setSuccess] = useState(false)
	const [shake, setShake] = useState(false)
	const [closing, setClosing] = useState(false)
	const [poppedIdx, setPoppedIdx] = useState<number | null>(null)
	const inputRefs = useRef<Array<HTMLInputElement | null>>([])
	const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
	const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

	const requestClose = () => {
		if (closing) return
		setClosing(true)
		window.setTimeout(() => onClose(), 220)
	}

	const tabs: Array<'passkey' | 'totp' | 'recovery'> = [
		...(hasPasskey ? (['passkey'] as const) : []),
		...(mfa.hasTotp ? (['totp'] as const) : []),
		'recovery',
	]
	const activeIdx = tabs.indexOf(mode)

	useEffect(() => {
		const el = tabRefs.current[activeIdx]
		if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
	}, [activeIdx, mode])
	const [unlock] = useUnlockVaultMutation()
	const [assertOpts] = usePasskeyAssertOptionsMutation()

	useEffect(() => {
		const t = window.setTimeout(() => inputRefs.current[0]?.focus(), 120)
		return () => window.clearTimeout(t)
	}, [mode])

	const resetDigits = () => {
		setDigits(Array(OTP_LEN).fill(''))
		inputRefs.current[0]?.focus()
	}

	const triggerError = (msg: string) => {
		setErr(msg)
		setShake(true)
		window.setTimeout(() => setShake(false), 460)
		window.setTimeout(() => {
			if (mode === 'totp') resetDigits()
			else setRecoveryCode('')
		}, 500)
	}

	const doUnlock = async (payload?: {
		method: 'totp' | 'recovery' | 'passkey'
		code?: string
	}) => {
		setErr(null)
		setBusy(true)
		try {
			if (payload?.method === 'passkey') {
				const options = (await assertOpts().unwrap()) as never
				const assertion = await startAuthentication({ optionsJSON: options })
				await unlock({ method: 'passkey', assertion }).unwrap()
			} else {
				const method = payload?.method ?? mode
				const code =
					payload?.code ??
					(mode === 'totp' ? digits.join('') : recoveryCode.trim())
				if (method === 'totp' && code.length !== OTP_LEN) {
					triggerError('Enter all 6 digits')
					return
				}
				if (method === 'recovery' && code.length < 10) {
					triggerError('Recovery code is too short')
					return
				}
				await unlock({ method, code }).unwrap()
			}
			setSuccess(true)
			window.setTimeout(() => {
				setClosing(true)
				window.setTimeout(() => onSuccess(), 220)
			}, 1400)
		} catch (e) {
			console.error('[vault unlock]', e)
			const message =
				parseServerError(e) || 'Code incorrect — try again'
			triggerError(message)
		} finally {
			setBusy(false)
		}
	}

	const onDigitChange = (idx: number, raw: string) => {
		const char = raw.replace(/\D/g, '').slice(-1)
		if (!char && raw.length > 0) return
		const next = [...digits]
		next[idx] = char
		setDigits(next)
		if (char && err) setErr(null)
		if (char) {
			setPoppedIdx(idx)
			window.setTimeout(() => setPoppedIdx(null), 220)
		}
		if (char && idx < OTP_LEN - 1) {
			inputRefs.current[idx + 1]?.focus()
		}
		if (char && idx === OTP_LEN - 1 && next.every((d) => d)) {
			void doUnlock({ method: 'totp', code: next.join('') })
		}
	}

	const onDigitKey = (
		idx: number,
		e: ReactKeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === 'Backspace') {
			if (digits[idx]) {
				const next = [...digits]
				next[idx] = ''
				setDigits(next)
			} else if (idx > 0) {
				inputRefs.current[idx - 1]?.focus()
				const next = [...digits]
				next[idx - 1] = ''
				setDigits(next)
			}
		}
		if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus()
		if (e.key === 'ArrowRight' && idx < OTP_LEN - 1)
			inputRefs.current[idx + 1]?.focus()
	}

	const onPaste = (e: ReactClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
		if (!text) return
		const next = Array(OTP_LEN).fill('')
		for (let i = 0; i < text.length; i++) next[i] = text[i]
		setDigits(next)
		const focusIdx = Math.min(text.length, OTP_LEN - 1)
		inputRefs.current[focusIdx]?.focus()
		if (text.length === OTP_LEN) {
			void doUnlock({ method: 'totp', code: text })
		}
	}

	if (success) {
		return (
			<Scrim onClick={requestClose} $closing={closing}>
				<FullPanel
					onClick={(e) => e.stopPropagation()}
					$closing={closing}
				>
					<SuccessColumn>
						<SuccessHeroBg />
						<SuccessRing>
							<svg
								width='32'
								height='32'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='3'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<polyline
									className='check-path'
									points='20 6 9 17 4 12'
								/>
							</svg>
						</SuccessRing>
						<SuccessTitle>Vault unlocked</SuccessTitle>
						<SuccessSub>Session expires in 1 hour</SuccessSub>
					</SuccessColumn>
				</FullPanel>
			</Scrim>
		)
	}

	return (
		<Scrim onClick={requestClose} $closing={closing}>
			<SplitPanel
				onClick={(e) => e.stopPropagation()}
				$shake={shake}
				$closing={closing}
			>
				<HeroLeft>
					<HeroIcon>
						<AnimatedLock $busy={busy} />
					</HeroIcon>
					<HeroMeta>
						<HeroMetaRow>
							<HeroLabel>Session</HeroLabel>
							<HeroValue>1 hour</HeroValue>
						</HeroMetaRow>
						<HeroMetaRow>
							<HeroLabel>Guarded by</HeroLabel>
							<HeroValue>RBAC + MFA</HeroValue>
						</HeroMetaRow>
					</HeroMeta>
				</HeroLeft>

				<FormRight>
					<AnimatedContent key='form'>
						<>
							<FormTitle>Unlock the vault</FormTitle>
							<FormSub>Prove it&apos;s you to access shared credentials.</FormSub>

							<UnderlineTabs>
								{tabs.map((t, i) => {
									const isActive =
										t === 'passkey' ? false : mode === t
									const Icon =
										t === 'passkey'
											? FingerprintOutlined
											: t === 'totp'
												? KeyOutlined
												: ShieldOutlined
									const label =
										t === 'passkey'
											? 'Passkey'
											: t === 'totp'
												? 'Authenticator'
												: 'Recovery code'
									return (
										<UnderlineTab
											key={t}
											ref={(el) => {
												tabRefs.current[i] = el
											}}
											$active={isActive}
											$kind={t}
											type='button'
											onClick={() => {
												if (t === 'passkey') {
													void doUnlock({ method: 'passkey' })
												} else {
													setMode(t)
													setErr(null)
												}
											}}
										>
											<Icon
												style={{ fontSize: 15 }}
												className='tab-ico'
											/>
											{label}
										</UnderlineTab>
									)
								})}
								{indicator && (
									<TabIndicator
										style={{
											left: indicator.left,
											width: indicator.width,
										}}
									/>
								)}
							</UnderlineTabs>

							<AnimatedField key={mode}>
								{mode === 'totp' ? (
									<OtpRow>
										{digits.map((d, i) => (
											<OtpBox
												key={i}
												ref={(el) => {
													inputRefs.current[i] = el
												}}
												value={d}
												inputMode='numeric'
												autoComplete='one-time-code'
												maxLength={1}
												disabled={busy}
												$filled={!!d}
												$error={!!err}
												$pop={poppedIdx === i}
												onChange={(e) => onDigitChange(i, e.target.value)}
												onKeyDown={(e) => onDigitKey(i, e)}
												onPaste={onPaste}
												onFocus={(e) => e.target.select()}
											/>
										))}
									</OtpRow>
								) : (
									<RecoveryInput
										autoFocus
										value={recoveryCode}
										$error={!!err}
										disabled={busy}
										placeholder='xxxx-xxxx-xxxx'
										maxLength={14}
										onChange={(e) => setRecoveryCode(e.target.value)}
									/>
								)}
							</AnimatedField>

							<ErrSlot>
								{err && (
									<ErrMsg>
										<svg
											width='13'
											height='13'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.5'
											strokeLinecap='round'
										>
											<circle cx='12' cy='12' r='10' />
											<line x1='12' y1='8' x2='12' y2='12' />
											<line x1='12' y1='16' x2='12.01' y2='16' />
										</svg>
										{err}
									</ErrMsg>
								)}
							</ErrSlot>

							<LostAccessNote>
								Lost every device <em>and</em> recovery codes?{' '}
								<strong>Contact an admin to reset vault access.</strong>
							</LostAccessNote>

							<FootRow>
								<GhostBtn
									type='button'
									onClick={requestClose}
									disabled={busy}
								>
									Cancel
								</GhostBtn>
								<PrimaryCta
									type='button'
									onClick={() => doUnlock()}
									disabled={
										busy ||
										(mode === 'totp'
											? digits.some((d) => !d)
											: recoveryCode.trim().length < 10)
									}
								>
									{busy ? (
										<>
											<Spinner /> Verifying…
										</>
									) : (
										'Unlock vault'
									)}
								</PrimaryCta>
							</FootRow>
						</>
					</AnimatedContent>
				</FormRight>
			</SplitPanel>
		</Scrim>
	)
}

/* ─── Styles ──────────────────────────────────────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`

const fadeOut = keyframes`
	from { opacity: 1; }
	to { opacity: 0; }
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
	animation: ${(p) => (p.$closing ? fadeOut : fadeIn)} 220ms ease-out forwards;
`

const Panel = styled.div`
	background: #ffffff;
	border-radius: 20px;
	padding: 28px 32px 26px;
	max-width: 460px;
	width: calc(100% - 40px);
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${fadeIn} 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
`

const PanelHead = styled.div`
	display: flex;
	gap: 14px;
	margin-bottom: 18px;
	.ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 12px;
		background: linear-gradient(135deg, #38bdf8, #0284c7);
		color: #fff;
	}
	.ico svg {
		font-size: 22px;
	}
	h2 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 20px;
		letter-spacing: -0.4px;
	}
	p {
		margin: 2px 0 0;
		font-size: 13px;
		color: #64748b;
	}
`

const FactorGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	@media (max-width: 540px) {
		grid-template-columns: 1fr;
	}
`

const FactorCard = styled.button`
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 18px 16px;
	border-radius: 14px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #fafafd;
	text-align: left;
	cursor: pointer;
	font: inherit;
	transition:
		border-color 200ms,
		transform 220ms;
	&:hover {
		border-color: #0369a1;
		transform: translateY(-2px);
	}
	svg {
		font-size: 26px;
		color: #0369a1;
	}
	strong {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 700;
		font-size: 14px;
	}
	span {
		font-size: 12px;
		color: #64748b;
	}
`

const TotpConfirm = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	p {
		margin: 0;
		font-size: 13px;
		color: #475569;
	}
`

const SecretBox = styled.div`
	padding: 12px 14px;
	border-radius: 10px;
	background: #0f172a;
	color: #e2e8f0;
	code {
		display: block;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 1px;
	}
	span {
		display: block;
		font-size: 11px;
		color: rgba(203, 213, 225, 0.7);
		margin-top: 4px;
	}
`

const OtpauthLink = styled.a`
	display: inline-block;
	padding: 7px 14px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font-weight: 600;
	font-size: 12.5px;
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

const PrimaryBtn = styled.button`
	padding: 11px 16px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #0284c7, #0369a1);
	color: #fff;
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`

const RecoveryList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 16px;
	}
	p {
		margin: 0;
		font-size: 13px;
		color: #64748b;
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

const PasskeyLabelStage = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;

	p {
		margin: 0;
		font-size: 13px;
		color: #475569;
	}
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

const SecretTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
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
	transition:
		border-color 180ms,
		background 180ms,
		color 180ms;

	&:hover {
		border-color: #0369a1;
		color: #0369a1;
	}
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
		cursor: pointer;
		flex-shrink: 0;
	}

	span {
		font-size: 12.5px;
		color: #0c4a6e;
		line-height: 1.45;
	}
`

const MethodRow = styled.div`
	display: flex;
	gap: 8px;
	margin-bottom: 14px;
	flex-wrap: wrap;
`

const MethodChip = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 12px;
	border-radius: 999px;
	border: 1.5px solid
		${(p) => (p.$active ? '#0369a1' : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) =>
		p.$active ? 'rgba(3, 105, 161, 0.1)' : '#ffffff'};
	color: ${(p) => (p.$active ? '#0369a1' : '#334155')};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
`

const ErrBanner = styled.div`
	margin-top: 12px;
	padding: 10px 14px;
	border-radius: 10px;
	background: rgba(220, 38, 38, 0.1);
	color: #b91c1c;
	font-size: 12.5px;
`

/* ─── V2 · Split card hero styles ─────────────────────────────── */

const shakeKf = keyframes`
	10%, 90% { transform: translateX(-1px); }
	20%, 80% { transform: translateX(2px); }
	30%, 50%, 70% { transform: translateX(-5px); }
	40%, 60% { transform: translateX(5px); }
`

const scaleIn = keyframes`
	from { opacity: 0; transform: scale(0.94) translateY(8px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
`

const scaleOut = keyframes`
	from { opacity: 1; transform: scale(1) translateY(0); }
	to { opacity: 0; transform: scale(0.96) translateY(4px); }
`

const spinKf = keyframes`
	to { transform: rotate(360deg); }
`

const popKf = keyframes`
	0% { transform: scale(1); }
	40% { transform: scale(1.08); }
	100% { transform: scale(1); }
`

const contentFadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

const SplitPanel = styled.div<{ $shake: boolean; $closing?: boolean }>`
	display: grid;
	grid-template-columns: 190px 1fr;
	width: calc(100% - 40px);
	max-width: 560px;
	background: #ffffff;
	border-radius: 22px;
	overflow: hidden;
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${(p) => (p.$closing ? scaleOut : scaleIn)} 220ms
		cubic-bezier(0.22, 1.12, 0.36, 1) forwards;

	${(p) =>
		p.$shake &&
		!p.$closing &&
		css`
			animation:
				${scaleIn} 220ms cubic-bezier(0.22, 1.12, 0.36, 1) forwards,
				${shakeKf} 0.46s cubic-bezier(0.36, 0.07, 0.19, 0.97);
		`}

	@media (max-width: 540px) {
		grid-template-columns: 1fr;
	}
`

const AnimatedContent = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 240px;
	animation: ${contentFadeIn} 260ms cubic-bezier(0.22, 1, 0.36, 1);
`

const AnimatedField = styled.div`
	min-height: 70px;
	display: flex;
	align-items: center;
	animation: ${contentFadeIn} 200ms cubic-bezier(0.22, 1, 0.36, 1);

	& > * {
		width: 100%;
	}
`

const HeroLeft = styled.div`
	position: relative;
	padding: 28px 22px;
	background: linear-gradient(160deg, #0369a1 0%, #075985 100%);
	color: #ffffff;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;
	gap: 20px;

	&::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -40%;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(56, 189, 248, 0.55) 0%,
			transparent 70%
		);
		pointer-events: none;
	}

	@media (max-width: 540px) {
		padding: 20px;
		flex-direction: row;
		align-items: center;
	}
`

const HeroIcon = styled.div`
	position: relative;
	z-index: 1;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.14);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.22);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const HeroMeta = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const HeroMetaRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const HeroLabel = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	letter-spacing: 1.2px;
	text-transform: uppercase;
	opacity: 0.7;
`

const HeroValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 500;
	letter-spacing: 0.2px;
`

const FormRight = styled.div`
	padding: 26px 28px 22px;
	display: flex;
	flex-direction: column;
	min-width: 0;
`

const FormTitle = styled.h2`
	margin: 0 0 4px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 19px;
	font-weight: 700;
	letter-spacing: -0.3px;
	color: #0a0a0f;
`

const FormSub = styled.p`
	margin: 0 0 18px;
	font-size: 12.5px;
	color: #64748b;
	line-height: 1.5;
`

const UnderlineTabs = styled.div`
	position: relative;
	display: flex;
	gap: 20px;
	margin: 0 0 18px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`

const keyWiggleKf = keyframes`
	0%, 100% { transform: rotate(0deg); }
	30% { transform: rotate(-18deg); }
	60% { transform: rotate(12deg); }
`

const shieldPulseKf = keyframes`
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.15); }
`

const fingerprintScanKf = keyframes`
	0%, 100% { opacity: 1; }
	50% { opacity: 0.55; }
`

const UnderlineTab = styled.button<{
	$active: boolean
	$kind: 'passkey' | 'totp' | 'recovery'
}>`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 2px;
	background: transparent;
	border: none;
	cursor: pointer;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	color: ${(p) => (p.$active ? '#0a0a0f' : '#94a3b8')};
	transition: color 180ms;

	.tab-ico {
		transition:
			color 180ms,
			transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);
		transform-origin: center;
		color: ${(p) => (p.$active ? '#0369a1' : '#94a3b8')};
	}

	&:hover {
		color: ${(p) => (p.$active ? '#0a0a0f' : '#475569')};
	}
	&:hover .tab-ico {
		color: ${(p) => (p.$active ? '#0369a1' : '#475569')};
		transform: scale(1.1);
	}

	${(p) =>
		p.$active &&
		p.$kind === 'totp' &&
		css`
			.tab-ico {
				animation: ${keyWiggleKf} 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
			}
		`}
	${(p) =>
		p.$active &&
		p.$kind === 'recovery' &&
		css`
			.tab-ico {
				animation: ${shieldPulseKf} 600ms cubic-bezier(0.22, 1, 0.36, 1);
			}
		`}
	${(p) =>
		p.$kind === 'passkey' &&
		css`
			.tab-ico {
				animation: ${fingerprintScanKf} 2.4s ease-in-out infinite;
			}
		`}

	@media (prefers-reduced-motion: reduce) {
		.tab-ico {
			animation: none !important;
			transform: none !important;
		}
	}
`

const TabIndicator = styled.span`
	position: absolute;
	bottom: -1px;
	height: 2px;
	background: linear-gradient(90deg, #0284c7, #0369a1);
	border-radius: 2px;
	transition:
		left 320ms cubic-bezier(0.4, 0, 0.2, 1),
		width 320ms cubic-bezier(0.4, 0, 0.2, 1);
	pointer-events: none;
`

const shackleIdleKf = keyframes`
	0%, 60%, 100% { transform: rotate(0deg); }
	75%, 88% { transform: rotate(42deg); }
`

const shackleBusyKf = keyframes`
	0%, 100% { transform: rotate(0deg); }
	50% { transform: rotate(45deg); }
`

const LockSvg = styled.svg<{ $busy: boolean }>`
	color: #ffffff;
	overflow: visible;

	.shackle {
		transform-box: fill-box;
		transform-origin: 100% 100%;
		animation: ${(p) => (p.$busy ? shackleBusyKf : shackleIdleKf)}
			${(p) => (p.$busy ? '0.9s' : '3.6s')}
			cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.shackle {
			animation: none;
		}
	}
`

const AnimatedLock = ({ $busy }: { $busy: boolean }) => (
	<LockSvg
		$busy={$busy}
		width='28'
		height='28'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.2'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path className='shackle' d='M7 11V7a5 5 0 0 1 10 0v4' />
		<rect className='body' x='3' y='11' width='18' height='11' rx='2' />
	</LockSvg>
)

const OtpRow = styled.div`
	display: flex;
	gap: 8px;
	margin: 0 0 18px;
`

const OtpBox = styled.input<{
	$filled: boolean
	$error: boolean
	$pop: boolean
}>`
	flex: 1;
	min-width: 0;
	height: 52px;
	border: 2px solid
		${(p) =>
			p.$error
				? '#dc2626'
				: p.$filled
					? '#0369a1'
					: 'rgba(15, 23, 42, 0.14)'};
	background: ${(p) =>
		p.$error
			? 'rgba(220, 38, 38, 0.08)'
			: p.$filled
				? 'rgba(3, 105, 161, 0.08)'
				: '#ffffff'};
	border-radius: 12px;
	text-align: center;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 22px;
	font-weight: 600;
	color: ${(p) => (p.$error ? '#b91c1c' : p.$filled ? '#0369a1' : '#0a0a0f')};
	outline: none;
	transition:
		border-color 180ms ease,
		background-color 180ms ease,
		color 180ms ease,
		box-shadow 180ms ease;
	${(p) =>
		p.$pop &&
		css`
			animation: ${popKf} 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
		`}

	&:focus {
		border-color: ${(p) => (p.$error ? '#dc2626' : '#0369a1')};
	}

	&:disabled {
		opacity: 0.6;
	}

	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const RecoveryInput = styled.input<{ $error: boolean }>`
	padding: 14px 16px;
	margin: 0 0 18px;
	border-radius: 12px;
	border: 2px solid
		${(p) => (p.$error ? '#dc2626' : 'rgba(15, 23, 42, 0.14)')};
	background: ${(p) =>
		p.$error ? 'rgba(220, 38, 38, 0.08)' : '#ffffff'};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 15px;
	letter-spacing: 2px;
	text-align: center;
	outline: none;

	&:focus {
		border-color: ${(p) => (p.$error ? '#dc2626' : '#0369a1')};
	}
`

const ErrSlot = styled.div`
	min-height: 22px;
	margin: -6px 0 10px;
	display: flex;
	align-items: center;
`

const LostAccessNote = styled.div`
	margin: 0 0 10px;
	padding: 8px 12px;
	border-radius: 8px;
	background: rgba(100, 116, 139, 0.05);
	color: #64748b;
	font-size: 11.5px;
	line-height: 1.45;

	em {
		font-style: italic;
	}

	strong {
		color: #334155;
		font-weight: 600;
	}
`

const ErrMsg = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #dc2626;
	font-weight: 500;
	animation: ${contentFadeIn} 180ms ease-out;
`

const FootRow = styled.div`
	display: flex;
	gap: 10px;
	justify-content: flex-end;
	align-items: center;
	margin-top: auto;
`

const GhostBtn = styled.button`
	padding: 10px 14px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: #64748b;
	font: inherit;
	font-weight: 500;
	font-size: 13px;
	border-radius: 10px;

	&:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.04);
		color: #0a0a0f;
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const PrimaryCta = styled.button`
	padding: 11px 20px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #0284c7, #0369a1);
	color: #ffffff;
	font: inherit;
	font-weight: 700;
	font-size: 13.5px;
	cursor: pointer;
	box-shadow: 0 4px 14px rgba(3, 105, 161, 0.3);
	display: inline-flex;
	align-items: center;
	gap: 8px;
	transition:
		transform 160ms,
		box-shadow 200ms;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(3, 105, 161, 0.4);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}
`

const Spinner = styled.span`
	width: 13px;
	height: 13px;
	border-radius: 50%;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: #ffffff;
	animation: ${spinKf} 0.7s linear infinite;
`

const ringPopKf = keyframes`
	0% { transform: scale(0); opacity: 0; }
	80% { transform: scale(1.1); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
`

const whiteRippleKf = keyframes`
	0% { transform: scale(0.6); opacity: 0.9; }
	100% { transform: scale(1.8); opacity: 0; }
`

const drawCheckKf = keyframes`
	to { stroke-dashoffset: 0; }
`

const slideUpKf = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`

const FullPanel = styled.div<{ $closing?: boolean }>`
	position: relative;
	width: calc(100% - 40px);
	max-width: 560px;
	background: #ffffff;
	border-radius: 22px;
	overflow: hidden;
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${(p) => (p.$closing ? scaleOut : scaleIn)} 220ms
		cubic-bezier(0.22, 1.12, 0.36, 1) forwards;
`

const SuccessHeroBg = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 140px;
	background: linear-gradient(160deg, #0369a1 0%, #075985 100%);
	overflow: hidden;
	z-index: 0;

	&::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -20%;
		width: 260px;
		height: 260px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(56, 189, 248, 0.55) 0%,
			transparent 70%
		);
		pointer-events: none;
	}
`

const SuccessColumn = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 44px 32px 32px;
	gap: 10px;
	min-height: 300px;
`

const SuccessRing = styled.div`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.18);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border: 1.5px solid rgba(255, 255, 255, 0.5);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	margin-bottom: 20px;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.3),
		inset 0 -1px 0 rgba(0, 0, 0, 0.12),
		0 6px 20px rgba(3, 105, 161, 0.4);
	animation: ${ringPopKf} 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);

	&::after {
		content: '';
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.6);
		animation: ${whiteRippleKf} 1s 0.1s ease-out backwards;
	}

	.check-path {
		stroke-dasharray: 24;
		stroke-dashoffset: 24;
		animation: ${drawCheckKf} 0.4s 0.3s ease-out forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::after { animation: none; display: none; }
		.check-path {
			stroke-dashoffset: 0;
			animation: none;
		}
	}
`

const SuccessContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 180px;
	gap: 8px;
	text-align: center;
`

const SuccessTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 24px;
	font-weight: 700;
	letter-spacing: -0.5px;
	color: #0a0a0f;
	opacity: 0;
	animation: ${slideUpKf} 0.45s 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;

	@media (prefers-reduced-motion: reduce) {
		opacity: 1;
		animation: none;
	}
`

const SuccessSub = styled.div`
	font-size: 13.5px;
	color: #64748b;
	line-height: 1.5;
	opacity: 0;
	animation: ${slideUpKf} 0.45s 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;

	@media (prefers-reduced-motion: reduce) {
		opacity: 1;
		animation: none;
	}
`


