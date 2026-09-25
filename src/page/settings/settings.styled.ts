import styled, { keyframes } from 'styled-components'

const contentFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(10px);
		filter: blur(3px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
		filter: blur(0);
	}
`

const headerFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(-6px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const rowFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const saveBarFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(6px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

/**
 * Wraps the settings section content and animates it in when
 * the active section changes (component is re-keyed by section key).
 * Staggers direct children so rows cascade in.
 */
export const AnimatedSectionContent = styled('div')`
	animation: ${contentFadeIn} 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

	/* Cascade the direct rows (SettingRow -> MUI Box) */
	& > .settings-row {
		animation: ${rowFadeIn} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	& > .settings-row:nth-child(1) {
		animation-delay: 60ms;
	}
	& > .settings-row:nth-child(2) {
		animation-delay: 110ms;
	}
	& > .settings-row:nth-child(3) {
		animation-delay: 160ms;
	}
	& > .settings-row:nth-child(4) {
		animation-delay: 210ms;
	}
	& > .settings-row:nth-child(5) {
		animation-delay: 260ms;
	}
	& > .settings-row:nth-child(6) {
		animation-delay: 310ms;
	}
	& > .settings-row:nth-child(7) {
		animation-delay: 360ms;
	}
	& > .settings-row:nth-child(n + 8) {
		animation-delay: 410ms;
	}

	& > .settings-save-bar {
		animation: ${saveBarFadeIn} 0.45s ease-out 0.25s both;
	}

	@media (prefers-reduced-motion: reduce) {
		&,
		& > .settings-row,
		& > .settings-save-bar {
			animation: none !important;
		}
	}
`

export const AnimatedTabHeader = styled('div')`
	animation: ${headerFadeIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none !important;
	}
`
