import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	useGetVaultStatusQuery,
	useLockVaultMutation,
} from '../../store/credentials/vaultApi'
import { VAULT_REQUEST_UNLOCK } from './VaultSetupGate'

const VaultIsland = () => {
	const { data: status, refetch } = useGetVaultStatusQuery()
	const [lock] = useLockVaultMutation()
	const [tick, setTick] = useState(0)
	const [transitioning, setTransitioning] = useState(false)
	const [displayUnlocked, setDisplayUnlocked] = useState<boolean | null>(null)

	useEffect(() => {
		const id = window.setInterval(() => setTick((x) => x + 1), 1000)
		return () => window.clearInterval(id)
	}, [])
	void tick

	const session = status?.session
	const remaining = session
		? new Date(session.expiresAt).getTime() - Date.now()
		: 0
	const unlocked = !!session && remaining > 0

	useEffect(() => {
		if (!status) return
		if (displayUnlocked === null) {
			setDisplayUnlocked(unlocked)
			return
		}
		if (displayUnlocked === unlocked) return
		setTransitioning(true)
		const swap = window.setTimeout(() => {
			setDisplayUnlocked(unlocked)
			window.setTimeout(() => setTransitioning(false), 20)
		}, 200)
		return () => window.clearTimeout(swap)
	}, [unlocked, displayUnlocked, status])

	if (!status || displayUnlocked === null) return null

	const transitionStyle = {
		opacity: transitioning ? 0 : 1,
		transform: transitioning ? 'scale(0.94)' : 'scale(1)',
		transition:
			'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
	}

	if (displayUnlocked) {
		return (
			<Island style={transitionStyle}>
				<Pulse />
				<VaultLabel>Vault</VaultLabel>
				<MonoText>open</MonoText>
				<Divider />
				<TimeText>{renderRemainingParts(remaining)}</TimeText>
				<LockBtn
					type='button'
					onClick={async () => {
						try {
							await lock().unwrap()
						} catch {
							/* already revoked */
						}
						// Signal every reveal drawer / cached plaintext
						// holder to scrub state immediately. Vault
						// session is already revoked server-side.
						window.dispatchEvent(new CustomEvent('vault:locked'))
						refetch()
					}}
				>
					Lock
				</LockBtn>
			</Island>
		)
	}

	return (
		<Island
			as='button'
			type='button'
			style={{
				cursor: 'default',
				border: 'none',
				font: 'inherit',
				...transitionStyle,
			}}
		>
			<AmberDot />
			<VaultLabel>Vault</VaultLabel>
			<MonoText>locked</MonoText>
			<Divider />
			<UnlockBtn
				type='button'
				onClick={() =>
					window.dispatchEvent(new CustomEvent(VAULT_REQUEST_UNLOCK))
				}
			>
				Unlock
			</UnlockBtn>
		</Island>
	)
}

export default VaultIsland

const pad2 = (n: number) => String(n).padStart(2, '0')

function renderRemainingParts(ms: number) {
	const totalSec = Math.max(0, Math.floor(ms / 1000))
	const h = Math.floor(totalSec / 3600)
	const m = Math.floor((totalSec % 3600) / 60)
	const s = totalSec % 60
	if (h >= 1) {
		return (
			<>
				{h}
				<Unit>h</Unit> {pad2(m)}
				<Unit>m</Unit>
			</>
		)
	}
	if (m >= 1) {
		return (
			<>
				{pad2(m)}
				<Unit>m</Unit> {pad2(s)}
				<Unit>s</Unit>
			</>
		)
	}
	return (
		<>
			{pad2(s)}
			<Unit>s</Unit>
		</>
	)
}

const ripple = keyframes`
	0% { transform: scale(1); opacity: 0.85; }
	100% { transform: scale(3.4); opacity: 0; }
`

const glow = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
	50% { box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.55); }
