import styled, { keyframes } from 'styled-components'

const cardEnter = keyframes`
	0% {
		opacity: 0;
		transform: translateY(24px) scale(0.985);
		filter: blur(6px);
		box-shadow: 0 0 0 rgba(0, 0, 0, 0);
	}
	60% {
		opacity: 1;
		filter: blur(0);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
`

const shineSweep = keyframes`
	0% { transform: translateX(-120%) skewX(-18deg); }
	100% { transform: translateX(220%) skewX(-18deg); }
`

const borderGlow = keyframes`
	0%, 100% {
		box-shadow:
			0 10px 30px -12px rgba(99, 102, 241, 0.18),
			0 4px 12px -6px rgba(15, 23, 42, 0.06);
	}
	50% {
		box-shadow:
			0 18px 42px -14px rgba(99, 102, 241, 0.32),
			0 6px 16px -8px rgba(15, 23, 42, 0.08);
	}
`

const AnimatedCardShell = styled('div')`
	position: relative;
	border-radius: 14px;
	animation:
		${cardEnter} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both,
		${borderGlow} 6s ease-in-out 0.9s infinite;
	will-change: transform, opacity, filter, box-shadow;

	/* Shine sweep across the card on entrance */
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 40%;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(
			120deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.55) 45%,
			rgba(255, 255, 255, 0) 100%
		);
		pointer-events: none;
		transform: translateX(-120%) skewX(-18deg);
		animation: ${shineSweep} 1.4s ease-out 0.35s 1 both;
		mix-blend-mode: overlay;
		opacity: 0.9;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::after {
			display: none;
		}
	}

	& > * {
		border-radius: inherit;
		overflow: hidden;
	}
`

export default AnimatedCardShell
