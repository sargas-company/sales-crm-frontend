import { FC, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { Button } from '../../../ui'

const ringPulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.18); }
	50%      { box-shadow: 0 0 0 10px transparent; }
`

const toneMap: Record<string, { bg: string; fg: string }> = {
	error: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#ef4444' },
	success: { bg: 'rgba(34, 197, 94, 0.12)', fg: '#22c55e' },
	warning: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#f59e0b' },
	info: { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3b82f6' },
}

const ConfirmationFinish: FC<ConfirmationProps> = ({
	icon,
	iconColor,
	title,
	subtitle,
	onConfirmDone,
}) => {
	const tone = toneMap[iconColor] ?? toneMap.info
	return (
		<Wrap>
			<IconRing $bg={tone.bg} $fg={tone.fg}>
				{icon}
			</IconRing>
			<Title>{title}</Title>
			<Subtitle>{subtitle}</Subtitle>
			<Button onClick={onConfirmDone}>Ok</Button>
		</Wrap>
	)
}
export default ConfirmationFinish

export interface ConfirmationProps {
	icon: ReactNode
	iconColor: string
	title: string
	subtitle: string
	onConfirmDone: () => void
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 8px 0;
`

const IconRing = styled.div<{ $bg: string; $fg: string }>`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32px;
	animation: ${ringPulse} 2.4s ease-in-out infinite;

	svg {
		font-size: 32px;
	}
`

const Title = styled.h3`
	margin: 12px 0 0;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.01em;
	color: inherit;
`

const Subtitle = styled.p`
	margin: 0 0 12px;
	font-size: 13px;
	color: #7a7591;
	text-align: center;
	line-height: 1.5;
`
