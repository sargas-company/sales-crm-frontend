import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import Modal from '../modal/Modal'
import { Button } from '../../ui'
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

const toneMap: Record<
	ConfirmTone,
	{ bgLight: string; bgDark: string; fg: string; ring: string }
> = {
	danger: {
		bgLight: 'rgba(239, 68, 68, 0.10)',
		bgDark: 'rgba(239, 68, 68, 0.16)',
		fg: '#ef4444',
		ring: 'rgba(239, 68, 68, 0.20)',
	},
	success: {
		bgLight: 'rgba(34, 197, 94, 0.10)',
		bgDark: 'rgba(34, 197, 94, 0.16)',
		fg: '#22c55e',
		ring: 'rgba(34, 197, 94, 0.20)',
	},
	info: {
		bgLight: 'rgba(59, 130, 246, 0.10)',
		bgDark: 'rgba(59, 130, 246, 0.16)',
		fg: '#3b82f6',
		ring: 'rgba(59, 130, 246, 0.20)',
	},
	warning: {
		bgLight: 'rgba(245, 158, 11, 0.10)',
		bgDark: 'rgba(245, 158, 11, 0.16)',
		fg: '#f59e0b',
		ring: 'rgba(245, 158, 11, 0.20)',
	},
	primary: {
		bgLight: 'rgba(99, 102, 241, 0.10)',
		bgDark: 'rgba(99, 102, 241, 0.16)',
		fg: '#6366f1',
		ring: 'rgba(99, 102, 241, 0.20)',
	},
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
	maxWidth = 440,
}: Props) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const tone = toneMap[iconTone]

	return (
		<Modal handleOutClick={onClose}>
			<Surface $dark={isDark} $maxWidth={maxWidth}>
				<Content>
					<IconRing
						$dark={isDark}
						$bg={isDark ? tone.bgDark : tone.bgLight}
						$fg={tone.fg}
						$ring={tone.ring}
					>
						{icon}
					</IconRing>

					<TextBlock>
						<TitleText>{title}</TitleText>
						<DescText $dark={isDark}>{description}</DescText>
					</TextBlock>

					<Divider $dark={isDark} />

					<Actions>
						<Button
							varient='outlined'
							color='info'
							type='button'
							onClick={onClose}
							disabled={isLoading}
						>
							{cancelLabel}
						</Button>
						<Button color={confirmColor} onClick={onConfirm} disabled={isLoading}>
							{isLoading ? confirmLoadingLabel ?? 'Working…' : confirmLabel}
						</Button>
					</Actions>
				</Content>
			</Surface>
		</Modal>
	)
}

export default ConfirmModal

/* ── Styles ─────────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const ringPulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 var(--ring); }
	50%      { box-shadow: 0 0 0 10px transparent; }
`

const Surface = styled.div<{ $dark: boolean; $maxWidth: number }>`
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	width: 100%;
	margin: 1rem;
	background: ${({ $dark }) => ($dark ? '#252d3a' : '#ffffff')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#eceaf3')};
	border-radius: 18px;
	box-shadow: ${({ $dark }) =>
		$dark
			? '0 40px 80px -30px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)'
			: '0 40px 80px -30px rgba(63, 51, 111, 0.30), 0 4px 10px rgba(63, 51, 111, 0.08)'};
	overflow: hidden;
	animation: ${fadeIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const Content = styled.div`
	padding: 32px 28px 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
`

const IconRing = styled.div<{ $dark: boolean; $bg: string; $fg: string; $ring: string }>`
	--ring: ${({ $ring }) => $ring};
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	display: flex;
	align-items: center;
	justify-content: center;
	animation: ${ringPulse} 2.4s ease-in-out infinite;

	svg {
		font-size: 28px;
	}
`

const TextBlock = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
`

const TitleText = styled.h3`
	margin: 0;
	font-size: 17px;
	font-weight: 700;
	letter-spacing: -0.01em;
	color: inherit;
`

const DescText = styled.p<{ $dark: boolean }>`
	margin: 0;
	font-size: 13px;
	line-height: 1.5;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#7a7591')};

	strong {
		color: ${({ $dark }) => ($dark ? '#e8e9ee' : '#3a3541')};
		font-weight: 600;
	}
`

const Divider = styled.div<{ $dark: boolean }>`
	width: 100%;
	height: 1px;
	background: ${({ $dark }) => ($dark ? '#323a48' : '#f0eef7')};
`

const Actions = styled.div`
	display: flex;
	gap: 10px;
	justify-content: center;
	width: 100%;
	padding-top: 2px;

	@media (max-width: 420px) {
		flex-direction: column-reverse;
		button {
			width: 100%;
		}
	}
`
