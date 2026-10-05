import styled, { keyframes } from 'styled-components'
import { T } from '../../../components/sales-analytics/_shared/tokens'

const revealDown = keyframes`
	from { opacity: 0; transform: translateY(-6px); }
	to { opacity: 1; transform: translateY(0); }
`

const barIn = keyframes`
	from { opacity: 0; transform: translateY(-6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const leadIconIn = keyframes`
	0%   { opacity: 0; transform: scale(0.6) rotate(-25deg); }
	60%  { opacity: 1; transform: scale(1.06) rotate(4deg); }
	100% { opacity: 1; transform: scale(1) rotate(0); }
`

const iconWiggle = keyframes`
	0%, 100% { transform: rotate(0); }
	25%      { transform: rotate(-12deg); }
	55%      { transform: rotate(8deg); }
	80%      { transform: rotate(-3deg); }
`

/* ─── Fresh Paper palette (one-off for the sales toolbar) ──────── */
const PAPER_INK = '#241E16'
const PAPER_INK_SOFT = '#5C5243'
const PAPER_MUTE = '#7D6E5D'
const PAPER_ACCENT = '#E85D2F'
const PAPER_RULE = 'rgba(36, 30, 22, 0.08)'
const PAPER_RULE_STRONG = 'rgba(36, 30, 22, 0.14)'

export const FiltersBarWrap = styled('div')`
	position: relative;
	display: flex;
	align-items: center;
	gap: 22px;
	flex-wrap: wrap;
	padding: 14px 22px;
	background: #ffffff;
	border: 1px solid ${PAPER_RULE};
	border-radius: 18px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
	color: ${PAPER_INK};
	overflow: hidden;
	animation: ${barIn} 380ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	.filter-lead {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding-right: 22px;
		border-right: 1px solid ${PAPER_RULE};
	}

	.filter-lead .lead-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: ${PAPER_INK};
		color: #fdfaf2;
		animation: ${leadIconIn} 620ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: 120ms;
		transition:
			transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
			background 220ms ease;
	}

	.filter-lead:hover .lead-icon {
		transform: rotate(-6deg) scale(1.08);
		background: ${PAPER_ACCENT};
	}

	.filter-lead .lead-icon svg {
		font-size: 20px;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.filter-lead:hover .lead-icon svg {
		animation: ${iconWiggle} 620ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.filter-lead .lead-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 78px;
	}

	.filter-lead .lead-text .top {
		font-family: 'Fraunces', 'Georgia', serif;
		font-variation-settings: 'opsz' 36;
		font-size: 17px;
		font-weight: 600;
		color: ${PAPER_INK};
		letter-spacing: -0.2px;
	}

	.filter-lead .lead-text .bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
		color: ${PAPER_MUTE};
		letter-spacing: 0.7px;
		text-transform: uppercase;
		margin-top: 3px;
		white-space: nowrap;
		transition: color 200ms ease;
	}

	.filter-lead:hover .lead-text .bot {
		color: ${PAPER_ACCENT};
	}

	.filter-spacer {
		flex: 1;
	}

	.upwork-hint {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		pointer-events: none;
		align-self: center;
		color: ${PAPER_INK};
		animation: ${barIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 180ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.upwork-hint {
			animation: none;
		}
	}

	.upwork-hint .row {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
	}

	.upwork-hint .w {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 28px;
		line-height: 1;
		letter-spacing: 0.2px;
		color: ${PAPER_INK};
	}

	.upwork-hint .amber-wrap {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 4px;
	}

	.upwork-hint .a {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 32px;
		line-height: 1;
		letter-spacing: 0.3px;
		color: ${PAPER_ACCENT};
	}

	.upwork-hint .squiggle {
		display: block;
		width: 100%;
		max-width: 120px;
		margin-top: 2px;
		color: ${PAPER_ACCENT};
	}

	.upwork-hint .stars {
		display: inline-flex;
		align-items: center;
		margin-left: 2px;
		color: ${PAPER_ACCENT};
	}

	@media (max-width: 900px) {
		.upwork-hint {
			display: none;
		}
	}
`

/* ─── Tape-stamp segmented pills ─────────────────────────────── */

const tapePillsIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

export const TapePills = styled('div')`
	position: relative;
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(36, 30, 22, 0.05);
	align-items: center;
	animation: ${tapePillsIn} 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/**
 * Sliding orange tape stamp that moves to the active pill with a
 * spring ease — same mechanic as AnimatedSegmented's SegIndicator,
 * but with a -1.2° rotation baked in so the pill reads as a torn
 * strip of tape rather than a chip. The transform is composed in
 * the component (`translateX(left) rotate(-1.2deg)`) so the slide
 * animates through the rotation.
 */
export const TapeIndicator = styled('span')`
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: 0;
	border-radius: 999px;
	background: ${PAPER_ACCENT};
	box-shadow:
		0 2px 0 rgba(36, 30, 22, 0.14),
		0 4px 10px rgba(232, 93, 47, 0.22);
	transform-origin: center;
	transition:
		transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;
	pointer-events: none;
	will-change: transform, width;

	@media (prefers-reduced-motion: reduce) {
		transition:
			transform 0ms,
			width 0ms,
			opacity 0ms;
	}
`

export const TapePill = styled('button')<{ $active: boolean }>`
	position: relative;
	z-index: 1;
	padding: 7px 16px;
	border-radius: 999px;
	border: none;
	background: transparent;
	color: ${({ $active }) => ($active ? '#FDFAF2' : PAPER_INK_SOFT)};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	letter-spacing: 0.1px;
	white-space: nowrap;
	cursor: pointer;
	transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		color: ${({ $active }) => ($active ? '#FDFAF2' : PAPER_INK)};
	}

	&:focus-visible {
		outline: 2px solid ${PAPER_ACCENT};
		outline-offset: 2px;
	}
`

const pillIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

const countPop = keyframes`
	0%   { transform: scale(0.4); opacity: 0; }
	60%  { transform: scale(1.15); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
`

export const MoreFiltersButton = styled('button')<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 9px 18px;
	border-radius: 999px;
	background: ${({ $active }) =>
		$active ? 'rgba(232, 93, 47, 0.08)' : '#ffffff'};
	border: 1.5px solid
		${({ $active }) => ($active ? PAPER_ACCENT : PAPER_RULE_STRONG)};
	color: ${({ $active }) => ($active ? PAPER_ACCENT : PAPER_INK)};
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	align-self: center;
	animation: ${pillIn} 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: 220ms;
	transition:
		background 200ms ease,
		border-color 200ms ease,
		color 200ms ease,
		transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	&:hover {
		border-color: ${PAPER_INK};
		color: ${PAPER_INK};
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: 2px solid ${PAPER_ACCENT};
		outline-offset: 2px;
	}

	svg {
		font-size: 17px;
		transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&:hover .tune-icon {
		animation: ${iconWiggle} 620ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.count-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: ${PAPER_ACCENT};
		color: #fdfaf2;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		font-weight: 700;
		padding: 1px 8px;
		border-radius: 999px;
		min-width: 18px;
		animation: ${countPop} 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
`

export const MoreFiltersReveal = styled('div')`
	margin-top: 10px;
	animation: ${revealDown} 220ms ${T.ease};
`

export const MoreFiltersPanel = styled('div')`
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 16px;
	padding: 22px 24px 24px;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 24px;
		right: 24px;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			${T.primaryStrong} 20%,
			${T.primaryStrong} 80%,
			transparent 100%
		);
		opacity: 0.6;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.filter-section + .filter-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px dashed ${T.divider};
	}

	.section-title {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 700;
		color: ${T.textMuted};
		letter-spacing: 0.6px;
		text-transform: uppercase;
	}
	.section-title::before {
		content: '';
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${T.primary};
		opacity: 0.5;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px 18px;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.filter-field label,
	.filter-field .field-label {
		font-size: 12px;
		font-weight: 600;
		color: ${T.textPrimary};
		letter-spacing: 0;
		text-transform: none;
	}
	.filter-field .field-hint {
		font-size: 11.5px;
		color: ${T.textMuted};
	}

	select {
		appearance: none;
		-webkit-appearance: none;
		background-color: ${T.cardBg};
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a5a1b0' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
		background-repeat: no-repeat;
		background-position: right 11px center;
		background-size: 13px 13px;
		padding-right: 32px;
		cursor: pointer;
	}

	select,
	input[type='number'] {
		border: 1px solid ${T.border};
		border-radius: 10px;
		padding: 9px 12px;
		font-size: 13.5px;
		font-weight: 500;
		color: ${T.textPrimary};
		background-color: ${T.cardBg};
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
		transition:
			border-color 160ms ${T.ease},
			box-shadow 160ms ${T.ease};
	}
	select:hover,
	input[type='number']:hover {
		border-color: ${T.primaryStrong};
	}
	select:focus,
	input:focus {
		outline: none;
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}

	.filter-field .range {
		display: flex;
		align-items: center;
		gap: 10px;
		color: ${T.textMuted};
		font-size: 13px;
	}
	.filter-field .range input {
		flex: 1;
		min-width: 0;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		background: ${T.cardBg};
		color: ${T.textPrimary};
		border: 1px solid ${T.border};
		padding: 6px 12px;
		border-radius: 999px;
		font-size: 12.5px;
		font-weight: 500;
		font-family: inherit;
		text-transform: none;
		letter-spacing: normal;
		line-height: 1.2;
		cursor: pointer;
		transition:
			color 160ms ${T.ease},
			background 160ms ${T.ease},
			border-color 160ms ${T.ease},
			transform 120ms ${T.ease};
	}
	.chip:hover {
		background: ${T.subtleBg};
		border-color: ${T.textMuted};
		color: ${T.textStrong};
	}
	.chip:active {
		transform: scale(0.97);
	}
	.chip.active {
		background: ${T.textStrong};
		color: ${T.cardBg};
		border-color: ${T.textStrong};
		font-weight: 600;
	}
	.chip.active:hover {
		background: ${T.textStrong};
		color: ${T.cardBg};
	}
	.chip:focus-visible {
		outline: 2px solid ${T.primary};
		outline-offset: 2px;
	}
`
