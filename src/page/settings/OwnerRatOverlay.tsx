import { RefObject, useEffect, useLayoutEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

/**
 * Easter egg: once per day, when an Owner opens the My account page,
 * a little rat scampers in near the Avatar card's actions row (next
 * to the Remove button), pauses to say "помни кто ты есть", flashes a
 * smile, and runs off. localStorage flags the day only when the whole
 * animation completes so a half-watched visit still counts tomorrow.
 */
type Phase = 'running-in' | 'speak' | 'smile' | 'running-out' | 'done'

/* Set to `true` during tasting to make the rat appear on every mount
 * without touching localStorage. Default: once-per-day dedup. */
const RAT_TESTING_MODE = false

const todayISO = () => new Date().toISOString().slice(0, 10)
const seenKey = (userId: string) => `sargas.rat.${userId}.${todayISO()}`

export const shouldShowRat = (
	roleName: string | null | undefined,
	userId: string,
): boolean => {
	if (roleName !== 'owner') return false
	if (RAT_TESTING_MODE) return true
	try {
		return !localStorage.getItem(seenKey(userId))
	} catch {
		return false
	}
}

const markRatSeen = (userId: string) => {
	if (RAT_TESTING_MODE) return
	try {
		localStorage.setItem(seenKey(userId), '1')
	} catch {
		/* storage blocked — nothing to persist */
	}
}

const OwnerRatOverlay = ({
	userId,
	anchorRef,
	onDone,
}: {
	userId: string
	anchorRef: RefObject<HTMLElement>
	onDone?: () => void
}) => {
	const [phase, setPhase] = useState<Phase>('running-in')
	const [anchor, setAnchor] = useState<{
		top: number
		centerX: number
		leftIn: number
		rightOut: number
	} | null>(null)

	// Track the anchor's viewport position so the rat always comes to
	// rest near the Remove button, even on scroll / resize.
	useLayoutEffect(() => {
		const measure = () => {
			const el = anchorRef.current
			if (!el) return
			const r = el.getBoundingClientRect()
			/* Park the rat next to the Remove button in the empty space to
			 * its right, aligned with the button vertically. The rat SVG
			 * is 120×90, so centerX / top refer to its top-left corner's
			 * nudge target. */
			setAnchor({
				top: r.top - 50,
				centerX: r.right + 380,
				leftIn: Math.max(0, r.left - 360),
				rightOut: Math.min(window.innerWidth + 220, r.right + 700),
			})
		}
		measure()
		window.addEventListener('resize', measure)
		window.addEventListener('scroll', measure, true)
		return () => {
			window.removeEventListener('resize', measure)
			window.removeEventListener('scroll', measure, true)
		}
	}, [anchorRef])

	useEffect(() => {
		if (!anchor) return
		const timers: number[] = []
		timers.push(window.setTimeout(() => setPhase('speak'), 2800))
		timers.push(window.setTimeout(() => setPhase('smile'), 7000))
		timers.push(window.setTimeout(() => setPhase('running-out'), 7700))
		timers.push(
			window.setTimeout(() => {
				setPhase('done')
				markRatSeen(userId)
				onDone?.()
			}, 10400),
		)
		return () => timers.forEach(clearTimeout)
	}, [userId, onDone, anchor])

	if (phase === 'done' || !anchor) return null

	// Rat's own center (120px wide) relative to viewport.
	const stopX = anchor.centerX - 60
	const startX = anchor.leftIn - 200
	const endX = anchor.rightOut

	const translateX =
		phase === 'running-in' || phase === 'speak' || phase === 'smile'
			? stopX
			: phase === 'running-out'
				? endX
				: startX

	return (
		<Overlay aria-hidden='true' style={{ top: `${anchor.top}px` }}>
			<Bubble
				$phase={phase}
				style={{ left: `${anchor.centerX}px` }}
			>
				remember who you are
			</Bubble>
			<Rat
				$phase={phase}
				style={{
					transform: `translateX(${translateX}px)`,
					transitionDuration:
						phase === 'running-in'
							? '2600ms'
							: phase === 'running-out'
								? '2500ms'
								: '400ms',
				}}
				initialX={startX}
			>
				<RatSvg phase={phase} />
			</Rat>
		</Overlay>
	)
}

export default OwnerRatOverlay

/* ─── SVG — minimal cute outline rat ─────────────────────────── */

const RatSvg = ({ phase }: { phase: Phase }) => {
	const smile = phase === 'smile' || phase === 'running-out'
	return (
		<svg
			viewBox='0 0 120 90'
			width='120'
			height='90'
			fill='none'
			stroke='#252d3a'
			strokeWidth='2.4'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M 100 60 Q 118 46 112 32' fill='none' />
			<ellipse cx='60' cy='60' rx='40' ry='20' fill='#c7c3c0' />
			<circle cx='28' cy='56' r='18' fill='#d8d4d0' />
			<circle cx='22' cy='40' r='6.5' fill='#d8d4d0' />
			<circle cx='22' cy='40' r='3' fill='#f5a7b8' stroke='none' />
			<circle cx='34' cy='40' r='5.5' fill='#d8d4d0' />
			<circle cx='34' cy='40' r='2.5' fill='#f5a7b8' stroke='none' />
			<circle cx='22' cy='56' r='2.8' fill='#252d3a' stroke='none' />
			<circle cx='21' cy='55' r='0.8' fill='#ffffff' stroke='none' />
			<circle cx='11' cy='60' r='1.8' fill='#f5a7b8' stroke='none' />
			<path d='M 13 61 L 4 60' />
			<path d='M 13 63 L 4 65' />
			<path
				d={smile ? 'M 14 66 Q 20 72 26 66' : 'M 14 66 L 24 66'}
				style={{ transition: 'd 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}
			/>
			<g className='rat-legs'>
				<path d='M 42 78 L 42 86' className='leg leg-l1' />
				<path d='M 58 78 L 58 86' className='leg leg-l2' />
				<path d='M 76 78 L 76 86' className='leg leg-l3' />
				<path d='M 90 78 L 90 86' className='leg leg-l4' />
			</g>
		</svg>
	)
}

/* ─── Styles ─────────────────────────────────────────────────── */

const Overlay = styled.div`
	position: fixed;
	left: 0;
	width: 100vw;
	height: 90px;
	pointer-events: none;
	z-index: 1200;
`

const legKick = keyframes`
	0%, 100% { transform: translateY(0); }
	50%     { transform: translateY(-5px); }
`

const legKickAlt = keyframes`
	0%, 100% { transform: translateY(-5px); }
	50%     { transform: translateY(0); }
`

const bodyBob = keyframes`
	0%, 100% { transform: translateY(0); }
	50%     { transform: translateY(-2px); }
`

const Rat = styled.div<{ $phase: Phase; initialX: number }>`
	position: absolute;
	top: 0;
	left: 0;
	width: 120px;
	height: 90px;
	opacity: ${(p) => (p.$phase === 'running-out' ? 0 : 1)};
	transition-property: transform, opacity;
	transition-timing-function:
		${(p) =>
			p.$phase === 'running-in'
				? 'cubic-bezier(0.33, 0, 0.3, 1)'
				: p.$phase === 'running-out'
					? 'cubic-bezier(0.6, 0, 0.75, 1)'
					: 'cubic-bezier(0.22, 1, 0.36, 1)'},
		cubic-bezier(0.4, 0, 0.6, 1);
	transition-duration: inherit, 1800ms;
	transition-delay: 0ms,
		${(p) => (p.$phase === 'running-out' ? '600ms' : '0ms')};
	will-change: transform, opacity;

	svg {
		display: block;
		animation: ${bodyBob} 320ms linear infinite;
		animation-play-state: ${(p) =>
			p.$phase === 'running-in' || p.$phase === 'running-out'
				? 'running'
				: 'paused'};
	}

	.rat-legs .leg-l1,
	.rat-legs .leg-l3 {
		animation: ${legKick} 240ms linear infinite;
		animation-play-state: ${(p) =>
			p.$phase === 'running-in' || p.$phase === 'running-out'
				? 'running'
				: 'paused'};
	}
	.rat-legs .leg-l2,
	.rat-legs .leg-l4 {
		animation: ${legKickAlt} 240ms linear infinite;
		animation-play-state: ${(p) =>
			p.$phase === 'running-in' || p.$phase === 'running-out'
				? 'running'
				: 'paused'};
	}
`

const bubblePop = keyframes`
	0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.6) rotate(-4deg); }
	60%  { transform: translateX(-50%) translateY(-4px) scale(1.08) rotate(2deg); }
	100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) rotate(-2deg); }
`

const bubbleIdle = keyframes`
	0%, 100% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
	50%     { transform: translateX(-50%) translateY(-3px) rotate(-1deg); }
`

const Bubble = styled.div<{ $phase: Phase }>`
	position: absolute;
	bottom: calc(100% + 12px);
	transform: translateX(-50%);
	padding: 10px 18px 12px;
	background: #ffffff;
	border-radius: 18px;
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-size: 28px;
	font-weight: 700;
	color: #e85d2f;
	line-height: 1;
	white-space: nowrap;
	box-shadow: 0 8px 24px -10px rgba(15, 23, 42, 0.28);
	opacity: ${(p) =>
		p.$phase === 'speak' || p.$phase === 'smile' ? 1 : 0};
	transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
	animation: ${(p) =>
			p.$phase === 'speak' || p.$phase === 'smile' ? bubblePop : 'none'}
		520ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
		${bubbleIdle} 2.6s ease-in-out 520ms infinite;

	&::after {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 14px;
		height: 14px;
		background: #ffffff;
		box-shadow: 4px 4px 10px -4px rgba(15, 23, 42, 0.12);
	}
`
