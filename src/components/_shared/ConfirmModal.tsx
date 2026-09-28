import { ReactNode, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import Modal from '../modal/Modal'
import useTheme from '../../theme/useTheme'

export type ConfirmTone = 'danger' | 'success' | 'info' | 'warning' | 'primary'
export type ConfirmColor = 'error' | 'success' | 'primary' | 'warning' | 'info'

interface Props {
	icon: ReactNode
	iconTone?: ConfirmTone
	title: string
	description: ReactNode
	confirmLabel: string
	confirmLoadingLabel?: string
	confirmColor?: ConfirmColor
	cancelLabel?: string
	onClose: () => void
	onConfirm: () => void
	isLoading?: boolean
	maxWidth?: number
}

interface TonePalette {
	bgLight: string
	bgDark: string
	fg: string
	ring: string
	solid: string
	solidHover: string
	solidShadow: string
}

const toneMap: Record<ConfirmTone, TonePalette> = {
	danger: {
		bgLight: 'rgba(239, 68, 68, 0.12)',
		bgDark: 'rgba(239, 68, 68, 0.18)',
		fg: '#dc2626',
		ring: 'rgba(239, 68, 68, 0.22)',
		solid: '#dc2626',
		solidHover: '#b91c1c',
		solidShadow: 'rgba(220, 38, 38, 0.32)',
	},
	success: {
		bgLight: 'rgba(34, 197, 94, 0.12)',
		bgDark: 'rgba(34, 197, 94, 0.18)',
		fg: '#16a34a',
		ring: 'rgba(34, 197, 94, 0.22)',
		solid: '#16a34a',
		solidHover: '#15803d',
		solidShadow: 'rgba(22, 163, 74, 0.32)',
	},
	info: {
		bgLight: 'rgba(3, 105, 161, 0.12)',
		bgDark: 'rgba(3, 105, 161, 0.20)',
		fg: 'rgb(3, 105, 161)',
		ring: 'rgba(3, 105, 161, 0.22)',
		solid: 'rgb(3, 105, 161)',
		solidHover: 'rgb(2, 124, 192)',
		solidShadow: 'rgba(3, 105, 161, 0.32)',
	},
	warning: {
		bgLight: 'rgba(245, 158, 11, 0.14)',
		bgDark: 'rgba(245, 158, 11, 0.20)',
		fg: '#d97706',
		ring: 'rgba(245, 158, 11, 0.22)',
		solid: '#d97706',
		solidHover: '#b45309',
		solidShadow: 'rgba(217, 119, 6, 0.32)',
	},
	primary: {
		bgLight: 'rgba(3, 105, 161, 0.12)',
		bgDark: 'rgba(3, 105, 161, 0.20)',
		fg: 'rgb(3, 105, 161)',
		ring: 'rgba(3, 105, 161, 0.22)',
		solid: 'rgb(3, 105, 161)',
		solidHover: 'rgb(2, 124, 192)',
		solidShadow: 'rgba(3, 105, 161, 0.32)',
	},
}

const colorToTone: Record<ConfirmColor, ConfirmTone> = {
	error: 'danger',
	success: 'success',
	primary: 'primary',
	warning: 'warning',
	info: 'info',
}

const ConfirmModal = ({
	icon,
	iconTone = 'danger',
	title,
	description,
	confirmLabel,
	confirmLoadingLabel,
	confirmColor = 'error',
	cancelLabel = 'Cancel',
	onClose,
	onConfirm,
	isLoading,
	maxWidth = 460,
}: Props) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const tone = toneMap[iconTone]
	const confirmTone = toneMap[colorToTone[confirmColor]]

	// Track a "closing" state so we can play an exit animation before
	// actually invoking the parent's onClose (which unmounts us).
	const [closing, setClosing] = useState(false)

	const requestClose = () => {
		if (closing || isLoading) return
		setClosing(true)
		window.setTimeout(onClose, 220)
	}

	const requestConfirm = () => {
		if (closing || isLoading) return
		onConfirm()
	}

	return (
		<Modal handleOutClick={requestClose}>
			<Surface $dark={isDark} $maxWidth={maxWidth} $closing={closing}>
				<Accent $solid={tone.solid} $closing={closing} />

				<Content>
					<IconWrap $closing={closing}>
						<IconRingOuter $ring={tone.ring} />
						<IconRingInner $bg={isDark ? tone.bgDark : tone.bgLight} $fg={tone.fg}>
							{icon}
						</IconRingInner>
					</IconWrap>

					<TextBlock $closing={closing}>
						<TitleText $dark={isDark}>{title}</TitleText>
						<DescText $dark={isDark}>{description}</DescText>
					</TextBlock>

					<Actions $closing={closing}>
						<CancelButton
							type='button'
							onClick={requestClose}
							disabled={isLoading || closing}
							$dark={isDark}
						>
							{cancelLabel}
						</CancelButton>
						<ConfirmButton
							type='button'
							onClick={requestConfirm}
							disabled={isLoading || closing}
							$solid={confirmTone.solid}
							$solidHover={confirmTone.solidHover}
							$shadow={confirmTone.solidShadow}
						>
							{isLoading ? (
								<>
									<Spinner />
									<span>{confirmLoadingLabel ?? 'Working…'}</span>
								</>
							) : (
								confirmLabel
							)}
						</ConfirmButton>
					</Actions>
				</Content>
			</Surface>
		</Modal>
	)
}

