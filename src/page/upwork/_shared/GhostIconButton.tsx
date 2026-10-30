import styled, { keyframes } from 'styled-components'
import { PrimaryGhostButton } from '../../../components/_shared/formShell.styled'

/* Icon micro-wiggle used by Upwork secondary buttons.
 * Mirrors the editWiggle / trashShake pattern in formShell.styled.ts
 * so secondary CTAs feel alive without any hover glow / halo. */
const iconWiggle = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	30%  { rotate: -16deg; translate: -1px 2px; }
	60%  { rotate: 10deg; translate: 1px -1px; }
	100% { rotate: 0deg; translate: 0 0; }
`

/* Ghost secondary CTA. Same geometry as PrimaryGhostButton — hover
 * only lifts the button (translateY, no shadow, no border/color
 * change) and wiggles the leading icon. No glow. */
export const GhostIconButton = styled(PrimaryGhostButton)`
	svg {
		transform-origin: 50% 60%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.14;
		animation: ${iconWiggle} 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`
