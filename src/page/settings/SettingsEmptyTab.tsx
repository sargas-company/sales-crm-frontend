import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'

const enterFade = keyframes`
	from {
		opacity: 0;
		transform: translateY(12px) scale(0.96);
		filter: blur(6px);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
`

const iconPop = keyframes`
	0% {
		opacity: 0;
		transform: scale(0.4) rotate(-14deg);
	}
	60% {
		opacity: 1;
		transform: scale(1.12) rotate(4deg);
	}
	100% {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6px); }
`

const glowPulse = keyframes`
	0%, 100% {
		opacity: 0.4;
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		opacity: 0.7;
		transform: translate(-50%, -50%) scale(1.05);
	}
`

const slideFadeUp = keyframes`
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const Wrap = styled('div')`
	min-height: 380px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48px 24px;
	animation: ${enterFade} 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
`

const Inner = styled('div')`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	max-width: 420px;
	text-align: center;
`

const IconStage = styled('div')`
	position: relative;
	width: 112px;
	height: 112px;
	display: flex;
	align-items: center;
	justify-content: center;

	/* Soft blue glow behind the icon — matches the app's active-tab background */
	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 180%;
		height: 180%;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(25, 118, 210, 0.22) 0%,
			rgba(25, 118, 210, 0.08) 45%,
			rgba(25, 118, 210, 0) 72%
		);
		animation: ${glowPulse} 3.6s ease-in-out infinite;
		pointer-events: none;
	}

	.icon-wrap {
		position: relative;
		z-index: 2;
		width: 96px;
		height: 96px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f9ff;
		box-shadow: 0 10px 26px -12px rgba(25, 118, 210, 0.35);
		animation:
			${iconPop} 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both,
			${iconFloat} 3.4s ease-in-out 0.8s infinite;
	}
	.icon-wrap svg {
		font-size: 44px !important;
		color: #1976d2;
	}
`

const Title = styled('div')`
	font-size: 18px;
	font-weight: 700;
	color: #1f2937;
	margin-top: 8px;
	animation: ${slideFadeUp} 0.5s ease-out 0.22s both;
`

const Desc = styled('div')`
	font-size: 14px;
	line-height: 1.55;
	color: #777;
	animation: ${slideFadeUp} 0.5s ease-out 0.35s both;
`

interface Props {
	icon: ReactNode
	title: string
	description: string
}

const SettingsEmptyTab = ({ icon, title, description }: Props) => (
	<Wrap>
		<Inner>
			<IconStage>
				<div className='icon-wrap'>{icon}</div>
			</IconStage>
			<Title>{title}</Title>
			<Desc>{description}</Desc>
		</Inner>
	</Wrap>
)

export default SettingsEmptyTab
