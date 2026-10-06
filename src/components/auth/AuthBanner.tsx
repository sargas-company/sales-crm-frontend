import React, { FC, ReactNode, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'model-viewer': React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					src?: string
					alt?: string
					'camera-controls'?: boolean
					'auto-rotate'?: boolean
					'shadow-intensity'?: string
				},
				HTMLElement
			>
		}
	}
}

/* ─────────────── keyframes ─────────────── */

const gridDrift = keyframes`
	0%   { background-position: 0 0, 0 0; }
	100% { background-position: 40px 40px, 40px 40px; }
`

const spotlightPulse = keyframes`
	0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
	50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.05); }
`

const softFade = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
`

const dotPulse = keyframes`
	0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55); }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px rgba(56, 189, 248, 0); }
`

const cursiveDraw = keyframes`
	from { opacity: 0; transform: translate(-8px, 4px) rotate(-8deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-8deg); }
`

const shineText = keyframes`
	0%   { background-position: -140% 0; }
	60%  { background-position: 140% 0; }
	100% { background-position: 140% 0; }
`

const watermarkFloat = keyframes`
	0%, 100% { transform: translate(-50%, -50%) scale(1); }
	50%      { transform: translate(-50%, calc(-50% - 8px)) scale(1.02); }
`

/* ─────────────── styled ─────────────── */

const BannerRoot = styled('div')`
	position: relative;
	flex: 1 1 auto;
	align-self: stretch;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #0b1120;
	color: #e2e8f0;
	padding: 32px;

	@media (max-width: 1080px) {
		padding: 24px;
	}
`

const Grid = styled('div')`
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	background-image:
		linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
		linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
	background-size:
		40px 40px,
		40px 40px;
	animation: ${gridDrift} 24s linear infinite;
	mask-image: radial-gradient(
		circle at center,
		#000 30%,
		rgba(0, 0, 0, 0.35) 70%,
		transparent 100%
	);
	-webkit-mask-image: radial-gradient(
		circle at center,
		#000 30%,
		rgba(0, 0, 0, 0.35) 70%,
		transparent 100%
	);
`

const Spotlight = styled('div')`
	position: absolute;
	top: 50%;
	left: 50%;
	width: 720px;
	height: 720px;
	transform: translate(-50%, -50%);
	background: radial-gradient(
		circle at center,
		rgba(255, 255, 255, 0.16) 0%,
		rgba(56, 189, 248, 0.06) 40%,
		transparent 70%
	);
	filter: blur(30px);
	animation: ${spotlightPulse} 4.2s ease-in-out infinite;
	pointer-events: none;
	z-index: 0;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Watermark = styled('span')`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 0;
	pointer-events: none;
	font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
	font-size: clamp(160px, 22vw, 320px);
	letter-spacing: 2px;
	line-height: 0.85;
	white-space: nowrap;
	color: transparent;
	-webkit-text-stroke: 1px rgba(255, 255, 255, 0.04);
	background: linear-gradient(
		180deg,
		rgba(255, 255, 255, 0.045) 0%,
		rgba(255, 255, 255, 0.01) 100%
	);
	-webkit-background-clip: text;
	background-clip: text;
	animation: ${watermarkFloat} 9s ease-in-out infinite;
	user-select: none;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const TopBar = styled('div')`
	position: absolute;
	top: 32px;
	left: 32px;
	right: 32px;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	animation: ${softFade} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 1080px) {
		top: 24px;
		left: 24px;
		right: 24px;
	}
`

const Wordmark = styled('div')`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: #f8fafc;
	font-size: 15px;
	font-weight: 800;
	letter-spacing: -0.3px;

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #38bdf8;
		animation: ${dotPulse} 2.2s ease-in-out infinite;
	}

	.beta {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		font-size: 9.5px;
		font-weight: 800;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: #38bdf8;
		background: rgba(56, 189, 248, 0.12);
		border: 1px solid rgba(56, 189, 248, 0.28);
		border-radius: 999px;
		margin-left: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
		}
	}
`

const CornerLink = styled('a')`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: #94a3b8;
	font-size: 12.5px;
	font-weight: 600;
	letter-spacing: 0.1px;
	text-decoration: none;
	padding: 8px 14px;
	border-radius: 999px;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background: rgba(255, 255, 255, 0.02);
	backdrop-filter: blur(4px);
	transition:
		color 0.2s ease,
		border-color 0.2s ease,
		background 0.2s ease;
	cursor: pointer;

	&:hover {
		color: #f8fafc;
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.06);
	}

	.arrow {
		transition: transform 0.2s ease;
	}
	&:hover .arrow {
		transform: translateX(3px);
	}
`

const HeroWrap = styled('div')`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0;
	width: 100%;
	max-width: 720px;