`

const amberRipple = keyframes`
	0% { transform: scale(1); opacity: 0.85; }
	100% { transform: scale(3.4); opacity: 0; }
`

const amberGlow = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
	50% { box-shadow: 0 0 8px 2px rgba(251, 191, 36, 0.6); }
`

const Island = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 11px;
	padding: 11px 20px 11px 16px;
	background: rgba(10, 10, 10, 0.92);
	color: #ffffff;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 500;
	letter-spacing: -0.1px;
	box-shadow:
		0 2px 8px rgba(0, 0, 0, 0.14),
		inset 0 1px 0 rgba(255, 255, 255, 0.08);
	user-select: none;
`

const Pulse = styled.span`
	position: relative;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #22c55e;
	animation: ${glow} 2s ease-in-out infinite;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid #22c55e;
		animation: ${ripple} 2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::before {
			animation: none;
			display: none;
		}
	}
`

const AmberDot = styled.span`
	position: relative;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #fbbf24;
	animation: ${amberGlow} 2s ease-in-out infinite;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid #fbbf24;
		animation: ${amberRipple} 2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::before {
			animation: none;
			display: none;
		}
	}
`

const VaultLabel = styled.span`
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	color: #ffffff;
`

const MonoText = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	color: rgba(255, 255, 255, 0.72);
	font-weight: 400;
	font-size: 12.5px;
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const TimeText = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	color: #ffffff;
	font-weight: 600;
	font-size: 13px;
	letter-spacing: 0.3px;
	font-variant-numeric: tabular-nums;
	padding: 3px 9px;
	background: rgba(255, 255, 255, 0.08);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 7px;
	box-shadow:
		inset 0 1px 2px rgba(0, 0, 0, 0.35),
		inset 0 -1px 0 rgba(255, 255, 255, 0.04);
`

const Unit = styled.span`
	font-size: 0.72em;
	opacity: 0.65;
	margin-left: 1px;
	font-weight: 400;
	text-transform: uppercase;
`

const Divider = styled.span`
	width: 1px;
	height: 10px;
	background: rgba(255, 255, 255, 0.12);
`

const UnlockBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8px 14px;
	background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
	color: #1a1206;
	border: none;
	border-radius: 999px;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 500;
	letter-spacing: 0.5px;
	line-height: 1;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow:
		0 2px 6px rgba(251, 191, 36, 0.55),
		inset 0 1px 0 rgba(255, 255, 255, 0.4),
		inset 0 -1px 0 rgba(0, 0, 0, 0.08);
	transition:
		filter 160ms,
		box-shadow 180ms,
		transform 120ms;

	&:hover {
		filter: brightness(1.06);
		box-shadow:
			0 3px 10px rgba(251, 191, 36, 0.65),
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 0 -1px 0 rgba(0, 0, 0, 0.08);
	}

	&:active {
		transform: translateY(0.5px);
		filter: brightness(0.95);
	}

	&:focus-visible {
		outline: 2px solid rgba(251, 191, 36, 0.7);
		outline-offset: 2px;
	}
`

const LockBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8px 14px;
	background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
	color: #1a1206;
	border: none;
	border-radius: 999px;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 500;
	letter-spacing: 0.5px;
	line-height: 1;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow:
		0 2px 6px rgba(251, 191, 36, 0.55),
		inset 0 1px 0 rgba(255, 255, 255, 0.4),
		inset 0 -1px 0 rgba(0, 0, 0, 0.08);
	transition:
		filter 160ms,
		box-shadow 180ms,
		transform 120ms;

	&:hover {
		filter: brightness(1.06);
		box-shadow:
			0 3px 10px rgba(251, 191, 36, 0.65),
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 0 -1px 0 rgba(0, 0, 0, 0.08);
	}

	&:active {
		transform: translateY(0.5px);
		filter: brightness(0.95);
	}

	&:focus-visible {
		outline: 2px solid rgba(251, 191, 36, 0.7);
		outline-offset: 2px;
	}
`