export default ConfirmModal

/* ── Styles ─────────────────────────────────────────────────────────────── */

const surfaceIn = keyframes`
	from { opacity: 0; transform: translateY(14px) scale(0.94); filter: blur(4px); }
	to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`

const surfaceOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
	to   { opacity: 0; transform: translateY(-6px) scale(0.96); filter: blur(2px); }
`

const accentWipe = keyframes`
	from { transform: scaleX(0); }
	to   { transform: scaleX(1); }
`

const iconPop = keyframes`
	0%   { opacity: 0; transform: scale(0.4) rotate(-14deg); }
	65%  { transform: scale(1.14) rotate(4deg); }
	85%  { transform: scale(0.96) rotate(-2deg); }
	100% { opacity: 1; transform: scale(1) rotate(0deg); }
`

const iconOut = keyframes`
	from { opacity: 1; transform: scale(1); }
	to   { opacity: 0; transform: scale(0.7) rotate(10deg); }
`

const softIn = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
`

const softOut = keyframes`
	from { opacity: 1; transform: translateY(0); }
	to   { opacity: 0; transform: translateY(-4px); }
`

const ringPulse = keyframes`
	0%   { transform: scale(0.85); opacity: 0.9; }
	80%  { transform: scale(1.35); opacity: 0; }
	100% { transform: scale(1.35); opacity: 0; }
`

const spinnerSpin = keyframes`
	to { transform: rotate(360deg); }
`

const Surface = styled.div<{ $dark: boolean; $maxWidth: number; $closing: boolean }>`
	position: relative;
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	width: 100%;
	margin: 1rem;
	background: ${({ $dark }) => ($dark ? '#252d3a' : '#ffffff')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : 'rgba(15, 23, 42, 0.06)')};
	border-radius: 20px;
	box-shadow: ${({ $dark }) =>
		$dark
			? '0 40px 80px -30px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)'
			: '0 40px 80px -30px rgba(15, 23, 42, 0.30), 0 4px 10px rgba(15, 23, 42, 0.06)'};
	overflow: hidden;
	animation: ${({ $closing }) => ($closing ? surfaceOut : surfaceIn)}
		${({ $closing }) => ($closing ? '220ms' : '360ms')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
`

const Accent = styled.div<{ $solid: string; $closing: boolean }>`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4px;
	background: linear-gradient(90deg, ${({ $solid }) => $solid} 0%, transparent 100%);
	transform-origin: left center;
	animation: ${accentWipe} 750ms cubic-bezier(0.4, 0, 0.2, 1) 80ms both;
	opacity: ${({ $closing }) => ($closing ? 0 : 1)};
	transition: opacity 180ms ease;
`

const Content = styled.div`
	padding: 36px 32px 28px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22px;
`

