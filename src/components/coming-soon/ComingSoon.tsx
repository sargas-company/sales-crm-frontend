import { ReactNode } from 'react'
import { AutoAwesomeOutlined } from '@mui/icons-material'
import styled, { keyframes } from 'styled-components'

/* ─────────────── keyframes ─────────────── */

const heroFadeIn = keyframes`
	from { opacity: 0; transform: translateY(18px) scale(0.98); filter: blur(6px); }
	to   { opacity: 1; transform: translateY(0)    scale(1);    filter: blur(0); }
`

const ringSpin = keyframes`
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
`

const ringSpinReverse = keyframes`
	from { transform: rotate(360deg); }
	to   { transform: rotate(0deg); }
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50%      { transform: translateY(-6px); }
`

const iconPulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.35), 0 20px 40px -18px rgba(25, 118, 210, 0.4); }
	50%      { box-shadow: 0 0 0 16px rgba(25, 118, 210, 0), 0 22px 44px -16px rgba(25, 118, 210, 0.55); }
`

const blobDrift1 = keyframes`
	0%, 100% { transform: translate(0, 0) scale(1); }
	50%      { transform: translate(30px, -18px) scale(1.08); }
`

const blobDrift2 = keyframes`
	0%, 100% { transform: translate(0, 0) scale(1); }
	50%      { transform: translate(-24px, 20px) scale(1.05); }
`

const blobDrift3 = keyframes`
	0%, 100% { transform: translate(0, 0) scale(1); }
	50%      { transform: translate(18px, 12px) scale(0.94); }
`

const sparkle = keyframes`
	0%, 100% { opacity: 0.15; transform: scale(0.9); }
	50%      { opacity: 1;    transform: scale(1.1); }
`

const badgeShine = keyframes`
	0%   { transform: translateX(-120%) skewX(-20deg); }
	100% { transform: translateX(260%)  skewX(-20deg); }
`

const headerFade = keyframes`
	from { opacity: 0; transform: translateY(-6px); }
	to   { opacity: 1; transform: translateY(0); }
`

/* ─────────────── styled ─────────────── */

const Wrap = styled('div')`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	color: #1f2937;
`

const Header = styled('div')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16px;
	animation: ${headerFade} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;

	.h-title {
		font-size: 26px;
		font-weight: 800;
		letter-spacing: -0.4px;
		margin: 0;
	}
	.h-subtitle {
		font-size: 13.5px;
		color: #6b7280;
		margin-top: 2px;
	}
`

const Stage = styled('div')`
	position: relative;
	overflow: hidden;
	background: linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%);
	border-radius: 22px;
	padding: 56px 32px 44px;
	box-shadow:
		0 20px 50px -28px rgba(15, 23, 42, 0.16),
		0 4px 10px -6px rgba(15, 23, 42, 0.05);
	animation: ${heroFadeIn} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none !important;
	}
`

const Blobs = styled('div')`
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
	z-index: 0;

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(50px);
		opacity: 0.55;
	}
	.blob-a {
		top: -60px;
		left: -40px;
		width: 260px;
		height: 260px;
		background: radial-gradient(circle at 30% 30%, #a5c8ff 0%, transparent 70%);
		animation: ${blobDrift1} 12s ease-in-out infinite;
	}
	.blob-b {
		top: 40px;
		right: -80px;
		width: 300px;
		height: 300px;
		background: radial-gradient(circle at 60% 40%, #c4b5fd 0%, transparent 70%);
		animation: ${blobDrift2} 14s ease-in-out infinite;
	}
	.blob-c {
		bottom: -100px;
		left: 40%;
		width: 320px;
		height: 320px;
		background: radial-gradient(circle at 50% 50%, #bfdbfe 0%, transparent 70%);
		animation: ${blobDrift3} 16s ease-in-out infinite;
	}
`

