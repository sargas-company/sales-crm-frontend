import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	BlockRounded,
	FingerprintOutlined,
	KeyOutlined,
} from '@mui/icons-material'
import { startAuthentication } from '@simplewebauthn/browser'
import { usePasskeyAssertOptionsMutation } from '../../store/credentials/vaultApi'

interface Props {
	title: string
	description: string
	confirmationLabel: string
	expectedConfirmation: string
	onConfirm: (payload: {
		confirmation: string
		mfa: { method: 'passkey' | 'totp'; code?: string; assertion?: unknown }
	}) => Promise<void>
	onClose: () => void
}

/**
 * Hard-delete gate. Even inside an active vault session the API refuses
 * the DELETE without:
 *   (1) a typed confirmation that matches the target label exactly, and
 *   (2) a fresh MFA proof (TOTP code or WebAuthn assertion).
 */
const HardDeleteModal = ({
	title,
	description,
	confirmationLabel,
	expectedConfirmation,
	onConfirm,
	onClose,
}: Props) => {
	const [confirmation, setConfirmation] = useState('')
	const [method, setMethod] = useState<'passkey' | 'totp'>('passkey')
	const [code, setCode] = useState('')
	const [busy, setBusy] = useState(false)
	const [err, setErr] = useState<string | null>(null)
	const [lastErr, setLastErr] = useState<string | null>(null)
	const [assertOpts] = usePasskeyAssertOptionsMutation()
	const totpRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (err) setLastErr(err)
	}, [err])

	const [open, setOpen] = useState(false)
	useEffect(() => {
		const t = requestAnimationFrame(() => setOpen(true))
		return () => cancelAnimationFrame(t)
	}, [])

	const closeWithAnim = useCallback(() => {
		setOpen(false)
		setTimeout(onClose, 220)
	}, [onClose])

	const ready =
		confirmation === expectedConfirmation &&
		(method === 'totp' ? code.length === 6 : true)

	useEffect(() => {
		if (method !== 'totp') return
		const t = setTimeout(() => totpRef.current?.focus(), 180)
		return () => clearTimeout(t)
	}, [method])

	const submit = async () => {
		setErr(null)
		setBusy(true)
		try {
			let assertion: unknown | undefined
			if (method === 'passkey') {
				const options = (await assertOpts().unwrap()) as never
				assertion = await startAuthentication({ optionsJSON: options })
			}
			await onConfirm({
				confirmation,
				mfa: {
					method,
					code: method === 'totp' ? code.trim() : undefined,
					assertion,
				},
			})
		} catch (e) {
			setErr(
				(e as { data?: { message?: string } }).data?.message ??
					(e as Error).message ??
					'Delete failed',
			)
			setBusy(false)
		}
	}

	const totpVisible = method === 'totp'

	const switchMethod = (next: 'passkey' | 'totp') => {
		if (next === method) return
		setErr(null)
		setMethod(next)
	}

	return (
		<Scrim $open={open} onClick={closeWithAnim}>
			<Panel $open={open} onClick={(e) => e.stopPropagation()}>
				<Head>
					<h2>{title}</h2>
					<p>{description}</p>
				</Head>
				<Body>
					<Field>
						<label>
							Type <strong>{expectedConfirmation}</strong> to confirm
						</label>
						<Input
							value={confirmation}
							onChange={(e) => setConfirmation(e.target.value)}
							placeholder={confirmationLabel}
						/>
					</Field>
					<Field>
						<label>Fresh MFA step-up</label>
						<MethodRow>
							<MethodChip
								type='button'
								$active={method === 'passkey'}
								onClick={() => switchMethod('passkey')}
							>
								<FingerprintOutlined style={{ fontSize: 15 }} />
								Passkey
							</MethodChip>
							<MethodChip
								type='button'
								$active={method === 'totp'}
								onClick={() => switchMethod('totp')}
							>
								<KeyOutlined style={{ fontSize: 15 }} />
								Authenticator
							</MethodChip>
						</MethodRow>
						<TotpSlot $show={totpVisible} aria-hidden={!totpVisible}>
							<TotpInner $show={totpVisible}>
								<Input
									ref={totpRef}
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder='123456'
									maxLength={6}
									tabIndex={totpVisible ? 0 : -1}
									style={{ letterSpacing: 4, textAlign: 'center' }}
								/>
							</TotpInner>
						</TotpSlot>
					</Field>
				</Body>
				<ErrSlot $show={!!err} aria-hidden={!err}>
					<ErrInner $show={!!err}>
						{lastErr && (
							<StickerBanner>
								<StickerIcon>
									<BlockRounded style={{ fontSize: 18 }} />
								</StickerIcon>
								<StickerText>
									<StickerTitle>Nope</StickerTitle>
									<StickerSub>{lastErr}</StickerSub>
								</StickerText>
							</StickerBanner>
						)}
					</ErrInner>
				</ErrSlot>
				<Foot>
					<Cancel type='button' onClick={closeWithAnim} disabled={busy}>
						Cancel
					</Cancel>
					<Delete type='button' onClick={submit} disabled={!ready || busy}>
						{busy ? 'Deleting…' : 'Delete permanently'}
					</Delete>
				</Foot>
			</Panel>
		</Scrim>
	)
}

export default HardDeleteModal

/* ─── Styles ──────────────────────────────────────────────────── */

