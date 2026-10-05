import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	FingerprintOutlined,
	KeyOutlined,
	WarningAmberRounded,
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
 *
 * We keep the modal visually distinct — amber + red accents — so an
 * operator can never confuse it with the ordinary archive flow.
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
	const [assertOpts] = usePasskeyAssertOptionsMutation()

	const ready =
		confirmation === expectedConfirmation &&
		(method === 'totp' ? code.length === 6 : true)

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

	return (
		<Scrim onClick={onClose}>
			<Panel onClick={(e) => e.stopPropagation()}>
				<Head>
					<Icon>
						<WarningAmberRounded />
					</Icon>
					<div>
						<h2>{title}</h2>
						<p>{description}</p>
					</div>
				</Head>
				<Body>
					<Field>
						<label>Type <strong>{expectedConfirmation}</strong> to confirm</label>
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
								$active={method === 'passkey'}
								onClick={() => setMethod('passkey')}
							>
								<FingerprintOutlined style={{ fontSize: 15 }} />
								Passkey
							</MethodChip>
							<MethodChip
								$active={method === 'totp'}
								onClick={() => setMethod('totp')}
							>
								<KeyOutlined style={{ fontSize: 15 }} />
								Authenticator
							</MethodChip>
						</MethodRow>
						{method === 'totp' && (
							<Input
								autoFocus
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder='123456'
								maxLength={6}
								style={{ letterSpacing: 4, textAlign: 'center' }}
							/>
						)}
					</Field>
					{err && <ErrBanner>{err}</ErrBanner>}
				</Body>
				<Foot>
					<Cancel type='button' onClick={onClose} disabled={busy}>
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

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Scrim = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1100;
	animation: ${fadeIn} 160ms;
`

const Panel = styled.div`
	background: #ffffff;
	border-radius: 20px;
	padding: 26px 30px 22px;
	max-width: 460px;
	width: calc(100% - 40px);
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${fadeIn} 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
`

const Head = styled.div`
	display: flex;
	gap: 14px;
	margin-bottom: 18px;
	h2 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 19px;
		color: #b91c1c;
		letter-spacing: -0.3px;
	}
	p {
		margin: 2px 0 0;
		font-size: 13px;
		color: #64748b;
	}
`

const Icon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 42px;
	height: 42px;
	border-radius: 12px;
	background: rgba(217, 119, 6, 0.14);
	color: #b45309;
	svg {
		font-size: 24px;
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
	padding: 11px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	font: inherit;
	font-size: 14px;
	&:focus {
		outline: none;
		border-color: #b91c1c;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
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
	background: ${(p) =>
		p.$active ? 'rgba(220, 38, 38, 0.08)' : '#ffffff'};
	color: ${(p) => (p.$active ? '#b91c1c' : '#334155')};
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
`

const Foot = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 20px;
`

const Cancel = styled.button`
	padding: 10px 16px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.14);
	background: #ffffff;
	color: #334155;
	font: inherit;
	font-weight: 600;
	cursor: pointer;
`

const Delete = styled.button`
	padding: 10px 18px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #ef4444, #b91c1c);
	color: #ffffff;
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`

const ErrBanner = styled.div`
	padding: 10px 14px;
	border-radius: 10px;
	background: rgba(220, 38, 38, 0.1);
	color: #b91c1c;
	font-size: 12.5px;
`