const IconWrap = styled.div<{ $closing: boolean }>`
	position: relative;
	width: 76px;
	height: 76px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	animation: ${({ $closing }) => ($closing ? iconOut : iconPop)}
		${({ $closing }) => ($closing ? '200ms' : '640ms')}
		cubic-bezier(0.22, 1.35, 0.36, 1) 80ms both;
`

const IconRingOuter = styled.span<{ $ring: string }>`
	position: absolute;
	inset: 0;
	border-radius: 50%;
	border: 2px solid ${({ $ring }) => $ring};
	animation: ${ringPulse} 2.2s ease-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const IconRingInner = styled.div<{ $bg: string; $fg: string }>`
	position: relative;
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	display: inline-flex;
	align-items: center;
	justify-content: center;

	svg {
		font-size: 30px;
	}
`

const TextBlock = styled.div<{ $closing: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	text-align: center;
	max-width: 380px;
	animation: ${({ $closing }) => ($closing ? softOut : softIn)}
		${({ $closing }) => ($closing ? '180ms' : '420ms')}
		cubic-bezier(0.22, 1, 0.36, 1) ${({ $closing }) => ($closing ? '0ms' : '180ms')} both;
`

const TitleText = styled.h3<{ $dark: boolean }>`
	margin: 0;
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.02em;
	color: ${({ $dark }) => ($dark ? '#f4f5f7' : '#0f172a')};
	line-height: 1.2;
`

const DescText = styled.p<{ $dark: boolean }>`
	margin: 0;
	font-size: 13.5px;
	line-height: 1.55;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : 'rgba(15, 23, 42, 0.6)')};
	word-break: break-word;

	strong {
		color: ${({ $dark }) => ($dark ? '#e8e9ee' : '#0f172a')};
		font-weight: 700;
		font-family:
			'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 12.5px;
		background: rgba(15, 23, 42, 0.04);
		padding: 1px 6px;
		border-radius: 6px;
		border: 1px solid rgba(15, 23, 42, 0.08);
	}
`

const Actions = styled.div<{ $closing: boolean }>`
	display: flex;
	gap: 10px;
	justify-content: stretch;
	width: 100%;
	padding-top: 6px;
	animation: ${({ $closing }) => ($closing ? softOut : softIn)}
		${({ $closing }) => ($closing ? '180ms' : '460ms')}
		cubic-bezier(0.22, 1, 0.36, 1) ${({ $closing }) => ($closing ? '0ms' : '280ms')} both;

	> button {
		flex: 1;
	}

	@media (max-width: 420px) {
		flex-direction: column-reverse;
	}
`

const baseButton = `
	appearance: none;
	border: none;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.005em;
	padding: 12px 20px;
	border-radius: 12px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	transition:
		background 200ms ease,
		border-color 200ms ease,
		color 200ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 220ms ease;

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`

const CancelButton = styled.button<{ $dark: boolean }>`
	${baseButton}
	background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff')};
	color: ${({ $dark }) => ($dark ? '#c7c9d3' : 'rgba(15, 23, 42, 0.72)')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : 'rgba(15, 23, 42, 0.1)')};

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		border-color: ${({ $dark }) => ($dark ? '#3b455a' : 'rgba(15, 23, 42, 0.2)')};
		color: ${({ $dark }) => ($dark ? '#e8e9ee' : '#0f172a')};
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`

const ConfirmButton = styled.button<{
	$solid: string
	$solidHover: string
	$shadow: string
}>`
	${baseButton}
	background: ${({ $solid }) => $solid};
	color: #ffffff;
	border: 1px solid ${({ $solid }) => $solid};
	box-shadow: 0 6px 18px -6px ${({ $shadow }) => $shadow};

	&:hover:not(:disabled) {
		background: ${({ $solidHover }) => $solidHover};
		border-color: ${({ $solidHover }) => $solidHover};
		transform: translateY(-1px);
		box-shadow: 0 10px 24px -8px ${({ $shadow }) => $shadow};
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`

const Spinner = styled.span`
	width: 14px;
	height: 14px;
	border: 2px solid rgba(255, 255, 255, 0.35);
	border-top-color: #fff;
	border-radius: 50%;
	animation: ${spinnerSpin} 700ms linear infinite;
`