const Sparkles = styled('div')`
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 1;

	span {
		position: absolute;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #1976d2;
		box-shadow: 0 0 8px rgba(25, 118, 210, 0.7);
		animation: ${sparkle} 2.6s ease-in-out infinite;
	}
	span.s1 { top: 22%;  left: 12%; animation-delay: 0s;   }
	span.s2 { top: 68%;  left: 28%; animation-delay: 0.4s; background: #8b5cf6; box-shadow: 0 0 8px rgba(139, 92, 246, 0.7); }
	span.s3 { top: 34%;  left: 82%; animation-delay: 0.8s; }
	span.s4 { top: 78%;  left: 74%; animation-delay: 1.2s; background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.7); }
	span.s5 { top: 14%;  left: 48%; animation-delay: 1.6s; }
	span.s6 { top: 88%;  left: 52%; animation-delay: 2.0s; background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.7); }
`

const HeroContent = styled('div')`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 18px;
`

const IconWreath = styled('div')`
	position: relative;
	width: 148px;
	height: 148px;
	display: flex;
	align-items: center;
	justify-content: center;

	.ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1.5px dashed rgba(25, 118, 210, 0.35);
		animation: ${ringSpin} 22s linear infinite;
	}
	.ring-inner {
		inset: 16px;
		border-style: dotted;
		border-color: rgba(139, 92, 246, 0.35);
		animation: ${ringSpinReverse} 16s linear infinite;
	}
	.core {
		position: relative;
		width: 88px;
		height: 88px;
		border-radius: 26px;
		background: linear-gradient(135deg, #3b82f6 0%, #1976d2 60%, #6366f1 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		animation: ${iconFloat} 4s ease-in-out infinite, ${iconPulse} 2.8s ease-in-out infinite;
	}
	.core svg {
		font-size: 44px;
	}
	.orbit-dot {
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #f59e0b;
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
	}

	@media (prefers-reduced-motion: reduce) {
		.ring, .core, .orbit-dot { animation: none !important; }
	}
`

const Badge = styled('span')`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: linear-gradient(135deg, #f0f9ff 0%, #ede9fe 100%);
	color: #1e40af;
	padding: 6px 14px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 800;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	overflow: hidden;
	border: 1px solid rgba(25, 118, 210, 0.18);

	svg {
		font-size: 14px !important;
	}

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 40%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.85) 50%,
			transparent 100%
		);
		animation: ${badgeShine} 3.4s ease-in-out infinite;
	}
`

const Title = styled('h2')`
	font-size: 32px;
	font-weight: 900;
	margin: 0;
	letter-spacing: -0.8px;
	background: linear-gradient(90deg, #0f172a 0%, #1976d2 55%, #6366f1 100%);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	line-height: 1.15;
`

const Subtitle = styled('p')`
	font-size: 14.5px;
	color: #475569;
	max-width: 480px;
	margin: 0;
	line-height: 1.6;
`

/* ─────────────── component ─────────────── */

export interface ComingSoonProps {
	headerTitle: string
	headerSubtitle: string
	icon: ReactNode
	title: string
	description: string
}

const ComingSoon = ({
	headerTitle,
	headerSubtitle,
	icon,
	title,
	description,
}: ComingSoonProps) => {
	return (
		<Wrap>
			<Header>
				<div>
					<h1 className='h-title'>{headerTitle}</h1>
					<div className='h-subtitle'>{headerSubtitle}</div>
				</div>
			</Header>

			<Stage>
				<Blobs>
					<span className='blob blob-a' />
					<span className='blob blob-b' />
					<span className='blob blob-c' />
				</Blobs>

				<Sparkles>
					<span className='s1' />
					<span className='s2' />
					<span className='s3' />
					<span className='s4' />
					<span className='s5' />
					<span className='s6' />
				</Sparkles>

				<HeroContent>
					<IconWreath>
						<span className='ring' />
						<span className='ring ring-inner' />
						<span className='orbit-dot' />
						<span className='core'>{icon}</span>
					</IconWreath>

					<Badge>
						<AutoAwesomeOutlined />
						Coming Soon
					</Badge>

					<Title>{title}</Title>
					<Subtitle>{description}</Subtitle>
				</HeroContent>
			</Stage>
		</Wrap>
	)
}

export default ComingSoon
