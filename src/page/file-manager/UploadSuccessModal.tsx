import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'

interface Props {
	title?: string
	subtitle?: string
	duration?: number
	onDone: () => void
}

/* Success panel shown right after an upload is queued. Mirrors the
 * credentials VaultSetupGate success panel one-to-one — same hero
 * strip at the top, same glass-morph ring with a drawn-in check,
 * same text stagger — only the palette is swapped from vault blue
 * to the File Manager's ink + muted sky accent. */
export const UploadSuccessModal = ({
	title = 'Added to queue',
	subtitle = 'Watch the upload progress in the tray.',
	duration = 1100,
	onDone,
}: Props) => {
	const [closing, setClosing] = useState(false)

	useEffect(() => {
		const t1 = window.setTimeout(() => setClosing(true), duration)
		const t2 = window.setTimeout(onDone, duration + 240)
		return () => {
			window.clearTimeout(t1)
			window.clearTimeout(t2)
		}
	}, [duration, onDone])

	/* Portal the modal to document.body so it escapes any ancestor
	 *  that creates a containing block (anything with `transform`,
	 *  `filter`, `backdrop-filter`, `perspective`, `will-change:
	 *  transform` — common in shells with hero backgrounds). Without
	 *  this the Scrim's position:fixed resolves to the nearest such
	 *  ancestor, so the FullPanel stretches to that ancestor's
	 *  height — the full-screen bug on the portal host. */
	return createPortal(
		<Scrim $closing={closing}>
			<FullPanel $closing={closing}>
				<SuccessColumn>
					<SuccessHeroBg />
					<SuccessRing>
						<svg
							width='32'
							height='32'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='3'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<polyline
								className='check-path'
								points='20 6 9 17 4 12'
							/>
						</svg>
					</SuccessRing>
					<SuccessTitle>{title}</SuccessTitle>
					<SuccessSub>{subtitle}</SuccessSub>
				</SuccessColumn>
			</FullPanel>
		</Scrim>,
		document.body,
	)
}

/* ─── animations lifted from VaultSetupGate ──────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`
const fadeOut = keyframes`
	from { opacity: 1; }
	to { opacity: 0; }
`
const scaleIn = keyframes`
	from { opacity: 0; transform: scale(0.94) translateY(8px); }
	to   { opacity: 1; transform: scale(1) translateY(0); }
`
const scaleOut = keyframes`
	from { opacity: 1; transform: scale(1) translateY(0); }
	to   { opacity: 0; transform: scale(0.96) translateY(4px); }
`
const ringPopKf = keyframes`
	0%   { transform: scale(0); opacity: 0; }
	80%  { transform: scale(1.1); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
`
const whiteRippleKf = keyframes`
	0%   { transform: scale(0.6); opacity: 0.9; }
	100% { transform: scale(1.8); opacity: 0; }
`
const drawCheckKf = keyframes`
	to { stroke-dashoffset: 0; }
`
const slideUpKf = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`

/* ─── styled ─────────────────────────────────────────────────────── */

const Scrim = styled.div<{ $closing: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.52);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: ${({ $closing }) => ($closing ? fadeOut : fadeIn)} 220ms ease-out
		forwards;
`

const FullPanel = styled.div<{ $closing: boolean }>`
	position: relative;
	width: calc(100% - 40px);
	max-width: 420px;
	background: #ffffff;
	border-radius: 22px;
	overflow: hidden;
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
	animation: ${({ $closing }) => ($closing ? scaleOut : scaleIn)} 220ms
		cubic-bezier(0.22, 1.12, 0.36, 1) forwards;
`

/* Ink hero strip — our File Manager accent (deep slate → slate),
 * replacing the vault's sky-blue gradient. The soft bokeh circle
 * sits in the upper-right, same shape as the credentials version. */
const SuccessHeroBg = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 130px;
	background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
	overflow: hidden;
	z-index: 0;

	&::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -20%;
		width: 240px;
		height: 240px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(148, 163, 184, 0.4) 0%,
			transparent 70%
		);
		pointer-events: none;
	}
`

const SuccessColumn = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 40px 28px 28px;
	gap: 8px;
	min-height: 240px;
`

const SuccessRing = styled.div`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.18);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border: 1.5px solid rgba(255, 255, 255, 0.5);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	margin-bottom: 20px;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.3),
		inset 0 -1px 0 rgba(0, 0, 0, 0.12),
		0 6px 20px rgba(15, 23, 42, 0.4);
	animation: ${ringPopKf} 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);

	&::after {
		content: '';
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.6);
		/* forwards fill-mode holds the end state (opacity 0, scaled
		 * out), so the ripple ring disappears when the animation
		 * finishes instead of snapping back to the solid-white
		 * resting state. */
		opacity: 0;
		animation: ${whiteRippleKf} 1s 0.1s ease-out forwards;
	}

	.check-path {
		stroke-dasharray: 24;
		stroke-dashoffset: 24;
		animation: ${drawCheckKf} 0.4s 0.3s ease-out forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::after { animation: none; display: none; }
		.check-path { stroke-dashoffset: 0; animation: none; }
	}
`

const SuccessTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.4px;
	color: #0a0a0f;
	opacity: 0;
	animation: ${slideUpKf} 0.45s 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;

	@media (prefers-reduced-motion: reduce) {
		opacity: 1;
		animation: none;
	}
`

const SuccessSub = styled.div`
	font-size: 13px;
	color: #64748b;
	line-height: 1.5;
	opacity: 0;
	animation: ${slideUpKf} 0.45s 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;

	@media (prefers-reduced-motion: reduce) {
		opacity: 1;
		animation: none;
	}
`
