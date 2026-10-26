import { ReactNode, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import Modal from '../modal/Modal'
import useTheme from '../../theme/useTheme'

export type ConfirmTone =
	| 'danger'
	| 'success'
	| 'info'
	| 'warning'
	| 'primary'
	| 'orange'
	| 'ink'
export type ConfirmColor =
	| 'error'
	| 'success'
	| 'primary'
	| 'warning'
	| 'info'
	| 'orange'
	| 'ink'

interface Props {
	icon: ReactNode
	iconTone?: ConfirmTone
	title: string
	description: ReactNode
	confirmLabel: string
	confirmLoadingLabel?: string
	confirmColor?: ConfirmColor
	cancelLabel?: string
	/** Hide the primary confirm button and stretch cancel to the full
	 *  row. Useful for modals that are purely informational / use
	 *  inline per-row actions and only need a dismiss affordance. */
	hideConfirm?: boolean
	/** Mirror of hideConfirm — hide the ghost cancel button and let
	 *  the solid confirm fill the row (e.g. a "Done" dismiss styled
	 *  as the primary action). */
	hideCancel?: boolean
	onClose: () => void
	onConfirm: () => void
	isLoading?: boolean
	/** When true the confirm button is rendered in the disabled state,
	 * matching the greyed-out styling the user already sees on other
	 * forms (opacity + not-allowed cursor + no hover shift). Use for
	 * destructive flows that need a pre-condition — e.g. "6-digit code
	 * must be entered before Remove is clickable". */
	confirmDisabled?: boolean
	maxWidth?: number
	/** Optional extra content rendered between the description and
	 * the action buttons — e.g. a radio-group of strategies for the
	 * Resume AI modal. Picks up the same softIn/softOut animation. */
	children?: ReactNode
	/** When set, wraps the icon + title + description + children block
	 *  in a bordered box (currently only `'dashed'` is used, for the
	 *  upload-modal drop-zone framing). Actions always stay outside. */
	bodyBorder?: 'dashed'
	/** When combined with `bodyBorder='dashed'`, lights the border up
	 *  and tints the background — e.g. drop-target active state. */
	bodyBorderActive?: boolean
	/** Imperative close trigger — flip this to true from the parent
	 *  to play the regular close animation and then call onClose,
	 *  as if the user had clicked Cancel. Used by multi-stage flows
	 *  (upload modal → success panel) that need the first modal to
	 *  gracefully exit before the next one appears. */
	forceClose?: boolean
	/** Override the close animation duration (default 220ms). Only
	 *  the exit speed is affected — opening stays snappy. Both the
	 *  surface scale/fade and the onClose timeout honour this. */
	closeDurationMs?: number
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
	orange: {
		bgLight: 'rgba(249, 115, 22, 0.12)',
		bgDark: 'rgba(249, 115, 22, 0.20)',
		fg: '#f97316',
		ring: 'rgba(249, 115, 22, 0.22)',
		solid: '#f97316',
		solidHover: '#ea580c',
		solidShadow: 'rgba(249, 115, 22, 0.32)',
	},
	ink: {
		bgLight: 'rgba(15, 23, 42, 0.08)',
		bgDark: 'rgba(248, 250, 252, 0.08)',
		fg: '#0f172a',
		ring: 'rgba(15, 23, 42, 0.18)',
		solid: '#0f172a',
		solidHover: '#1e293b',
		solidShadow: 'rgba(15, 23, 42, 0.4)',
	},
}

const colorToTone: Record<ConfirmColor, ConfirmTone> = {
	error: 'danger',
	success: 'success',
	primary: 'primary',
	warning: 'warning',
	info: 'info',
	orange: 'orange',
	ink: 'ink',
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
	hideConfirm = false,
	hideCancel = false,
	onClose,
	onConfirm,
	isLoading,
	confirmDisabled,
	maxWidth = 460,
	children,
	bodyBorder,
	bodyBorderActive,
	forceClose,
	closeDurationMs = 220,
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
		window.setTimeout(onClose, closeDurationMs)
	}

	const requestConfirm = () => {
		if (closing || isLoading) return
		onConfirm()
	}

	/* Parent-triggered close — flipped on by `forceClose` so a multi-
	 * stage flow can play the exit animation before swapping us for
	 * the next modal. */
	useEffect(() => {
		if (forceClose && !closing) {
			setClosing(true)
			window.setTimeout(onClose, closeDurationMs)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [forceClose])

	return (
		<Modal handleOutClick={requestClose}>
			<Surface
				$dark={isDark}
				$maxWidth={maxWidth}
				$closing={closing}
				$exitMs={closeDurationMs}
			>
				<Accent $solid={tone.solid} $closing={closing} />

				<Content>
					<BodyFrame $border={bodyBorder} $active={bodyBorderActive}>
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

						{children ? (
							<ExtrasSlot $closing={closing}>{children}</ExtrasSlot>
						) : null}
					</BodyFrame>

					<Actions $closing={closing} $single={hideConfirm || hideCancel}>
						{!hideCancel && (
							<CancelButton
								type='button'
								onClick={requestClose}
								disabled={isLoading || closing}
								$dark={isDark}
							>
								{cancelLabel}
							</CancelButton>
						)}
						{!hideConfirm && (
							<ConfirmButton
								type='button'
								onClick={requestConfirm}
								disabled={isLoading || closing || !!confirmDisabled}
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
						)}
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

const Surface = styled.div<{
	$dark: boolean
	$maxWidth: number
	$closing: boolean
	$exitMs: number
}>`
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
		${({ $closing, $exitMs }) => ($closing ? `${$exitMs}ms` : '360ms')}
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

/* Optional bordered wrapper around the icon + text + extras block.
 * Actions always stay outside of it. Used by the Upload modal to
 * frame the whole upper half as a drop target. */
const BodyFrame = styled.div<{ $border?: 'dashed'; $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22px;
	width: 100%;
	${({ $border, $active }) =>
		$border === 'dashed' &&
		`
		padding: 28px 24px;
		border-radius: 14px;
		border: 2px dashed ${
			$active ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.14)'
		};
		background: ${$active ? 'rgba(15, 23, 42, 0.05)' : 'transparent'};
		transition: border-color 220ms ease, background 220ms ease;
	`}
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

const ExtrasSlot = styled.div<{ $closing: boolean }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 10px;
	animation: ${({ $closing }) => ($closing ? softOut : softIn)}
		${({ $closing }) => ($closing ? '180ms' : '440ms')}
		cubic-bezier(0.22, 1, 0.36, 1) ${({ $closing }) => ($closing ? '0ms' : '220ms')} both;
`

const Actions = styled.div<{ $closing: boolean; $single?: boolean }>`
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