const Scrim = styled.div<{ $open: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1100;
	opacity: ${(p) => (p.$open ? 1 : 0)};
	transition: opacity 200ms ease;
`

const Panel = styled.div<{ $open: boolean }>`
	background: #ffffff;
	border-radius: 20px;
	padding: 26px 30px 22px;
	max-width: 460px;
	width: calc(100% - 40px);
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	opacity: ${(p) => (p.$open ? 1 : 0)};
	transform: ${(p) =>
		p.$open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)'};
	transform-origin: center;
	transition:
		opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 240ms cubic-bezier(0.22, 1.35, 0.36, 1);
`

const Head = styled.div`
	margin-bottom: 18px;
	h2 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 19px;
		color: #b91c1c;
		letter-spacing: -0.3px;
	}
	p {
		margin: 6px 0 0;
		font-size: 13px;
		color: #64748b;
		line-height: 1.5;
	}
`

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 7px;
	label {
		font-size: 11.5px;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: #64748b;
		font-weight: 700;
	}
	label strong {
		color: #b91c1c;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		margin: 0 2px;
		text-transform: none;
	}
`

const Input = styled.input`
	width: 100%;
	box-sizing: border-box;
	padding: 11px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	font: inherit;
	font-size: 14px;
	transition: border-color 160ms ease;
	&:focus {
		outline: none;
		border-color: #b91c1c;
	}
`

const MethodRow = styled.div`
	display: flex;
	gap: 6px;
`

const MethodChip = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 7px 12px;
	border-radius: 999px;
	border: 1.5px solid ${(p) => (p.$active ? '#b91c1c' : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) => (p.$active ? 'rgba(220, 38, 38, 0.08)' : '#ffffff')};
	color: ${(p) => (p.$active ? '#b91c1c' : '#334155')};
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 220ms ease,
		border-color 220ms ease,
		color 220ms ease;
	&:focus {
		outline: none;
	}
`

const TotpSlot = styled.div<{ $show: boolean }>`
	display: grid;
	grid-template-rows: ${(p) => (p.$show ? '1fr' : '0fr')};
	margin-top: ${(p) => (p.$show ? '7px' : '0px')};
	transition:
		grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1),
		margin-top 240ms cubic-bezier(0.22, 1, 0.36, 1);
`

const TotpInner = styled.div<{ $show: boolean }>`
	overflow: hidden;
	min-height: 0;
	opacity: ${(p) => (p.$show ? 1 : 0)};
	transition: opacity 180ms ease ${(p) => (p.$show ? '60ms' : '0ms')};
`

const Foot = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 20px;
`

const Cancel = styled.button`
	padding: 9px 16px;
	border-radius: 12px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	background: #ffffff;
	color: #334155;
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	cursor: pointer;
`

const Delete = styled.button`
	padding: 9px 18px;
	border-radius: 12px;
	border: none;
	background: linear-gradient(135deg, #ef4444, #b91c1c);
	color: #ffffff;
	font: inherit;
	font-size: 13.5px;
	font-weight: 700;
	cursor: pointer;
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`

const ErrSlot = styled.div<{ $show: boolean }>`
	display: grid;
	grid-template-rows: ${(p) => (p.$show ? '1fr' : '0fr')};
	margin-top: ${(p) => (p.$show ? '16px' : '0px')};
	transition:
		grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1),
		margin-top 240ms cubic-bezier(0.22, 1, 0.36, 1);
`

const ErrInner = styled.div<{ $show: boolean }>`
	overflow: hidden;
	min-height: 0;
	opacity: ${(p) => (p.$show ? 1 : 0)};
	transition: opacity 180ms ease ${(p) => (p.$show ? '60ms' : '0ms')};
`

/* ─── Error banner — sticker burst ────────────────────────────── */

const stickerPop = keyframes`
	0% { transform: scale(0.85) rotate(-3deg); opacity: 0; }
	60% { transform: scale(1.04) rotate(1deg); opacity: 1; }
	100% { transform: scale(1) rotate(0); opacity: 1; }
`

const stickerShimmer = keyframes`
	0%   { background-position:   0% 50%; }
	50%  { background-position: 100% 50%; }
	100% { background-position:   0% 50%; }
`

const StickerBanner = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 999px 999px 999px 6px;
	/* Platform palette: orange → pinky → purple → pinky → orange
	   (src/theme/colors.ts) — mirrored so background-position shift
	   loops seamlessly end-to-start. */
	background: linear-gradient(
		120deg,
		rgba(255, 91, 0, 1) 0%,
		rgba(249, 72, 146, 1) 25%,
		rgba(166, 108, 255, 1) 50%,
		rgba(249, 72, 146, 1) 75%,
		rgba(255, 91, 0, 1) 100%
	);
	background-size: 280% 280%;
	color: #fff;
	box-shadow:
		0 10px 24px -8px rgba(249, 72, 146, 0.55),
		inset 0 1px 0 rgba(255, 255, 255, 0.3);
	animation:
		${stickerPop} 320ms cubic-bezier(0.34, 1.56, 0.64, 1) 1,
		${stickerShimmer} 6s ease-in-out infinite;
`

const StickerIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.22);
	backdrop-filter: blur(4px);
	flex: 0 0 auto;
`

const StickerText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	min-width: 0;
`

const StickerTitle = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 14px;
	font-weight: 800;
	letter-spacing: -0.3px;
	line-height: 1.15;
`

const StickerSub = styled.span`
	font-size: 12px;
	font-weight: 500;
	opacity: 0.9;
	line-height: 1.3;
`
