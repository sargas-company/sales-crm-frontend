import styled, { keyframes } from 'styled-components'
import { T } from '../../../components/sales-analytics/_shared/tokens'

const revealDown = keyframes`
	from { opacity: 0; transform: translateY(-6px); }
	to { opacity: 1; transform: translateY(0); }
`

export const FiltersBarWrap = styled('div')`
	display: flex;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
	padding: 14px 16px;
	background: ${T.primaryTint};
	border: 1px solid ${T.primaryStrong};
	border-radius: 14px;
	box-shadow: 0 4px 14px -6px rgba(3, 105, 161, 0.18);

	.filter-group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.filter-icon {
		font-size: 18px !important;
		color: #0369a1;
	}

	.filter-spacer {
		flex: 1;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: transparent;
		border: none;
		color: ${T.textSecondary};
		font-size: 14px;
		font-weight: 600;
		text-transform: none;
		letter-spacing: normal;
		cursor: pointer;
		padding: 8px 12px;
		border-radius: 9px;
		transition:
			color 160ms ${T.ease},
			background 160ms ${T.ease};
	}
	.reset-btn:hover {
		color: ${T.textStrong};
		background: rgba(255, 255, 255, 0.7);
	}
	.reset-btn:focus-visible {
		outline: 2px solid ${T.primary};
		outline-offset: 2px;
	}
`

export const SegmentedControl = styled('div')`
	display: inline-flex;
	background: transparent;
	border-radius: 10px;
	padding: 3px;
	gap: 2px;

	button {
		border: none;
		background: transparent;
		font-size: 14px;
		font-weight: 600;
		color: ${T.textSecondary};
		padding: 8px 16px;
		border-radius: 7px;
		cursor: pointer;
		text-transform: none;
		letter-spacing: normal;
		font-family: inherit;
		transition:
			color 160ms ${T.ease},
			background 160ms ${T.ease},
			box-shadow 160ms ${T.ease};
	}
	button:hover {
		color: #0369a1;
	}
	button.active {
		background: ${T.cardBg};
		color: #0369a1;
		font-weight: 700;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
	}
	button.active:hover {
		background: ${T.cardBg};
		color: #0369a1;
	}
	button:focus-visible {
		outline: 2px solid #0369a1;
		outline-offset: 2px;
	}
`

export const MoreFiltersButton = styled('button')<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: ${({ $active }) => ($active ? T.cardBg : 'transparent')};
	color: #0369a1;
	border: none;
	border-radius: 7px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 700;
	text-transform: none;
	letter-spacing: normal;
	font-family: inherit;
	cursor: pointer;
	box-shadow: ${({ $active }) => ($active ? '0 1px 2px rgba(15, 23, 42, 0.06)' : 'none')};
	transition:
		color 160ms ${T.ease},
		background 160ms ${T.ease},
		box-shadow 160ms ${T.ease};

	&:hover {
		background: ${T.cardBg};
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
	}
	&:focus-visible {
		outline: 2px solid #0369a1;
		outline-offset: 2px;
	}

	.count-pill {
		background: #0369a1;
		color: ${T.cardBg};
		font-size: 12px;
		font-weight: 800;
		padding: 1px 8px;
		border-radius: ${T.radiusPill};
		font-variant-numeric: tabular-nums;
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
