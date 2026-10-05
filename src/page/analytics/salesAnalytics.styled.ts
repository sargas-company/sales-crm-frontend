import styled, { keyframes } from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

const soonPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
	50%      { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(220, 38, 38, 0); }
`

const handDraw = keyframes`
	from { opacity: 0; transform: translate(-6px, 4px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-6deg); }
`

const flourishDraw = keyframes`
	from { stroke-dashoffset: 240; opacity: 0; }
	to   { stroke-dashoffset: 0;   opacity: 1; }
`

export const TabLabel = styled('span')`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

export const SoonBadge = styled('span')`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 8px 2px 7px;
	background: #fee2e2;
	color: #dc2626;
	font-size: 9.5px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	border-radius: 999px;
	line-height: 1;
	border: 1px solid rgba(220, 38, 38, 0.18);

	&::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #dc2626;
		animation: ${soonPulse} 1.8s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		&::before {
			animation: none;
		}
	}
`

export const ViewFade = styled('div')`
	animation: ${fadeUp} 240ms ${T.ease};
`

export const ShellCard = styled('div')`
	position: relative;
	background: ${T.cardBg};
	border-radius: ${T.radiusLg};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 20px 40px -20px rgba(15, 23, 42, 0.12);
	overflow: hidden;
	color: ${T.textPrimary};
	isolation: isolate;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(900px 340px at 5% -10%, rgba(3, 105, 161, 0.05) 0%, transparent 60%),
			radial-gradient(700px 300px at 95% -5%, rgba(124, 58, 237, 0.05) 0%, transparent 55%);
		z-index: -1;
		pointer-events: none;
	}

	button {
		text-transform: none;
		letter-spacing: normal;
		min-width: 0;
		font-family: inherit;
		line-height: 1.4;
	}
`

export const ShellInner = styled('div')`
	padding: 32px 36px 36px;

	@media (max-width: 720px) {
		padding: 22px 20px 26px;
	}
`

export const Crumbs = styled('nav')`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	font-weight: 600;
	color: ${T.textMuted};
	margin-bottom: 12px;
	letter-spacing: 0.3px;
	text-transform: uppercase;

	.crumb-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${T.primary};
		opacity: 0.6;
	}
	.current {
		color: ${T.textSecondary};
	}
`

export const PageHead = styled('header')`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 26px;
	border-bottom: 1px solid ${T.divider};
	margin-bottom: 24px;

	.title h1 {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 44px;
		font-weight: 700;
		font-variation-settings: 'opsz' 72;
		line-height: 0.95;
		margin: 0;
		color: ${T.textStrong};
		letter-spacing: -1.6px;
	}
	.title p {
		color: ${T.textSecondary};
		margin: 14px 0 0;
		max-width: 62ch;
		font-size: 14px;
		line-height: 1.5;
	}
	.title-right {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		flex-shrink: 0;
		margin-top: -18px;
		padding-right: 6px;
	}
	.hand-line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 42px;
		font-weight: 700;
		line-height: 1;
		color: #0369a1;
		transform: rotate(-6deg);
		transform-origin: right center;
		text-shadow: 0 6px 22px rgba(2, 132, 199, 0.22);
		animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
		white-space: nowrap;
	}
	.hand-flourish {
		display: inline-flex;
		color: #0284c7;
		opacity: 0.75;
		margin-right: -4px;
		transform: rotate(-4deg);
	}
	.hand-flourish svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${flourishDraw} 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.hand-line { animation: none; transform: rotate(-6deg); }
		.hand-flourish svg path { animation: none; stroke-dashoffset: 0; opacity: 1; }
	}

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
		.title h1 {
			font-size: 34px;
			letter-spacing: -1px;
		}
		.title-right {
			align-items: flex-start;
			padding-top: 0;
		}
		.hand-line {
			font-size: 34px;
			transform-origin: left center;
		}
	}
`

export const TabsWrap = styled('div')`
	margin-top: 22px;

	.tab-list-wrapper {
		border-bottom: 1px solid ${T.divider};
		margin-bottom: 0 !important;
	}
	.tab-item {
		font-weight: 500;
		color: ${T.textSecondary};
		font-size: 14px;
		padding: 12px 4px;
		margin-right: 24px;
		transition: color 160ms ${T.ease};
		text-transform: none;
		letter-spacing: normal;
	}
	.tab-item:hover {
		color: ${T.textStrong};
	}
	.tab-item.tab-item-active {
		font-weight: 700;
		color: ${T.textStrong};
	}
	/* Disabled "Soon" tabs — hide the native cursor; the floating
	   SoonCursorOverlay renders our own red circle at the mouse
	   position and fades in/out with CSS. */
	.tab-item:disabled,
	.tab-item[disabled],
	.tab-item[aria-disabled='true'] {
		cursor: none !important;
	}
	.tab-content {
		outline: none;
		padding: 24px 0 0;
	}
	.tab-content[hidden] {
		display: none;
	}
`

export const TabPanel = styled('div')`
	display: flex;
	flex-direction: column;
	gap: 20px;
`
