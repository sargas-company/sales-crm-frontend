import { css, keyframes } from 'styled-components'

/** Each atom fades + slides in sequentially. Shared across every
 *  Settings panel so the right-hand content assembles with the same
 *  cadence the main app sidebar uses for its own items. */
export const atomIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

/** Gap between atoms in ms — same step across every panel. */
export const STAGGER_STEP = 80

/** Base animation (no delay) — the component instance supplies its own
 *  animation-delay inline, usually via a monotonic counter. */
export const atom = css`
	animation: ${atomIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

/** Convenience: when a parent wants to stagger an unknown number of
 *  children by position in the DOM. Covers up to 12 items. */
export const nthStagger = css`
	& > *:nth-child(1) {
		animation-delay: 0ms;
	}
	& > *:nth-child(2) {
		animation-delay: ${STAGGER_STEP}ms;
	}
	& > *:nth-child(3) {
		animation-delay: ${STAGGER_STEP * 2}ms;
	}
	& > *:nth-child(4) {
		animation-delay: ${STAGGER_STEP * 3}ms;
	}
	& > *:nth-child(5) {
		animation-delay: ${STAGGER_STEP * 4}ms;
	}
	& > *:nth-child(6) {
		animation-delay: ${STAGGER_STEP * 5}ms;
	}
	& > *:nth-child(7) {
		animation-delay: ${STAGGER_STEP * 6}ms;
	}
	& > *:nth-child(8) {
		animation-delay: ${STAGGER_STEP * 7}ms;
	}
	& > *:nth-child(9) {
		animation-delay: ${STAGGER_STEP * 8}ms;
	}
	& > *:nth-child(10) {
		animation-delay: ${STAGGER_STEP * 9}ms;
	}
	& > *:nth-child(11) {
		animation-delay: ${STAGGER_STEP * 10}ms;
	}
	& > *:nth-child(12) {
		animation-delay: ${STAGGER_STEP * 11}ms;
	}
`