`

const Cursive = styled('span')`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-size: clamp(38px, 5.6vw, 68px);
	font-weight: 700;
	color: #fbbf24;
	line-height: 1;
	letter-spacing: 0.5px;
	transform: rotate(-8deg);
	transform-origin: center;
	margin-bottom: -18px;
	margin-right: -60%;
	position: relative;
	z-index: 3;
	text-shadow: 0 6px 24px rgba(251, 191, 36, 0.28);
	animation: ${cursiveDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;

	@media (max-width: 1080px) {
		margin-right: -40%;
	}
	@media (prefers-reduced-motion: reduce) {
		transform: rotate(-8deg);
		animation: none;
	}
`

const Stage = styled('div')`
	position: relative;
	z-index: 2;
	width: 100%;
	max-width: 500px;
	height: 400px;
	display: flex;
	align-items: center;
	justify-content: center;

	model-viewer {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.55));
	}
`

const BigDisplay = styled('h1')`
	margin: 0;
	font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
	font-size: clamp(88px, 13vw, 168px);
	line-height: 0.9;
	letter-spacing: 1.5px;
	text-align: center;
	color: #ffffff;
	background: linear-gradient(
		90deg,
		#ffffff 0%,
		#ffffff 45%,
		#e0f2fe 55%,
		#ffffff 65%,
		#ffffff 100%
	);
	background-size: 250% 100%;
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	animation:
		${softFade} 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both,
		${shineText} 6s ease-in-out infinite 1.5s;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 2px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
	}
`

const SubCaps = styled('div')`
	margin-top: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11px;
	font-weight: 700;
	color: #94a3b8;
	text-transform: uppercase;
	letter-spacing: 4px;
	animation: ${softFade} 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;

	.line {
		width: 42px;
		height: 1px;
		background: linear-gradient(90deg, transparent, #475569, transparent);
	}

	.mid {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.mid-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: #64748b;
	}
`

const BottomBar = styled('div')`
	position: absolute;
	bottom: 32px;
	left: 32px;
	right: 32px;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	color: #64748b;
	font-size: 12px;
	font-weight: 500;
	animation: ${softFade} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;

	@media (max-width: 1080px) {
		bottom: 24px;
		left: 24px;
		right: 24px;
	}

	.copy {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.copy code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11.5px;
		color: #94a3b8;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 4px;
		padding: 1px 6px;
	}
	.copy-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #475569;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: 999px;
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.22);
		color: #6ee7b7;
		font-size: 11.5px;
		font-weight: 700;
		letter-spacing: 0.3px;
	}
	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
		animation: ${dotPulse} 2.2s ease-in-out infinite;
	}

	.legal {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}
	.legal a {
		color: #64748b;
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.legal a:hover {
		color: #e2e8f0;
	}
	.legal-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: #334155;
	}

	@media (prefers-reduced-motion: reduce) {
		.status-dot {
			animation: none;
		}
	}
`

/* ─────────────── component ─────────────── */

const AuthBanner: FC<Props> = () => {
	const modelRef = useRef<HTMLElement | null>(null)

	useEffect(() => {
		const el = modelRef.current
		if (!el) return

		const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		if (reduced) {
			el.setAttribute('camera-orbit', '0deg 75deg auto')
			return
		}

		const AMPLITUDE_DEG = 14
		const PERIOD_MS = 6500
		const start = performance.now()
		let raf = 0

		const loop = (t: number) => {
			const elapsed = t - start
			const angle = Math.sin((elapsed / PERIOD_MS) * Math.PI * 2) * AMPLITUDE_DEG
			el.setAttribute('camera-orbit', `${angle.toFixed(2)}deg 75deg auto`)
			raf = requestAnimationFrame(loop)
		}
		raf = requestAnimationFrame(loop)

		return () => cancelAnimationFrame(raf)
	}, [])

	return (
		<BannerRoot>
			<Grid />
			<Spotlight />
			<Watermark>CONSOLE</Watermark>

			<TopBar>
				<Wordmark>
					<span className='dot' />
					Sargas
					<span className='beta'>Internal</span>
				</Wordmark>
				<CornerLink href='#'>
					<strong style={{ color: '#e2e8f0' }}>Runbook</strong>
					<span className='arrow'>→</span>
				</CornerLink>
			</TopBar>

			<HeroWrap>
				<Cursive>welcome back to</Cursive>
				<Stage>
					<model-viewer
						ref={(el: HTMLElement | null) => {
							modelRef.current = el
						}}
						src='/snowflake.glb'
						alt='Snowflake'
						camera-controls
						shadow-intensity='1'
					/>
				</Stage>
				<BigDisplay>SARGAS.</BigDisplay>
				<SubCaps>
					<span className='line' />
					<span className='mid'>
						v2.4.1
						<span className='mid-dot' />
						production
						<span className='mid-dot' />
						eu-central-1
					</span>
					<span className='line' />
				</SubCaps>
			</HeroWrap>

			<BottomBar>
				<span className='copy'>Last deploy · 2h ago</span>
				<span className='status'>
					<span className='status-dot' />
					All systems operational
				</span>
				<span className='legal'>
					<a href='#'>Docs</a>
					<span className='legal-sep' />
					<a href='#'>Status</a>
					<span className='legal-sep' />
					<a href='#'>Report issue</a>
				</span>
			</BottomBar>
		</BannerRoot>
	)
}

export default AuthBanner

interface Props {
	children?: ReactNode
	bgDark: string
	bgLight: string
}
